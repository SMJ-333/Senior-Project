// notification-system.js - Central Notification System with Badge Support
import { db, auth } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs, 
    updateDoc, 
    doc, 
    Timestamp,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Notification Types
export const NotificationType = {
    NEWS: 'news',
    EVENT_REGISTRATION: 'event_registration',
    EVENT_REMINDER: 'event_reminder',
    EVENT_UPCOMING: 'event_upcoming',
    BOOKING_CONFIRMATION: 'booking_confirmation'
};

let notificationsUnsubscribe = null;
let currentUserId = null;

// ==================== NOTIFICATION BADGE FUNCTIONS ====================

// Create and add notification badge to account icon
export function initializeNotificationBadge() {
    const accountIcon = document.querySelector('.account-icon');
    
    if (!accountIcon) {
        console.warn('⚠️ Account icon not found on this page');
        return null;
    }

    let badge = accountIcon.querySelector('.notification-badge');
    
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'notification-badge';
        badge.id = 'notificationBadge';
        badge.style.cssText = `
            position: absolute;
            top: -5px;
            right: -5px;
            background: #e74c3c;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 0.7rem;
            font-weight: 600;
            border: 2px solid #fdfaf4;
            z-index: 10;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        accountIcon.style.position = 'relative';
        accountIcon.appendChild(badge);
        console.log('✅ Notification badge initialized');
    }
    
    return badge;
}

// Listen to user's notifications and update badge
export function listenToNotificationCount(userId) {
    if (notificationsUnsubscribe) {
        notificationsUnsubscribe();
    }

    let retryCount = 0;
    const maxRetries = 5;
    
    const tryInitialize = () => {
        const badge = initializeNotificationBadge();
        
        if (!badge && retryCount < maxRetries) {
            retryCount++;
            console.log(`⏳ Retrying badge initialization (${retryCount}/${maxRetries})...`);
            setTimeout(tryInitialize, 500);
            return;
        }
        
        if (!badge) {
            console.error('❌ Failed to initialize notification badge after retries');
            return;
        }

        const notificationsRef = collection(db, 'Notifications');
        const q = query(
            notificationsRef,
            where('userId', '==', userId),
            where('isRead', '==', false)
        );

        notificationsUnsubscribe = onSnapshot(q, (snapshot) => {
            const unreadCount = snapshot.size;
            
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'flex';
                console.log(`🔔 ${unreadCount} unread notifications`);
            } else {
                badge.style.display = 'none';
            }
        }, (error) => {
            console.error('❌ Error listening to notifications:', error);
            badge.style.display = 'none';
        });
    };

    tryInitialize();
}

// ==================== NOTIFICATION CREATION FUNCTIONS ====================

// Create new notification
export async function createNotification(userId, type, title, message, relatedId, relatedTitle, category = null) {
    try {
        console.log('📝 Creating notification for user:', userId);
        console.log('   Type:', type);
        console.log('   Title:', title);
        console.log('   Category:', category);
        
        const notificationData = {
            userId: userId,
            type: type,
            title: title,
            message: message,
            relatedId: relatedId,
            relatedTitle: relatedTitle,
            isRead: false,
            createdAt: Timestamp.now()
        };

        if (category) {
            notificationData.category = category;
        }

        const docRef = await addDoc(collection(db, "Notifications"), notificationData);
        console.log('✅ Notification created successfully with ID:', docRef.id);
        return true;
    } catch (error) {
        console.error('❌ Error creating notification:', error);
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
        return false;
    }
}

// Send news notification to users based on interests
export async function sendNewsNotificationToUsers(newsId, newsTitle, newsCategory) {
    try {
        console.log('📰 Starting to send news notifications...');
        console.log('   News ID:', newsId);
        console.log('   News Title:', newsTitle);
        console.log('   News Category:', newsCategory);
        
        const categoryToInterestMap = {
            'Exhibitions': ['Arab Heritage', 'Persian Heritage', 'Indian Heritage', 'Andalusian Heritage', 'Turkish Heritage', 'Echoes of Islamic Civilization'],
            'Events': ['Arab Heritage', 'Persian Heritage', 'Indian Heritage', 'Andalusian Heritage', 'Turkish Heritage'],
            'Collections': ['Manuscripts', 'Weapons', 'Boxes', 'Bottles'],
            'Research': ['Manuscripts', 'Weapons', 'Boxes', 'Bottles'],
            'Announcements': []
        };

        console.log('🔍 Fetching all users from database...');
        const usersSnapshot = await getDocs(collection(db, "Users"));
        console.log(`👥 Found ${usersSnapshot.size} users in database`);
        
        const targetInterests = categoryToInterestMap[newsCategory] || [];
        console.log('🎯 Target interests for category:', targetInterests);
        
        let notificationCount = 0;
        let successCount = 0;
        let errorCount = 0;

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const userInterests = userData.Interests || [];
            
            const shouldSend = newsCategory === 'Announcements' || 
                             targetInterests.length === 0 ||
                             userInterests.some(interest => targetInterests.includes(interest));

            if (shouldSend) {
                notificationCount++;
                console.log(`📨 Sending notification ${notificationCount} to user:`, userDoc.id);
                
                // Customize title and message based on category
                let notificationTitle;
                let notificationMessage;
                
                if (newsCategory === 'Announcements') {
                    notificationTitle = '📢 New Announcement';
                    notificationMessage = `Important announcement: "${newsTitle}". Check it out now!`;
                } else {
                    notificationTitle = '📰 New Article in Your Interests!';
                    notificationMessage = `A new article has been published: "${newsTitle}" in ${newsCategory}. Don't miss it!`;
                }
                
                const success = await createNotification(
                    userDoc.id,
                    NotificationType.NEWS,
                    notificationTitle,
                    notificationMessage,
                    newsId,
                    newsTitle,
                    newsCategory
                );
                
                if (success) {
                    successCount++;
                } else {
                    errorCount++;
                    console.error(`❌ Failed to create notification for user: ${userDoc.id}`);
                }
            }
        }

        console.log('📊 Notification Summary:');
        console.log(`   Total users checked: ${usersSnapshot.size}`);
        console.log(`   Notifications attempted: ${notificationCount}`);
        console.log(`   Successfully created: ${successCount}`);
        console.log(`   Failed: ${errorCount}`);
        
        return successCount;
    } catch (error) {
        console.error('❌ Fatal error in sendNewsNotificationToUsers:', error);
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
        console.error('   Full error:', error);
        return 0;
    }
}

