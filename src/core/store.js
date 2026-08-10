/* ============================================================
   LifeOS — Reactive Store with localStorage persistence
   ============================================================ */

import { generateId, todayISO } from './utils.js';

const STORAGE_KEY = 'lifeos_data';

// ---- Default State ----
function getDefaultState() {
  return {
    // Ikigai
    ikigai: {
      love: [],
      good_at: [],
      paid_for: [],
      world_needs: [],
      reflection: '',
    },

    // Wheel of Life
    wheelOfLife: {
      current: {
        career: 5,
        finance: 5,
        health: 5,
        relationships: 5,
        growth: 5,
        fun: 5,
        environment: 5,
        spirituality: 5,
      },
      history: [],
    },

    // Goals
    goals: [],

    // Tasks
    tasks: [],

    // Pomodoro config & history
    pomodoro: {
      workMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      sessionsBeforeLongBreak: 4,
      sessions: [],
    },

    // Time Blocks
    timeBlocks: [],

    // Reviews
    reviews: [],

    // App settings
    settings: {
      sidebarCollapsed: false,
      onboardingDone: false,
      lastReviewDate: null,
    },

    // Daily Focus — manually pinned task ID (resets daily)
    dailyFocus: {
      taskId: null,
      date: null,
    },
  };
}

// ---- Demo Data ----
function getDemoData() {
  const today = todayISO();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().split('T')[0];

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekISO = nextWeek.toISOString().split('T')[0];

  return {
    ikigai: {
      love: ['projektowanie', 'technologia', 'rozwiązywanie problemów', 'muzyka'],
      good_at: ['programowanie', 'design UX/UI', 'analiza danych', 'komunikacja'],
      paid_for: ['web development', 'consulting technologiczny', 'szkolenia'],
      world_needs: ['lepsze narzędzia produktywności', 'edukacja technologiczna', 'automatyzacja'],
      reflection: 'Moje Ikigai łączy pasję do technologii z umiejętnością tworzenia narzędzi, które pomagają ludziom być bardziej produktywnymi i realizować swój potencjał.',
    },

    wheelOfLife: {
      current: {
        career: 7,
        finance: 5,
        health: 6,
        relationships: 8,
        growth: 7,
        fun: 4,
        environment: 6,
        spirituality: 5,
      },
      history: [
        {
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          scores: { career: 6, finance: 4, health: 5, relationships: 7, growth: 6, fun: 5, environment: 5, spirituality: 4 },
        },
      ],
    },

    goals: [
      {
        id: generateId(),
        title: 'Uruchomić własny produkt SaaS',
        area: 'career',
        deadline: '2026-12-31',
        progress: 35,
        milestones: [
          { id: generateId(), title: 'Badanie rynku', done: true },
          { id: generateId(), title: 'Prototyp MVP', done: true },
          { id: generateId(), title: 'Landing page', done: false },
          { id: generateId(), title: 'Beta testy', done: false },
          { id: generateId(), title: 'Launch', done: false },
        ],
      },
      {
        id: generateId(),
        title: 'Przebiec półmaraton',
        area: 'health',
        deadline: '2026-11-15',
        progress: 20,
        milestones: [
          { id: generateId(), title: 'Biegać 3x/tydzień', done: true },
          { id: generateId(), title: 'Przebiec 10km', done: false },
          { id: generateId(), title: 'Przebiec 15km', done: false },
          { id: generateId(), title: 'Półmaraton!', done: false },
        ],
      },
      {
        id: generateId(),
        title: 'Zbudować poduszkę finansową (6 miesięcy)',
        area: 'finance',
        deadline: '2027-06-30',
        progress: 40,
        milestones: [
          { id: generateId(), title: 'Budżet miesięczny', done: true },
          { id: generateId(), title: 'Oszczędzić 1 miesiąc', done: true },
          { id: generateId(), title: 'Oszczędzić 3 miesiące', done: false },
          { id: generateId(), title: 'Oszczędzić 6 miesięcy', done: false },
        ],
      },
    ],

    tasks: [
      { id: generateId(), title: 'Zaprojektować landing page', quadrant: 2, goalId: null, pomodoros: 4, pomodorosDone: 1, done: false, dueDate: today, createdAt: today },
      { id: generateId(), title: 'Odpowiedzieć na pilne maile', quadrant: 1, goalId: null, pomodoros: 1, pomodorosDone: 0, done: false, dueDate: today, createdAt: today },
      { id: generateId(), title: 'Trening biegowy — 5km', quadrant: 2, goalId: null, pomodoros: 2, pomodorosDone: 0, done: false, dueDate: today, createdAt: today },
      { id: generateId(), title: 'Przegląd kodu PR #42', quadrant: 1, goalId: null, pomodoros: 2, pomodorosDone: 0, done: false, dueDate: today, createdAt: today },
      { id: generateId(), title: 'Przeczytać rozdział książki', quadrant: 2, goalId: null, pomodoros: 2, pomodorosDone: 0, done: false, dueDate: tomorrowISO, createdAt: today },
      { id: generateId(), title: 'Social media scrolling', quadrant: 4, goalId: null, pomodoros: 0, pomodorosDone: 0, done: false, dueDate: null, createdAt: today },
      { id: generateId(), title: 'Spotkanie statusowe', quadrant: 3, goalId: null, pomodoros: 1, pomodorosDone: 0, done: false, dueDate: today, createdAt: today },
      { id: generateId(), title: 'Zaplanować sprint na przyszły tydzień', quadrant: 2, goalId: null, pomodoros: 1, pomodorosDone: 0, done: false, dueDate: nextWeekISO, createdAt: today },
    ],

    pomodoro: {
      workMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      sessionsBeforeLongBreak: 4,
      sessions: [
        { date: today, taskId: null, duration: 25, completedAt: new Date(Date.now() - 3600000).toISOString() },
        { date: today, taskId: null, duration: 25, completedAt: new Date(Date.now() - 1800000).toISOString() },
      ],
    },

    timeBlocks: [
      { id: generateId(), date: today, startHour: 7, startMinute: 0, endHour: 7, endMinute: 30, category: 'routine', taskId: null, label: 'Poranna rutyna' },
      { id: generateId(), date: today, startHour: 8, startMinute: 0, endHour: 10, endMinute: 0, category: 'deep-work', taskId: null, label: 'Deep Work — projekt' },
      { id: generateId(), date: today, startHour: 10, startMinute: 0, endHour: 10, endMinute: 15, category: 'break', taskId: null, label: 'Przerwa kawowa' },
      { id: generateId(), date: today, startHour: 10, startMinute: 15, endHour: 12, endMinute: 0, category: 'deep-work', taskId: null, label: 'Deep Work — landing page' },
      { id: generateId(), date: today, startHour: 13, startMinute: 0, endHour: 13, endMinute: 30, category: 'meeting', taskId: null, label: 'Spotkanie statusowe' },
      { id: generateId(), date: today, startHour: 14, startMinute: 0, endHour: 16, endMinute: 0, category: 'deep-work', taskId: null, label: 'Kodowanie' },
      { id: generateId(), date: today, startHour: 17, startMinute: 0, endHour: 18, endMinute: 0, category: 'growth', taskId: null, label: 'Nauka / Czytanie' },
    ],

    reviews: [
      {
        type: 'daily',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        achieved: 'Skończyłem prototyp strony, przebiegłem 5km, przeczytałem 30 stron książki.',
        improve: 'Za dużo czasu spędziłem na scrollowaniu social media. Powinienem blokować te aplikacje w godzinach pracy.',
        grateful: 'Wspaniała pogoda, dobra kawa rano, ciekawy podcast w drodze.',
        tomorrowFocus: 'Dokończyć design system i zacząć landing page.',
      },
    ],

    settings: {
      sidebarCollapsed: false,
      onboardingDone: true,
      lastReviewDate: null,
    },
  };
}

