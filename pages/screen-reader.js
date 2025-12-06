// ===== COMPREHENSIVE SCREEN READER ACCESSIBILITY SYSTEM =====
// This file includes both JavaScript functionality and CSS styles

// Inject CSS styles
(function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* ===== SCREEN READER ACCESSIBILITY STYLES ===== */
        
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
            background: #653025;
            color: #fdfaf4;
            border: 3px solid #b08d57;
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
            background: #8d2e1d;
        }

        .accessibility-btn.active {
            background: #b08d57;
            color: #653025;
        }

        .accessibility-menu {
            position: absolute;
            bottom: 70px;
            right: 0;
            background: #fdfaf4;
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
            color: #653025;
            margin-bottom: 1rem;
            font-size: 1.2rem;
        }

        .menu-option {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.8rem 0;
            border-bottom: 1px solid #f4f1e3;
            transition: all 0.3s ease;
        }

        .menu-option:last-child {
            border-bottom: none;
        }

        .menu-option label {
            color: #3b2f23;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }

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
            background-color: #b08d57;
        }

        input:checked+.slider:before {
            transform: translateX(24px);
        }

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
            accent-color: #b08d57;
        }

        .speed-label {
            display: flex;
            justify-content: space-between;
            font-size: 0.85rem;
            color: #7c6f57;
        }

        .sr-highlight {
            outline: 3px solid #b08d57 !important;
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
})();