// Send event registration notification
export async function sendEventRegistrationNotification(userId, eventId, eventTitle) {
    try {
        await createNotification(
            userId,
            NotificationType.EVENT_REGISTRATION,
            '✅ Registration completed successfully!',
            `You are registered for the event: "${eventTitle}". Check your email for more details.`,
            eventId,
            eventTitle
        );
        console.log('✅ Event registration notification sent');
        return true;
    } catch (error) {
        console.error('❌ Error sending event registration notification:', error);
        return false;
    }
}

// Send event reminder notification
export async function sendEventReminderNotification(userId, eventId, eventTitle, eventDate) {
    try {
        const dateStr = eventDate.toDate().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        await createNotification(
            userId,
            NotificationType.EVENT_REMINDER,
            '🔔 Reminder: Upcoming Event!',
            `The event "${eventTitle}" starts on ${dateStr}. Don't forget to attend!`,
            eventId,
            eventTitle
        );
        console.log('✅ Event reminder notification sent');
        return true;
    } catch (error) {
        console.error('❌ Error sending event reminder:', error);
        return false;
    }
}

// Send "Notify Me" upcoming event notification
export async function sendUpcomingEventNotification(userId, eventId, eventTitle) {
    try {
        await createNotification(
            userId,
            NotificationType.EVENT_UPCOMING,
            '🎉 The event you requested is now available!',
            `The event "${eventTitle}" is now available. Hurry up and register!`,
            eventId,
            eventTitle
        );
        console.log('✅ Upcoming event notification sent');
        return true;
    } catch (error) {
        console.error('❌ Error sending upcoming event notification:', error);
        return false;
    }
}

// Send booking confirmation notification
export async function sendBookingConfirmationNotification(userId, bookingDetails) {
    try {
        const message = `Your ${bookingDetails.visitInfo} booking is confirmed for ${bookingDetails.date} at ${bookingDetails.time}. Total visitors: ${bookingDetails.totalVisitors}. Amount paid: $${bookingDetails.total}`;
        
        const notificationData = {
            userId: userId,
            type: NotificationType.BOOKING_CONFIRMATION,
            title: '🎫 Booking Confirmed',
            message: message,
            relatedId: bookingDetails.bookingId,
            relatedTitle: bookingDetails.visitInfo,
            bookingDetails: {
                bookingId: bookingDetails.bookingId,
                visitInfo: bookingDetails.visitInfo,
                date: bookingDetails.date,
                time: bookingDetails.time,
                totalVisitors: bookingDetails.totalVisitors,
                adults: bookingDetails.adults || 0,
                children: bookingDetails.children || 0,
                seniors: bookingDetails.seniors || 0,
                total: bookingDetails.total,
                paymentMethod: bookingDetails.paymentMethod
            },
            isRead: false,
            createdAt: Timestamp.now()
        };

        await addDoc(collection(db, "Notifications"), notificationData);
        console.log('✅ Booking confirmation notification sent');
        return true;
    } catch (error) {
        console.error('❌ Error sending booking confirmation:', error);
        return false;
    }
}

