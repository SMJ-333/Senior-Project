
(function () {
    'use strict';

    // ===== INJECT CSS STYLES =====
    const style = document.createElement('style');
    style.textContent = `
        .accessibility-controls {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .accessibility-btn {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: var(--primary-dark);
            color: var(--white);
            border: 3px solid var(--accent);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            font-size: 1.5rem;
        }

        .accessibility-btn:hover {
            transform: scale(1.1);
            background: var(--primary-light);
        }

        .accessibility-btn.active {
            background: var(--accent);
            color: var(--primary-dark);
        }

        .accessibility-menu {
            position: absolute;
            bottom: 70px;
            right: 0;
            background: var(--white);
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            padding: 1.5rem;
            min-width: 250px;
            display: none;
        }

        .accessibility-menu.show {
            display: block;
            animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .accessibility-menu h3 {
            color: var(--primary-dark);
            margin-bottom: 1rem;
            font-size: 1.2rem;
        }

        .menu-option {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.8rem 0;
            border-bottom: 1px solid var(--neutral-light);
            transition: var(--transition);
        }

        .menu-option:last-child {
            border-bottom: none;
        }

        .menu-option label {
            color: var(--text-dark);
            font-size: 0.95rem;
            cursor: pointer;
            transition: var(--transition);
        }

        /* Disabled state for menu options */
        .menu-option:has(input:disabled) {
            opacity: 0.5;
        }

        .menu-option:has(input:disabled) label {
            cursor: not-allowed;
        }

        .toggle-switch {
            position: relative;
            width: 50px;
            height: 26px;
        }

        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 34px;
        }

        .slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }

        input:checked+.slider {
            background-color: var(--accent);
        }

        input:checked+.slider:before {
            transform: translateX(24px);
        }

        /* Disabled toggle styling */
        .toggle-switch input:disabled+.slider {
            background-color: #e0e0e0;
            cursor: not-allowed;
            opacity: 0.6;
        }

        .toggle-switch input:disabled+.slider:before {
            background-color: #f5f5f5;
        }

        .speed-control {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding: 0.8rem 0;
        }

        .speed-control input[type="range"] {
            width: 100%;
            accent-color: var(--accent);
        }

        .speed-label {
            display: flex;
            justify-content: space-between;
            font-size: 0.85rem;
            color: var(--text-light);
        }

        .sr-highlight {
            outline: 3px solid var(--accent) !important;
            outline-offset: 2px;
            background-color: rgba(176, 141, 87, 0.1) !important;
        }

        @media (max-width: 768px) {
            .accessibility-controls {
                bottom: 15px;
                right: 15px;
            }

            .accessibility-btn {
                width: 55px;
                height: 55px;
            }

            .accessibility-menu {
                right: -10px;
                min-width: 220px;
            }
        }
    `;
    document.head.appendChild(style);

    // ===== SCREEN READER ACCESSIBILITY SYSTEM =====
    class ScreenReaderSystem {
        constructor() {
            this.isEnabled = false;
            this.isReading = false;
            this.autoReadOnHover = false;
            this.readOnClick = false;
            this.speed = 1.0;
            this.currentElement = null;
            this.hoverTimeout = null;

            this.init();
        }

        init() {
            this.createAccessibilityControls();
            this.loadSettings();
            this.attachEventListeners();
        }

        createAccessibilityControls() {
            const controls = document.createElement('div');
            controls.className = 'accessibility-controls';
            controls.innerHTML = `
            <button class="accessibility-btn" id="accessibility-toggle" title="Screen Reader Controls" aria-label="Open screen reader controls">
                <span class="material-icons">accessibility_new</span>
            </button>
            <div class="accessibility-menu" id="accessibility-menu" role="menu">
                <h3>Screen Reader</h3>
                
                <div class="menu-option">
                    <label for="enable-reader">Enable Reader</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="enable-reader">
                        <span class="slider"></span>
                    </label>
                </div>

                <div class="menu-option">
                    <label for="auto-hover">Read on Hover</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="auto-hover" disabled>
                        <span class="slider"></span>
                    </label>
                </div>

                <div class="menu-option">
                    <label for="read-click">Read on Click</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="read-click" disabled>
                        <span class="slider"></span>
                    </label>
                </div>

                <div class="speed-control">
                    <div class="speed-label">
                        <span>Speech Speed</span>
                        <span id="speed-value">Normal</span>
                    </div>
                    <input type="range" id="speed-control" min="0.5" max="2" step="0.1" value="1">
                </div>
            </div>
        `;
            document.body.appendChild(controls);
        }

        attachEventListeners() {
            // Toggle menu
            document.getElementById('accessibility-toggle').addEventListener('click', () => {
                const menu = document.getElementById('accessibility-menu');
                menu.classList.toggle('show');
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.accessibility-controls')) {
                    document.getElementById('accessibility-menu').classList.remove('show');
                }
            });

            // Enable/Disable reader
            document.getElementById('enable-reader').addEventListener('change', (e) => {
                this.isEnabled = e.target.checked;
                const hoverCheckbox = document.getElementById('auto-hover');
                const clickCheckbox = document.getElementById('read-click');

                if (this.isEnabled) {
                    hoverCheckbox.disabled = false;
                    clickCheckbox.disabled = false;

                    this.autoReadOnHover = true;
                    this.readOnClick = true;
                    hoverCheckbox.checked = true;
                    clickCheckbox.checked = true;

                    this.speak("Screen reader enabled");
                    this.enableReader();
                    this.enableHoverReading();
                } else {
                    hoverCheckbox.disabled = true;
                    clickCheckbox.disabled = true;
                    hoverCheckbox.checked = false;
                    clickCheckbox.checked = false;

                    this.autoReadOnHover = false;
                    this.readOnClick = false;

                    this.speak("Screen reader disabled");
                    this.disableReader();
                }

                this.saveSettings();
            });

            // Auto hover
            document.getElementById('auto-hover').addEventListener('change', (e) => {
                this.autoReadOnHover = e.target.checked;
                this.saveSettings();
                if (this.autoReadOnHover) {
                    this.enableHoverReading();
                } else {
                    this.disableHoverReading();
                }
            });

            // Read on click
            document.getElementById('read-click').addEventListener('change', (e) => {
                this.readOnClick = e.target.checked;
                this.saveSettings();
            });

            // Speed control
            document.getElementById('speed-control').addEventListener('input', (e) => {
                this.speed = parseFloat(e.target.value);
                this.updateSpeedLabel();
                this.saveSettings();
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.altKey && e.key === 's') {
                    e.preventDefault();
                    this.stopSpeaking();
                }
                if (e.altKey && e.key === 'r') {
                    e.preventDefault();
                    const enableCheckbox = document.getElementById('enable-reader');
                    enableCheckbox.checked = !enableCheckbox.checked;
                    enableCheckbox.dispatchEvent(new Event('change'));
                }
            });
        }

        enableReader() {
            document.body.style.cursor = 'help';
        }

        disableReader() {
            document.body.style.cursor = 'default';
            this.stopSpeaking();
            this.disableHoverReading();
        }

        enableHoverReading() {
            document.addEventListener('mouseover', this.handleHover);
        }

        disableHoverReading() {
            document.removeEventListener('mouseover', this.handleHover);
            clearTimeout(this.hoverTimeout);
        }

        handleHover = (e) => {
            if (!this.isEnabled || !this.autoReadOnHover) return;

            clearTimeout(this.hoverTimeout);

            this.hoverTimeout = setTimeout(() => {
                const element = e.target;
                if (element && element !== this.currentElement) {
                    this.readElement(element);
                }
            }, 500);
        }

        readElement(element) {
            if (!this.isEnabled) return;

            // Skip script, style, and hidden elements
            if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(element.tagName)) return;
            if (element.offsetParent === null && element.tagName !== 'BODY') return;

            let textToRead = '';
            let isClickable = false;

            // Check if element is clickable
            const hasClickHandler = element.onclick !== null ||
                element.hasAttribute('onclick') ||
                element.style.cursor === 'pointer' ||
                element.classList.contains('clickable') ||
                element.hasAttribute('role') && element.getAttribute('role') === 'button';

            // Get aria-label or title first (highest priority)
            if (element.getAttribute('aria-label')) {
                textToRead = element.getAttribute('aria-label');
                isClickable = hasClickHandler;
            } else if (element.getAttribute('title')) {
                textToRead = element.getAttribute('title');
                isClickable = hasClickHandler;
            } else if (element.tagName === 'IMG') {
                textToRead = element.alt || 'Image';
                isClickable = hasClickHandler;
            } else if (element.tagName === 'A') {
                textToRead = `Link: ${element.textContent.trim()}`;
                isClickable = true;
            } else if (element.tagName === 'BUTTON') {
                textToRead = `Button: ${element.textContent.trim()}`;
                isClickable = true;
            } else if (element.tagName === 'INPUT') {
                const label = document.querySelector(`label[for="${element.id}"]`);
                textToRead = `Input field: ${label ? label.textContent : element.placeholder || 'Text input'}`;
                isClickable = true;
            } else if (element.tagName === 'TEXTAREA') {
                const label = document.querySelector(`label[for="${element.id}"]`);
                textToRead = `Text area: ${label ? label.textContent : element.placeholder || 'Text area'}`;
                isClickable = true;
            } else if (element.tagName === 'SELECT') {
                const label = document.querySelector(`label[for="${element.id}"]`);
                textToRead = `Dropdown: ${label ? label.textContent : 'Select option'}`;
                isClickable = true;
            } else if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(element.tagName)) {
                textToRead = element.textContent.trim();
                isClickable = hasClickHandler;
            } else if (element.tagName === 'P') {
                textToRead = element.textContent.trim();
                isClickable = hasClickHandler;
            } else if (element.tagName === 'NAV') {
                textToRead = 'Navigation menu';
                isClickable = false;
            } else if (element.tagName === 'FOOTER') {
                textToRead = 'Footer section';
                isClickable = false;
            } else if (element.tagName === 'HEADER') {
                textToRead = 'Header section';
                isClickable = false;
            } else if (element.tagName === 'SECTION') {
                // For sections, try to find the main heading to read
                const heading = element.querySelector('h1, h2, h3, h4, h5, h6');
                if (heading) {
                    textToRead = heading.textContent.trim();
                } else {
                    return;
                }
                isClickable = hasClickHandler;
            } else if (element.tagName === 'DIV') {
                // Check if div is clickable (cards, containers)
                if (hasClickHandler) {
                    // Try to find meaningful text inside
                    const heading = element.querySelector('h1, h2, h3, h4, h5, h6');
                    if (heading) {
                        textToRead = heading.textContent.trim();
                    } else {
                        // Get first meaningful text
                        const firstText = element.textContent.trim().substring(0, 100);
                        textToRead = firstText;
                    }
                    isClickable = true;
                } else {
                    return;
                }
            } else {
                // Get direct text content only (not nested elements)
                textToRead = Array.from(element.childNodes)
                    .filter(node => node.nodeType === Node.TEXT_NODE)
                    .map(node => node.textContent.trim())
                    .filter(text => text.length > 0)
                    .join(' ');

                isClickable = hasClickHandler;
            }

            // Clean up text
            textToRead = textToRead.trim().replace(/\s+/g, ' ');

            // Add "clickable" announcement if element is interactive
            if (isClickable && textToRead && !textToRead.toLowerCase().includes('button') && !textToRead.toLowerCase().includes('link')) {
                textToRead = `Clickable: ${textToRead}`;
            }

            if (textToRead && textToRead.length > 1) {
                this.speak(textToRead);
                this.currentElement = element;
                this.highlightElement(element);
            }
        }

        highlightElement(element) {
            // Remove previous highlight
            document.querySelectorAll('.sr-highlight').forEach(el => {
                el.classList.remove('sr-highlight');
            });

            // Add temporary highlight
            element.classList.add('sr-highlight');
            setTimeout(() => {
                element.classList.remove('sr-highlight');
            }, 2000);
        }

        speak(text) {
            if (!text || text.trim().length === 0) return;

            // Stop current speech
            this.stopSpeaking();

            // Use ResponsiveVoice if available, otherwise use browser's SpeechSynthesis
            if (typeof responsiveVoice !== 'undefined') {
                responsiveVoice.speak(text, "US English Female", {
                    rate: this.speed,
                    pitch: 1,
                    volume: 1
                });
            } else {
                // Fallback to browser's built-in speech synthesis
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = this.speed;
                utterance.pitch = 1;
                utterance.volume = 1;
                window.speechSynthesis.speak(utterance);
            }

            this.isReading = true;
        }

        stopSpeaking() {
            if (typeof responsiveVoice !== 'undefined') {
                responsiveVoice.cancel();
            } else {
                window.speechSynthesis.cancel();
            }
            this.isReading = false;
            this.currentElement = null;
        }

        updateSpeedLabel() {
            const label = document.getElementById('speed-value');
            if (this.speed < 0.8) {
                label.textContent = 'Slow';
            } else if (this.speed > 1.2) {
                label.textContent = 'Fast';
            } else {
                label.textContent = 'Normal';
            }
        }

        saveSettings() {
            localStorage.setItem('screenReaderSettings', JSON.stringify({
                enabled: this.isEnabled,
                autoHover: this.autoReadOnHover,
                readClick: this.readOnClick,
                speed: this.speed
            }));
        }

        loadSettings() {
            const saved = localStorage.getItem('screenReaderSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.isEnabled = settings.enabled || false;
                this.autoReadOnHover = settings.autoHover || false;
                this.readOnClick = settings.readClick || false;
                this.speed = settings.speed || 1.0;

                const hoverCheckbox = document.getElementById('auto-hover');
                const clickCheckbox = document.getElementById('read-click');

                document.getElementById('enable-reader').checked = this.isEnabled;
                document.getElementById('speed-control').value = this.speed;
                this.updateSpeedLabel();

                if (this.isEnabled) {
                    hoverCheckbox.disabled = false;
                    clickCheckbox.disabled = false;
                    hoverCheckbox.checked = this.autoReadOnHover;
                    clickCheckbox.checked = this.readOnClick;

                    this.enableReader();
                    if (this.autoReadOnHover) {
                        this.enableHoverReading();
                    }
                } else {
                    hoverCheckbox.disabled = true;
                    clickCheckbox.disabled = true;
                    hoverCheckbox.checked = false;
                    clickCheckbox.checked = false;
                }
            }
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.screenReader = new ScreenReaderSystem();

            // Add click listeners to all clickable elements
            document.addEventListener('click', (e) => {
                if (window.screenReader && window.screenReader.isEnabled && window.screenReader.readOnClick) {
                    window.screenReader.readElement(e.target);
                }
            });
        });
    } else {
        window.screenReader = new ScreenReaderSystem();

        document.addEventListener('click', (e) => {
            if (window.screenReader && window.screenReader.isEnabled && window.screenReader.readOnClick) {
                window.screenReader.readElement(e.target);
            }
        });
    }
})();