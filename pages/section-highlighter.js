/**
 * Search Highlighter System
 * Highlights and scrolls to search terms on any page
 */

(function() {
    'use strict';

    // Get search query from URL
    function getSearchQuery() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('searchQuery') || urlParams.get('q');
    }

    // Remove highlight classes from previous searches
    function clearHighlights() {
        document.querySelectorAll('.search-highlight').forEach(el => {
            el.classList.remove('search-highlight');
            el.classList.remove('search-highlight-active');
        });
    }

    // Highlight text in element
    function highlightTextInElement(element, searchText) {
        if (!element || !searchText) return false;

        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip script, style, and already highlighted elements
                    if (node.parentElement.tagName === 'SCRIPT' || 
                        node.parentElement.tagName === 'STYLE' ||
                        node.parentElement.classList.contains('search-highlight')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        let found = false;
        const searchLower = searchText.toLowerCase();

        textNodes.forEach(textNode => {
            const text = textNode.textContent;
            const textLower = text.toLowerCase();
            const index = textLower.indexOf(searchLower);

            if (index !== -1) {
                found = true;
                
                // Split the text node
                const before = text.substring(0, index);
                const match = text.substring(index, index + searchText.length);
                const after = text.substring(index + searchText.length);

                // Create highlight span
                const highlightSpan = document.createElement('span');
                highlightSpan.className = 'search-highlight';
                highlightSpan.textContent = match;

                // Create document fragment
                const fragment = document.createDocumentFragment();
                if (before) fragment.appendChild(document.createTextNode(before));
                fragment.appendChild(highlightSpan);
                if (after) fragment.appendChild(document.createTextNode(after));

                // Replace the text node
                textNode.parentNode.replaceChild(fragment, textNode);
            }
        });

        return found;
    }

    // Find and highlight all instances of search text
    function highlightSearchTerm(searchText) {
        if (!searchText || searchText.length < 2) return;

        clearHighlights();

        const searchableElements = [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'span', 'div', 'li', 'td', 'th',
            'a', 'label', 'button'
        ];

        let highlightedElements = [];

        searchableElements.forEach(tag => {
            const elements = document.querySelectorAll(tag);
            elements.forEach(element => {
                if (highlightTextInElement(element, searchText)) {
                    highlightedElements.push(element);
                }
            });
        });

        // Find all highlighted spans
        const highlights = document.querySelectorAll('.search-highlight');
        
        if (highlights.length > 0) {
            // Mark first highlight as active
            highlights[0].classList.add('search-highlight-active');
            
            // Scroll to first highlight with smooth behavior
            setTimeout(() => {
                highlights[0].scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                // Pulse animation on the parent element
                const parentElement = highlights[0].closest('section, div.section, div.container, article, .event-item, .exhibition-item, .recommendation-card, .info-text, .stat-box');
                if (parentElement) {
                    parentElement.classList.add('search-highlight-pulse');
                    setTimeout(() => {
                        parentElement.classList.remove('search-highlight-pulse');
                    }, 2000);
                }
            }, 500);

            console.log(`✅ Highlighted ${highlights.length} instance(s) of "${searchText}"`);
            
            // Show count to user (optional)
            showHighlightCount(highlights.length, searchText);
        } else {
            console.log(`ℹ️ No instances of "${searchText}" found on this page`);
        }
    }

    // Show highlight count notification
    function showHighlightCount(count, searchText) {
        // Remove existing notification
        const existing = document.getElementById('search-highlight-notification');
        if (existing) existing.remove();

        // Create notification
        const notification = document.createElement('div');
        notification.id = 'search-highlight-notification';
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="material-icons" style="font-size: 1.2rem;">search</span>
                <span>Found ${count} match${count !== 1 ? 'es' : ''} for "<strong>${searchText}</strong>"</span>
            </div>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; padding: 0.25rem;">
                <span class="material-icons" style="font-size: 1.2rem;">close</span>
            </button>
        `;
        
        document.body.appendChild(notification);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    // Add CSS styles
    function addHighlightStyles() {
        if (document.getElementById('search-highlight-styles')) return;

        const style = document.createElement('style');
        style.id = 'search-highlight-styles';
        style.textContent = `
            .search-highlight {
                background: rgba(255, 235, 59, 0.6);
                padding: 0.1rem 0.2rem;
                border-radius: 3px;
                font-weight: 600;
                transition: all 0.3s ease;
                box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.3);
            }

            .search-highlight-active {
                background: rgba(255, 193, 7, 0.9);
                box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.5);
                animation: highlightPulse 1.5s ease-in-out;
            }

            @keyframes highlightPulse {
                0%, 100% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.05);
                }
            }

            .search-highlight-pulse {
                animation: sectionPulse 2s ease-out;
                position: relative;
            }

            @keyframes sectionPulse {
                0% {
                    box-shadow: 0 0 0 0 rgba(176, 141, 87, 0.7);
                    background-color: rgba(176, 141, 87, 0);
                }
                50% {
                    box-shadow: 0 0 0 20px rgba(176, 141, 87, 0);
                    background-color: rgba(176, 141, 87, 0.1);
                }
                100% {
                    box-shadow: 0 0 0 0 rgba(176, 141, 87, 0);
                    background-color: transparent;
                }
            }

            #search-highlight-notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: linear-gradient(135deg, #b08d57 0%, #d4b483 100%);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                animation: slideInRight 0.3s ease-out;
                font-family: 'Inter', sans-serif;
                font-size: 0.95rem;
                transition: opacity 0.3s ease;
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            #search-highlight-notification strong {
                font-weight: 700;
            }

            @media (max-width: 768px) {
                #search-highlight-notification {
                    top: 80px;
                    right: 10px;
                    left: 10px;
                    font-size: 0.85rem;
                    padding: 0.8rem 1rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize on page load
    function init() {
        // Add styles
        addHighlightStyles();

        // Wait for page to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(() => {
                    const searchQuery = getSearchQuery();
                    if (searchQuery) {
                        highlightSearchTerm(searchQuery);
                    }
                }, 300);
            });
        } else {
            setTimeout(() => {
                const searchQuery = getSearchQuery();
                if (searchQuery) {
                    highlightSearchTerm(searchQuery);
                }
            }, 300);
        }
    }

    // Run initialization
    init();

    // Expose function globally for manual use
    window.highlightSearchTerm = highlightSearchTerm;
})();