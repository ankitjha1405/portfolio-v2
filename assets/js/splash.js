/*
 * SplashScreen: Home page entry animation — progress ring around M,
 * then a green wipe that covers the page from bottom to top before reveal.
 */
const SplashScreen = {
    RING_DELAY_MS: 200,
    RING_DURATION_MS: 1500,
    HOLD_MS: 220,
    COVER_MS: 850,
    COVER_HOLD_MS: 280,
    REVEAL_MS: 1100,

    shouldShow: function() {
        return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    logoMarkup: function() {
        return `
            <div class="splash-wipe" aria-hidden="true"></div>
            <div class="splash-logo" aria-hidden="true">
                <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Loading">
                    <defs>
                        <clipPath id="splash-m-fill-clip" clipPathUnits="userSpaceOnUse">
                            <rect class="splash-fill-mask" x="20" y="18" width="40" height="48"></rect>
                        </clipPath>
                    </defs>
                    <circle class="splash-ring-track" cx="40" cy="40" r="36"></circle>
                    <circle class="splash-ring-progress" cx="40" cy="40" r="36"></circle>
                    <text class="splash-logo-base" x="40" y="52" font-size="38" font-weight="900" font-family="Arial Black, Arial, sans-serif" text-anchor="middle">A</text>
                    <text class="splash-logo-fill" x="40" y="52" font-size="38" font-weight="900" font-family="Arial Black, Arial, sans-serif" text-anchor="middle" clip-path="url(#splash-m-fill-clip)">A</text>
                </svg>
            </div>
        `;
    },

    show: function(onComplete) {
        document.body.classList.add('splash-active');
        document.body.classList.remove('splash-ready');

        if (typeof CursorLogic !== 'undefined') {
            CursorLogic.init();
        }

        const overlay = document.createElement('div');
        overlay.id = 'splash-screen';
        overlay.className = 'splash-screen';
        overlay.setAttribute('role', 'status');
        overlay.setAttribute('aria-live', 'polite');
        overlay.setAttribute('aria-label', 'Loading');
        overlay.innerHTML = this.logoMarkup();
        document.body.appendChild(overlay);

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const ringDelay = reducedMotion ? 0 : this.RING_DELAY_MS;
        const ringDuration = reducedMotion ? 0 : this.RING_DURATION_MS;
        const hold = reducedMotion ? 80 : this.HOLD_MS;
        const cover = reducedMotion ? 0 : this.COVER_MS;
        const coverHold = reducedMotion ? 0 : this.COVER_HOLD_MS;
        const reveal = reducedMotion ? 0 : this.REVEAL_MS;

        const coverStart = ringDelay + ringDuration + hold;
        const readyAt = coverStart + cover;
        const revealStart = readyAt + coverHold;
        const doneAt = revealStart + reveal;

        window.setTimeout(function() {
            overlay.classList.add('splash-screen--cover');
        }, coverStart);

        // While fully covered in green, soft-prepare the page underneath.
        window.setTimeout(function() {
            document.body.classList.add('splash-ready');
        }, readyAt);

        window.setTimeout(function() {
            overlay.classList.add('splash-screen--reveal');
        }, revealStart);

        window.setTimeout(function() {
            overlay.remove();
            document.body.classList.remove('splash-active');
            document.body.classList.remove('splash-ready');
            if (typeof onComplete === 'function') {
                onComplete();
            }
        }, doneAt);
    }
};
