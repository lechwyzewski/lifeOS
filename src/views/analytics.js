import store from '../core/store.js';
import utils from '../core/utils.js';

function getLastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().split('T')[0],
      dayOfWeek: d.getDay() // 0 is Sunday
    });
  }
  return days;
}

function getDayNamePl(dayIndex) {
  const names = ['Nd', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
  return names[dayIndex];
}

function renderBarChart(labels, data) {
  const max = Math.max(...data, 5);
  const width = 400;
  const height = 200;
  const padding = 30;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  
  const barW = chartW / labels.length - 10;
  
  let svg = `<svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block; overflow: visible;">`;
  
  for (let i = 0; i <= 4; i++) {
    const y = padding + (chartH / 4) * i;
    const val = Math.round(max - (max / 4) * i);
    svg += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="rgba(255,255,255,0.1)" stroke-dasharray="4"/>`;
    svg += `<text x="${padding - 5}" y="${y + 4}" fill="#888" font-size="10" text-anchor="end">${val}</text>`;
  }
  
  svg += `<defs>
    <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--accent-color, #8b5cf6)"/>
      <stop offset="100%" stop-color="rgba(139,92,246,0.2)"/>
    </linearGradient>
  </defs>`;
  
  data.forEach((val, i) => {
    const h = (val / max) * chartH;
    const x = padding + 10 + i * (chartW / labels.length);
    const y = height - padding - h;
    
    svg += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="url(#bar-grad)" rx="4">
              <animate attributeName="height" from="0" to="${h}" dur="0.8s" fill="freeze" />
              <animate attributeName="y" from="${height - padding}" to="${y}" dur="0.8s" fill="freeze" />
            </rect>`;
    svg += `<text x="${x + barW/2}" y="${height - padding + 15}" fill="#888" font-size="10" text-anchor="middle">${labels[i]}</text>`;
  });
  
  svg += `</svg>`;
  return svg;
}

function renderDonutChart(percents) {
  const width = 300;
  const height = 200;
  const cx = 100;
  const cy = 100;
  const r = 60;
  const strokeWidth = 30;
  
  let svg = `<svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block;">`;
  
  let cumulativePercent = 0;
  const colors = [
    'var(--q1-color, #ef4444)',
    'var(--q2-color, #3b82f6)',
    'var(--q3-color, #f59e0b)',
    'var(--q4-color, #10b981)'
  ];
  
  const labels = ['Q1 (Ważne, Pilne)', 'Q2 (Ważne, Niepilne)', 'Q3 (Nieważne, Pilne)', 'Q4 (Nieważne, Niepilne)'];
  
  function getCoordinatesForPercent(percent) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }
  
  percents.forEach((p, i) => {
    if (p === 0) return;
    const startPercent = cumulativePercent;
    const endPercent = cumulativePercent + p / 100;
    
    const startAngle = startPercent - 0.25;
    const endAngle = endPercent - 0.25;
    
    const [startX, startY] = getCoordinatesForPercent(startAngle);
    const [endX, endY] = getCoordinatesForPercent(endAngle);
    
    const largeArcFlag = p > 50 ? 1 : 0;
    const pathData = [
      `M ${cx + r * startX} ${cy + r * startY}`,
      `A ${r} ${r} 0 ${largeArcFlag} 1 ${cx + r * endX} ${cy + r * endY}`
    ].join(' ');
    
    if (p === 100) {
      svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colors[i]}" stroke-width="${strokeWidth}" />`;
    } else {
      svg += `<path d="${pathData}" fill="none" stroke="${colors[i]}" stroke-width="${strokeWidth}">
                <animate attributeName="stroke-dasharray" from="0, 1000" to="1000, 0" dur="1s" fill="freeze" />
              </path>`;
    }
    
    cumulativePercent += p / 100;
  });
  
  svg += `<g transform="translate(190, 50)">`;
  labels.forEach((l, i) => {
    svg += `<rect x="0" y="${i * 25}" width="12" height="12" fill="${colors[i]}" rx="2" />`;
    svg += `<text x="20" y="${i * 25 + 10}" fill="#ccc" font-size="10">${l} (${percents[i]}%)</text>`;
  });
  svg += `</g>`;
  
  svg += `</svg>`;
  return svg;
}

