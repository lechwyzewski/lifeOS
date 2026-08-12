/* ============================================================
   LifeOS — Application Entry Point
   ============================================================ */

import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';
import './styles/views.css';

import router from './core/router.js';
import store from './core/store.js';
import { initSidebar } from './components/sidebar.js';
import { $ } from './core/utils.js';

// ---- Import Views ----
import { render as renderDashboard } from './views/dashboard.js';
import { render as renderIkigai } from './views/ikigai.js';
import { render as renderWheelOfLife } from './views/wheel-of-life.js';
import { render as renderGoals } from './views/goals.js';
import { render as renderEisenhower } from './views/eisenhower.js';
import { render as renderPomodoro } from './views/pomodoro.js';
import { render as renderTimeBlocking } from './views/time-blocking.js';
import { render as renderReview } from './views/review.js';
import { render as renderAnalytics } from './views/analytics.js';

// ---- Initialize Application ----
function init() {
  // Set router container
  const viewContainer = $('#view-container');
  router.setContainer(viewContainer);

  // Register routes
  router.register('dashboard', {
    title: 'Dashboard',
    render: renderDashboard,
  });

  router.register('ikigai', {
    title: 'Ikigai Explorer',
    render: renderIkigai,
  });

  router.register('wheel-of-life', {
    title: 'Wheel of Life',
    render: renderWheelOfLife,
  });

  router.register('goals', {
    title: 'Cele życiowe',
    render: renderGoals,
  });

  router.register('eisenhower', {
    title: 'Macierz Eisenhowera',
    render: renderEisenhower,
  });

  router.register('pomodoro', {
    title: 'Pomodoro Timer',
    render: renderPomodoro,
  });

  router.register('time-blocking', {
    title: 'Time Blocking',
    render: renderTimeBlocking,
  });

  router.register('review', {
    title: 'Daily Review',
    render: renderReview,
  });

  router.register('analytics', {
    title: 'Statystyki',
    render: renderAnalytics,
  });

  // Initialize sidebar
  initSidebar();

  // Setup Quick Add modal
  setupQuickAddModal();

  // Setup Backup Export / Import
  setupBackupHandlers();

  // Setup Cloud Sync Modal
  setupCloudSyncModal();

  // LocalStorage is the primary source of truth. Cloud load is triggered on user action in modal.

  // Start router
  router.start();

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  console.log('🌀 LifeOS initialized');
}

// ---- Quick Add Task Modal ----
function setupQuickAddModal() {
  const quickAddBtn = $('#quick-add-btn');
  const modal = $('#quick-add-modal');
  const form = $('#quick-add-form');
  const goalSelect = $('#task-goal-input');

  if (quickAddBtn && modal) {
    quickAddBtn.addEventListener('click', () => {
      // Populate goals dropdown
      if (goalSelect) {
        const goals = store.getState().goals;
        goalSelect.innerHTML = '<option value="">— Brak —</option>';
        for (const goal of goals) {
          goalSelect.innerHTML += `<option value="${goal.id}">${goal.title}</option>`;
        }
      }

      // Set default due date to today
      const dueInput = $('#task-due-input');
      if (dueInput) {
        dueInput.value = new Date().toISOString().split('T')[0];
      }

      modal.showModal();

      // Focus title input
      setTimeout(() => {
        const titleInput = $('#task-title-input');
        if (titleInput) titleInput.focus();
      }, 100);
    });
  }

  // Close button
  const closeBtn = modal?.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.close());
  }

  // Form submit
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const title = $('#task-title-input')?.value?.trim();
      if (!title) return;

      const quadrant = parseInt($('#task-quadrant-input')?.value || '2');
      const dueDate = $('#task-due-input')?.value || null;
      const pomodoros = parseInt($('#task-pomodoros-input')?.value || '1');
      const goalId = $('#task-goal-input')?.value || null;

      store.addTask({
        title,
        quadrant,
        dueDate,
        pomodoros,
        goalId,
      });

      // Reset form
      form.reset();
      modal.close();

      // Re-render current view if it displays tasks
      const currentRoute = router.getCurrentRoute();
      if (['dashboard', 'eisenhower'].includes(currentRoute)) {
        const viewContainer = $('#view-container');
        const route = router._routes?.get(currentRoute);
        if (route && viewContainer) {
          route.render(viewContainer);
        }
      }

      // Re-initialize icons
      if (window.lucide) {
        window.lucide.createIcons();
      }
    });
  }

  // Close on backdrop click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.close();
    });
  }
}