// Screen Reader Class
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
        this.attachSelectListeners();
    }
    
    attachSelectListeners() {
        // Add listeners to all select elements to read options on keyboard navigation
        document.addEventListener('change', (e) => {
            if (this.isEnabled && e.target.tagName === 'SELECT') {
                const selectedOption = e.target.options[e.target.selectedIndex];
                if (selectedOption) {
                    this.speak(selectedOption.textContent.trim());
                }
            }
        });
        
        // Handle keyboard navigation in selects
        document.addEventListener('keydown', (e) => {
            if (this.isEnabled && e.target.tagName === 'SELECT') {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    setTimeout(() => {
                        const selectedOption = e.target.options[e.target.selectedIndex];
                        if (selectedOption) {
                            this.speak(selectedOption.textContent.trim());
                        }
                    }, 50);
                }
            }
        });
        
        // Handle hover over options (using mouseenter on SELECT to detect when options are hovered)
        document.addEventListener('mouseenter', (e) => {
            if (this.isEnabled && this.autoReadOnHover && e.target.tagName === 'OPTION') {
                const text = e.target.textContent.trim();
                if (text && text.length > 0 && e.target !== this.currentElement) {
                    this.speak(text);
                    this.currentElement = e.target;
                }
            }
        }, true); // Use capture phase
        
        // Also handle focus events on options
        document.addEventListener('focus', (e) => {
            if (this.isEnabled && this.autoReadOnHover && e.target.tagName === 'OPTION') {
                const text = e.target.textContent.trim();
                if (text && text.length > 0 && e.target !== this.currentElement) {
                    this.speak(text);
                    this.currentElement = e.target;
                }
            }
        }, true); // Use capture phase
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
        document.getElementById('accessibility-toggle').addEventListener('click', () => {
            const menu = document.getElementById('accessibility-menu');
            menu.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.accessibility-controls')) {
                document.getElementById('accessibility-menu').classList.remove('show');
            }
        });

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

                this.speak("Screen reader enabled. Hover over elements to hear them read aloud.");
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

        document.getElementById('auto-hover').addEventListener('change', (e) => {
            this.autoReadOnHover = e.target.checked;
            this.saveSettings();
            if (this.autoReadOnHover) {
                this.enableHoverReading();
            } else {
                this.disableHoverReading();
            }
        });

        document.getElementById('read-click').addEventListener('change', (e) => {
            this.readOnClick = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('speed-control').addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value);
            this.updateSpeedLabel();
            this.saveSettings();
        });

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
        document.addEventListener('mousemove', this.handleSelectOptions);
    }

    disableHoverReading() {
        document.removeEventListener('mouseover', this.handleHover);
        document.removeEventListener('mousemove', this.handleSelectOptions);
        clearTimeout(this.hoverTimeout);
    }
    
    handleSelectOptions = (e) => {
        if (!this.isEnabled || !this.autoReadOnHover) return;
        
        const element = e.target;
        
        // Skip material icons
        if (element.classList && element.classList.contains('material-icons')) return;
        
        if (element.tagName === 'OPTION') {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = setTimeout(() => {
                if (element !== this.currentElement) {
                    const text = element.textContent.trim();
                    if (text && text.length > 0) {
                        this.speak(text);
                        this.currentElement = element;
                    }
                }
            }, 100);
        }
    }

    handleHover = (e) => {
        if (!this.isEnabled || !this.autoReadOnHover) return;

        const element = e.target;
        
        // Skip material icons
        if (element.classList && element.classList.contains('material-icons')) return;

        clearTimeout(this.hoverTimeout);

        // Use shorter delay for dropdown options
        const delay = element.tagName === 'OPTION' ? 100 : 500;

        this.hoverTimeout = setTimeout(() => {
            if (element && element !== this.currentElement) {
                this.readElement(element);
            }
        }, delay);
    }

    readElement(element) {
        if (!this.isEnabled) return;

        if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(element.tagName)) return;
        if (element.offsetParent === null && element.tagName !== 'BODY') return;
        
        // Skip material icons
        if (element.classList && element.classList.contains('material-icons')) return;
        
        // Skip if parent is a material icon
        if (element.parentElement && element.parentElement.classList && element.parentElement.classList.contains('material-icons')) return;
        
        // Skip if element contains only a material icon as child
        const iconChild = element.querySelector('.material-icons');
        if (iconChild && element.textContent.trim() === iconChild.textContent.trim()) return;

        let textToRead = '';
        let isClickable = false;

        const hasClickHandler = element.onclick !== null ||
            element.hasAttribute('onclick') ||
            element.style.cursor === 'pointer' ||
            element.classList.contains('clickable') ||
            element.hasAttribute('role') && element.getAttribute('role') === 'button';

        // Priority 1: Aria-label
        if (element.getAttribute('aria-label')) {
            textToRead = element.getAttribute('aria-label');
            isClickable = hasClickHandler;
        } 
        // Priority 2: Title attribute
        else if (element.getAttribute('title')) {
            textToRead = element.getAttribute('title');
            isClickable = hasClickHandler;
        } 
        // Priority 3: Specific element types
        else if (element.tagName === 'IMG') {
            textToRead = element.alt || 'Image';
            isClickable = hasClickHandler;
        } 
        else if (element.tagName === 'A') {
            textToRead = `Link: ${element.textContent.trim()}`;
            isClickable = true;
        } 
        else if (element.tagName === 'BUTTON') {
            // Get text content but exclude material icons
            let buttonText = '';
            element.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    buttonText += node.textContent.trim() + ' ';
                } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('material-icons')) {
                    buttonText += node.textContent.trim() + ' ';
                }
            });
            buttonText = buttonText.trim();
            if (buttonText) {
                textToRead = `Button: ${buttonText}`;
                isClickable = true;
            } else {
                return; // Skip buttons with only icons
            }
        } 
        else if (element.tagName === 'INPUT') {
            const label = document.querySelector(`label[for="${element.id}"]`);
            const labelText = label ? label.textContent.trim() : '';
            const type = element.type || 'text';
            const value = element.value || '';
            
            if (type === 'checkbox' || type === 'radio') {
                const state = element.checked ? 'checked' : 'unchecked';
                textToRead = `${labelText || type} ${state}`;
            } else if (value) {
                textToRead = `${labelText || 'Input field'}: current value is ${value}`;
            } else {
                textToRead = `${labelText || 'Input field'}: ${element.placeholder || 'empty'}`;
            }
            isClickable = true;
        } 
        else if (element.tagName === 'TEXTAREA') {
            const label = document.querySelector(`label[for="${element.id}"]`);
            const value = element.value || '';
            textToRead = `Text area ${label ? label.textContent : ''}: ${value || element.placeholder || 'empty'}`;
            isClickable = true;
        } 
        else if (element.tagName === 'SELECT') {
            const label = document.querySelector(`label[for="${element.id}"]`);
            const selectedOption = element.options[element.selectedIndex];
            const selectedText = selectedOption ? selectedOption.text : 'nothing selected';
            textToRead = `Dropdown menu: ${label ? label.textContent.trim() + ', ' : ''}currently selected: ${selectedText}`;
            isClickable = true;
        } 
        else if (element.tagName === 'OPTION') {
            textToRead = element.textContent.trim();
            isClickable = false; // Don't add "clickable" prefix
        } 
        else if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(element.tagName)) {
            textToRead = element.textContent.trim();
            isClickable = hasClickHandler;
        } 
        else if (element.tagName === 'P') {
            textToRead = element.textContent.trim();
            isClickable = hasClickHandler;
        } 
        else if (element.tagName === 'LABEL') {
            const forElement = element.getAttribute('for');
            const associatedInput = forElement ? document.getElementById(forElement) : null;
            textToRead = `Label: ${element.textContent.trim()}`;
            if (associatedInput) {
                textToRead += `. Associated with ${associatedInput.tagName.toLowerCase()}`;
            }
            isClickable = false;
        } 
        else if (element.tagName === 'SPAN') {
            // Check if it's a counter value or price tag
            if (element.classList.contains('counter-value')) {
                textToRead = `Count: ${element.textContent.trim()}`;
            } else if (element.classList.contains('price-tag')) {
                textToRead = `Price: ${element.textContent.trim()}`;
            } else {
                textToRead = element.textContent.trim();
            }
            isClickable = hasClickHandler;
        } 
        else if (element.tagName === 'NAV') {
            textToRead = 'Navigation menu';
            isClickable = false;
        } 
        else if (element.tagName === 'FOOTER') {
            textToRead = 'Footer section';
            isClickable = false;
        } 
        else if (element.tagName === 'HEADER') {
            textToRead = 'Header section';
            isClickable = false;
        } 
        else if (element.tagName === 'SECTION') {
            const heading = element.querySelector('h1, h2, h3, h4, h5, h6');
            if (heading) {
                textToRead = `Section: ${heading.textContent.trim()}`;
            } else {
                return;
            }
            isClickable = hasClickHandler;
        } 
        // Enhanced DIV reading
        else if (element.tagName === 'DIV') {
            // Check for specific interactive components
            if (element.classList.contains('counter-group')) {
                const label = element.querySelector('.counter-label');
                const price = element.querySelector('.counter-price');
                const count = element.querySelector('.counter-value');
                if (label && count) {
                    textToRead = `${label.textContent.trim()}: ${count.textContent.trim()} selected. ${price ? price.textContent.trim() : ''}`;
                }
                isClickable = true;
            } else if (element.classList.contains('visit-type-card')) {
                const title = element.querySelector('h4');
                const price = element.querySelector('.price-tag');
                const description = element.querySelector('p:not(.price-tag)');
                textToRead = `${title ? title.textContent.trim() : 'Visit option'}. ${price ? price.textContent.trim() : ''}. ${description ? description.textContent.trim() : ''}`;
                isClickable = true;
            } else if (element.classList.contains('calendar-date')) {
                const isSelected = element.classList.contains('selected');
                const isUnavailable = element.classList.contains('unavailable');
                const dateNum = element.textContent.trim();
                if (isUnavailable) {
                    textToRead = `Date ${dateNum}: unavailable`;
                } else if (isSelected) {
                    textToRead = `Date ${dateNum}: currently selected`;
                } else {
                    textToRead = `Date ${dateNum}: available for booking`;
                }
                isClickable = !isUnavailable;
            } else if (element.classList.contains('form-group')) {
                const label = element.querySelector('.form-label');
                const input = element.querySelector('input, select, textarea');
                if (label) {
                    textToRead = `Form field: ${label.textContent.trim()}`;
                    if (input && input.tagName === 'SELECT') {
                        const selected = input.options[input.selectedIndex];
                        textToRead += `. Currently: ${selected ? selected.text : 'not selected'}`;
                    }
                }
                isClickable = false;
            } else if (element.classList.contains('summary-item')) {
                textToRead = element.textContent.trim().replace(/\s+/g, ' ');
            } else if (element.classList.contains('summary-total')) {
                textToRead = `Total amount: ${element.textContent.trim().replace(/\s+/g, ' ')}`;
            } else if (element.classList.contains('member-status-card')) {
                const greeting = element.querySelector('#member-greeting');
                const desc = element.querySelector('#member-description');
                const badge = element.querySelector('#member-badge');
                if (greeting && desc && badge) {
                    textToRead = `${greeting.textContent.trim()}. ${desc.textContent.trim()}. ${badge.textContent.trim()}`;
                }
            } else if (hasClickHandler) {
                const heading = element.querySelector('h1, h2, h3, h4, h5, h6');
                if (heading) {
                    textToRead = heading.textContent.trim();
                } else {
                    const firstText = element.textContent.trim().substring(0, 150);
                    textToRead = firstText;
                }
                isClickable = true;
            } else {
                // Read direct text content only
                const directText = Array.from(element.childNodes)
                    .filter(node => node.nodeType === Node.TEXT_NODE)
                    .map(node => node.textContent.trim())
                    .filter(text => text.length > 0)
                    .join(' ');
                
                if (directText) {
                    textToRead = directText;
                } else {
                    return;
                }
            }
        } 
        else {
            textToRead = Array.from(element.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent.trim())
                .filter(text => text.length > 0)
                .join(' ');

            isClickable = hasClickHandler;
        }

        // Clean up the text
        textToRead = textToRead.trim().replace(/\s+/g, ' ');

        // Add clickable indicator if needed
        if (isClickable && textToRead && !textToRead.toLowerCase().includes('button') && !textToRead.toLowerCase().includes('link') && !textToRead.toLowerCase().includes('clickable')) {
            textToRead = `Clickable: ${textToRead}`;
        }

        // Speak if we have meaningful text
        if (textToRead && textToRead.length > 1) {
            this.speak(textToRead);
            this.currentElement = element;
            this.highlightElement(element);
        }
    }

    highlightElement(element) {
        document.querySelectorAll('.sr-highlight').forEach(el => {
            el.classList.remove('sr-highlight');
        });

        element.classList.add('sr-highlight');
        setTimeout(() => {
            element.classList.remove('sr-highlight');
        }, 2000);
    }

    speak(text) {
        if (!text || text.trim().length === 0) return;

        this.stopSpeaking();

        if (typeof responsiveVoice !== 'undefined') {
            responsiveVoice.speak(text, "US English Female", {
                rate: this.speed,
                pitch: 1,
                volume: 1
            });
        } else {
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

// Initialize screen reader when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.screenReader = new ScreenReaderSystem();

        document.addEventListener('click', (e) => {
            // Skip material icons
            if (e.target.classList && e.target.classList.contains('material-icons')) return;
            
            if (window.screenReader && window.screenReader.isEnabled && window.screenReader.readOnClick) {
                window.screenReader.readElement(e.target);
            }
        });
    });
} else {
    window.screenReader = new ScreenReaderSystem();

    document.addEventListener('click', (e) => {
        // Skip material icons
        if (e.target.classList && e.target.classList.contains('material-icons')) return;
        
        if (window.screenReader && window.screenReader.isEnabled && window.screenReader.readOnClick) {
            window.screenReader.readElement(e.target);
        }
    });
}