function renderAreaChart(labels, data) {
  const max = Math.max(...data, 5);
  const width = 400;
  const height = 200;
  const padding = 30;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  
  let svg = `<svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block; overflow: visible;">`;
  
  for (let i = 0; i <= 4; i++) {
    const y = padding + (chartH / 4) * i;
    const val = Math.round(max - (max / 4) * i);
    svg += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="rgba(255,255,255,0.1)" stroke-dasharray="4"/>`;
    if(i !== 4) svg += `<text x="${padding - 5}" y="${y + 4}" fill="#888" font-size="10" text-anchor="end">${val}</text>`;
  }
  
  let dLine = '';
  let dArea = '';
  
  const points = data.map((val, i) => {
    const x = padding + i * (chartW / (labels.length - 1));
    const y = height - padding - (val / max) * chartH;
    return {x, y};
  });
  
  points.forEach((p, i) => {
    if (i === 0) {
      dLine += `M ${p.x} ${p.y} `;
      dArea += `M ${p.x} ${height - padding} L ${p.x} ${p.y} `;
    } else {
      dLine += `L ${p.x} ${p.y} `;
      dArea += `L ${p.x} ${p.y} `;
    }
  });
  
  dArea += `L ${points[points.length-1].x} ${height - padding} Z`;
  
  svg += `<defs>
    <linearGradient id="area-grad-chart" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--accent-color, #8b5cf6)" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="var(--accent-color, #8b5cf6)" stop-opacity="0.0"/>
    </linearGradient>
  </defs>`;
  
  svg += `<path d="${dArea}" fill="url(#area-grad-chart)">
            <animate attributeName="opacity" from="0" to="1" dur="1s" fill="freeze" />
          </path>`;
  svg += `<path d="${dLine}" fill="none" stroke="var(--accent-color, #8b5cf6)" stroke-width="3">
            <animate attributeName="stroke-dasharray" from="0, 2000" to="2000, 0" dur="1s" fill="freeze" />
          </path>`;
  
  points.forEach((p, i) => {
    svg += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="var(--bg-color, #1f2937)" stroke="var(--accent-color, #8b5cf6)" stroke-width="2" />`;
    svg += `<text x="${p.x}" y="${height - padding + 15}" fill="#888" font-size="10" text-anchor="middle">${labels[i]}</text>`;
  });
  
  svg += `</svg>`;
  return svg;
}

function renderHeatmap(data) {
  const weeks = 12;
  const daysInWeek = 7;
  const cellSize = 12;
  const cellGap = 4;
  
  const width = (cellSize + cellGap) * weeks + 40;
  const height = (cellSize + cellGap) * daysInWeek + 20;
  
  let svg = `<svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block;" class="heatmap-grid">`;
  
  const labels = [
    { idx: 1, name: 'Pon' },
    { idx: 3, name: 'Śr' },
    { idx: 5, name: 'Pt' }
  ];
  
  labels.forEach(l => {
    const y = 10 + l.idx * (cellSize + cellGap) + cellSize / 2 + 4;
    svg += `<text x="25" y="${y}" fill="#888" font-size="10" text-anchor="end">${l.name}</text>`;
  });
  
  let col = 0;
  let row = 0;
  
  data.forEach((d, i) => {
    col = Math.floor(i / daysInWeek);
    row = i % daysInWeek;
    
    const x = 30 + col * (cellSize + cellGap);
    const y = 10 + row * (cellSize + cellGap);
    
    const colorVar = d.level === 0 ? 'rgba(255,255,255,0.05)' : `var(--level-${d.level}-color, rgba(139,92,246,${0.2 + d.level*0.25}))`;
    
    svg += `<rect class="heatmap-cell" x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${colorVar}">
              <title>${d.date}: poziom aktywności ${d.level}</title>
              <animate attributeName="opacity" from="0" to="1" dur="${0.5 + Math.random()*0.5}s" fill="freeze" />
            </rect>`;
  });
  
  svg += `</svg>`;
  return svg;
}

