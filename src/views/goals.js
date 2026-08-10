import store from '../core/store.js';
import utils from '../core/utils.js';

export function render(container) {
  let unsubscribe;
  let editingId = null;
  let tempMilestones = [];

  const update = () => {
    const state = store.getState();
    const goals = state.goals || [];
    const areas = typeof utils.getWolAreas === 'function' ? utils.getWolAreas() : [];

    container.innerHTML = `
      <style>
        .goal-card .goal-actions {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .goal-card:hover .goal-actions {
          opacity: 1;
        }
        dialog::backdrop {
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
        }
      </style>
      <div class="view-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h1 class="section-title" style="margin: 0;">Cele życiowe</h1>
        <button class="btn btn-primary" id="btn-add-goal">
          <i data-lucide="plus"></i> Nowy cel
        </button>
      </div>
      
      <div class="goals-list" style="display: flex; flex-direction: column; gap: 1rem;">
        ${goals.length === 0 ? `
          <div class="empty-state" style="text-align: center; padding: 4rem 2rem;">
            <i data-lucide="target" style="width: 64px; height: 64px; opacity: 0.3; margin-bottom: 1rem;"></i>
            <p style="color: #888; font-size: 1.1rem;">Nie masz jeszcze żadnych celów</p>
          </div>
        ` : goals.map(goal => renderGoal(goal, areas)).join('')}
      </div>

      <dialog id="goal-dialog" class="glass-card" style="padding: 1.5rem; border: none; border-radius: 12px; width: 90%; max-width: 500px; margin: auto; background: var(--bg-surface, #1e1e1e); color: white;">
        <form id="goal-form">
          <h2 id="dialog-title" class="section-title" style="margin-top: 0; margin-bottom: 1.5rem;">Nowy cel</h2>
          
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem; color: #aaa;">Tytuł celu</label>
            <input type="text" id="goal-title" class="form-control" required style="width: 100%;" />
          </div>
          
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem; color: #aaa;">Obszar życia</label>
            <select id="goal-area" class="form-control" required style="width: 100%;">
              ${areas.map(a => `<option value="${a.id}">${a.label}</option>`).join('')}
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem; color: #aaa;">Deadline</label>
            <input type="date" id="goal-deadline" class="form-control" style="width: 100%;" />
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem; color: #aaa;">Kamienie milowe</label>
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
              <input type="text" id="milestone-input" class="form-control" placeholder="Nowy kamień milowy" style="flex: 1;" />
              <button type="button" id="btn-add-milestone" class="btn btn-sm" style="white-space: nowrap;">Dodaj</button>
            </div>
            <ul id="milestones-preview" style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; max-height: 200px; overflow-y: auto;">
            </ul>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 2rem;">
            <button type="button" id="btn-cancel-goal" class="btn btn-ghost">Anuluj</button>
            <button type="submit" class="btn btn-primary">Zapisz</button>
          </div>
        </form>
      </dialog>
    `;

    if (window.lucide) {
      lucide.createIcons({ root: container });
    }

    // Attach milestone checkboxes
    utils.$$('.milestone-check', container).forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const goalId = e.target.getAttribute('data-goal-id');
        const mId = e.target.getAttribute('data-milestone-id');
        const done = e.target.checked;
        
        const goal = goals.find(g => g.id === goalId);
        if (goal) {
          const m = goal.milestones.find(mil => mil.id === mId);
          if (m) {
            m.done = done;
            if (typeof store.updateGoal === 'function') {
              store.updateGoal(goalId, { milestones: goal.milestones });
            } else {
              store.setState('goals', [...goals]);
            }
          }
        }
      });
    });

    // Delete buttons
    utils.$$('.btn-delete-goal', container).forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Czy na pewno chcesz usunąć ten cel?')) {
          if (typeof store.deleteGoal === 'function') {
            store.deleteGoal(id);
          } else {
            store.setState('goals', goals.filter(g => g.id !== id));
          }
        }
      });
    });

    // Edit buttons
    utils.$$('.btn-edit-goal', container).forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const goal = goals.find(g => g.id === id);
        if (goal) {
          editingId = id;
          utils.$('#dialog-title', container).textContent = 'Edytuj cel';
          utils.$('#goal-title', container).value = goal.title || '';
          utils.$('#goal-area', container).value = goal.areaId || '';
          utils.$('#goal-deadline', container).value = goal.deadline || '';
          tempMilestones = JSON.parse(JSON.stringify(goal.milestones || []));
          renderTempMilestones();
          utils.$('#goal-dialog', container).showModal();
        }
      });
    });

    // Add button
    utils.$('#btn-add-goal', container).addEventListener('click', () => {
      editingId = null;
      utils.$('#goal-form', container).reset();
      utils.$('#dialog-title', container).textContent = 'Nowy cel';
      tempMilestones = [];
      renderTempMilestones();
      utils.$('#goal-dialog', container).showModal();
    });

    // Cancel button
    utils.$('#btn-cancel-goal', container).addEventListener('click', () => {
      utils.$('#goal-dialog', container).close();
    });

    // Add milestone
    utils.$('#btn-add-milestone', container).addEventListener('click', () => {
      const input = utils.$('#milestone-input', container);
      const title = input.value.trim();
      if (title) {
        tempMilestones.push({
          id: utils.generateId(),
          title,
          done: false
        });
        input.value = '';
        renderTempMilestones();
      }
    });

    utils.$('#milestone-input', container).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        utils.$('#btn-add-milestone', container).click();
      }
    });

    // Form submit
    utils.$('#goal-form', container).addEventListener('submit', (e) => {
      e.preventDefault();
      
      const data = {
        title: utils.$('#goal-title', container).value.trim(),
        areaId: utils.$('#goal-area', container).value,
        deadline: utils.$('#goal-deadline', container).value,
        milestones: tempMilestones
      };

      if (editingId) {
        if (typeof store.updateGoal === 'function') {
          store.updateGoal(editingId, data);
        } else {
          const index = goals.findIndex(g => g.id === editingId);
          if (index !== -1) {
            goals[index] = { ...goals[index], ...data };
            store.setState('goals', [...goals]);
          }
        }
      } else {
        data.id = utils.generateId();
        if (typeof store.addGoal === 'function') {
          store.addGoal(data);
        } else {
          store.setState('goals', [...goals, data]);
        }
      }

      utils.$('#goal-dialog', container).close();
    });
  };

  const renderTempMilestones = () => {
    const list = utils.$('#milestones-preview', container);
    if (!list) return;
    
    list.innerHTML = tempMilestones.map(m => `
      <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.05); border-radius: 6px;">
        <span style="font-size: 0.9rem;">${m.title}</span>
        <button type="button" class="btn btn-sm btn-danger btn-remove-milestone" data-id="${m.id}" style="padding: 0.25rem;">
          <i data-lucide="x" style="width: 14px; height: 14px;"></i>
        </button>
      </li>
    `).join('');
    
    if (window.lucide) {
      lucide.createIcons({ root: list });
    }

    utils.$$('.btn-remove-milestone', list).forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        tempMilestones = tempMilestones.filter(m => m.id !== id);
        renderTempMilestones();
      });
    });
  };

  const renderGoal = (goal, areas) => {
    const area = areas.find(a => a.id === goal.areaId) || { label: goal.areaId || 'Inne', color: '#888' };
    
    let completed = 0;
    if (goal.milestones && goal.milestones.length > 0) {
      completed = goal.milestones.filter(m => m.done).length;
    }
    const total = goal.milestones ? goal.milestones.length : 0;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    return `
      <div class="glass-card goal-card" style="padding: 1.5rem; position: relative;">
        <div class="goal-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
          <div>
            <h3 style="margin: 0 0 0.75rem 0; font-size: 1.25rem;">${goal.title}</h3>
            <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
              <span class="badge" style="background-color: ${area.color}20; color: ${area.color}; border: 1px solid ${area.color}40; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">
                ${area.label}
              </span>
              ${goal.deadline ? `<span style="font-size: 0.85rem; color: #999; display: flex; align-items: center; gap: 0.3rem;"><i data-lucide="calendar" style="width: 14px; height: 14px;"></i> ${typeof utils.formatDate === 'function' ? utils.formatDate(goal.deadline) : goal.deadline}</span>` : ''}
            </div>
          </div>
          <div class="goal-actions" style="display: flex; gap: 0.5rem;">
            <button class="btn btn-sm btn-ghost btn-edit-goal" data-id="${goal.id}" title="Edytuj"><i data-lucide="edit-2" style="width: 16px; height: 16px;"></i></button>
            <button class="btn btn-sm btn-danger btn-delete-goal" data-id="${goal.id}" title="Usuń"><i data-lucide="trash-2" style="width: 16px; height: 16px;"></i></button>
          </div>
        </div>
        
        <div class="goal-progress" style="margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.5rem; color: #aaa;">
            <span>Postęp</span>
            <span>${progress}%</span>
          </div>
          <div class="progress-bar-container" style="background: rgba(255,255,255,0.05); height: 8px; border-radius: 4px; overflow: hidden; position: relative;">
            <div class="progress-bar" style="width: ${progress}%; background: ${area.color}; height: 100%; transition: width 0.4s ease-out; border-radius: 4px;" style="--progress: ${progress}%"></div>
          </div>
        </div>

        <div class="goal-milestones">
          ${total > 0 ? `
            <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem;">
              ${goal.milestones.map(m => `
                <li style="display: flex; align-items: flex-start; gap: 0.75rem; font-size: 0.95rem;">
                  <input type="checkbox" class="milestone-check" data-goal-id="${goal.id}" data-milestone-id="${m.id}" ${m.done ? 'checked' : ''} style="margin-top: 0.2rem; cursor: pointer; width: 16px; height: 16px; accent-color: ${area.color};" />
                  <span style="${m.done ? 'text-decoration: line-through; opacity: 0.5;' : ''} transition: all 0.2s; cursor: pointer;">${m.title}</span>
                </li>
              `).join('')}
            </ul>
          ` : '<p style="font-size: 0.85rem; color: #666; margin: 0; font-style: italic;">Brak kamieni milowych.</p>'}
        </div>
      </div>
    `;
  };

  update();
  
  if (typeof store.subscribe === 'function') {
    unsubscribe = store.subscribe(() => {
      // Re-render only if dialog is not open to prevent losing state while typing, 
      // but simpler approach: just update whole DOM unless editing. 
      // For now let's just update and let dialog be managed since it's modal.
      if (!utils.$('#goal-dialog', container).open) {
        update();
      }
    });
  }

  // Cleanup on re-render
  const originalClean = container.clean;
  container.clean = () => {
    if (unsubscribe) unsubscribe();
    if (originalClean) originalClean();
  };
}
