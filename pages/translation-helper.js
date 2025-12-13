// translation-helper.js - Shared translation system for all pages

class TranslationManager {
    constructor() {
        this.currentLang = this.getSavedLanguage();
        this.isTranslating = false;
        this.initialized = false;

        // Inject CSS styles immediately
        this.injectStyles();
    }

    injectStyles() {
        // Check if styles already injected
        if (document.getElementById('translation-styles')) return;

        const styleElement = document.createElement('style');
        styleElement.id = 'translation-styles';
        styleElement.textContent = `
            /* Hide Google Translate UI elements */
            .goog-te-banner-frame.skiptranslate {
                display: none !important;
            }

            body {
                top: 0px !important;
                position: static !important;
            }

            .goog-te-balloon-frame {
                display: none !important;
            }

            .goog-tooltip {
                display: none !important;
            }

            .goog-tooltip:hover {
                display: none !important;
            }

            .goog-text-highlight {
                background-color: transparent !important;
                border: none !important;
                box-shadow: none !important;
            }

            #goog-gt-tt {
                display: none !important;
            }

            .goog-te-banner-frame {
                display: none !important;
            }

            .goog-te-banner-frame.skiptranslate,
            .goog-te-gadget-simple {
                display: none !important;
            }

            iframe.goog-te-banner-frame {
                display: none !important;
            }

            body > .skiptranslate {
                display: none !important;
            }

            iframe.skiptranslate {
                display: none !important;
            }

            .VIpgJd-ZVi9od-aZ2wEe-wOHMyf {
                display: none !important;
            }

            .VIpgJd-ZVi9od-aZ2wEe-OiiCO {
                display: none !important;
            }

            .VIpgJd-ZVi9od-xl07Ob-lTBxed {
                display: none !important;
            }

            /* Language Toggle Button */
            .language-toggle {
                background: var(--accent);
                color: var(--primary-dark);
                border: 2px solid var(--accent);
                padding: 0.5rem 1.2rem;
                border-radius: 25px;
                cursor: pointer;
                font-weight: 600;
                transition: var(--transition);
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.95rem;
                font-family: 'Inter', sans-serif;
            }

            .language-toggle:hover {
                background: var(--accent-light);
                transform: scale(1.05);
                box-shadow: 0 4px 12px rgba(176, 141, 87, 0.3);
            }

            .language-toggle .material-icons {
                font-size: 1.2rem;
            }

            /* Hide Arabic text by default (when in English mode) */
            .arabic-only {
                display: none;
            }

            /* When in Arabic mode (RTL), hide English and show Arabic */
            body[dir="rtl"] .english-only {
                display: none;
            }

            body[dir="rtl"] .arabic-only {
                display: inline;
            }

            /* RTL Support for Arabic */
            body[dir="rtl"] {
                direction: rtl;
                text-align: right;
            }

            body[dir="rtl"] .nav-container {
                flex-direction: row;
            }

            body[dir="rtl"] .logo::before {
                margin-right: 0;
                margin-left: 0.5rem;
            }

            body[dir="rtl"] .nav-links a::after {
                left: auto;
                right: 50%;
                transform: translateX(50%);
            }

            body[dir="rtl"] .search-icon {
                margin-right: 0;
                margin-left: 1rem;
            }

            /* Force language toggle and account to the LEFT side in RTL */
            body[dir="rtl"] .nav-container > div:last-child {
                order: 3;
                margin-right: 0;
            }

            body[dir="rtl"] .logo {
                order: 1;
            }

            body[dir="rtl"] .nav-links {
                order: 2;
            }

            body[dir="rtl"] .info-grid {
                direction: rtl;
            }

            body[dir="rtl"] .event-item,
            body[dir="rtl"] .exhibition-item {
                border-left: none;
                border-right: 4px solid transparent;
            }

            body[dir="rtl"] .event-item:hover,
            body[dir="rtl"] .exhibition-item:hover {
                transform: translateX(-5px);
                border-left: none;
                border-right: 4px solid var(--accent);
            }

            body[dir="rtl"] .footer-info {
                direction: rtl;
            }

            body[dir="rtl"] .recommendation-badge {
                right: auto;
                left: 1rem;
            }

            body[dir="rtl"] .accessibility-controls {
                right: auto;
                left: 20px;
            }

            body[dir="rtl"] .accessibility-menu {
                right: auto;
                left: 0;
            }

            body[dir="rtl"] .suggestion-icon {
                margin-right: 0;
                margin-left: 1rem;
            }

            body[dir="rtl"] .language-toggle {
                margin-left: 1rem;
            }

            /* Responsive adjustments */
            @media (max-width: 768px) {
                body[dir="rtl"] .accessibility-controls {
                    left: 15px;
                    right: auto;
                }

                .language-toggle {
                    padding: 0.4rem 0.8rem;
                    font-size: 0.85rem;
                }
            }
            body[dir="rtl"] .timeline-content::after {
                right: 15px !important;
                left: auto !important;
            }
                
            /* Force LTR for specific elements even in RTL mode */
            .keep-ltr {
                direction: ltr !important;
                text-align: left !important;
            }

            body[dir="rtl"] .keep-ltr {
                direction: ltr !important;
                text-align: left !important;
            }

            /* Override timeline RTL styles when keep-ltr is used */
            body[dir="rtl"] .timeline.keep-ltr::after {
                left: 50% !important;
                right: auto !important;
                margin-left: -2px !important;
                margin-right: 0 !important;
            }

            body[dir="rtl"] .timeline.keep-ltr .timeline-item:nth-child(odd) {
                left: 0 !important;
                right: auto !important;
            }

            body[dir="rtl"] .timeline.keep-ltr .timeline-item:nth-child(even) {
                left: 50% !important;
                right: auto !important;
            }

            body[dir="rtl"] .timeline.keep-ltr .timeline-item:nth-child(odd) .timeline-content::after {
                right: -10px !important;
                left: auto !important;
            }

            body[dir="rtl"] .timeline.keep-ltr .timeline-item:nth-child(even) .timeline-content::after {
                left: -10px !important;
                right: auto !important;
            }
        `;

        // Insert at the beginning of <head> for high priority
        document.head.insertBefore(styleElement, document.head.firstChild);
    }