export function render(container) {
  const state = store.getState();
  const tasks = state.tasks || [];
  const pomodoroSessions = (state.pomodoro && state.pomodoro.sessions) ? state.pomodoro.sessions : [];
  
  const days7 = getLastNDays(7);
  
  const tasksCompleted7 = days7.map(d => {
    return tasks.filter(t => t.done && t.createdAt && t.createdAt.startsWith(d.date)).length; 
  });
  
  const pomodoros7 = days7.map(d => {
    return pomodoroSessions.filter(s => (s.date && s.date === d.date) || (s.startTime && s.startTime.startsWith(d.date))).length;
  });

  const qCounts = [0, 0, 0, 0];
  tasks.forEach(t => {
    if (t.quadrant >= 1 && t.quadrant <= 4) {
      qCounts[t.quadrant - 1]++;
    }
  });
  const totalEisenhower = qCounts.reduce((a, b) => a + b, 0);
  const qPercents = totalEisenhower === 0 ? [25, 25, 25, 25] : qCounts.map(c => Math.round((c / totalEisenhower) * 100));

  const days84 = getLastNDays(84);
  const heatmapData = days84.map(d => {
    const tCount = tasks.filter(t => t.done && t.createdAt && t.createdAt.startsWith(d.date)).length;
    const pCount = pomodoroSessions.filter(s => (s.date && s.date === d.date) || (s.startTime && s.startTime.startsWith(d.date))).length;
    const score = tCount + pCount;
    let level = 0;
    if (score >= 1 && score <= 2) level = 1;
    else if (score >= 3 && score <= 4) level = 2;
    else if (score >= 5 && score <= 6) level = 3;
    else if (score >= 7) level = 4;
    return { date: d.date, level };
  });

  let completionRate = 0;
  if (typeof store.getCompletionRate === 'function') {
    completionRate = store.getCompletionRate();
  } else {
    const recentTasks = tasks.filter(t => {
      if (!t.createdAt) return false;
      const tDate = t.createdAt.split('T')[0];
      return days7.some(d => d.date === tDate);
    });
    const recentDone = recentTasks.filter(t => t.done).length;
    completionRate = recentTasks.length ? Math.round((recentDone / recentTasks.length) * 100) : 0;
  }

  const totalTasksCompleted = tasks.filter(t => t.done).length;
  const totalPomodoroMinutes = pomodoroSessions.reduce((acc, s) => acc + (s.duration || 25), 0);
  const totalPomodoroHours = (totalPomodoroMinutes / 60).toFixed(1);
  
  let streak = 0;
  for (let i = days7.length - 1; i >= 0; i--) {
    const d = days7[i].date;
    const hasActivity = tasks.some(t => t.done && t.createdAt && t.createdAt.startsWith(d)) || 
                        pomodoroSessions.some(s => ((s.date && s.date === d) || (s.startTime && s.startTime.startsWith(d))));
    if (hasActivity) streak++;
    else if (i !== days7.length - 1) break;
  }

  container.innerHTML = `
    <div class="analytics-view">
      <div class="section-title">
        <h2><i data-lucide="bar-chart-2"></i> Statystyki</h2>
      </div>

      <div class="stats-row" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem;">
        <div class="glass-card stat-card">
          <div class="stat-title" style="color: #888; font-size: 0.9rem; margin-bottom: 0.5rem;">Wskaźnik ukończenia (7 dni)</div>
          <div class="stat-value" style="font-size: 1.5rem; font-weight: bold;">${completionRate}%</div>
        </div>
        <div class="glass-card stat-card">
          <div class="stat-title" style="color: #888; font-size: 0.9rem; margin-bottom: 0.5rem;">Ukończone zadania (ogółem)</div>
          <div class="stat-value" style="font-size: 1.5rem; font-weight: bold;">${totalTasksCompleted}</div>
        </div>
        <div class="glass-card stat-card">
          <div class="stat-title" style="color: #888; font-size: 0.9rem; margin-bottom: 0.5rem;">Godziny Focus (ogółem)</div>
          <div class="stat-value" style="font-size: 1.5rem; font-weight: bold;">${totalPomodoroHours}h</div>
        </div>
        <div class="glass-card stat-card">
          <div class="stat-title" style="color: #888; font-size: 0.9rem; margin-bottom: 0.5rem;">Obecny Streak (dni)</div>
          <div class="stat-value" style="font-size: 1.5rem; font-weight: bold;">${streak} <i data-lucide="flame" style="color: var(--warning-color, #f59e0b); width: 20px; height: 20px; vertical-align: middle;"></i></div>
        </div>
      </div>

      <div class="analytics-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
        <div class="glass-card-static chart-card" style="padding: 1.5rem; border-radius: 12px;">
          <h3 style="margin-top: 0; margin-bottom: 1.5rem;">Ukończone zadania</h3>
          ${renderBarChart(days7.map(d => getDayNamePl(d.dayOfWeek)), tasksCompleted7)}
        </div>

        <div class="glass-card-static chart-card" style="padding: 1.5rem; border-radius: 12px;">
          <h3 style="margin-top: 0; margin-bottom: 1.5rem;">Rozkład zadań Eisenhowera</h3>
          ${renderDonutChart(qPercents)}
        </div>

        <div class="glass-card-static chart-card" style="padding: 1.5rem; border-radius: 12px;">
          <h3 style="margin-top: 0; margin-bottom: 1.5rem;">Focus Time (Pomodoro)</h3>
          ${renderAreaChart(days7.map(d => getDayNamePl(d.dayOfWeek)), pomodoros7)}
        </div>

        <div class="glass-card-static chart-card" style="padding: 1.5rem; border-radius: 12px;">
          <h3 style="margin-top: 0; margin-bottom: 1.5rem;">Aktywność</h3>
          ${renderHeatmap(heatmapData)}
        </div>
      </div>
    </div>
  `;

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}