// ---- Store Implementation ----
class Store {
  constructor() {
    this._subscribers = new Set();
    this._state = this._loadState();
  }

  _loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle schema upgrades
        return this._deepMerge(getDefaultState(), parsed);
      }
    } catch (e) {
      console.warn('LifeOS: Failed to load saved state', e);
    }
    // No saved state — seed with demo data
    const demoState = getDemoData();
    this._saveState(demoState);
    return demoState;
  }

  _saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state || this._state));
    } catch (e) {
      console.warn('LifeOS: Failed to save state', e);
    }
  }

  _deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])
        && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        result[key] = this._deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  _notify() {
    this._saveState();
    for (const cb of this._subscribers) {
      try { cb(this._state); } catch (e) { console.error('Store subscriber error:', e); }
    }
  }

  // ---- Public API ----

  getState() {
    return this._state;
  }

  setState(path, value) {
    const keys = path.split('.');
    let obj = this._state;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in obj)) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    this._notify();
  }

  subscribe(callback) {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }

  // ---- Task Operations ----

  addTask(taskData) {
    const task = {
      id: generateId(),
      title: taskData.title || 'Nowe zadanie',
      quadrant: taskData.quadrant || 2,
      goalId: taskData.goalId || null,
      pomodoros: taskData.pomodoros || 1,
      pomodorosDone: 0,
      done: false,
      dueDate: taskData.dueDate || todayISO(),
      createdAt: todayISO(),
    };
    this._state.tasks.push(task);
    this._notify();
    return task;
  }

  updateTask(id, updates) {
    const idx = this._state.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      this._state.tasks[idx] = { ...this._state.tasks[idx], ...updates };
      this._notify();
    }
  }

  deleteTask(id) {
    this._state.tasks = this._state.tasks.filter(t => t.id !== id);
    this._notify();
  }

  toggleTask(id) {
    const task = this._state.tasks.find(t => t.id === id);
    if (task) {
      task.done = !task.done;
      this._notify();
    }
  }

  getTodaysTasks() {
    const today = todayISO();
    return this._state.tasks.filter(t => t.dueDate === today || (!t.dueDate && !t.done));
  }

  getTasksByQuadrant(q) {
    return this._state.tasks.filter(t => t.quadrant === q && !t.done);
  }

  // ---- Goal Operations ----

  addGoal(goalData) {
    const goal = {
      id: generateId(),
      title: goalData.title || 'Nowy cel',
      area: goalData.area || 'growth',
      deadline: goalData.deadline || '',
      progress: 0,
      milestones: goalData.milestones || [],
    };
    this._state.goals.push(goal);
    this._notify();
    return goal;
  }

  updateGoal(id, updates) {
    const idx = this._state.goals.findIndex(g => g.id === id);
    if (idx !== -1) {
      this._state.goals[idx] = { ...this._state.goals[idx], ...updates };
      this._notify();
    }
  }

  deleteGoal(id) {
    this._state.goals = this._state.goals.filter(g => g.id !== id);
    this._notify();
  }

  // ---- Pomodoro Operations ----

  addPomodoroSession(session) {
    this._state.pomodoro.sessions.push({
      date: todayISO(),
      taskId: session.taskId || null,
      duration: session.duration || this._state.pomodoro.workMinutes,
      completedAt: new Date().toISOString(),
    });
    this._notify();
  }

  getTodayPomodoros() {
    const today = todayISO();
    return this._state.pomodoro.sessions.filter(s => s.date === today);
  }

  // ---- Time Block Operations ----

  addTimeBlock(blockData) {
    const block = {
      id: generateId(),
      date: blockData.date || todayISO(),
      startHour: blockData.startHour || 9,
      startMinute: blockData.startMinute || 0,
      endHour: blockData.endHour || 10,
      endMinute: blockData.endMinute || 0,
      category: blockData.category || 'deep-work',
      taskId: blockData.taskId || null,
      label: blockData.label || '',
    };
    this._state.timeBlocks.push(block);
    this._notify();
    return block;
  }

  updateTimeBlock(id, updates) {
    const idx = this._state.timeBlocks.findIndex(b => b.id === id);
    if (idx !== -1) {
      this._state.timeBlocks[idx] = { ...this._state.timeBlocks[idx], ...updates };
      this._notify();
    }
  }

  deleteTimeBlock(id) {
    this._state.timeBlocks = this._state.timeBlocks.filter(b => b.id !== id);
    this._notify();
  }

  getTodayTimeBlocks() {
    const today = todayISO();
    return this._state.timeBlocks
      .filter(b => b.date === today)
      .sort((a, b) => (a.startHour * 60 + a.startMinute) - (b.startHour * 60 + b.startMinute));
  }

  // ---- Review Operations ----

  addReview(reviewData) {
    const review = {
      type: reviewData.type || 'daily',
      date: todayISO(),
      achieved: reviewData.achieved || '',
      improve: reviewData.improve || '',
      grateful: reviewData.grateful || '',
      tomorrowFocus: reviewData.tomorrowFocus || '',
    };
    this._state.reviews.push(review);
    this._state.settings.lastReviewDate = todayISO();
    this._notify();
    return review;
  }

  getReviewsByType(type) {
    return this._state.reviews
      .filter(r => r.type === type)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // ---- Wheel of Life ----

  updateWheelOfLife(scores) {
    // Save current as history entry
    if (this._state.wheelOfLife.current) {
      this._state.wheelOfLife.history.push({
        date: todayISO(),
        scores: { ...this._state.wheelOfLife.current },
      });
    }
    this._state.wheelOfLife.current = { ...scores };
    this._notify();
  }

  // ---- Stats helpers ----

  getCompletionRate(days = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const relevantTasks = this._state.tasks.filter(t => t.createdAt >= cutoffStr);
    if (relevantTasks.length === 0) return 0;
    const done = relevantTasks.filter(t => t.done).length;
    return Math.round((done / relevantTasks.length) * 100);
  }

  getStreak() {
    const reviews = this.getReviewsByType('daily');
    if (reviews.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      if (reviews.some(r => r.date === dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }

  // ---- Daily Focus ----

  setDailyFocus(taskId) {
    this._state.dailyFocus = {
      taskId: taskId,
      date: todayISO(),
    };
    this._notify();
  }

  clearDailyFocus() {
    this._state.dailyFocus = { taskId: null, date: null };
    this._notify();
  }

  getDailyFocus() {
    const focus = this._state.dailyFocus;
    // Only return if set today
    if (focus && focus.taskId && focus.date === todayISO()) {
      const task = this._state.tasks.find(t => t.id === focus.taskId && !t.done);
      if (task) return task;
    }
    return null;
  }

  // ---- Backup & Export / Import ----

  exportJSON() {
    const jsonStr = JSON.stringify(this._state, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeos_backup_${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object') {
        this._state = this._deepMerge(getDefaultState(), parsed);
        this._notify();
        return true;
      }
    } catch (e) {
      console.error('LifeOS: Failed to import JSON state', e);
    }
    return false;
  }

  // ---- Reset ----
  resetToDefaults() {
    this._state = getDefaultState();
    this._notify();
  }

  resetToDemoData() {
    this._state = getDemoData();
    this._notify();
  }
}

// Singleton
const store = new Store();
export default store;
