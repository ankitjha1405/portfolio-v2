/*
 * AiTransition: the loader shown when crossing between the portfolio and the
 * AI Playground.
 *
 *   entering the playground -> "Connecting you to the AI world"
 *   leaving the playground  -> "Taking you back to the Human World"
 *
 * The same artwork is used in both directions; only the message changes.
 *
 * The loader must never be able to trap the visitor, so every overlay carries
 * a deadline and there are four independent ways out:
 *   1. the normal timer
 *   2. a sweep on visibilitychange / pageshow, for tabs whose timers were
 *      throttled in the background or restored from the back/forward cache
 *   3. a navigation watchdog, if a page transition never completes
 *   4. a pure-CSS failsafe on the baked-in entry overlay, in case this file
 *      never runs at all (see ai-transition.css)
 */
const AiTransition = {
  MSG_IN: 'Connecting you to the AI world',
  MSG_OUT: 'Taking you back to the Human World',
  ANIM_PATH: 'assets/lottie/brainstorm.json?v=20260807c',

  HOLD_MS: 2000,        // how long the loader stays on screen
  FADE_MS: 420,         // must match the CSS transition duration
  SPEED: 1.25,          // lottie playback rate
  NAV_TIMEOUT_MS: 8000, // give up waiting for a navigation and release the page

  _busy: false,

  reduced: function () {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  now: function () {
    return Date.now();
  },

  /* ---- markup ---- */

  build: function (message) {
    const overlay = document.createElement('div');
    overlay.className = 'ai-transition';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');

    const glow = document.createElement('div');
    glow.className = 'ai-transition-glow';

    const anim = document.createElement('div');
    anim.className = 'ai-transition-anim';

    const msg = document.createElement('p');
    msg.className = 'ai-transition-msg';
    msg.textContent = message;

    const dots = document.createElement('div');
    dots.className = 'ai-transition-dots';
    dots.setAttribute('aria-hidden', 'true');
    dots.innerHTML = '<span></span><span></span><span></span>';

    overlay.appendChild(glow);
    overlay.appendChild(anim);
    overlay.appendChild(msg);
    overlay.appendChild(dots);
    return overlay;
  },

  /* ---- lottie ---- */

  _data: null,

  /* Fetch the animation once up front so the artwork is on screen the moment
   * the overlay fades in, rather than a beat later. */
  preload: function () {
    const self = this;
    if (this._dataPromise) return this._dataPromise;

    this._dataPromise = fetch(this.ANIM_PATH)
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (json) { self._data = json; return json; })
      .catch(function () { return null; });

    return this._dataPromise;
  },

  mountAnimation: function (overlay) {
    const holder = overlay.querySelector('.ai-transition-anim');
    if (!holder || overlay.__player || typeof lottie === 'undefined') return null;

    const config = {
      container: holder,
      renderer: 'svg',
      loop: true,
      autoplay: !this.reduced()
    };

    // animationData renders synchronously; path costs an extra round trip.
    if (this._data) {
      config.animationData = this._data;
    } else {
      config.path = this.ANIM_PATH;
    }

    let player = null;
    try {
      player = lottie.loadAnimation(config);
      player.setSpeed(this.SPEED);
    } catch (e) {
      return null; // artwork is decorative; never block the transition on it
    }

    overlay.__player = player;
    return player;
  },

  /* rAF stops in background tabs and lottie can come back paused. */
  resumeAnimations: function () {
    if (this.reduced()) return;
    document.querySelectorAll('.ai-transition').forEach(function (overlay) {
      const player = overlay.__player;
      if (player && player.isPaused) {
        try { player.play(); } catch (e) { /* nothing we can do */ }
      }
    });
  },

  /* ---- teardown ---- */

  destroy: function (overlay) {
    if (!overlay) return;

    if (overlay.__timers) {
      overlay.__timers.forEach(clearTimeout);
      overlay.__timers = null;
    }

    if (overlay.__player) {
      try { overlay.__player.destroy(); } catch (e) { /* already gone */ }
      overlay.__player = null;
    }

    overlay.remove();
    this.syncLock();
  },

  /* The scroll lock belongs to the overlays, not to a stray class: recompute
   * it from what is actually on screen so it can never be left behind. */
  syncLock: function () {
    const active = document.querySelector('.ai-transition');
    document.documentElement.classList.toggle('ai-transition-lock', !!active);
    if (!active) this._busy = false;
  },

  track: function (overlay, timer) {
    if (!overlay.__timers) overlay.__timers = [];
    overlay.__timers.push(timer);
  },

  fadeOut: function (overlay) {
    const self = this;
    if (!overlay || !overlay.isConnected) return;
    overlay.classList.remove('is-visible');
    this.track(overlay, window.setTimeout(function () { self.destroy(overlay); }, this.FADE_MS));
  },

  /* Anything that has outlived its deadline gets cleared. Runs when the tab
   * comes back to the foreground, where throttled timers may still be pending,
   * and on bfcache restores, where a frozen overlay can come back with it. */
  sweep: function () {
    const self = this;
    const now = this.now();

    document.querySelectorAll('.ai-transition').forEach(function (overlay) {
      const deadline = overlay.__deadline;
      if (!deadline) return;      // not ours to manage
      if (now < deadline) return; // still within its window
      self.destroy(overlay);      // overdue: give the page back
    });

    this.syncLock();
    this.resumeAnimations();
  },

  /* ---- outbound: play the loader, then hand control back ---- */

  run: function (message, done) {
    const self = this;

    if (this.reduced()) {
      if (typeof done === 'function') done();
      return;
    }

    const overlay = this.build(message);
    overlay.__deadline = this.now() + this.FADE_MS + this.HOLD_MS + this.NAV_TIMEOUT_MS;
    overlay.__navigating = true;

    document.body.appendChild(overlay);
    this.syncLock();

    this.preload().then(function () {
      if (overlay.isConnected) self.mountAnimation(overlay);
    });

    // let the element paint at opacity 0 before transitioning in
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add('is-visible');
      });
    });

    this.track(overlay, window.setTimeout(function () {
      if (typeof done === 'function') done();

      // If the navigation stalls or is blocked, don't leave the page covered.
      self.track(overlay, window.setTimeout(function () {
        self.destroy(overlay);
      }, self.NAV_TIMEOUT_MS));
    }, this.FADE_MS + this.HOLD_MS));
  },

  /* ---- arrival: overlay is already in the markup, fade it away ---- */

  reveal: function (overlay, message) {
    const self = this;
    if (!overlay) return;

    if (message) {
      const msg = overlay.querySelector('.ai-transition-msg');
      if (msg) msg.textContent = message;
    }

    if (this.reduced()) {
      this.destroy(overlay);
      return;
    }

    overlay.__deadline = this.now() + this.HOLD_MS + this.FADE_MS;
    overlay.classList.add('is-visible');
    this.syncLock();

    this.preload().then(function () {
      if (overlay.isConnected) self.mountAnimation(overlay);
    });

    this.track(overlay, window.setTimeout(function () {
      self.fadeOut(overlay);
    }, this.HOLD_MS));
  },

  /* ---- link interception ----
   * Any element matching `selector` navigates through the loader instead of
   * jumping straight to its href. Modified clicks (new tab, middle click) and
   * same-page anchors are left alone.
   */

  guard: function (selector, message) {
    const self = this;

    document.addEventListener('click', function (event) {
      if (event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const trigger = event.target.closest && event.target.closest(selector);
      if (!trigger) return;

      const href = trigger.getAttribute('href') || trigger.dataset.href;
      if (!href || href.charAt(0) === '#') return;
      if (trigger.target === '_blank') return;

      event.preventDefault();

      // One transition at a time: a second click must not stack a second
      // overlay or fire a second navigation.
      if (self._busy) return;
      self._busy = true;

      // The destination should not stack its own intro splash on top of the
      // loader the visitor is already watching.
      try { sessionStorage.setItem('ai-skip-splash', '1'); } catch (e) { /* private mode */ }

      self.run(message, function () { window.location.href = href; });
    });
  },

  /* True once per navigation that came through a transition. */
  cameFromTransition: function () {
    try {
      if (sessionStorage.getItem('ai-skip-splash') !== '1') return false;
      sessionStorage.removeItem('ai-skip-splash');
      return true;
    } catch (e) {
      return false;
    }
  },

  init: function () {
    const self = this;

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) self.sweep();
    });

    // bfcache restore: a frozen overlay can be reinstated with the page.
    window.addEventListener('pageshow', function (event) {
      if (event.persisted) {
        document.querySelectorAll('.ai-transition').forEach(function (overlay) {
          self.destroy(overlay);
        });
        self._busy = false;
        self.syncLock();
      }
    });

    // Leaving the page cancels any in-flight transition bookkeeping.
    window.addEventListener('pagehide', function () {
      self._busy = false;
    });

    this.preload();
  }
};

AiTransition.init();
