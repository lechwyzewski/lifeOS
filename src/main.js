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

// ---- Start ----
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
