#!/usr/bin/env python3
"""
Carga el bundle extraído por lib.py/migrate.py a Supabase vía su API REST
(PostgREST) en vez de una conexión Postgres directa.

Se usa cuando el entorno donde corre el script no permite TCP crudo hacia el
puerto de Postgres (solo HTTPS saliente) — la API REST de Supabase corre
sobre HTTPS normal en <project>.supabase.co, así que sí es alcanzable.

Requisitos:
  - Las tablas ya deben existir (correr schema.sql manualmente en el SQL
    Editor de Supabase antes de esto).
  - La `service_role` key del proyecto (Project Settings -> API Keys),
    porque hace falta para saltarse RLS en la carga masiva.

Uso:
    python3 migrate_rest.py --xlsx TrackerVersion4_7.xlsx \
        --project-url https://xxxxx.supabase.co \
        --service-key eyJ...
"""
from __future__ import annotations

import argparse
import datetime as dt
import sys
import uuid

import openpyxl
import requests

from migrate import build_bundle, summarize

BATCH_SIZE = 500


def to_jsonable(value):
    if value is None:
        return None
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, dt.datetime):
        return value.isoformat()
    if isinstance(value, dt.date):
        return value.isoformat()
    if isinstance(value, dt.time):
        return value.isoformat()
    if isinstance(value, dict):
        return value
    return value


class SupabaseREST:
    def __init__(self, project_url: str, service_key: str):
        self.base = project_url.rstrip("/") + "/rest/v1"
        self.session = requests.Session()
        self.session.headers.update({
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        })

    def upsert(self, table, rows, on_conflict=None, batch_size=BATCH_SIZE):
        if not rows:
            return
        url = f"{self.base}/{table}"
        params = {"on_conflict": on_conflict} if on_conflict else {}
        total = 0
        for i in range(0, len(rows), batch_size):
            chunk = rows[i:i + batch_size]
            payload = [{k: to_jsonable(v) for k, v in row.items()} for row in chunk]
            resp = self.session.post(url, params=params, json=payload)
            if resp.status_code >= 300:
                raise RuntimeError(f"Error insertando en {table}: {resp.status_code} {resp.text[:2000]}")
            total += len(chunk)
        print(f"{table}: {total} filas cargadas")

    def select_all(self, table, columns, page_size=1000):
        url = f"{self.base}/{table}"
        out = []
        offset = 0
        headers = {"Prefer": "count=exact"}
        while True:
            r = self.session.get(
                url,
                params={"select": columns},
                headers={"Range-Unit": "items", "Range": f"{offset}-{offset + page_size - 1}"},
            )
            if r.status_code >= 300:
                raise RuntimeError(f"Error leyendo {table}: {r.status_code} {r.text[:500]}")
            batch = r.json()
            out.extend(batch)
            if len(batch) < page_size:
                break
            offset += page_size
        return out


def load_to_supabase_rest(bundle, project_url, service_key):
    db = SupabaseREST(project_url, service_key)

    # 1. people
    db.upsert("people", list(bundle.people.values()), on_conflict="nombre")
    people_ids = {p["nombre"]: p["id"] for p in db.select_all("people", "nombre,id")}

    # 2. sites / projects
    db.upsert("sites", bundle.sites, on_conflict="id_sitio")
    db.upsert("projects", bundle.projects, on_conflict="id_proyecto")

    # 3. tasks
    task_id_by_key = {}
    task_rows = []
    for key, t in bundle.tasks.items():
        tid = str(uuid.uuid4())
        task_id_by_key[key] = tid
        task_rows.append({
            "id": tid, "folio": t["folio"], "dedupe_key": t["dedupe_key"],
            "folio_sintetico": t["folio_sintetico"],
            "assignee_id": people_ids.get(t.get("assignee_raw")),
            "assignee_raw": t.get("assignee_raw"), "departamento": t.get("departamento"),
            "fecha_alta": t.get("fecha_alta"), "hora_alta": t.get("hora_alta"),
            "clasificacion": t.get("clasificacion"), "concepto": t["concepto"],
            "avance": t.get("avance", 0), "fecha_estimada_fin": t.get("fecha_estimada_fin"),
            "hora_estimada_fin": t.get("hora_estimada_fin"), "reloj": t.get("reloj"),
            "restricciones": t.get("restricciones"), "prioridad": t.get("prioridad"),
            "riesgos": t.get("riesgos"), "fecha_respuesta": t.get("fecha_respuesta"),
            "correo": t.get("correo"), "carpeta": t.get("carpeta"),
            "cumplimiento": t.get("cumplimiento"), "comentarios": t.get("comentarios"),
            "comentarios_semana": t.get("comentarios_semana"),
            "comentarios_semana_previa": t.get("comentarios_semana_previa"),
            "status": t.get("status", "PENDIENTE"), "source_sheet": t["source_sheet"],
        })
    db.upsert("tasks", task_rows, on_conflict="dedupe_key")

    inv_rows = []
    for key, names in bundle.task_involucrados.items():
        tid = task_id_by_key.get(key)
        if not tid:
            continue
        for name in names:
            inv_rows.append({"task_id": tid, "person_id": people_ids.get(name), "raw_name": name})
    db.upsert("task_involucrados", inv_rows, on_conflict="task_id,raw_name")

    # 4. ppc_borradores
    borrador_rows = [{
        **{k: v for k, v in b.items()},
        "responsable_id": people_ids.get(b.get("responsable_raw")),
    } for b in bundle.ppc_borradores]
    db.upsert("ppc_borradores", borrador_rows)

    # 5. quotes
    quote_rows = []
    for q in bundle.quotes.values():
        row = dict(q)
        row["vendedor_id"] = people_ids.get(q.get("vendedor_raw"))
        quote_rows.append(row)
    db.upsert("quotes", quote_rows, on_conflict="folio")
    db.upsert("banco_datos", bundle.banco_datos, on_conflict="folio")

    # 6. work orders
    wo_folios = sorted({row["folio"] for rows in bundle.wo_rows.values() for row in rows})
    db.upsert("work_orders", [{"folio": f} for f in wo_folios], on_conflict="folio")
    for table, rows in bundle.wo_rows.items():
        db.upsert(table, rows)

    # 7. agenda / hábitos / kpi / log
    agenda_rows = [{
        **a, "usuario_id": people_ids.get(a.get("usuario_raw")),
    } for a in bundle.personal_agenda]
    db.upsert("personal_agenda", agenda_rows, on_conflict="id")

    habits_rows = []
    for h in bundle.habits_log:
        row = dict(h)
        row["usuario_id"] = people_ids.get(h.get("usuario_raw"))
        if row.get("log_json"):
            import json
            try:
                row["log_json"] = json.loads(row["log_json"])
            except (ValueError, TypeError):
                row["log_json"] = None
        habits_rows.append(row)
    db.upsert("habits_log", habits_rows)

    db.upsert("kpi_cotizaciones", bundle.kpi_cotizaciones)
    db.upsert("system_log", bundle.system_log)

    print("\nMigración completada vía REST.")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--xlsx", required=True)
    parser.add_argument("--project-url", required=True, help="https://<project-ref>.supabase.co")
    parser.add_argument("--service-key", required=True, help="service_role key (Project Settings -> API Keys)")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    wb = openpyxl.load_workbook(args.xlsx, read_only=True, data_only=True)
    bundle = build_bundle(wb)
    summarize(bundle)

    if args.dry_run:
        print("\n--dry-run: no se llamó a la API REST.")
        return

    load_to_supabase_rest(bundle, args.project_url, args.service_key)


if __name__ == "__main__":
    main()
