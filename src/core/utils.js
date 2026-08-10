/* ============================================================
   LifeOS — Utility Functions
   ============================================================ */

/**
 * Generate a unique ID string
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * querySelector shortcut
 */
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * querySelectorAll shortcut
 */
export function $$(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

/**
 * Create a DOM element
 */
export function createElement(tag, className = '', innerHTML = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (innerHTML) el.innerHTML = innerHTML;
  return el;
}

/**
 * Format date to Polish locale
 */
export function formatDate(date, options = {}) {
  const d = date instanceof Date ? date : new Date(date);
  const defaults = { day: 'numeric', month: 'long', year: 'numeric' };
  return d.toLocaleDateString('pl-PL', { ...defaults, ...options });
}

/**
 * Format date to short Polish locale
 */
export function formatDateShort(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
}

/**
 * Format seconds to mm:ss
 */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Get today as YYYY-MM-DD
 */
export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current day name in Polish
 */
export function getDayName(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('pl-PL', { weekday: 'long' });
}

/**
 * Debounce function
 */
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Throttle function
 */
export function throttle(fn, ms = 100) {
  let isThrottled = false;
  return (...args) => {
    if (isThrottled) return;
    fn(...args);
    isThrottled = true;
    setTimeout(() => { isThrottled = false; }, ms);
  };
}

/**
 * Clamp a number between min and max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get a motivational quote (Polish)
 */
export function getRandomQuote() {
  const quotes = [
    { text: 'Najlepszy czas na posadzenie drzewa był 20 lat temu. Drugi najlepszy czas jest teraz.', author: 'Przysłowie chińskie' },
    { text: 'Sukces to suma małych wysiłków, powtarzanych dzień po dniu.', author: 'Robert Collier' },
    { text: 'Nie musisz być wielki, żeby zacząć. Ale musisz zacząć, żeby być wielki.', author: 'Zig Ziglar' },
    { text: 'Główne rzeczy to utrzymać główne rzeczy jako główne rzeczy.', author: 'Stephen Covey' },
    { text: 'Zacznij tam, gdzie jesteś. Użyj tego, co masz. Zrób to, co możesz.', author: 'Arthur Ashe' },
    { text: 'Jedynym sposobem na świetną pracę jest kochanie tego, co robisz.', author: 'Steve Jobs' },
    { text: 'Twoja przyszłość zależy od tego, co zrobisz dzisiaj.', author: 'Mahatma Gandhi' },
    { text: 'Produktywność to nie kwestia robienia więcej, ale kwestia robienia tego, co ważne.', author: 'Cal Newport' },
    { text: 'Nie chodzi o to, ile masz czasu, ale jak go wykorzystujesz.', author: 'Seneka' },
    { text: 'Małe kroki każdego dnia prowadzą do wielkich zmian.', author: 'Japońska zasada Kaizen' },
    { text: 'Życie jest zbyt krótkie, żeby robić rzeczy, które nie mają znaczenia.', author: 'Ikigai' },
    { text: 'To, co mierzysz, się poprawia.', author: 'Peter Drucker' },
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

/**
 * Get greeting based on time of day
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return 'Dobrej nocy';
  if (hour < 12) return 'Dzień dobry';
  if (hour < 18) return 'Witaj ponownie';
  return 'Dobry wieczór';
}

/**
 * Calculate days until a date
 */
export function daysUntil(dateStr) {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = target - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get the Wheel of Life area labels (Polish)
 */
export function getWolAreas() {
  return [
    { key: 'career', label: 'Kariera', icon: 'briefcase', color: 'var(--wol-career)' },
    { key: 'finance', label: 'Finanse', icon: 'wallet', color: 'var(--wol-finance)' },
    { key: 'health', label: 'Zdrowie', icon: 'heart-pulse', color: 'var(--wol-health)' },
    { key: 'relationships', label: 'Relacje', icon: 'users', color: 'var(--wol-relationships)' },
    { key: 'growth', label: 'Rozwój', icon: 'brain', color: 'var(--wol-growth)' },
    { key: 'fun', label: 'Rozrywka', icon: 'sparkles', color: 'var(--wol-fun)' },
    { key: 'environment', label: 'Otoczenie', icon: 'home', color: 'var(--wol-environment)' },
    { key: 'spirituality', label: 'Sens życia', icon: 'compass', color: 'var(--wol-spirituality)' },
  ];
}

/**
 * Eisenhower Quadrant labels
 */
export function getQuadrantInfo(q) {
  const info = {
    1: { title: 'Ważne i Pilne', subtitle: 'Kryzysy, deadline\'y', action: 'ZRÓB TERAZ', color: 'var(--q1-color)', icon: 'alert-triangle' },
    2: { title: 'Ważne i Niepilne', subtitle: 'Planowanie, rozwój', action: 'ZAPLANUJ', color: 'var(--q2-color)', icon: 'target' },
    3: { title: 'Nieważne i Pilne', subtitle: 'Przerywacze', action: 'DELEGUJ', color: 'var(--q3-color)', icon: 'forward' },
    4: { title: 'Nieważne i Niepilne', subtitle: 'Pożeracze czasu', action: 'ELIMINUJ', color: 'var(--q4-color)', icon: 'trash-2' },
  };
  return info[q] || info[1];
}

/**
 * Time block category info
 */
export function getBlockCategories() {
  return [
    { key: 'deep-work', label: 'Deep Work', color: 'var(--tb-deep-work)', cssClass: 'deep-work' },
    { key: 'meeting', label: 'Spotkanie', color: 'var(--tb-meeting)', cssClass: 'meeting' },
    { key: 'break', label: 'Przerwa', color: 'var(--tb-break)', cssClass: 'break' },
    { key: 'routine', label: 'Rutyna', color: 'var(--tb-routine)', cssClass: 'routine' },
    { key: 'growth', label: 'Rozwój', color: 'var(--tb-growth)', cssClass: 'growth' },
  ];
}

export default {
  generateId, $, $$, createElement,
  formatDate, formatDateShort, formatTime, todayISO, getDayName,
  debounce, throttle, clamp,
  getRandomQuote, getGreeting, daysUntil,
  getWolAreas, getQuadrantInfo, getBlockCategories,
};
