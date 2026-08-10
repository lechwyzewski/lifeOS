import store from '../core/store.js';
import utils from '../core/utils.js';

let unsubscribe = null;
let currentContainer = null;

export function render(container) {
  currentContainer = container;

  if (unsubscribe) {
    unsubscribe();
  }

  unsubscribe = store.subscribe(() => {
    if (currentContainer) renderHTML(currentContainer);
  });

  renderHTML(container);
}

function renderHTML(container) {
  container.innerHTML = `
    <div class="eisenhower-view">
      <div class="section-title">Macierz Eisenhowera</div>
      <div class="eisenhower-labels" style="display: grid; grid-template-columns: 1fr 1fr; text-align: center; font-weight: bold; margin-bottom: 1rem;">
        <div>PILNE</div>
        <div>NIEPILNE</div>
      </div>
      <div class="eisenhower-grid" style="display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 1rem; min-height: 500px;">
        ${[1, 2, 3, 4].map(q => renderQuadrant(q)).join('')}
      </div>
      <div class="eisenhower-stats" style="margin-top: 2rem;">
        ${renderStatsBar()}
      </div>
    </div>
  `;

  attachEvents(container);

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderQuadrant(q) {
  const info = utils.getQuadrantInfo(q);
  const tasks = store.getTasksByQuadrant(q);
  
  return `
    <div class="glass-card eisenhower-quadrant q${q} drop-zone" data-quadrant="${q}" style="display: flex; flex-direction: column; border-top: 4px solid ${info.color};">
      <div class="quadrant-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div>
          <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem; color: ${info.color}">
            <i data-lucide="${info.icon}"></i> ${info.title}
          </h3>
          <small style="color: var(--text-muted);">${info.subtitle}</small>
        </div>
        <div style="text-align: right;">
          <span class="badge" style="background-color: ${info.color}; color: #fff;">${info.action}</span>
          <div style="font-size: 0.8rem; margin-top: 0.25rem;">Zadań: ${tasks.length}</div>
        </div>
      </div>
      
      <div class="quadrant-tasks" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;">
        ${tasks.length ? tasks.map(t => `
          <div class="task-item glass-card" draggable="true" id="task-item-${t.id}" data-id="${t.id}" style="padding: 0.75rem; cursor: grab; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <input type="checkbox" id="task-checkbox-${t.id}" class="task-checkbox" data-id="${t.id}" ${t.done ? 'checked' : ''}>
              <label for="task-checkbox-${t.id}" style="${t.done ? 'text-decoration: line-through; opacity: 0.7;' : ''} cursor: pointer;">${t.title}</label>
            </div>
            ${t.pomodoros ? `<span class="badge badge-info"><i data-lucide="clock" style="width: 12px; height: 12px;"></i> ${t.pomodoros}</span>` : ''}
          </div>
        `).join('') : '<div class="empty-state" style="padding: 1rem; text-align: center; color: var(--text-muted);">Brak zadań</div>'}
      </div>
      
      <div class="quadrant-quick-add" style="margin-top: auto;">
        <input type="text" id="quick-add-q${q}" class="form-control quick-add-input" data-quadrant="${q}" placeholder="Dodaj zadanie (Enter)..." style="width: 100%;">
      </div>
    </div>
  `;
}

function renderStatsBar() {
  const counts = [1, 2, 3, 4].map(q => store.getTasksByQuadrant(q).length);
  const total = counts.reduce((sum, c) => sum + c, 0);
  
  if (total === 0) return '<div class="empty-state">Brak zadań w macierzy</div>';
  
  const segments = counts.map((c, i) => {
    const q = i + 1;
    const info = utils.getQuadrantInfo(q);
    const percent = (c / total) * 100;
    return percent > 0 ? `<div style="width: ${percent}%; background-color: ${info.color}; height: 100%; transition: width 0.3s;" title="Q${q}: ${c} zadań (${Math.round(percent)}%)"></div>` : '';
  }).join('');

  return `
    <div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
        <span>Rozkład zadań</span>
        <span>Razem: ${total}</span>
      </div>
      <div style="height: 12px; border-radius: 6px; overflow: hidden; display: flex; background: var(--bg-card);">
        ${segments}
      </div>
    </div>
  `;
}

function attachEvents(container) {
  // Quick Add
  const inputs = utils.$$('.quick-add-input', container);
  inputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        const q = parseInt(input.getAttribute('data-quadrant'), 10);
        store.addTask({ title: input.value.trim(), quadrant: q });
      }
    });
  });

  // Task Checkbox Toggle
  const checkboxes = utils.$$('.task-checkbox', container);
  checkboxes.forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = e.target.getAttribute('data-id');
      store.toggleTask(id);
    });
  });

  // Drag & Drop
  const taskItems = utils.$$('.task-item', container);
  taskItems.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.getAttribute('data-id'));
      item.style.opacity = '0.5';
    });
    item.addEventListener('dragend', (e) => {
      item.style.opacity = '1';
    });
  });

  const dropZones = utils.$$('.drop-zone', container);
  dropZones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
      // Add a slight visual cue manually in case drag-over class isn't doing enough
      zone.style.transform = 'scale(1.02)';
      zone.style.transition = 'transform 0.2s';
    });
    
    zone.addEventListener('dragleave', (e) => {
      zone.classList.remove('drag-over');
      zone.style.transform = 'scale(1)';
    });
    
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      zone.style.transform = 'scale(1)';
      
      const taskId = e.dataTransfer.getData('text/plain');
      const newQ = parseInt(zone.getAttribute('data-quadrant'), 10);
      
      if (taskId && newQ) {
        // Find current task to make sure we only update if changed
        const tasks = store.getState().tasks;
        const task = tasks.find(t => t.id === taskId);
        if (task && task.quadrant !== newQ) {
          store.updateTask(taskId, { quadrant: newQ });
        }
      }
    });
  });
}
