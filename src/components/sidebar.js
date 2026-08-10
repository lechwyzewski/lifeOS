/* ============================================================
   LifeOS — Sidebar Navigation Component
   ============================================================ */

import router from '../core/router.js';
import { $ } from '../core/utils.js';

const NAV_SECTIONS = [
  {
    title: null,
    items: [
      { path: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    ],
  },
  {
    title: 'Odkrywanie',
    items: [
      { path: 'ikigai', label: 'Ikigai', icon: 'compass' },
      { path: 'wheel-of-life', label: 'Wheel of Life', icon: 'circle-dot' },
    ],
  },
  {
    title: 'Cele',
    items: [
      { path: 'goals', label: 'Cele życiowe', icon: 'target' },
    ],
  },
  {
    title: 'Działanie',
    items: [
      { path: 'eisenhower', label: 'Macierz Eisenhowera', icon: 'grid-2x2' },
      { path: 'pomodoro', label: 'Pomodoro Timer', icon: 'timer' },
      { path: 'time-blocking', label: 'Time Blocking', icon: 'calendar-clock' },
    ],
  },
  {
    title: 'Przegląd',
    items: [
      { path: 'review', label: 'Daily Review', icon: 'notebook-pen' },
      { path: 'analytics', label: 'Statystyki', icon: 'bar-chart-3' },
    ],
  },
];

export function initSidebar() {
  const nav = $('#sidebar-nav');
  if (!nav) return;

  // Build navigation HTML
  let html = '';
  for (const section of NAV_SECTIONS) {
    html += '<div class="nav-section">';
    if (section.title) {
      html += `<div class="nav-section-title">${section.title}</div>`;
    }
    for (const item of section.items) {
      html += `
        <button class="nav-item" data-route="${item.path}" aria-label="${item.label}">
          <i data-lucide="${item.icon}"></i>
          <span>${item.label}</span>
        </button>
      `;
    }
    html += '</div>';
  }
  nav.innerHTML = html;

  // Click handlers
  nav.addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (!navItem) return;
    const route = navItem.dataset.route;
    if (route) {
      router.navigate(route);
      closeSidebar();
    }
  });

  // Mobile toggle
  const menuToggle = $('#menu-toggle');
  const sidebarClose = $('#sidebar-close');
  const sidebarOverlay = $('#sidebar-overlay');

  if (menuToggle) {
    menuToggle.addEventListener('click', () => toggleSidebar());
  }
  if (sidebarClose) {
    sidebarClose.addEventListener('click', () => closeSidebar());
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => closeSidebar());
  }

  // Update active state on navigation
  router.onNavigate((path) => {
    updateActiveNav(path);
  });

  // Activate Lucide icons in sidebar
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function updateActiveNav(path) {
  const nav = $('#sidebar-nav');
  if (!nav) return;

  const items = nav.querySelectorAll('.nav-item');
  for (const item of items) {
    if (item.dataset.route === path) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  }
}

function toggleSidebar() {
  const sidebar = $('#sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

function closeSidebar() {
  const sidebar = $('#sidebar');
  if (sidebar) sidebar.classList.remove('open');
}

export default { initSidebar };
