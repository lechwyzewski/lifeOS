import store from '../core/store.js';
import utils from '../core/utils.js';

let unsubscribe = null;
let currentContainer = null;
let editingTaskId = null;

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

      <!-- Edit Task Dialog -->
      <dialog id="edit-task-modal" class="modal">
        <div class="modal-content glass-card">
          <div class="modal-header">
            <h2>Edytuj zadanie</h2>
            <button class="modal-close" id="edit-modal-close" aria-label="Zamknij">
              <i data-lucide="x"></i>
            </button>
          </div>
          <form id="edit-task-form" class="modal-body">
            <input type="hidden" id="edit-task-id" />
            <div class="form-group">
              <label for="edit-task-title">Tytuł zadania</label>
              <input type="text" id="edit-task-title" class="form-control" required />
            </div>
            <div class="form-group">
              <label for="edit-task-quadrant">Kwadrant Eisenhowera</label>
              <select id="edit-task-quadrant" class="form-control">
                <option value="1">Q1 — Ważne i Pilne</option>
                <option value="2">Q2 — Ważne i Niepilne</option>
                <option value="3">Q3 — Nieważne i Pilne</option>
                <option value="4">Q4 — Nieważne i Niepilne</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="edit-task-due">Termin</label>
                <input type="date" id="edit-task-due" class="form-control" />
              </div>
              <div class="form-group">
                <label for="edit-task-pomodoros">Pomodoro (est.)</label>
                <input type="number" id="edit-task-pomodoros" class="form-control" min="1" max="20" />
              </div>
            </div>
            <div class="modal-actions" style="display:flex;justify-content:space-between;align-items:center;">
              <button type="button" id="edit-task-delete-btn" class="btn btn-danger btn-sm">
                <i data-lucide="trash-2"></i> Usuń zadanie
              </button>
              <div style="display:flex;gap:0.5rem;">
                <button type="button" id="edit-task-cancel-btn" class="btn btn-ghost">Anuluj</button>
                <button type="submit" class="btn btn-primary">Zapisz zmiany</button>
              </div>
            </div>
          </form>
        </div>
      </dialog>
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
          <div class="task-item glass-card" draggable="true" id="task-item-${t.id}" data-id="${t.id}" style="padding: 0.75rem; cursor: grab; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0;">
              <input type="checkbox" id="task-checkbox-${t.id}" class="task-checkbox" data-id="${t.id}" ${t.done ? 'checked' : ''}>
              <label for="task-checkbox-${t.id}" class="task-label-title" data-id="${t.id}" style="${t.done ? 'text-decoration: line-through; opacity: 0.7;' : ''} cursor: pointer; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; flex: 1;" title="Kliknij dwukrotnie lub ikona ołówka aby edytować">${t.title}</label>
            </div>
            <div style="display: flex; align-items: center; gap: 0.25rem; flex-shrink: 0;">
              ${t.pomodoros ? `<span class="badge badge-info" style="font-size: 0.75rem;"><i data-lucide="clock" style="width: 12px; height: 12px;"></i> ${t.pomodoros}</span>` : ''}
              <button type="button" class="edit-task-btn btn-icon" data-id="${t.id}" title="Edytuj zadanie" style="background: none; border: none; cursor: pointer; color: var(--text-tertiary, #888); padding: 2px 4px; transition: color 0.2s;">
                <i data-lucide="pencil" style="width: 14px; height: 14px;"></i>
              </button>
            </div>
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

  // Edit Task Buttons & Double Click
  const modal = utils.$('#edit-task-modal', container);
  const form = utils.$('#edit-task-form', container);
  const closeBtn = utils.$('#edit-modal-close', container);
  const cancelBtn = utils.$('#edit-task-cancel-btn', container);
  const deleteBtn = utils.$('#edit-task-delete-btn', container);

  const openEditModal = (taskId) => {
    const task = store.getState().tasks.find(t => t.id === taskId);
    if (!task) return;

    editingTaskId = taskId;
    utils.$('#edit-task-id', container).value = task.id;
    utils.$('#edit-task-title', container).value = task.title;
    utils.$('#edit-task-quadrant', container).value = task.quadrant || 2;
    utils.$('#edit-task-due', container).value = task.dueDate || '';
    utils.$('#edit-task-pomodoros', container).value = task.pomodoros || 1;

    if (typeof modal.showModal === 'function') {
      modal.showModal();
    } else {
      modal.setAttribute('open', '');
    }
  };

  const closeEditModal = () => {
    if (typeof modal.close === 'function') {
      modal.close();
    } else {
      modal.removeAttribute('open');
    }
    editingTaskId = null;
  };

  utils.$$('.edit-task-btn', container).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(btn.getAttribute('data-id'));
    });
  });

  utils.$$('.task-label-title', container).forEach(lbl => {
    lbl.addEventListener('dblclick', () => {
      openEditModal(lbl.getAttribute('data-id'));
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeEditModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeEditModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeEditModal();
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = utils.$('#edit-task-id', container).value;
      const title = utils.$('#edit-task-title', container).value.trim();
      const quadrant = parseInt(utils.$('#edit-task-quadrant', container).value, 10);
      const dueDate = utils.$('#edit-task-due', container).value || null;
      const pomodoros = parseInt(utils.$('#edit-task-pomodoros', container).value || '1', 10);

      if (id && title) {
        store.updateTask(id, {
          title,
          quadrant,
          dueDate,
          pomodoros
        });
      }
      closeEditModal();
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      const id = utils.$('#edit-task-id', container).value;
      if (id && confirm('Czy na pewno chcesz usunąć to zadanie?')) {
        store.deleteTask(id);
        closeEditModal();
      }
    });
  }

  // Drag & Drop
  const taskItems = utils.$$('.task-item', container);
  taskItems.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.getAttribute('data-id'));
      item.style.opacity = '0.5';
    });
    item.addEventListener('dragend', () => {
      item.style.opacity = '1';
    });
  });

  const dropZones = utils.$$('.drop-zone', container);
  dropZones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
      zone.style.transform = 'scale(1.02)';
      zone.style.transition = 'transform 0.2s';
    });
    
    zone.addEventListener('dragleave', () => {
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
        const tasks = store.getState().tasks;
        const task = tasks.find(t => t.id === taskId);
        if (task && task.quadrant !== newQ) {
          store.updateTask(taskId, { quadrant: newQ });
        }
      }
    });
  });
}
