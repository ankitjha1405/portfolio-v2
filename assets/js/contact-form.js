/*
 * ContactFormLogic: Footer contact form submission and success states.
 */
const ContactFormLogic = {
    /* FormSubmit token for jhaankitkumar12@gmail.com. Using the token instead
     * of the address keeps the inbox out of the form endpoint, which is the
     * part bots scrape. Messages still land in the same inbox.
     * Regenerate by submitting once with the naked address if it ever changes. */
    endpoint: 'https://formsubmit.co/ajax/71df5abc36d4d0ee9645de1ee514ee46',
    maxWords: 250,
    isInitialized: false,

    init: function() {
        if (this.isInitialized) return;

        const form = document.querySelector('.site-contact-form');
        if (!form) return;

        this.isInitialized = true;
        this.form = form;
        this.submitBtn = form.querySelector('.site-contact-submit');
        this.successPanel = form.querySelector('.site-contact-success');
        this.errorPanel = form.querySelector('.site-contact-error');
        this.fieldsWrap = form.querySelector('.site-contact-fields');
        this.layoutWrap = form.querySelector('.site-contact-layout');
        this.messageField = form.querySelector('#contact-message');
        this.wordCountEl = form.querySelector('#contact-message-count');

        form.addEventListener('submit', this.handleSubmit.bind(this));

        if (this.messageField) {
            this.messageField.addEventListener('input', this.handleMessageInput.bind(this));
            this.updateWordCount(this.messageField.value);
        }
    },

    countWords: function(text) {
        const trimmed = (text || '').trim();
        if (!trimmed) return 0;
        return trimmed.split(/\s+/).length;
    },

    trimToWordLimit: function(text) {
        const trimmed = (text || '').trim();
        if (!trimmed) return '';
        const words = trimmed.split(/\s+/);
        if (words.length <= this.maxWords) return text;
        return words.slice(0, this.maxWords).join(' ');
    },

    handleMessageInput: function() {
        if (!this.messageField) return;

        const limited = this.trimToWordLimit(this.messageField.value);
        if (limited !== this.messageField.value) {
            this.messageField.value = limited;
        }
        this.updateWordCount(this.messageField.value);
    },

    updateWordCount: function(text) {
        if (!this.wordCountEl) return;

        const count = this.countWords(text);
        this.wordCountEl.textContent = count + ' / ' + this.maxWords + ' words';
        this.wordCountEl.classList.toggle('is-over-limit', count > this.maxWords);
    },

    handleSubmit: async function(event) {
        event.preventDefault();
        if (!this.form || this.form.dataset.state === 'submitting') return;

        this.clearFeedback();
        if (this.messageField) {
            this.messageField.value = this.trimToWordLimit(this.messageField.value);
            this.updateWordCount(this.messageField.value);
        }

        const wordCount = this.countWords(this.messageField ? this.messageField.value : '');
        if (wordCount > this.maxWords) {
            this.showError('Please keep your message to ' + this.maxWords + ' words or fewer.');
            return;
        }

        if (!this.form.checkValidity()) {
            this.form.reportValidity();
            return;
        }

        const formData = new FormData(this.form);
        const payload = {
            name: (formData.get('name') || '').toString().trim(),
            email: (formData.get('email') || '').toString().trim(),
            message: (formData.get('message') || '').toString().trim(),
            _subject: 'Portfolio contact form: new message',
            _replyto: (formData.get('email') || '').toString().trim(),
            _captcha: 'false',
            _template: 'table'
        };

        if (!payload.name || !payload.email || !payload.message) {
            this.showError('Please fill in all fields before sending.');
            return;
        }

        this.setSubmitting(true);

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json().catch(function() {
                return {};
            });

            if (!response.ok || (result.success !== 'true' && result.success !== true)) {
                throw new Error(result.message || 'Unable to send your message right now.');
            }

            this.showSuccess();
            this.form.reset();
            this.updateWordCount('');
        } catch (error) {
            this.showError(error.message || 'Something went wrong. Please try again or email me directly.');
        } finally {
            this.setSubmitting(false);
        }
    },

    setSubmitting: function(isSubmitting) {
        if (!this.form || !this.submitBtn) return;

        this.form.dataset.state = isSubmitting ? 'submitting' : 'idle';
        this.submitBtn.disabled = isSubmitting;
        this.submitBtn.innerHTML = isSubmitting
            ? 'Sending…'
            : 'Say hello <i class="fas fa-arrow-up-right" aria-hidden="true"></i>';
    },

    clearFeedback: function() {
        if (this.successPanel) {
            this.successPanel.hidden = true;
        }
        if (this.errorPanel) {
            this.errorPanel.hidden = true;
            this.errorPanel.textContent = '';
        }
        if (this.layoutWrap) {
            this.layoutWrap.hidden = false;
        } else if (this.fieldsWrap) {
            this.fieldsWrap.hidden = false;
        }
    },

    showSuccess: function() {
        if (this.layoutWrap) {
            this.layoutWrap.hidden = true;
        } else if (this.fieldsWrap) {
            this.fieldsWrap.hidden = true;
        }
        if (this.errorPanel) {
            this.errorPanel.hidden = true;
        }
        if (this.successPanel) {
            this.successPanel.hidden = false;
            this.successPanel.focus();
        }
    },

    showError: function(message) {
        if (!this.errorPanel) return;
        this.errorPanel.hidden = false;
        this.errorPanel.textContent = message;
    }
};

/* Initialized by PortfolioApp.startAppEffects — avoid duplicate DOMContentLoaded init */
