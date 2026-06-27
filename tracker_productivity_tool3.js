const fs = require('fs');

function addFunctions() {
  let codigo = fs.readFileSync('CODIGO.js', 'utf8');

  const insertBeforeStr = "function apiFetchTeamKPIData(username) {";

  const functionCode = `
/* ================================================================
 * [TRACKER PRODUCTIVITY AGENT]
 * ================================================================ */

function apiFetchTrackerProductivityMetrics(params) {
  try {
    const p = params || {};
    const now = new Date();
    const targetMonth = (p.month !== undefined && p.month !== null) ? parseInt(p.month) : (now.getMonth() + 1);
    const targetYear  = (p.year  !== undefined && p.year  !== null) ? parseInt(p.year)  : now.getFullYear();

    // Directory lookup to filter only ESTANDAR and HIBRIDO and exclude VENTAS sheets
    const allowedStaff = [];
    const deptMap = {};
    INITIAL_DIRECTORY.forEach(emp => {
      if (emp.type === 'ESTANDAR' || emp.type === 'HIBRIDO') {
        if (emp.name) {
          const uName = emp.name.toUpperCase().trim();
          allowedStaff.push(uName);
          deptMap[uName] = emp.dept || 'SIN DEPT';
        }
      }
    });

    const deptStats = {};
    const collabStats = {};
    const priorityStats = { 'ALTA': 0, 'MEDIA': 0, 'BAJA': 0, 'SIN_PRIORIDAD': 0 };

    let totalTasks = 0;
    let onTimeTasks = 0;
    let lateTasks = 0;
    let tasksWithRestrictions = 0;
    let tasksWithRisks = 0;
    let totalDurationDays = 0;
    let tasksWithDuration = 0;

    // Helper Date Parser
    const parseDate = (d) => {
      if (!d) return null;
      if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
      if (typeof d === 'number') return new Date(d);
      const s = String(d).trim();
      if (!s) return null;
      if (s.includes('/')) {
        const pts = s.split('/');
        if (pts.length === 3) {
          const yr = pts[2].length === 2 ? '20' + pts[2] : pts[2];
          const dt = new Date(parseInt(yr), parseInt(pts[1]) - 1, parseInt(pts[0]));
          return isNaN(dt.getTime()) ? null : dt;
        }
      }
      const parsed = new Date(s);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    // Helper Duration
    const getDurationDaysAndDates = (row, estimatedDateFallback) => {
      // FECHA as Start Date
      const startDate = parseDate(row['FECHA'] || row['F.INICIO'] || row['F. INICIO'] || null);

      // End Date from Process Log or Estimated
      let realEndDate = null;
      try {
        const logStr = String(row['PROCESO_LOG'] || row['proceso_log'] || '').trim();
        if (logStr && logStr.startsWith('[')) {
          const log = JSON.parse(logStr);
          if (Array.isArray(log)) {
            let lastEnd = null;
            log.forEach(step => {
              if (step.endTimestamp && step.status === 'DONE') {
                if (!lastEnd || step.endTimestamp > lastEnd) lastEnd = step.endTimestamp;
              }
            });
            if (lastEnd) realEndDate = new Date(lastEnd);
          }
        }
      } catch (e) {}

      const estimatedDate = parseDate(row['FECHA ESTIMADA DE FIN'] || row['FEC. EST. FIN'] || row['FECHA_RESPUESTA'] || estimatedDateFallback);

      if (!realEndDate) realEndDate = new Date();

      let isLate = false;
      let durationDays = 0;

      if (estimatedDate) {
         // Comparing dates (ignoring time)
         const rEnd = new Date(realEndDate.getFullYear(), realEndDate.getMonth(), realEndDate.getDate());
         const estEnd = new Date(estimatedDate.getFullYear(), estimatedDate.getMonth(), estimatedDate.getDate());
         isLate = rEnd > estEnd;
      }

      if (startDate && realEndDate) {
        const diff = realEndDate.getTime() - startDate.getTime();
        durationDays = diff < 0 ? 0 : Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      return { isLate, durationDays, realEndDate };
    };

    Object.keys(USER_DB).forEach(k => {
      const u = USER_DB[k];
      if (!u.staffName) return;
      const uName = u.staffName.toUpperCase().trim();

      // Filter out VENTAS and those not in allowedStaff
      if (u.seller || k === 'ANTONIA_VENTAS' || !allowedStaff.includes(uName)) return;

      const result = internalFetchSheetData(u.staffName);
      if (!result.success) return;

      const history = result.history || [];
      const dept = deptMap[uName] || 'SIN DEPT';

      history.forEach(row => {
        // Date filtering based on Start Date or Estimated End Date
        const startDate = parseDate(row['FECHA'] || row['F.INICIO'] || row['F. INICIO']);
        const estimatedDate = parseDate(row['FECHA ESTIMADA DE FIN'] || row['FEC. EST. FIN'] || row['FECHA_RESPUESTA']);

        const dateToUse = startDate || estimatedDate;
        if (!dateToUse) return;

        if ((dateToUse.getMonth() + 1) === targetMonth && dateToUse.getFullYear() === targetYear) {
          totalTasks++;

          const durStats = getDurationDaysAndDates(row, estimatedDate);

          if (durStats.isLate) lateTasks++;
          else onTimeTasks++;

          if (durStats.durationDays > 0) {
             totalDurationDays += durStats.durationDays;
             tasksWithDuration++;
          }

          // Restrictions & Risks
          const rest = String(row['RESTRICCIONES'] || '').trim().toUpperCase();
          if (rest && rest !== 'NINGUNO' && rest !== 'NINGUNA' && rest !== 'NO') tasksWithRestrictions++;

          const risk = String(row['RIESGO'] || '').trim().toUpperCase();
          if (risk && risk !== 'BAJO' && risk !== 'NINGUNO' && risk !== 'NO' && risk !== '') tasksWithRisks++;

          // Priorities
          const prio = String(row['PRIORIDAD'] || '').trim().toUpperCase();
          if (['ALTA', 'MEDIA', 'BAJA'].includes(prio)) {
            priorityStats[prio]++;
          } else {
            priorityStats['SIN_PRIORIDAD']++;
          }

          // Dept Stats
          if (!deptStats[dept]) deptStats[dept] = { count: 0, late: 0, onTime: 0 };
          deptStats[dept].count++;
          if (durStats.isLate) deptStats[dept].late++;
          else deptStats[dept].onTime++;

          // Collab Stats
          if (!collabStats[uName]) collabStats[uName] = { name: uName, dept, count: 0, late: 0, onTime: 0, totalDuration: 0, durCount: 0 };
          collabStats[uName].count++;
          if (durStats.isLate) collabStats[uName].late++;
          else collabStats[uName].onTime++;
          if (durStats.durationDays > 0) {
             collabStats[uName].totalDuration += durStats.durationDays;
             collabStats[uName].durCount++;
          }
        }
      });
    });

    const onTimePct = totalTasks > 0 ? Math.round((onTimeTasks / totalTasks) * 100) : 0;
    const avgDuration = tasksWithDuration > 0 ? parseFloat((totalDurationDays / tasksWithDuration).toFixed(1)) : 0;
    const restrictionsPct = totalTasks > 0 ? Math.round((tasksWithRestrictions / totalTasks) * 100) : 0;
    const risksPct = totalTasks > 0 ? Math.round((tasksWithRisks / totalTasks) * 100) : 0;

    const byCollabArr = Object.values(collabStats).sort((a,b) => b.count - a.count);
    byCollabArr.forEach(c => {
      c.avgDays = c.durCount > 0 ? parseFloat((c.totalDuration / c.durCount).toFixed(1)) : 0;
      c.onTimePct = c.count > 0 ? Math.round((c.onTime / c.count) * 100) : 0;
    });

    const byDeptArr = Object.keys(deptStats).map(k => ({ dept: k, count: deptStats[k].count })).sort((a,b) => b.count - a.count);

    return {
      success: true,
      metrics: {
        totalTasks,
        onTimeTasks,
        lateTasks,
        onTimePct,
        avgDurationDays: avgDuration,
        tasksWithRestrictions,
        restrictionsPct,
        tasksWithRisks,
        risksPct,
        priorityStats,
        byCollabArr,
        byDeptArr,
        month: targetMonth,
        year: targetYear
      }
    };

  } catch (e) {
    console.error("apiFetchTrackerProductivityMetrics Error: " + e.toString());
    return { success: false, message: e.toString() };
  }
}

function runTrackerProductivityAgent(params) {
  try {
    const p = params || {};
    const now = new Date();
    const month = (p.month !== undefined) ? parseInt(p.month) : (now.getMonth() + 1);
    const year  = (p.year  !== undefined) ? parseInt(p.year)  : now.getFullYear();
    const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const monthName = MONTHS[month - 1];

    const mResult = apiFetchTrackerProductivityMetrics({ month, year });
    if (!mResult.success) return { success: false, message: 'No se pudieron obtener métricas: ' + mResult.message };
    const m = mResult.metrics;

    // Rules
    const alerts = [];
    if (m.onTimePct < 80 && m.totalTasks > 0) {
      alerts.push({ type: 'ENTREGAS_ATRASADAS', severity: 'ALTA', icon: '🔴', mensaje: 'Porcentaje de entregas a tiempo crítico: ' + m.onTimePct + '%' });
    }
    if (m.restrictionsPct > 20) {
       alerts.push({ type: 'ALTAS_RESTRICCIONES', severity: 'MEDIA', icon: '🟡', mensaje: 'Alta proporción de tareas con restricciones: ' + m.restrictionsPct + '%' });
    }
    const topCollab = m.byCollabArr[0];
    if (topCollab && topCollab.onTimePct < 50 && topCollab.count >= 5) {
       alerts.push({ type: 'PRODUCTIVIDAD_COLAB', severity: 'ALTA', icon: '🔴', mensaje: 'Colaborador ' + topCollab.name + ' tiene ' + topCollab.onTimePct + '% a tiempo de ' + topCollab.count + ' tareas.' });
    }

    // Gemini
    const mStr = JSON.stringify({
      volumen_total: m.totalTasks,
      a_tiempo_pct: m.onTimePct,
      atrasadas: m.lateTasks,
      promedio_dias_resolucion: m.avgDurationDays,
      porcentaje_restricciones: m.restrictionsPct,
      porcentaje_riesgos: m.risksPct,
      prioridades: m.priorityStats,
      top_colaboradores: m.byCollabArr.slice(0,3).map(c => ({ nombre: c.name, volumen: c.count, a_tiempo_pct: c.onTimePct, promedio_dias: c.avgDays }))
    }, null, 2);

    const prompt = 'Eres un Analista de Productividad y Operaciones Senior. Analiza las siguientes métricas del equipo correspondientes al mes de ' + monthName + '. Tu objetivo es redactar un reporte ejecutivo muy conciso (máximo 180 palabras) en español. Debes destacar el porcentaje de tareas entregadas a tiempo, identificar si hay un cuello de botella con las prioridades altas o restricciones, y mencionar al colaborador o departamento más productivo. Termina siempre con UNA recomendación operativa concreta para mejorar los tiempos de entrega.\\n\\nMétricas:\\n' + mStr;

    let geminiSummary = 'No se pudo generar reporte con IA.';
    const gRes = callGeminiAPI(prompt);
    if (gRes.success && gRes.text) {
      geminiSummary = gRes.text;
    }

    const emailResult = _sendTrackerProductivityEmail(m, alerts, geminiSummary, monthName, year);

    return {
      success: true,
      data: {
        metrics: m,
        alerts: alerts,
        geminiReport: geminiSummary,
        emailSent: emailResult.success
      }
    };
  } catch(e) {
    console.error('runTrackerProductivityAgent Error: ' + e.toString());
    return { success: false, message: e.toString() };
  }
}

function _sendTrackerProductivityEmail(m, alerts, geminiSummary, monthName, year) {
  try {
    const recipients = [];
    if (USER_DB['LUIS_CARLOS']    && USER_DB['LUIS_CARLOS'].email)    recipients.push(USER_DB['LUIS_CARLOS'].email);
    if (USER_DB['ADMIN_CONTROL'] && USER_DB['ADMIN_CONTROL'].email) recipients.push(USER_DB['ADMIN_CONTROL'].email);
    if (USER_DB['JESUS_CANTU'] && USER_DB['JESUS_CANTU'].email) recipients.push(USER_DB['JESUS_CANTU'].email);

    if (recipients.length === 0) return { success: false, message: 'Sin destinatarios configurados.' };

    const alertRows = alerts.length > 0
      ? alerts.map(a => '<tr><td style="padding:6px 12px;">' + a.icon + '</td><td style="padding:6px 12px;color:#333;">' + a.mensaje + '</td><td style="padding:6px 12px;"><span style="background:' + (a.severity==='ALTA'?'#dc3545':a.severity==='MEDIA'?'#fd7e14':'#17a2b8') + ';color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">' + a.severity + '</span></td></tr>').join('')
      : '<tr><td colspan="3" style="padding:8px 12px;color:#28a745;">✅ Sin alertas críticas este mes</td></tr>';

    const collabRows = m.byCollabArr.slice(0, 8).map(c => {
      return '<tr style="border-bottom:1px solid #eee;"><td style="padding:5px 10px;">' + c.name + '</td><td style="text-align:center;padding:5px 10px;">' + c.count + '</td><td style="text-align:center;padding:5px 10px;color:' + (c.onTimePct >= 80 ? '#28a745' : '#dc3545') + ';">' + c.onTimePct + '%</td><td style="text-align:center;padding:5px 10px;">' + c.avgDays + '</td></tr>';
    }).join('');

    const html = [
      '<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;background:#fff;">',
      '<div style="background:#2c3e50;color:#fff;padding:24px;">',
      '<h1 style="margin:0;font-size:22px;">📊 Reporte de Productividad — ' + monthName.charAt(0).toUpperCase() + monthName.slice(1) + ' ' + year + '</h1>',
      '</div>',
      '<div style="padding:24px;border:1px solid #eee;">',
      '<h2 style="font-size:16px;color:#444;border-bottom:2px solid #2c3e50;padding-bottom:5px;">Resumen Ejecutivo (AI)</h2>',
      '<div style="background:#f8f9fa;padding:15px;border-radius:6px;color:#333;font-size:14px;line-height:1.6;border-left:4px solid #3b82f6;">' + geminiSummary.replace(/\\n/g, '<br>') + '</div>',
      '<div style="display:flex;gap:15px;margin-top:24px;">',
      '<div style="flex:1;background:#fff;border:1px solid #ddd;border-radius:8px;padding:15px;text-align:center;">',
      '<div style="font-size:12px;color:#666;text-transform:uppercase;">Total Completadas</div>',
      '<div style="font-size:24px;font-weight:bold;color:#333;margin-top:5px;">' + m.totalTasks + '</div>',
      '</div>',
      '<div style="flex:1;background:#fff;border:1px solid #ddd;border-radius:8px;padding:15px;text-align:center;">',
      '<div style="font-size:12px;color:#666;text-transform:uppercase;">% A Tiempo</div>',
      '<div style="font-size:24px;font-weight:bold;color:' + (m.onTimePct >= 80 ? '#28a745' : '#dc3545') + ';margin-top:5px;">' + m.onTimePct + '%</div>',
      '</div>',
      '<div style="flex:1;background:#fff;border:1px solid #ddd;border-radius:8px;padding:15px;text-align:center;">',
      '<div style="font-size:12px;color:#666;text-transform:uppercase;">Promedio Días</div>',
      '<div style="font-size:24px;font-weight:bold;color:#17a2b8;margin-top:5px;">' + m.avgDurationDays + ' d</div>',
      '</div>',
      '</div>',
      '<h2 style="font-size:16px;color:#444;border-bottom:2px solid #2c3e50;padding-bottom:5px;margin-top:24px;">Alertas Operativas</h2>',
      '<table style="width:100%;border-collapse:collapse;font-size:13px;background:#fdfdfd;border:1px solid #eee;">',
      alertRows,
      '</table>',
      '<h2 style="font-size:16px;color:#444;border-bottom:2px solid #2c3e50;padding-bottom:5px;margin-top:24px;">Top Colaboradores (Volumen)</h2>',
      '<table style="width:100%;border-collapse:collapse;font-size:13px;">',
      '<tr style="background:#f4f4f4;color:#555;"><th style="text-align:left;padding:8px 10px;">Nombre</th><th style="padding:8px 10px;">Volumen</th><th style="padding:8px 10px;">% A Tiempo</th><th style="padding:8px 10px;">Prom. Días</th></tr>',
      collabRows,
      '</table>',
      '</div>',
      '<div style="background:#f1f1f1;color:#777;text-align:center;padding:12px;font-size:11px;">Generado automáticamente por el Agente de Productividad Holtmont</div>',
      '</div>'
    ].join('');

    MailApp.sendEmail({
      to: recipients.join(','),
      subject: '📊 Reporte Ejecutivo de Productividad - ' + monthName + ' ' + year,
      htmlBody: html
    });

    return { success: true };
  } catch(e) {
    console.error('_sendTrackerProductivityEmail Error: ' + e.toString());
    return { success: false, message: e.toString() };
  }
}

`;

  if (codigo.includes("apiFetchTrackerProductivityMetrics")) {
     console.log("Already added");
     return;
  }

  codigo = codigo.replace(insertBeforeStr, functionCode + "\n" + insertBeforeStr);

  fs.writeFileSync('CODIGO.js', codigo, 'utf8');
}

addFunctions();
