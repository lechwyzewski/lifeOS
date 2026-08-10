import store from '../core/store.js';
import utils from '../core/utils.js';

let timerInterval = null;

// Keep state outside render so it persists when navigating between views
const timerState = {
  mode: 'work', // 'work' | 'short-break' | 'long-break'
  timeRemaining: 25 * 60,
  isRunning: false,
  currentSession: 1, // 1 to 4
  settings: {
    work: 25,
    shortBreak: 5,
    longBreak: 15
  },
  selectedTaskId: ''
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getModeLabel(mode) {
  if (mode === 'work') return 'Praca';
  if (mode === 'short-break') return 'Krótka przerwa';
  return 'Długa przerwa';
}

function playBeep() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.warn("Audio playback failed or not supported.");
  }
}

export function render(container) {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  container.innerHTML = `
    <div class="pomodoro-container" style="max-width: 500px; margin: 0 auto;">
      <h2 class="section-title text-center">Pomodoro</h2>
      
      <div class="pomodoro-task-select form-group">
        <label>Pracuję nad:</label>
        <select class="form-control" id="pomodoro-task">
          <option value="">Wybierz zadanie...</option>
        </select>
      </div>

      <div class="pomodoro-timer" style="position: relative; width: 280px; height: 280px; margin: 3rem auto;">
        <svg width="280" height="280" viewBox="0 0 280 280">
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#6366f1" />
              <stop offset="100%" stop-color="#8b5cf6" />
            </linearGradient>
          </defs>
          <circle class="timer-bg" cx="140" cy="140" r="130" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8" />
          <circle class="timer-progress" cx="140" cy="140" r="130" fill="none" stroke="url(#timerGradient)" stroke-width="8" stroke-linecap="round" transform="rotate(-90 140 140)" />
        </svg>
        <div class="timer-display" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <div class="timer-time" style="font-size: 3.5rem; font-weight: bold; font-variant-numeric: tabular-nums;">00:00</div>
          <div class="timer-label" style="font-size: 1.2rem; color: #a1a1aa; margin-top: 0.25rem;">Praca</div>
        </div>
      </div>

      <div class="pomodoro-session-dots" style="display: flex; justify-content: center; gap: 0.75rem; margin-bottom: 2.5rem;">
        ${[1, 2, 3, 4].map(i => `<div class="dot dot-${i}" style="width: 12px; height: 12px; border-radius: 50%; background-color: rgba(255,255,255,0.2); transition: all 0.3s;"></div>`).join('')}
      </div>

      <div class="pomodoro-controls" style="display: flex; justify-content: center; align-items: center; gap: 1.5rem; margin-bottom: 3rem;">
        <button class="btn btn-ghost" id="btn-reset" title="Resetuj">
          <i data-lucide="rotate-ccw"></i>
        </button>
        <button class="btn btn-primary" id="btn-toggle" style="width: 64px; height: 64px; border-radius: 50%; display: flex; justify-content: center; align-items: center; padding: 0;">
          <i data-lucide="play" id="icon-toggle" style="width: 24px; height: 24px; margin-left: ${timerState.isRunning ? '0' : '4px'};"></i>
        </button>
        <button class="btn btn-ghost" id="btn-skip" title="Pomiń">
          <i data-lucide="skip-forward"></i>
        </button>
      </div>

      <div class="pomodoro-stats glass-card" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; padding: 1.5rem; margin-bottom: 2rem; text-align: center;">
        <div class="stat-card">
          <div style="font-size: 0.8rem; color: #a1a1aa; margin-bottom: 0.25rem;">Dziś</div>
          <div id="stat-today" style="font-size: 1.2rem; font-weight: bold;">0 sesji</div>
        </div>
        <div class="stat-card">
          <div style="font-size: 0.8rem; color: #a1a1aa; margin-bottom: 0.25rem;">Całkowity czas focus</div>
          <div id="stat-total" style="font-size: 1.2rem; font-weight: bold;">0h 0m</div>
        </div>
        <div class="stat-card">
          <div style="font-size: 0.8rem; color: #a1a1aa; margin-bottom: 0.25rem;">Średnia dzienna</div>
          <div id="stat-avg" style="font-size: 1.2rem; font-weight: bold;">0 sesji</div>
        </div>
      </div>

      <div class="pomodoro-settings-container" style="margin-bottom: 2rem;">
        <button class="btn btn-ghost btn-sm" id="btn-settings-toggle" style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
          <span>Ustawienia Timera</span>
          <i data-lucide="chevron-down"></i>
        </button>
        <div id="settings-panel" class="glass-card" style="display: none; padding: 1.5rem; margin-top: 1rem;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group mb-0">
              <label>Praca (min)</label>
              <input type="number" id="setting-work" class="form-control" value="${timerState.settings.work}" min="1" max="120">
            </div>
            <div class="form-group mb-0">
              <label>Krótka (min)</label>
              <input type="number" id="setting-short" class="form-control" value="${timerState.settings.shortBreak}" min="1" max="60">
            </div>
            <div class="form-group mb-0">
              <label>Długa (min)</label>
              <input type="number" id="setting-long" class="form-control" value="${timerState.settings.longBreak}" min="1" max="60">
            </div>
          </div>
          <button class="btn btn-primary w-100" id="btn-save-settings">Zapisz ustawienia</button>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Populate Task Select
  const taskSelect = container.querySelector('#pomodoro-task');
  const allTasks = store.getState().tasks || [];
  const activeTasks = allTasks.filter(t => !t.done);
  
  activeTasks.forEach(t => {
    const option = document.createElement('option');
    option.value = t.id;
    option.textContent = t.title;
    if (t.id === timerState.selectedTaskId) {
      option.selected = true;
    }
    taskSelect.appendChild(option);
  });

  taskSelect.addEventListener('change', (e) => {
    timerState.selectedTaskId = e.target.value;
  });

  // Elements mapping
  const timeDisplay = container.querySelector('.timer-time');
  const labelDisplay = container.querySelector('.timer-label');
  const progressCircle = container.querySelector('.timer-progress');
  const dots = Array.from(container.querySelectorAll('.pomodoro-session-dots .dot'));
  
  const btnToggle = container.querySelector('#btn-toggle');
  const iconToggle = container.querySelector('#icon-toggle');
  const btnReset = container.querySelector('#btn-reset');
  const btnSkip = container.querySelector('#btn-skip');
  
  const statToday = container.querySelector('#stat-today');
  const statTotal = container.querySelector('#stat-total');
  const statAvg = container.querySelector('#stat-avg');

  const btnSettingsToggle = container.querySelector('#btn-settings-toggle');
  const settingsPanel = container.querySelector('#settings-panel');
  const btnSaveSettings = container.querySelector('#btn-save-settings');

  // SVG configuration
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;

  function updateDisplay() {
    timeDisplay.textContent = formatTime(timerState.timeRemaining);
    labelDisplay.textContent = getModeLabel(timerState.mode);

    let maxTime = timerState.settings.work * 60;
    if (timerState.mode === 'short-break') maxTime = timerState.settings.shortBreak * 60;
    if (timerState.mode === 'long-break') maxTime = timerState.settings.longBreak * 60;

    const progress = 1 - (timerState.timeRemaining / maxTime);
    const offset = circumference * (1 - progress);
    progressCircle.style.strokeDashoffset = offset;

    // Dots styling
    dots.forEach((dot, idx) => {
      dot.style.backgroundColor = 'rgba(255,255,255,0.2)';
      dot.style.transform = 'scale(1)';
      dot.style.boxShadow = 'none';

      if (idx < timerState.currentSession - 1) {
        dot.style.backgroundColor = '#8b5cf6'; // completed sessions
      } else if (idx === timerState.currentSession - 1) {
        if (timerState.mode === 'work') {
          dot.style.backgroundColor = '#6366f1'; // current session
          if (timerState.isRunning) {
            dot.style.transform = 'scale(1.2)';
            dot.style.boxShadow = '0 0 8px rgba(99, 102, 241, 0.6)';
          }
        }
      }
    });

    // Icon state
    iconToggle.setAttribute('data-lucide', timerState.isRunning ? 'pause' : 'play');
    iconToggle.style.marginLeft = timerState.isRunning ? '0' : '4px';
    if (window.lucide) window.lucide.createIcons();

    updateStatsDisplay();
  }

  function updateStatsDisplay() {
    const state = store.getState();
    const todaySessions = state.pomodoroToday || 0;
    const totalFocusMinutes = state.pomodoroTotal || 0;
    const h = Math.floor(totalFocusMinutes / 60);
    const m = totalFocusMinutes % 60;
    const avgSessions = state.pomodoroAvg || 0;

    statToday.textContent = `${todaySessions} sesji`;
    statTotal.textContent = `${h}h ${m}m`;
    statAvg.textContent = `${avgSessions} sesji`;
  }

  function setMode(mode) {
    timerState.mode = mode;
    if (mode === 'work') timerState.timeRemaining = timerState.settings.work * 60;
    else if (mode === 'short-break') timerState.timeRemaining = timerState.settings.shortBreak * 60;
    else if (mode === 'long-break') timerState.timeRemaining = timerState.settings.longBreak * 60;
    updateDisplay();
  }

  function handleSessionComplete() {
    playBeep();
    
    if (timerState.mode === 'work') {
      if (store.addPomodoroSession) {
        store.addPomodoroSession();
      } else {
        const s = store.getState();
        store.setState('pomodoroToday', (s.pomodoroToday || 0) + 1);
        store.setState('pomodoroTotal', (s.pomodoroTotal || 0) + timerState.settings.work);
      }

      if (timerState.selectedTaskId && store.updateTask) {
        const t = store.getState().tasks.find(x => x.id === timerState.selectedTaskId);
        if (t) {
          store.updateTask(t.id, { pomodorosDone: (t.pomodorosDone || 0) + 1 });
        }
      }

      if (timerState.currentSession >= 4) {
        setMode('long-break');
      } else {
        setMode('short-break');
      }
    } else {
      if (timerState.mode === 'long-break') {
        timerState.currentSession = 1;
      } else {
        timerState.currentSession++;
      }
      setMode('work');
    }
  }

  function tick() {
    if (timerState.timeRemaining > 0) {
      timerState.timeRemaining--;
      updateDisplay();
    } else {
      handleSessionComplete();
      timerState.isRunning = false;
      stopTimer();
      updateDisplay();
    }
  }

  function startTimer() {
    if (!timerInterval) {
      timerInterval = setInterval(tick, 1000);
      timerState.isRunning = true;
      updateDisplay();
    }
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    timerState.isRunning = false;
    updateDisplay();
  }

  btnToggle.addEventListener('click', () => {
    if (timerState.isRunning) stopTimer();
    else startTimer();
  });

  btnReset.addEventListener('click', () => {
    stopTimer();
    setMode(timerState.mode); 
  });

  btnSkip.addEventListener('click', () => {
    stopTimer();
    handleSessionComplete();
  });

  btnSettingsToggle.addEventListener('click', () => {
    const isHidden = settingsPanel.style.display === 'none';
    settingsPanel.style.display = isHidden ? 'block' : 'none';
    btnSettingsToggle.querySelector('i').setAttribute('data-lucide', isHidden ? 'chevron-up' : 'chevron-down');
    if (window.lucide) window.lucide.createIcons();
  });

  btnSaveSettings.addEventListener('click', () => {
    const work = parseInt(container.querySelector('#setting-work').value, 10);
    const shortB = parseInt(container.querySelector('#setting-short').value, 10);
    const longB = parseInt(container.querySelector('#setting-long').value, 10);
    
    if (work > 0) timerState.settings.work = work;
    if (shortB > 0) timerState.settings.shortBreak = shortB;
    if (longB > 0) timerState.settings.longBreak = longB;

    settingsPanel.style.display = 'none';
    btnSettingsToggle.querySelector('i').setAttribute('data-lucide', 'chevron-down');
    if (window.lucide) window.lucide.createIcons();

    if (!timerState.isRunning) {
      setMode(timerState.mode);
    }
  });

  // Re-start interval if it was running before view change
  if (timerState.isRunning) {
    timerInterval = setInterval(tick, 1000);
  }

  updateDisplay();
}
