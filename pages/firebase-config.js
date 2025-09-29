// firebase-config.js - Central Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBQtJl-1lI6HmPUnN6UKbADMvdUA9RXYpo",
    authDomain: "museum-management-4244e.firebaseapp.com",
    projectId: "museum-management-4244e",
    storageBucket: "museum-management-4244e.appspot.com",
    messagingSenderId: "86285806144",
    appId: "1:86285806144:web:f761e4f0c3577ac063cda5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Export the app instance if needed
export default app;