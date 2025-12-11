function getCachedData(key, maxAge = 10) { // maxAge in minutes
  const cached = localStorage.getItem(key);
  if (cached) {
    const {data, timestamp} = JSON.parse(cached);
    if (Date.now() - timestamp < maxAge * 60 * 1000) {
      return data;
    }
  }
  return null;
}

function setCachedData(key, data) {
  localStorage.setItem(key, JSON.stringify({
    data: data,
    timestamp: Date.now()
  }));
}

// When fetching data
async function loadEvents() {
  let events = getCachedData('events', 10); // Cache for 10 minutes
  
  if (!events) {
    const snapshot = await db.collection('events').get();
    events = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
    setCachedData('events', events);
  }
  
  return events;
}