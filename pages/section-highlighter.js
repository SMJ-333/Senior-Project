// This script handles highlighting sections when navigated from search

document.addEventListener('DOMContentLoaded', function() {
    // Check if there's a hash in the URL (for direct links with #section)
    const hash = window.location.hash.substring(1);
    const sectionFromStorage = sessionStorage.getItem('highlightSection');
    
    // Use storage value or URL hash
    const sectionToHighlight = sectionFromStorage || hash;
    
    if (sectionToHighlight) {
        // Clear the storage if it was used
        if (sectionFromStorage) {
            sessionStorage.removeItem('highlightSection');
        }
        
        // Wait for page to fully render
        setTimeout(() => {
            const targetElement = document.getElementById(sectionToHighlight);
            
            if (targetElement) {
                // Scroll to the element with smooth behavior
                targetElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
                
                // Add highlight class
                targetElement.classList.add('highlight-section');
                
                // Remove highlight after animation completes
                setTimeout(() => {
                    targetElement.classList.remove('highlight-section');
                }, 2000);
            }
        }, 500);
    }
});

// Add CSS for highlight animation if not already present
if (!document.getElementById('highlight-styles')) {
    const style = document.createElement('style');
    style.id = 'highlight-styles';
    style.textContent = `
        @keyframes highlightPulse {
            0% {
                box-shadow: 0 0 0 0 rgba(176, 141, 87, 0.7);
                background-color: rgba(176, 141, 87, 0.1);
            }
            50% {
                box-shadow: 0 0 0 20px rgba(176, 141, 87, 0);
                background-color: rgba(176, 141, 87, 0.2);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(176, 141, 87, 0);
                background-color: transparent;
            }
        }

        .highlight-section {
            animation: highlightPulse 2s ease-out;
            border: 2px solid var(--accent) !important;
            border-radius: 12px;
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}