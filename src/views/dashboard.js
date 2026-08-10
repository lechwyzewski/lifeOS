/* ============================================================
   LifeOS — Dashboard View
   ============================================================ */

import store from '../core/store.js';
import utils from '../core/utils.js';

export function render(container) {
  const state = store.getState();

  // Today's tasks
  const todaysTasks = store.getTodaysTasks();
  const doneTasks = todaysTasks.filter(t => t.done).length;
  const totalTasks = todaysTasks.length;

  // Pomodoro stats
  const todayPomodoros = store.getTodayPomodoros();
  const pomodoroCount = Array.isArray(todayPomodoros) ? todayPomodoros.length : 0;

  // Streak
  const streak = store.getStreak();

  // Wheel of Life average
  const wheelScores = state.wheelOfLife?.current || {};
  const wheelValues = Object.values(wheelScores);
  const wheelAvg = wheelValues.length
    ? (wheelValues.reduce((a, b) => a + b, 0) / wheelValues.length).toFixed(1)
    : '0.0';

  // Focus of the day — priority:
  // 1. Ręcznie ustawiony przez użytkownika (dailyFocus)
  // 2. Pierwsze nieukończone Q1 (pilne + ważne)
  // 3. Pierwsze nieukończone Q2 (ważne + niepilne)
  const manualFocus = store.getDailyFocus();
  const q1Tasks = store.getTasksByQuadrant(1);
  const q2Tasks = store.getTasksByQuadrant(2);
  const autoFocusTask = q1Tasks.length > 0 ? q1Tasks[0] : (q2Tasks.length > 0 ? q2Tasks[0] : null);
  const focusTask = manualFocus || autoFocusTask;
  const isManualFocus = !!manualFocus;

  // Schedule
  const timeBlocks = store.getTodayTimeBlocks();

  // Greeting and Quote
  const greeting = utils.getGreeting();
  const dateStr = utils.formatDate(new Date());
  const quote = utils.getRandomQuote();

  // Quadrant badge helper
  function qBadgeClass(q) {
    if (q === 1) return 'badge-danger';
    if (q === 2) return 'badge-success';
    if (q === 3) return 'badge-warning';
    return 'badge-neutral';
  }

  // Format time block time
  function formatBlockTime(hour, minute) {
    return `${String(hour).padStart(2, '0')}:${String(minute || 0).padStart(2, '0')}`;
  }

  // All incomplete tasks for the focus picker
  const allIncompleteTasks = state.tasks.filter(t => !t.done);

  container.innerHTML = `
    <div class="dashboard-view animate-fade-in">
      <!-- Welcome -->
      <div class="dashboard-welcome">
        <div class="welcome-greeting">${greeting} 👋</div>
        <div class="welcome-date">${dateStr}</div>
        <div class="welcome-quote">
          „${quote.text}" — <em>${quote.author}</em>
        </div>
      </div>

      <!-- Focus of the Day -->
      <div class="focus-card" style="position:relative;">
        <div class="focus-icon">
          <i data-lucide="${isManualFocus ? 'pin' : 'target'}"></i>
        </div>
        <div style="flex:1;">
          <div class="focus-label" style="display:flex;align-items:center;gap:var(--space-2);">
            Cel dnia
            ${isManualFocus ? '<span class="badge badge-info" style="font-size:0.65rem;">📌 Twój wybór</span>' : '<span class="badge badge-neutral" style="font-size:0.65rem;">auto</span>'}
          </div>
          ${focusTask 
            ? `<div class="focus-title">${focusTask.title}</div>`
            : `<div class="focus-title" style="opacity:0.5;">Wybierz swój cel na dziś →</div>`
          }
        </div>
        ${focusTask ? `<span class="badge ${qBadgeClass(focusTask.quadrant)}">Q${focusTask.quadrant}</span>` : ''}
        <button class="btn btn-sm btn-ghost" id="change-focus-btn" title="Zmień cel dnia" style="margin-left:var(--space-2);">
          <i data-lucide="pencil" style="width:16px;height:16px;"></i>
        </button>
      </div>

      <!-- Focus Picker (hidden by default) -->
      <div id="focus-picker" class="glass-card" style="display:none;padding:var(--space-4);margin-bottom:var(--space-4);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-3);">
          <h4 style="margin:0;">Wybierz cel dnia</h4>
          <button class="btn btn-sm btn-ghost" id="close-focus-picker">
            <i data-lucide="x" style="width:16px;height:16px;"></i>
          </button>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-2);max-height:250px;overflow-y:auto;">
          ${allIncompleteTasks.length === 0
            ? '<p style="opacity:0.5;text-align:center;padding:var(--space-4);">Brak zadań do wyboru</p>'
            : allIncompleteTasks.map(t => `
              <button class="focus-pick-item" data-task-id="${t.id}" style="
                display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);
                border-radius:var(--radius-md);border:1px solid var(--glass-border);
                background:${focusTask && t.id === focusTask.id && isManualFocus ? 'var(--accent-bg)' : 'transparent'};
                cursor:pointer;text-align:left;color:inherit;width:100%;transition:background 0.2s;
              ">
                <span class="badge ${qBadgeClass(t.quadrant)}" style="font-size:0.7rem;">Q${t.quadrant}</span>
                <span style="flex:1;">${t.title}</span>
                ${focusTask && t.id === focusTask.id && isManualFocus ? '<i data-lucide="check" style="width:16px;height:16px;color:var(--success);"></i>' : ''}
              </button>
            `).join('')
          }
        </div>
        ${isManualFocus ? `
          <button class="btn btn-sm btn-ghost" id="clear-focus-btn" style="margin-top:var(--space-3);width:100%;justify-content:center;">
            <i data-lucide="rotate-ccw" style="width:14px;height:14px;"></i> Przywróć automatyczny wybór
          </button>
        ` : ''}
      </div>

      <!-- Quick Stats -->
      <div class="dashboard-grid-4 stagger-children" style="margin-bottom: var(--space-6);">
        <div class="glass-card stat-card">
          <div class="stat-icon" style="background: var(--success-bg);">
            <i data-lucide="check-circle" style="color: var(--success);"></i>
          </div>
          <div class="stat-value">${doneTasks}<span style="font-size:var(--font-size-md);color:var(--text-tertiary);">/${totalTasks}</span></div>
          <div class="stat-label">Zadania na dziś</div>
        </div>
        <div class="glass-card stat-card">
          <div class="stat-icon" style="background: var(--danger-bg);">
            <i data-lucide="timer" style="color: var(--danger);"></i>
          </div>
          <div class="stat-value">${pomodoroCount}</div>
          <div class="stat-label">Pomodoro dziś</div>
        </div>
        <div class="glass-card stat-card">
          <div class="stat-icon" style="background: var(--info-bg);">
            <i data-lucide="circle-dot" style="color: var(--info);"></i>
          </div>
          <div class="stat-value">${wheelAvg}</div>
          <div class="stat-label">Wheel of Life</div>
        </div>
        <div class="glass-card stat-card">
          <div class="stat-icon" style="background: var(--warning-bg);">
            <i data-lucide="flame" style="color: var(--warning);"></i>
          </div>
          <div class="stat-value">${streak}</div>
          <div class="stat-label">Dni z rzędu 🔥</div>
        </div>
      </div>

      <!-- Tasks & Schedule Grid -->
      <div class="dashboard-grid-2">
        <!-- Today's Tasks -->
        <div class="glass-card-static" style="padding: var(--space-5);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4);">
            <h3 class="section-title" style="margin:0;"><i data-lucide="list-todo"></i> Dzisiejsze zadania</h3>
            <button class="btn btn-sm btn-primary" id="dashboard-quick-add">
              <i data-lucide="plus"></i> Dodaj
            </button>
          </div>
          <div style="display:flex;flex-direction:column;gap:var(--space-2);">
            ${todaysTasks.length === 0
              ? '<div class="empty-state" style="padding:var(--space-8) var(--space-4);"><i data-lucide="coffee"></i><h3>Brak zadań na dziś</h3><p>Odpoczywaj lub dodaj nowe zadanie!</p></div>'
              : todaysTasks.map(t => `
                <div class="task-item ${t.done ? 'done' : ''}" style="display:flex;align-items:center;gap:var(--space-3);">
                  <button class="task-checkbox ${t.done ? 'checked' : ''}" data-task-id="${t.id}" aria-label="Toggle task"></button>
                  <div class="task-info" style="flex:1;">
                    <div class="task-title">${t.title}</div>
                    <div class="task-meta" style="display:flex;gap:var(--space-2);align-items:center;">
                      <span class="badge ${qBadgeClass(t.quadrant)}">Q${t.quadrant}</span>
                      ${t.pomodoros > 0 ? `<span style="font-size:0.75rem;opacity:0.6;"><i data-lucide="timer" style="width:12px;height:12px;"></i> ${t.pomodorosDone || 0}/${t.pomodoros}</span>` : ''}
                    </div>
                  </div>
                  <button class="btn-icon set-focus-btn" data-task-id="${t.id}" title="Ustaw jako cel dnia" style="opacity:${isManualFocus && focusTask?.id === t.id ? '1' : '0.3'};padding:4px;background:none;border:none;color:inherit;cursor:pointer;transition:opacity 0.2s;">
                    <i data-lucide="${isManualFocus && focusTask?.id === t.id ? 'pin' : 'pin-off'}" style="width:14px;height:14px;"></i>
                  </button>
                </div>
              `).join('')
            }
          </div>
        </div>

        <!-- Today's Schedule -->
        <div class="glass-card-static" style="padding: var(--space-5);">
          <h3 class="section-title" style="margin-bottom:var(--space-4);"><i data-lucide="calendar-clock"></i> Harmonogram</h3>
          <div style="display:flex;flex-direction:column;gap:var(--space-2);">
            ${timeBlocks.length === 0
              ? '<div class="empty-state" style="padding:var(--space-8) var(--space-4);"><i data-lucide="calendar-off"></i><h3>Brak bloków</h3><p>Przejdź do Time Blocking, aby zaplanować dzień.</p></div>'
              : timeBlocks.map(b => `
                <div class="time-block ${b.category}" style="position:relative;margin-bottom:0;padding:var(--space-3);border-radius:var(--radius-md);">
                  <div class="block-label">${b.label || b.category}</div>
                  <div class="block-time">${formatBlockTime(b.startHour, b.startMinute)} – ${formatBlockTime(b.endHour, b.endMinute)}</div>
                </div>
              `).join('')
            }
          </div>
        </div>
      </div>
    </div>
  `;

  // ---- Event Listeners ----

  // Toggle task checkboxes
  container.querySelectorAll('.task-checkbox').forEach(btn => {
    btn.addEventListener('click', () => {
      const taskId = btn.dataset.taskId;
      store.toggleTask(taskId);
      render(container);
    });
  });

  // Quick Add button
  const quickAddBtn = container.querySelector('#dashboard-quick-add');
  if (quickAddBtn) {
    quickAddBtn.addEventListener('click', () => {
      const modal = document.getElementById('quick-add-modal');
      if (modal) modal.showModal();
    });
  }

  // --- Focus of the Day: change/pick ---
  const changeFocusBtn = container.querySelector('#change-focus-btn');
  const focusPicker = container.querySelector('#focus-picker');
  const closeFocusPicker = container.querySelector('#close-focus-picker');

  if (changeFocusBtn && focusPicker) {
    changeFocusBtn.addEventListener('click', () => {
      focusPicker.style.display = focusPicker.style.display === 'none' ? 'block' : 'none';
    });
  }
  if (closeFocusPicker && focusPicker) {
    closeFocusPicker.addEventListener('click', () => {
      focusPicker.style.display = 'none';
    });
  }

  // Pick a task as focus
  container.querySelectorAll('.focus-pick-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const taskId = btn.dataset.taskId;
      store.setDailyFocus(taskId);
      render(container);
    });
  });

  // Clear manual focus
  const clearFocusBtn = container.querySelector('#clear-focus-btn');
  if (clearFocusBtn) {
    clearFocusBtn.addEventListener('click', () => {
      store.clearDailyFocus();
      render(container);
    });
  }

  // Pin buttons on task items
  container.querySelectorAll('.set-focus-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const taskId = btn.dataset.taskId;
      // Toggle: if already focused, clear; otherwise set
      if (isManualFocus && focusTask?.id === taskId) {
        store.clearDailyFocus();
      } else {
        store.setDailyFocus(taskId);
      }
      render(container);
    });
  });

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
