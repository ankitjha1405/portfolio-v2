(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileMq = window.matchMedia('(max-width: 900px)');
  const isMobile = () => mobileMq.matches;

  /* ---- Scroll / enter reveals ---- */
  function initRevealAnimations() {
    const configs = [
      { selector: '.mc-hero-title', delay: 0, immediate: true },
      { selector: '.mc-hero-eyes', delay: 140, immediate: true },
      { selector: '.mc-intro-heading', delay: 220, immediate: true },
      { selector: '.mc-intro-actions', delay: 300, immediate: true },
      { selector: '.mc-intro-copy', delay: 380, immediate: true },
      { selector: '.mc-featured .mc-eyebrow', delay: 0 },
      { selector: '.mc-featured .mc-section-title', delay: 90 },
      { selector: '.mc-proj', stagger: 90 },
      { selector: '.mc-bring-title', delay: 0 },
      { selector: '.mc-bring-item', stagger: 120 },
      { selector: '.mc-about-title', delay: 0 },
      { selector: '.mc-about-copy p', stagger: 90 },
      { selector: '.mc-timeline h3', stagger: 70 },
      { selector: '.mc-timeline-row', stagger: 80 },
      { selector: '.mc-about-photo', delay: 140 },
      { selector: '.mc-contact-info .mc-eyebrow', delay: 0 },
      { selector: '.mc-contact-title', delay: 90 },
      { selector: '.mc-contact-actions', delay: 180 },
      { selector: '.mc-form-intro', delay: 0 },
      { selector: '.mc-form-fields > *', stagger: 70 }
    ];

    const elements = [];
    configs.forEach(({ selector, delay = 0, stagger = 0, immediate = false }) => {
      document.querySelectorAll(selector).forEach((el, i) => {
        el.classList.add('mc-reveal');
        el.style.setProperty('--reveal-delay', (delay + i * stagger) + 'ms');
        if (immediate) el.dataset.revealImmediate = 'true';
        elements.push(el);
      });
    });

    if (!elements.length) return;

    const reveal = (el) => {
      if (el.classList.contains('is-visible')) return;
      el.classList.add('is-visible');
    };

    if (reduced) {
      elements.forEach(reveal);
      return;
    }

    elements.filter((el) => el.dataset.revealImmediate).forEach(reveal);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, isMobile()
      ? { threshold: 0.05, rootMargin: '0px 0px 8% 0px' }
      : { threshold: 0.14, rootMargin: '0px 0px -5% 0px' });

    elements.filter((el) => !el.dataset.revealImmediate).forEach((el) => observer.observe(el));

    const featured = document.querySelector('.mc-panel--featured');
    if (featured && isMobile()) {
      const featuredObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          featured.querySelectorAll('.mc-reveal').forEach(reveal);
          featuredObserver.disconnect();
        });
      }, { threshold: 0.08 });
      featuredObserver.observe(featured);
    }
  }

  initRevealAnimations();

  /* ---- Hero eyes lift on short viewports ---- */
  function initHeroEyesLift() {
    const fold = document.querySelector('.mc-home-fold');
    const hero = document.querySelector('.mc-hero');
    const eyes = document.querySelector('.mc-hero-eyes-parallax');
    const eyesFrame = document.querySelector('.mc-hero-eyes');
    const intro = document.querySelector('.mc-panel--intro');
    if (!fold || !hero || !eyes || !eyesFrame || !intro) return;

    let pending = false;

    const applyEyesTransform = (lift) => {
      eyes.dataset.lift = String(lift);
      eyes.style.transform = lift > 0 ? 'translateY(' + (-lift).toFixed(1) + 'px)' : '';
    };

    const update = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;

        fold.classList.remove('is-eyes-lifted');
        hero.classList.remove('is-eyes-lifted');
        eyes.dataset.lift = '0';
        eyes.style.transform = '';

        const eyesRect = eyes.getBoundingClientRect();
        const introRect = intro.getBoundingClientRect();
        const eyesHeight = eyesRect.height;
        if (eyesHeight < 1) return;

        const overlap = Math.max(0, eyesRect.bottom - introRect.top);
        const overlapRatio = overlap / eyesHeight;

        if (overlapRatio <= 0.4) {
          if (typeof window.__applyHeroEyesParallax === 'function') window.__applyHeroEyesParallax();
          return;
        }

        const lift = overlap - eyesHeight * 0.4;
        fold.classList.add('is-eyes-lifted');
        hero.classList.add('is-eyes-lifted');
        applyEyesTransform(lift);
        if (typeof window.__applyHeroEyesParallax === 'function') window.__applyHeroEyesParallax();
      });
    };

    window.addEventListener('resize', update, { passive: true });

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(update);
      observer.observe(fold);
      observer.observe(intro);
    }

    update();
    window.__updateHeroEyesLift = update;
  }

  initHeroEyesLift();

  /* ---- Eyes follow cursor ---- */
  const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 3 };
  let rafPending = false;

  function updatePupils() {
    rafPending = false;
    document.querySelectorAll('[data-eye]').forEach((eye) => {
      const pupil = eye.querySelector('[data-pupil]');
      if (!pupil) return;
      const r = eye.getBoundingClientRect();
      if (r.width === 0) return;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = mouse.x - cx;
      const dy = mouse.y - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const reach = Math.min(dist / 240, 1);
      const maxX = r.width * 0.2;
      const maxY = r.height * 0.2;
      const tx = (dx / dist) * maxX * reach;
      const ty = (dy / dist) * maxY * reach;
      pupil.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px)';
    });
  }

  function requestPupilUpdate() {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(updatePupils);
    }
  }

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    requestPupilUpdate();
  }, { passive: true });

  window.addEventListener('scroll', requestPupilUpdate, { passive: true, capture: true });

  /* ---- Blinking (lid covers, eye does not shrink) ---- */
  if (!reduced) {
    const blinkEye = (eye, className, duration) => {
      eye.classList.add(className);
      setTimeout(() => eye.classList.remove(className), duration);
    };

    const scheduleBlink = () => {
      const delay = 2000 + Math.random() * 4000;
      setTimeout(() => {
        document.querySelectorAll('[data-eye]').forEach((eye) => blinkEye(eye, 'is-blinking', 160));
        scheduleBlink();
      }, delay);
    };
    scheduleBlink();
  }

  /* ---- Click to wink ---- */
  document.addEventListener('click', (e) => {
    const eye = e.target.closest && e.target.closest('[data-eye]');
    if (!eye) return;
    eye.classList.remove('is-blinking');
    eye.classList.add('is-winking');
    setTimeout(() => eye.classList.remove('is-winking'), 320);
  });

  /* ---- Hover tooltips ---- */
  const tip = document.createElement('div');
  tip.className = 'mc-tooltip';
  document.body.appendChild(tip);

  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest && e.target.closest('[data-tip]');
    if (!el) return;
    const r = el.getBoundingClientRect();
    tip.textContent = el.getAttribute('data-tip');
    tip.style.left = (r.left + r.width / 2) + 'px';
    tip.style.top = (el.getAttribute('data-tip-pos') === 'top' ? r.top + 14 : r.bottom + 10) + 'px';
    tip.classList.add('is-visible');
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest && e.target.closest('[data-tip]')) {
      tip.classList.remove('is-visible');
    }
  });

  /* ---- About award preview near cursor ---- */
  function initAboutAwardPreviews() {
    if (isMobile() || reduced) return;
    const section = document.querySelector('.mc-about-copy');
    if (!section || section.dataset.awardPreviewInit) return;
    section.dataset.awardPreviewInit = '1';

    let preview = document.getElementById('home-award-preview');
    if (!preview) {
      preview = document.createElement('div');
      preview.id = 'home-award-preview';
      preview.className = 'home-award-preview';
      preview.setAttribute('aria-hidden', 'true');
      preview.innerHTML = '<img src="" alt="">';
      document.body.appendChild(preview);
    }

    const img = preview.querySelector('img');
    const width = 240;
    const height = 160;
    const gap = 28;
    let activeLink = null;

    const positionPreview = (x, y) => {
      let left = x + gap;
      let top = y - height / 2;
      const pad = 12;
      if (left + width > window.innerWidth - pad) left = x - width - gap;
      if (top < pad) top = pad;
      if (top + height > window.innerHeight - pad) top = window.innerHeight - height - pad;
      preview.style.left = left + 'px';
      preview.style.top = top + 'px';
    };

    const hidePreview = () => {
      activeLink = null;
      preview.classList.remove('is-visible');
    };

    const showPreview = (link, x, y) => {
      const src = link.getAttribute('data-award-preview');
      if (!src) return;
      activeLink = link;
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
      img.setAttribute('alt', link.textContent.trim());
      positionPreview(x, y);
      preview.classList.add('is-visible');
    };

    section.addEventListener('mouseover', (e) => {
      const link = e.target.closest('.mc-about-award-link');
      if (!link || !link.getAttribute('data-award-preview')) return;
      showPreview(link, e.clientX, e.clientY);
    });

    section.addEventListener('mouseout', (e) => {
      const link = e.target.closest('.mc-about-award-link');
      if (!link || link !== activeLink) return;
      const next = e.relatedTarget;
      if (next && link.contains(next)) return;
      hidePreview();
    });

    section.addEventListener('mousemove', (e) => {
      if (!activeLink) return;
      if (!activeLink.contains(e.target)) {
        hidePreview();
        return;
      }
      positionPreview(e.clientX, e.clientY);
    });

    document.addEventListener('mousemove', (e) => {
      if (!activeLink) return;
      if (!e.target.closest('.mc-about-award-link')) hidePreview();
    }, { passive: true });

    window.addEventListener('scroll', hidePreview, { passive: true });
    window.addEventListener('blur', hidePreview);
  }

  initAboutAwardPreviews();

  /* ---- Parallax scrolling (desktop only) ---- */
  const parallaxSelector = '.mc-bring, .mc-about, .mc-contact';

  const ensureCoverInner = (section) => {
    let inner = section.querySelector(':scope > .mc-cover-inner');
    if (inner) return inner;
    inner = document.createElement('div');
    inner.className = 'mc-cover-inner';
    while (section.firstChild) {
      inner.appendChild(section.firstChild);
    }
    section.appendChild(inner);
    return inner;
  };

  document.querySelectorAll(parallaxSelector).forEach(ensureCoverInner);

  if (!reduced && !isMobile()) {
    let plxPending = false;
    const introPanel = document.querySelector('.mc-panel--intro');
    const navEl = document.querySelector('.mc-nav');

    const applyHeroEyesParallax = (el, plx, vh) => {
      const lift = parseFloat(el.dataset.lift || 0);

      // Read the untransformed position for this frame so both corrections
      // below are computed algebraically, instead of writing a transform and
      // re-measuring (which is what let the two corrections fight and drift).
      el.style.transform = '';
      const base = el.getBoundingClientRect();

      let ty = plx - lift;

      // Keep the eyes from dipping too far into the intro panel below.
      if (introPanel) {
        const minGap = 16;
        const introTop = introPanel.getBoundingClientRect().top;
        const overflow = (base.bottom + ty) - (introTop - minGap);
        if (overflow > 0) ty -= overflow;
      }

      // Keep the eyes from rising above the floating pill nav. Scroll
      // distance has no upper bound, so without this floor the growing
      // downward pull above kept getting corrected further and further
      // upward the more you scrolled, eventually launching the eyes past
      // the nav and off the top of the screen.
      if (navEl) {
        const navBuffer = 24;
        const navBottom = navEl.getBoundingClientRect().bottom;
        const minTy = (navBottom + navBuffer) - base.top;
        if (ty < minTy) ty = minTy;
      }

      el.style.transform = 'translateY(' + ty.toFixed(1) + 'px)';
    };

    window.__applyHeroEyesParallax = () => {
      const eyes = document.querySelector('.mc-hero-eyes-parallax');
      if (!eyes) return;
      const vh = window.innerHeight || document.documentElement.clientHeight || 800;
      const factor = parseFloat(eyes.getAttribute('data-plx')) || 0;
      const sec = eyes.closest('[data-screen-label]') || eyes.parentElement;
      const r = sec.getBoundingClientRect();
      const d = (r.top + r.height / 2) - vh / 2;
      applyHeroEyesParallax(eyes, -d * factor, vh);
    };

    const parallax = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight || 800;

      document.querySelectorAll('[data-plx]').forEach((el) => {
        const factor = parseFloat(el.getAttribute('data-plx')) || 0;
        const sec = el.closest('[data-screen-label]') || el.parentElement;
        const r = sec.getBoundingClientRect();
        const d = (r.top + r.height / 2) - vh / 2;
        const plx = -d * factor;

        if (el.classList.contains('mc-hero-eyes-parallax')) {
          applyHeroEyesParallax(el, plx, vh);
          return;
        }

        el.style.transform = 'translateY(' + plx.toFixed(1) + 'px)';
      });

      document.querySelectorAll(parallaxSelector).forEach((section) => {
        const inner = section.querySelector(':scope > .mc-cover-inner');
        if (!inner) return;
        const factor = parseFloat(section.getAttribute('data-plx-section')) || 0.06;
        const roll = parseFloat(section.getAttribute('data-plx-roll')) || 0;
        const r = section.getBoundingClientRect();
        const d = (r.top + r.height / 2) - vh / 2;
        const ty = (-d * factor).toFixed(1);
        const rot = roll ? ((d / vh) * roll).toFixed(2) : '0';
        inner.style.transform = 'translateY(' + ty + 'px) rotate(' + rot + 'deg)';
      });
    };
    const onScrollPlx = () => {
      if (!plxPending) {
        plxPending = true;
        requestAnimationFrame(() => { plxPending = false; parallax(); });
      }
    };
    document.addEventListener('scroll', onScrollPlx, { passive: true, capture: true });
    window.addEventListener('resize', onScrollPlx, { passive: true });
    parallax();

    mobileMq.addEventListener('change', () => {
      if (isMobile()) {
        document.querySelectorAll('.mc-cover-inner').forEach((el) => {
          el.style.transform = '';
        });
      } else {
        parallax();
      }
    });
  }

  /* ---- Play-once videos when scrolled into view ---- */
  const onceVideos = document.querySelectorAll('video[data-play-once-on-view]');
  if (onceVideos.length) {
    const playOnceObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (!entry.isIntersecting || video.dataset.playedOnce === 'true') return;
        video.dataset.playedOnce = 'true';
        video.muted = true;
        video.setAttribute('muted', '');
        video.loop = false;
        video.removeAttribute('loop');
        video.currentTime = 0;
        const playPromise = video.play();
        if (playPromise && playPromise.catch) playPromise.catch(() => {});
        playOnceObserver.unobserve(video);
      });
    }, { threshold: 0.55 });

    onceVideos.forEach((video) => {
      video.muted = true;
      video.setAttribute('muted', '');
      video.loop = false;
      video.removeAttribute('loop');
      video.pause();
      playOnceObserver.observe(video);
    });
  }

  /* ---- Muted inline video autoplay ---- */
  document.querySelectorAll('video:not([data-play-once-on-view])').forEach((v) => {
    v.muted = true;
    v.setAttribute('muted', '');
    if (v.paused) {
      const pr = v.play();
      if (pr && pr.catch) pr.catch(() => {});
    }
  });

  /* ---- Sticky header actions ----
   * The intro row's social links + resume CTA reappear in the header pill once
   * the originals have scrolled up under it, so they read as having stuck
   * there rather than as a separate set of buttons appearing from nowhere.
   */
  function initStickyNavActions() {
    const navActions = document.querySelector('.mc-nav-actions');
    const introActions = document.querySelector('.mc-panel--intro .mc-intro-actions');
    if (!navActions || !introActions) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // Wait for the originals to fully clear the top edge before taking
        // over. Handing off any earlier leaves both copies briefly stacked in
        // the same band, since they share the header's right-hand offset.
        // bottom <= 0 also rules out the "still below the fold" case on load,
        // where the originals are equally not-intersecting.
        const cleared = entry.boundingClientRect.bottom <= 0;
        navActions.classList.toggle('is-visible', !entry.isIntersecting && cleared);
      });
    }, { threshold: 0 });

    observer.observe(introActions);
  }

  initStickyNavActions();

  /* ---- Project modal ----
   * Content is read straight off the clicked card so there is no parallel
   * data structure to drift out of sync with the markup. The CTA reuses the
   * card's own href; cards that have no real destination yet ('#') get the
   * button hidden rather than a link that goes nowhere.
   */
  function initProjectModal() {
    const overlay = document.getElementById('project-modal');
    const grid = document.querySelector('.mc-proj-grid');
    if (!overlay || !grid) return;

    const modal = overlay.querySelector('.mc-modal');
    const kindEl = overlay.querySelector('.mc-modal-kind');
    const titleEl = overlay.querySelector('.mc-modal-title');
    const descEl = overlay.querySelector('.mc-modal-desc');
    const linkEl = overlay.querySelector('.mc-modal-link');
    const closeBtn = overlay.querySelector('.mc-modal-close');

    let lastFocused = null;

    const text = (card, sel) => {
      const el = card.querySelector(sel);
      return el ? el.textContent.trim() : '';
    };

    // A card can carry a longer, popup-only write-up in .mc-proj-modal-desc;
    // cards without one (no real destination yet) just mirror the card blurb.
    const modalDesc = (card) => {
      const override = card.querySelector('.mc-proj-modal-desc');
      return override ? override.innerHTML : text(card, '.mc-proj-desc');
    };

    function open(card) {
      const href = card.getAttribute('href') || '';
      const hasLink = href && href !== '#';

      kindEl.textContent = text(card, '.mc-proj-type');
      titleEl.textContent = text(card, '.mc-proj-eyebrow').split(' · ')[0];
      descEl.innerHTML = modalDesc(card);

      linkEl.href = hasLink ? href : '#';
      linkEl.classList.toggle('is-disabled', !hasLink);
      linkEl.textContent = hasLink ? (card.dataset.cta || 'View full project') + ' ' : 'Write-up coming soon';
      if (hasLink) {
        const arrow = document.createElement('i');
        arrow.className = 'fas fa-arrow-up';
        arrow.setAttribute('aria-hidden', 'true');
        linkEl.appendChild(arrow);
      }
      linkEl.setAttribute('aria-disabled', String(!hasLink));
      linkEl.tabIndex = hasLink ? 0 : -1;

      lastFocused = document.activeElement;
      overlay.classList.add('is-open');
      document.documentElement.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function close() {
      overlay.classList.remove('is-open');
      document.documentElement.style.overflow = '';
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    grid.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const card = e.target.closest('.mc-proj');
      if (!card) return;
      e.preventDefault();
      open(card);
    });

    overlay.addEventListener('click', close);
    modal.addEventListener('click', (e) => e.stopPropagation());
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
    });
  }

  initProjectModal();

  /* ---- Pic2Split intro: scale the fixed 1816x1000 stage to cover its card media ---- */
  const p2sStages = document.querySelectorAll('.p2s-stage');
  if (p2sStages.length) {
    const fitP2s = () => {
      p2sStages.forEach((stage) => {
        const media = stage.parentElement;
        if (!media) return;
        const scale = Math.max(media.clientWidth / 1816, media.clientHeight / 1000);
        stage.style.setProperty('--p2s-scale', scale);
      });
    };
    fitP2s();
    window.addEventListener('resize', fitP2s);
    window.addEventListener('load', fitP2s);
  }

  /* ---- Contact form (shared with the rest of the site, see contact-form.js) ---- */
  if (typeof ContactFormLogic !== 'undefined') {
    ContactFormLogic.init();
  }

})();
