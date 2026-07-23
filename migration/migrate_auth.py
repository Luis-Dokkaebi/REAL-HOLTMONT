#!/usr/bin/env python3
"""
Migra USER_DB (credenciales hardcodeadas en CODIGO.js, texto plano) a cuentas
reales de Supabase Auth + tabla `profiles`.

Mantiene el mismo usuario/contraseña que ya conoce cada persona, pero
Supabase las guarda hasheadas (bcrypt) — ya no quedan legibles en ningún
lado, ni en la base ni en el código.

Requisitos:
  - Correr migration/schema_auth.sql en el SQL Editor de Supabase primero
    (crea la tabla `profiles`).
  - La `service_role` key del proyecto (Project Settings -> API Keys).

Cómo resuelve el problema del email: Supabase Auth exige un email único por
cuenta, pero la mayoría de USER_DB tiene `email: ""`. Para esos casos se
genera uno sintético `<username>@holtmont.internal` (no se envía correo real
a nadie, es solo el identificador interno). El correo real, si existía, se
guarda aparte en `profiles.email` para referencia.

Uso:
    python3 migrate_auth.py --project-url https://xxx.supabase.co --service-key eyJ... --dry-run
    python3 migrate_auth.py --project-url https://xxx.supabase.co --service-key eyJ...
"""
from __future__ import annotations

import argparse
import re
import sys

import requests

USER_DB_PATTERN = re.compile(
    r'"(?P<username>[A-Z0-9_]+)":\s*\{\s*pass:\s*"(?P<pass>[^"]*)",\s*role:\s*"(?P<role>[^"]*)",\s*'
    r'label:\s*"(?P<label>[^"]*)",\s*email:\s*"(?P<email>[^"]*)"'
    r'(?:,\s*staffName:\s*"(?P<staffName>[^"]*)")?'
    r'(?:,\s*dept:\s*"(?P<dept>[^"]*)")?'
    r'(?:,\s*seller:\s*(?P<seller>true|false))?'
)


def parse_user_db(codigo_js_path: str):
    with open(codigo_js_path, encoding="utf-8") as f:
        text = f.read()
    start = text.index("const USER_DB = {")
    end = text.index("\n};", start)
    block = text[start:end]
    users = []
    for m in USER_DB_PATTERN.finditer(block):
        d = m.groupdict()
        users.append({
            "username": d["username"],
            "password": d["pass"],
            "role": d["role"],
            "label": d["label"],
            "email": d["email"] or None,
            "staffName": d.get("staffName"),
            "dept": d.get("dept"),
            "seller": d.get("seller") == "true",
        })
    return users


def synthetic_email(username: str) -> str:
    return f"{username.lower()}@holtmont.internal"


class SupabaseAdmin:
    def __init__(self, project_url: str, service_key: str):
        self.base = project_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
        })

    def create_auth_user(self, email, password, metadata):
        resp = self.session.post(
            f"{self.base}/auth/v1/admin/users",
            json={
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": metadata,
            },
        )
        if resp.status_code >= 300:
            return None, resp
        return resp.json().get("id"), resp

    def list_auth_users_by_email(self, email):
        resp = self.session.get(f"{self.base}/auth/v1/admin/users", params={"email": email})
        if resp.status_code >= 300:
            return None
        users = resp.json().get("users", [])
        return users[0]["id"] if users else None

    def upsert_rest(self, table, rows, on_conflict=None):
        if not rows:
            return
        url = f"{self.base}/rest/v1/{table}"
        params = {"on_conflict": on_conflict} if on_conflict else {}
        headers = {"Prefer": "resolution=merge-duplicates,return=minimal"}
        resp = self.session.post(url, params=params, json=rows, headers=headers)
        if resp.status_code >= 300:
            raise RuntimeError(f"Error insertando en {table}: {resp.status_code} {resp.text[:1000]}")

    def get_people_map(self):
        resp = self.session.get(f"{self.base}/rest/v1/people", params={"select": "nombre,id"})
        resp.raise_for_status()
        return {p["nombre"]: p["id"] for p in resp.json()}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--codigo-js", default="../CODIGO.js", help="Ruta a CODIGO.js (default: ../CODIGO.js)")
    parser.add_argument("--project-url", required=True)
    parser.add_argument("--service-key", required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    users = parse_user_db(args.codigo_js)
    print(f"Usuarios encontrados en USER_DB: {len(users)}")
    for u in users:
        email = u["email"] or synthetic_email(u["username"])
        tag = "real" if u["email"] else "sintético"
        print(f"  {u['username']:<26} role={u['role']:<14} email={email} ({tag})")

    if args.dry_run:
        print("\n--dry-run: no se crearon cuentas.")
        return

    admin = SupabaseAdmin(args.project_url, args.service_key)
    people_map = admin.get_people_map()

    profile_rows = []
    created, skipped, failed = 0, 0, 0
    for u in users:
        email = u["email"] or synthetic_email(u["username"])
        metadata = {"username": u["username"], "role": u["role"], "label": u["label"]}
        auth_id, resp = admin.create_auth_user(email, u["password"], metadata)
        if auth_id is None:
            if resp.status_code == 422 or "already been registered" in resp.text.lower():
                auth_id = admin.list_auth_users_by_email(email)
                if auth_id:
                    print(f"  ya existía: {u['username']} ({email})")
                    skipped += 1
                else:
                    print(f"  ERROR {u['username']}: {resp.status_code} {resp.text[:300]}", file=sys.stderr)
                    failed += 1
                    continue
            else:
                print(f"  ERROR {u['username']}: {resp.status_code} {resp.text[:300]}", file=sys.stderr)
                failed += 1
                continue
        else:
            created += 1

        person_id = people_map.get((u["staffName"] or "").upper()) if u["staffName"] else None
        profile_rows.append({
            "id": auth_id,
            "username": u["username"],
            "role": u["role"],
            "label": u["label"],
            "dept": u["dept"],
            "seller": u["seller"],
            "person_id": person_id,
            "email": u["email"],
        })

    admin.upsert_rest("profiles", profile_rows, on_conflict="id")

    print(f"\nCuentas creadas: {created} | ya existían: {skipped} | fallidas: {failed}")
    print(f"profiles: {len(profile_rows)} filas cargadas/actualizadas")


if __name__ == "__main__":
    main()
