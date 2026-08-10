/* ============================================================
   LifeOS — Hash-based SPA Router
   ============================================================ */

class Router {
  constructor() {
    this._routes = new Map();
    this._currentRoute = null;
    this._container = null;
    this._onNavigateCallbacks = [];

    window.addEventListener('hashchange', () => this._handleRoute());
  }

  /**
   * Set the container element for rendering views
   */
  setContainer(container) {
    this._container = container;
  }

  /**
   * Register a route
   * @param {string} path — route hash (e.g. 'dashboard', 'ikigai')
   * @param {Object} config — { title, render: (container) => void }
   */
  register(path, config) {
    this._routes.set(path, config);
  }

  /**
   * Navigate to a route
   */
  navigate(path) {
    window.location.hash = path;
  }

  /**
   * Get current route path
   */
  getCurrentRoute() {
    return this._currentRoute;
  }

  /**
   * Register a callback for navigation events
   */
  onNavigate(callback) {
    this._onNavigateCallbacks.push(callback);
  }

  /**
   * Start the router — handle the initial route
   */
  start() {
    this._handleRoute();
  }

  /**
   * Handle route change
   */
  _handleRoute() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    const route = this._routes.get(hash);

    if (!route) {
      // Fallback to dashboard
      this.navigate('dashboard');
      return;
    }

    this._currentRoute = hash;

    if (this._container) {
      if (document.startViewTransition && document.visibilityState === 'visible') {
        try {
          document.startViewTransition(() => {
            this._renderRoute(route);
          });
        } catch (e) {
          this._renderRoute(route);
        }
      } else {
        this._renderRoute(route);
      }
    }

    // Notify navigation callbacks
    for (const cb of this._onNavigateCallbacks) {
      try { cb(hash, route); } catch (e) { console.error('Router navigate callback error:', e); }
    }
  }

  _renderRoute(route) {
    this._container.innerHTML = '';
    this._container.classList.remove('view-enter');

    // Force reflow to restart animation
    void this._container.offsetHeight;
    this._container.classList.add('view-enter');

    route.render(this._container);

    // Update topbar title
    const topbarTitle = document.getElementById('topbar-title');
    if (topbarTitle && route.title) {
      topbarTitle.textContent = route.title;
    }

    // Scroll to top
    this._container.scrollTop = 0;
  }
}

// Singleton
const router = new Router();
export default router;
