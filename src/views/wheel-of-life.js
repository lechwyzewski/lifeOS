import store from '../core/store.js';
import utils from '../core/utils.js';

let unsubscribe = null;

export function render(container) {
  if (unsubscribe) {
    unsubscribe();
  }

  container.innerHTML = `
    <div class="view-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h2 class="section-title" style="margin: 0;">Koło Życia</h2>
      <button id="wol-save-btn" class="btn btn-primary">
        <i data-lucide="save"></i> Zapisz snapshot
      </button>
    </div>
    
    <div class="wol-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
      <div class="glass-card" style="display: flex; justify-content: center; align-items: center; padding: 2rem;">
        <div id="wol-chart-container" style="width: 100%; max-width: 400px; aspect-ratio: 1;"></div>
      </div>
      
      <div class="glass-card" style="padding: 1.5rem;">
        <h3 style="margin-top: 0; margin-bottom: 1.5rem;">Oceń swoje obszary (1-10)</h3>
        <div id="wol-sliders-container" style="display: flex; flex-direction: column; gap: 1rem;"></div>
      </div>
    </div>
    
    <h3 class="section-title" style="margin-bottom: 1rem;">Analiza luk (obszary do poprawy)</h3>
    <div id="wol-gap-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
    </div>
  `;

  const chartContainer = utils.$('#wol-chart-container', container);
  const slidersContainer = utils.$('#wol-sliders-container', container);
  const gapContainer = utils.$('#wol-gap-container', container);
  const saveBtn = utils.$('#wol-save-btn', container);

  const areas = utils.getWolAreas();

  function drawChart() {
    const state = store.getState();
    const current = state.wheelOfLife.current;
    const history = state.wheelOfLife.history;
    const prev = history.length > 0 ? history[history.length - 1].scores : null;

    const size = 200;
    const center = size / 2;
    const maxRadius = 75;

    let svg = `<svg viewBox="0 0 ${size} ${size}" width="100%" height="100%">`;
    
    // Draw concentric grid lines
    [2, 4, 6, 8, 10].forEach(level => {
      const r = (level / 10) * maxRadius;
      svg += `<circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1" />`;
    });

    // Draw axes & labels
    areas.forEach((area, i) => {
      const angle = (i * Math.PI * 2) / 8 - Math.PI / 2;
      const x = center + Math.cos(angle) * maxRadius;
      const y = center + Math.sin(angle) * maxRadius;
      svg += `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,0.2)" stroke-width="1" />`;
      
      const lx = center + Math.cos(angle) * (maxRadius + 15);
      const ly = center + Math.sin(angle) * (maxRadius + 15);
      const score = current[area.key];
      svg += `<text x="${lx}" y="${ly}" fill="rgba(255,255,255,0.7)" font-size="8" text-anchor="middle" dominant-baseline="middle">${area.label} (${score})</text>`;
    });

    // Draw history polygon
    if (prev) {
      let points = '';
      areas.forEach((area, i) => {
        const angle = (i * Math.PI * 2) / 8 - Math.PI / 2;
        const val = prev[area.key] || 0;
        const r = (val / 10) * maxRadius;
        const x = center + Math.cos(angle) * r;
        const y = center + Math.sin(angle) * r;
        points += `${x},${y} `;
      });
      svg += `<polygon points="${points}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-dasharray="4,2" />`;
    }

    // Draw current polygon
    let points = '';
    areas.forEach((area, i) => {
      const angle = (i * Math.PI * 2) / 8 - Math.PI / 2;
      const val = current[area.key] || 0;
      const r = (val / 10) * maxRadius;
      const x = center + Math.cos(angle) * r;
      const y = center + Math.sin(angle) * r;
      points += `${x},${y} `;
    });
    
    // Filled polygon with accent color
    svg += `<polygon points="${points}" fill="var(--accent-color, rgba(99, 102, 241, 0.3))" stroke="var(--accent-color, rgba(99, 102, 241, 1))" stroke-width="2" />`;
    
    // Current dots
    areas.forEach((area, i) => {
      const angle = (i * Math.PI * 2) / 8 - Math.PI / 2;
      const val = current[area.key] || 0;
      const r = (val / 10) * maxRadius;
      const x = center + Math.cos(angle) * r;
      const y = center + Math.sin(angle) * r;
      svg += `<circle cx="${x}" cy="${y}" r="3" fill="${area.color}" />`;
    });

    svg += `</svg>`;
    chartContainer.innerHTML = svg;
  }

  function renderSliders() {
    const current = store.getState().wheelOfLife.current;
    slidersContainer.innerHTML = areas.map(area => {
      const val = current[area.key] || 5;
      return `
        <div class="wol-slider-row" style="display: flex; align-items: center; gap: 1rem;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${area.color};"></div>
          <div class="wol-slider-label" style="flex: 1; font-weight: 500;">${area.label}</div>
          <input type="range" class="form-control range-slider" data-area="${area.key}" min="1" max="10" value="${val}" style="flex: 2; padding: 0;">
          <div style="width: 24px; text-align: right; font-weight: bold;" id="val-${area.key}">${val}</div>
        </div>
      `;
    }).join('');

    const sliders = utils.$$('.range-slider', slidersContainer);
    sliders.forEach(slider => {
      slider.addEventListener('input', (e) => {
        const key = e.target.dataset.area;
        const val = parseInt(e.target.value, 10);
        utils.$(`#val-${key}`, slidersContainer).textContent = val;
        
        store.getState().wheelOfLife.current[key] = val;
        drawChart();
        renderGapAnalysis();
      });
    });
  }

  function renderGapAnalysis() {
    const current = store.getState().wheelOfLife.current;
    const sorted = areas.map(a => ({ ...a, score: current[a.key] || 0 })).sort((a, b) => a.score - b.score);
    const lowest = sorted.slice(0, 3);

    gapContainer.innerHTML = lowest.map(a => `
      <div class="glass-card" style="padding: 1.5rem; border-left: 4px solid ${a.color};">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
          <i data-lucide="${a.icon}" style="color: ${a.color};"></i>
          <h4 style="margin: 0; font-size: 1.1rem;">${a.label} <span style="color: rgba(255,255,255,0.5);">(${a.score}/10)</span></h4>
        </div>
        <p style="margin: 0; font-size: 0.95rem; color: rgba(255,255,255,0.7);">Ten obszar wymaga uwagi.</p>
      </div>
    `).join('');
    
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  saveBtn.addEventListener('click', () => {
    const currentScores = { ...store.getState().wheelOfLife.current };
    store.updateWheelOfLife(currentScores);
    drawChart(); 
  });

  drawChart();
  renderSliders();
  renderGapAnalysis();

  if (window.lucide) {
    window.lucide.createIcons();
  }

  unsubscribe = store.subscribe(() => {
    // Empty for now since we manually update on save
  });
}
