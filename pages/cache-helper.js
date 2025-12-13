import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Add caching
const CACHE_KEY = 'exhibitions_data';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function loadExhibitions() {
    try {
        // Try to get from cache first
        const cachedData = getCachedData(CACHE_KEY);
        if (cachedData) {
            console.log('✅ Using cached exhibitions data');
            displayExhibitions(cachedData);
            loading.style.display = 'none';
            return;
        }

        console.log('📡 Fetching from Firebase...');
        const querySnapshot = await getDocs(collection(db, "Museum_Collection"));

        const exhibitionCounts = {};
        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            const exhibition = data.Exhibition ? data.Exhibition.trim() : 'Others';
            if (!exhibitionCounts[exhibition]) {
                exhibitionCounts[exhibition] = 0;
            }
            exhibitionCounts[exhibition]++;
        });

        // Cache the results
        setCachedData(CACHE_KEY, exhibitionCounts, CACHE_DURATION);

        displayExhibitions(exhibitionCounts);
        loading.style.display = 'none';

    } catch (error) {
        console.error('Error loading exhibitions:', error);
        showError(`Failed to load exhibitions: ${error.message}`);
    }
}

function displayExhibitions(exhibitionCounts) {
    Object.keys(exhibitionsData).forEach((exhibitionName) => {
        const count = exhibitionCounts[exhibitionName] || 0;
        const data = exhibitionsData[exhibitionName];

        const card = document.createElement('div');
        card.className = 'exhibition-card';
        card.onclick = () => viewExhibition(exhibitionName);

        const colorClass = data.color || 'color-default';

        card.innerHTML = `
            <div class="exhibition-image ${colorClass}">
                <div class="exhibition-icon">${data.icon || '🎨'}</div>
                <div class="exhibition-badge">${count} Artifact${count !== 1 ? 's' : ''}</div>
            </div>
            
            <div class="exhibition-info">
                <h3 class="exhibition-title">${getExhibitionHTML(exhibitionName)}</h3>
                <p class="exhibition-count">${count} item${count !== 1 ? 's' : ''} in collection</p>
                <p class="exhibition-description">${data.description || 'Explore this unique collection.'}</p>
            </div>
        `;

        exhibitionsGrid.appendChild(card);
    });
}

// Helper functions for caching
function getCachedData(key) {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();

        if (now - timestamp < CACHE_DURATION) {
            return data;
        }

        // Cache expired
        localStorage.removeItem(key);
        return null;
    } catch (error) {
        console.error('Cache read error:', error);
        return null;
    }
}

function setCachedData(key, data, duration) {
    try {
        const cacheObject = {
            data: data,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(cacheObject));
    } catch (error) {
        console.error('Cache write error:', error);
    }
}