// ---- Backup Export / Import Handlers ----
function setupBackupHandlers() {
  const exportBtn = $('#export-btn');
  const importBtn = $('#import-btn');
  const importFileInput = $('#import-file-input');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      store.exportJSON();
    });
  }

  if (importBtn && importFileInput) {
    importBtn.addEventListener('click', () => {
      importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const success = store.importJSON(event.target.result);
        if (success) {
          alert('Dane zostały pomyślnie zaimportowane!');
          const currentRoute = router.getCurrentRoute();
          const route = router._routes?.get(currentRoute);
          const viewContainer = $('#view-container');
          if (route && viewContainer) {
            route.render(viewContainer);
          }
        } else {
          alert('Błąd podczas odczytu pliku JSON. Upewnij się, że to poprawny plik kopii zapasowej.');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }
}

// ---- Cloud Sync Modal Handler ----
function setupCloudSyncModal() {
  const cloudSyncBtn = $('#cloud-sync-btn');
  const modal = $('#cloud-sync-modal');
  const keyInput = $('#cloud-sync-key-input');
  const genKeyBtn = $('#cloud-gen-key-btn');
  const saveBtn = $('#cloud-save-btn');
  const loadBtn = $('#cloud-load-btn');
  const statusEl = $('#cloud-sync-status');

  if (!cloudSyncBtn || !modal) return;

  cloudSyncBtn.addEventListener('click', () => {
    const config = store.getCloudSyncConfig();
    if (keyInput) keyInput.value = config.syncId || 'lech2026';
    if (statusEl) {
      if (config.lastSynced) {
        statusEl.style.display = 'block';
        statusEl.textContent = `Ostatnia synchronizacja: ${config.lastSynced}`;
      } else {
        statusEl.style.display = 'none';
      }
    }
    if (typeof modal.showModal === 'function') {
      modal.showModal();
    } else {
      modal.setAttribute('open', '');
    }
  });

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      if (typeof modal.close === 'function') modal.close();
      else modal.removeAttribute('open');
    }
  });

  if (genKeyBtn && keyInput) {
    genKeyBtn.addEventListener('click', () => {
      keyInput.value = 'lifeos-' + Math.random().toString(36).substring(2, 8);
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const syncId = keyInput?.value?.trim();
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i data-lucide="loader"></i> Wysyłam...';
      const result = await store.saveToCloud(syncId);
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i data-lucide="cloud-upload"></i> Wyślij do chmury';
      if (window.lucide) window.lucide.createIcons();

      if (result.success) {
        if (keyInput) keyInput.value = result.syncId;
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.innerHTML = `✅ Zapisano w chmurze! (${result.lastSynced})<br><small style="opacity:0.8;word-break:break-all;">Kod Chmury: <strong>${result.syncId}</strong></small>`;
        }
      } else {
        alert(result.error ? `Wystąpił błąd podczas wysyłania do chmury:\n${result.error}` : 'Wystąpił błąd podczas wysyłania do chmury. Sprawdź połączenie internetowe.');
      }
    });
  }

  if (loadBtn) {
    loadBtn.addEventListener('click', async () => {
      const syncId = keyInput?.value?.trim();
      if (!syncId) {
        alert('Podaj Kod Chmury!');
        return;
      }
      loadBtn.disabled = true;
      loadBtn.innerHTML = '<i data-lucide="loader"></i> Pobieram...';
      const success = await store.loadFromCloud(syncId);
      loadBtn.disabled = false;
      loadBtn.innerHTML = '<i data-lucide="cloud-download"></i> Pobierz z chmury';
      if (window.lucide) window.lucide.createIcons();

      if (success) {
        modal.close();
        alert('Pomyślnie pobrano dane z chmury!');
        const currentRoute = router.getCurrentRoute();
        const route = router._routes?.get(currentRoute);
        const viewContainer = $('#view-container');
        if (route && viewContainer) {
          route.render(viewContainer);
        }
      } else {
        alert(`Nie znaleziono danych dla Kodu Chmury: "${syncId}". Upewnij się, że wpisałeś ten sam kod co na pierwszym urządzeniu.`);
      }
    });
  }
}

// ---- Start ----
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