    getSavedLanguage() {
        return localStorage.getItem('siteLanguage') || 'en';
    }

    saveLanguage(lang) {
        localStorage.setItem('siteLanguage', lang);
        this.currentLang = lang;
    }

    updateDropdownOptions() {
        const isArabic = document.documentElement.getAttribute('dir') === 'rtl';

        document.querySelectorAll('option[data-en][data-ar]').forEach(option => {
            if (isArabic) {
                option.textContent = option.getAttribute('data-ar');
            } else {
                option.textContent = option.getAttribute('data-en');
            }
        });
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;

        // Wait for Google Translate to load
        this.waitForGoogleTranslate().then(() => {
            // Apply saved language immediately on page load
            if (this.currentLang === 'ar') {
                this.applyArabic(false); // false = don't speak (silent load)
            } else {
                this.applyEnglish(false);
            }

            // Update button text
            this.updateButtonText();

            // Mark material icons as notranslate
            this.markMaterialIcons();

            // Update dropdown options
            this.updateDropdownOptions();
        });

        // Keep button text correct
        setInterval(() => this.updateButtonText(), 2000);
    }

    waitForGoogleTranslate() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const selectElement = document.querySelector('.goog-te-combo');
                if (selectElement) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);

            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 10000);
        });
    }

    markMaterialIcons() {
        const materialIcons = document.querySelectorAll('.material-icons');
        materialIcons.forEach(icon => icon.classList.add('notranslate'));
    }

    updateButtonText() {
        const translateText = document.querySelector('.translate-text');
        if (!translateText) return;

        if (this.currentLang === 'ar') {
            if (translateText.textContent !== 'English') {
                translateText.textContent = 'English';
            }
        } else {
            if (translateText.textContent !== 'العربية') {
                translateText.textContent = 'العربية';
            }
        }
    }

    async toggleLanguage() {
        if (this.isTranslating) {
            console.log('Translation in progress, please wait...');
            return;
        }

        const selectElement = document.querySelector('.goog-te-combo');
        if (!selectElement) {
            console.error('Google Translate not ready');
            return;
        }

        this.isTranslating = true;

        if (this.currentLang === 'en') {
            await this.applyArabic(true);
        } else {
            await this.applyEnglish(true);
        }

        this.isTranslating = false;
    }

    applyArabic(speakMessage = false) {
        return new Promise((resolve) => {
            const selectElement = document.querySelector('.goog-te-combo');
            if (!selectElement) {
                resolve();
                return;
            }

            // Trigger translation
            selectElement.value = 'ar';
            selectElement.dispatchEvent(new Event('change'));

            // Apply RTL immediately
            document.documentElement.setAttribute('dir', 'rtl');
            document.body.setAttribute('dir', 'rtl');
            document.documentElement.setAttribute('lang', 'ar');

            // Update button
            const translateText = document.querySelector('.translate-text');
            if (translateText) translateText.textContent = 'English';

            // Save language
            this.saveLanguage('ar');

            // Update dropdown options
            this.updateDropdownOptions();

            // Speak if enabled
            if (speakMessage && window.screenReader && window.screenReader.isEnabled) {
                setTimeout(() => {
                    window.screenReader.speak("تم التبديل إلى اللغة العربية");
                }, 1000);
            }

            // Multiple updates to ensure button text stays correct
            setTimeout(() => {
                if (translateText) translateText.textContent = 'English';
            }, 500);
            setTimeout(() => {
                if (translateText) translateText.textContent = 'English';
            }, 1000);
            setTimeout(() => {
                if (translateText) translateText.textContent = 'English';
                resolve();
            }, 1500);
        });
    }

    applyEnglish(speakMessage = false) {
        return new Promise((resolve) => {
            const selectElement = document.querySelector('.goog-te-combo');
            if (!selectElement) {
                resolve();
                return;
            }

            // Trigger translation
            selectElement.value = 'en';
            selectElement.dispatchEvent(new Event('change'));

            // Apply LTR immediately
            document.documentElement.setAttribute('dir', 'ltr');
            document.body.setAttribute('dir', 'ltr');
            document.documentElement.setAttribute('lang', 'en');

            // Update button
            const translateText = document.querySelector('.translate-text');
            if (translateText) translateText.textContent = 'العربية';

            // Save language
            this.saveLanguage('en');

            // Update dropdown options
            this.updateDropdownOptions();

            // Speak if enabled
            if (speakMessage && window.screenReader && window.screenReader.isEnabled) {
                setTimeout(() => {
                    window.screenReader.speak("Switched to English");
                }, 1000);
            }

            // Multiple updates to ensure button text stays correct
            setTimeout(() => {
                if (translateText) translateText.textContent = 'العربية';
            }, 500);
            setTimeout(() => {
                if (translateText) translateText.textContent = 'العربية';
            }, 1000);
            setTimeout(() => {
                if (translateText) translateText.textContent = 'العربية';
                resolve();
            }, 1500);
        });
    }
}

// Create global instance
window.translationManager = new TranslationManager();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.translationManager.init();
    });
} else {
    window.translationManager.init();
}

// Global function for button onclick
function translateToArabic() {
    if (window.translationManager) {
        window.translationManager.toggleLanguage();
    }
}