// ==================== NOTIFICATION MANAGEMENT FUNCTIONS ====================

// Get user notifications
export async function getUserNotifications(userId) {
    try {
        const q = query(
            collection(db, "Notifications"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        const notifications = [];

        snapshot.forEach((doc) => {
            notifications.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return notifications;
    } catch (error) {
        console.error('❌ Error getting notifications:', error);
        return [];
    }
}

// Listen to notifications (real-time)
export function listenToNotifications(userId, callback) {
    try {
        const q = query(
            collection(db, "Notifications"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );

        return onSnapshot(q, (snapshot) => {
            const notifications = [];
            snapshot.forEach((doc) => {
                notifications.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            callback(notifications);
        });
    } catch (error) {
        console.error('❌ Error listening to notifications:', error);
        return null;
    }
}

// Mark notification as read
export async function markAsRead(notificationId) {
    try {
        await updateDoc(doc(db, "Notifications", notificationId), {
            isRead: true
        });
        console.log('✅ Notification marked as read');
        return true;
    } catch (error) {
        console.error('❌ Error marking notification as read:', error);
        return false;
    }
}

// Mark all notifications as read
export async function markAllAsRead(userId) {
    try {
        const q = query(
            collection(db, "Notifications"),
            where("userId", "==", userId),
            where("isRead", "==", false)
        );

        const snapshot = await getDocs(q);
        const updatePromises = [];

        snapshot.forEach((doc) => {
            updatePromises.push(
                updateDoc(doc.ref, { isRead: true })
            );
        });

        await Promise.all(updatePromises);
        console.log('✅ All notifications marked as read');
        return true;
    } catch (error) {
        console.error('❌ Error marking all as read:', error);
        return false;
    }
}

// Get unread notification count
export async function getUnreadCount(userId) {
    try {
        const q = query(
            collection(db, "Notifications"),
            where("userId", "==", userId),
            where("isRead", "==", false)
        );

        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error('❌ Error getting unread count:', error);
        return 0;
    }
}

// ==================== EVENT NOTIFICATION SCHEDULER ====================

// Save "Notify Me" request
export function saveNotifyMeRequest(userId, eventId, eventTitle, eventDate) {
    try {
        const requests = JSON.parse(localStorage.getItem('notifyMeRequests') || '[]');
        
        const newRequest = {
            userId: userId,
            eventId: eventId,
            eventTitle: eventTitle,
            eventDate: eventDate.toISOString(),
            requestedAt: new Date().toISOString()
        };

        const exists = requests.some(req => 
            req.userId === userId && req.eventId === eventId
        );

        if (!exists) {
            requests.push(newRequest);
            localStorage.setItem('notifyMeRequests', JSON.stringify(requests));
            console.log('✅ Notify Me request saved');
        }

        return true;
    } catch (error) {
        console.error('❌ Error saving Notify Me request:', error);
        return false;
    }
}

// Check upcoming events and send notifications
export async function checkUpcomingEventsAndNotify() {
    try {
        const requests = JSON.parse(localStorage.getItem('notifyMeRequests') || '[]');
        const now = new Date();

        for (const request of requests) {
            const eventDate = new Date(request.eventDate);
            const dayBeforeEvent = new Date(eventDate);
            dayBeforeEvent.setDate(dayBeforeEvent.getDate() - 1);

            if (now >= dayBeforeEvent && now < eventDate) {
                await sendEventReminderNotification(
                    request.userId,
                    request.eventId,
                    request.eventTitle,
                    eventDate
                );

                const updatedRequests = requests.filter(req => 
                    !(req.userId === request.userId && req.eventId === request.eventId)
                );
                localStorage.setItem('notifyMeRequests', JSON.stringify(updatedRequests));
            }
        }
    } catch (error) {
        console.error('❌ Error checking upcoming events:', error);
    }
}

// Start notification scheduler
export function startNotificationScheduler() {
    checkUpcomingEventsAndNotify();
    setInterval(checkUpcomingEventsAndNotify, 60 * 60 * 1000);
}

// ==================== AUTO-INITIALIZATION ====================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
} else {
    initializeSystem();
}

function initializeSystem() {
    console.log('📦 Notification system initializing...');
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('👤 User logged in:', user.email);
            currentUserId = user.uid;
            listenToNotificationCount(user.uid);
        } else {
            console.log('👤 No user logged in');
            currentUserId = null;
            const badge = document.getElementById('notificationBadge');
            if (badge) {
                badge.style.display = 'none';
            }
            
            if (notificationsUnsubscribe) {
                notificationsUnsubscribe();
                notificationsUnsubscribe = null;
            }
        }
    });

    window.addEventListener('beforeunload', () => {
        if (notificationsUnsubscribe) {
            notificationsUnsubscribe();
        }
    });
}

console.log('📦 Notification system module loaded');