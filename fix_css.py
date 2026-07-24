import re

with open("index.html", "r") as f:
    content = f.read()

css = """
    /* EXACT DASHBOARD STYLES */
    .dashboard-header-banner {
        background: #d0def7; color: #1e3a8a; font-weight: 700; font-size: 13px;
        text-align: center; padding: 10px; border-radius: 8px; margin-bottom: 20px;
    }
    .stat-card-modern {
        border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.02); height: 100%; display: flex; flex-direction: column; overflow: hidden;
    }
    .stat-card-modern-header {
        color: white; font-weight: 600; font-size: 11px; text-align: center; padding: 6px; letter-spacing: 0.5px;
    }
    .stat-card-modern-body {
        padding: 10px; display: flex; justify-content: space-between; align-items: center; flex: 1;
    }
    .stat-card-modern-number {
        font-size: 32px; font-weight: 800; color: #1e293b; margin: 0; line-height: 1;
    }
    .stat-card-modern-breakdown {
        font-size: 10px; color: #64748b; font-weight: 600; text-align: right; line-height: 1.4;
    }
    .donut-chart-container {
        position: relative; width: 140px; height: 140px; margin: 0 auto;
        border-radius: 50%;
        background: conic-gradient(
            #3b82f6 0deg 90deg,
            #22c55e 90deg 210deg,
            #eab308 210deg 290deg,
            #ef4444 290deg 330deg,
            #a855f7 330deg 360deg
        );
        display: flex; align-items: center; justify-content: center;
    }
    .donut-chart-inner {
        width: 100px; height: 100px; background: white; border-radius: 50%;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    }
    .btn-pill-modern {
        border-radius: 20px; font-weight: 600; font-size: 12px; padding: 6px 16px; border: none; color: white; display: inline-flex; align-items: center; gap: 6px;
    }
    .btn-pill-green { background-color: #22c55e; }
    .btn-pill-blue { background-color: #3b82f6; }
    .btn-pill-yellow { background-color: #eab308; color: #1e293b; }
    .btn-pill-cyan { background-color: #06b6d4; }
    .btn-pill-orange { background-color: #f97316; }

    .avatar-stack-modern { display: flex; flex-direction: row; }
    .avatar-stack-modern .avatar-circle {
        width: 24px; height: 24px; border-radius: 50%; background: #cbd5e1; color: white;
        display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold;
        border: 2px solid white; margin-left: -8px; z-index: 1;
    }
    .avatar-stack-modern .avatar-circle:first-child { margin-left: 0; z-index: 2; }
    .avatar-stack-modern .avatar-circle:nth-child(2) { z-index: 3; }
    .avatar-stack-modern .avatar-circle:nth-child(3) { z-index: 4; }
"""

# inject CSS
content = content.replace("/* Modern Tracker Table Styles */", css + "\n    /* Modern Tracker Table Styles */")

with open("index.html", "w") as f:
    f.write(content)
