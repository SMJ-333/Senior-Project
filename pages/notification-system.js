// notification-system.js - نظام الإشعارات المركزي
import { db } from './firebase-config.js';
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

// تعريف أنواع الإشعارات
export const NotificationType = {
    NEWS: 'news',
    EVENT_REGISTRATION: 'event_registration',
    EVENT_REMINDER: 'event_reminder',
    EVENT_UPCOMING: 'event_upcoming'
};

// إنشاء إشعار جديد
export async function createNotification(userId, type, title, message, relatedId, relatedTitle, category = null) {
    try {
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

        await addDoc(collection(db, "Notifications"), notificationData);
        console.log('✅ Notification created successfully');
        return true;
    } catch (error) {
        console.error('❌ Error creating notification:', error);
        return false;
    }
}

// إرسال إشعار خبر جديد لمستخدمين حسب اهتماماتهم
export async function sendNewsNotificationToUsers(newsId, newsTitle, newsCategory) {
    try {
        // خريطة الفئات إلى الاهتمامات
        const categoryToInterestMap = {
            'Exhibitions': ['Arab Heritage', 'Persian Heritage', 'Indian Heritage', 'Andalusian Heritage', 'Turkish Heritage', 'Echoes of Islamic Civilization'],
            'Events': ['Arab Heritage', 'Persian Heritage', 'Indian Heritage', 'Andalusian Heritage', 'Turkish Heritage'],
            'Collections': ['Manuscripts', 'Weapons', 'Boxes', 'Bottles'],
            'Research': ['Manuscripts', 'Weapons', 'Boxes', 'Bottles'],
            'Announcements': [] // للجميع
        };

        // جلب جميع المستخدمين
        const usersSnapshot = await getDocs(collection(db, "Users"));
        const targetInterests = categoryToInterestMap[newsCategory] || [];
        
        let notificationCount = 0;

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const userInterests = userData.Interests || [];
            
            // إرسال للجميع إذا كانت Announcements أو إذا كان لديه اهتمام مطابق
            const shouldSend = newsCategory === 'Announcements' || 
                             targetInterests.length === 0 ||
                             userInterests.some(interest => targetInterests.includes(interest));

            if (shouldSend) {
                await createNotification(
                    userDoc.id,
                    NotificationType.NEWS,
                    '📰 New article in your interests!',
                    `A new article has been published: "${newsTitle}" In class ${newsCategory}`,
                    newsId,
                    newsTitle,
                    newsCategory
                );
                notificationCount++;
            }
        }

        console.log(`✅ Sent ${notificationCount} news notifications`);
        return notificationCount;
    } catch (error) {
        console.error('❌ Error sending news notifications:', error);
        return 0;
    }
}

// إرسال إشعار تسجيل في حدث
export async function sendEventRegistrationNotification(userId, eventId, eventTitle) {
    try {
        await createNotification(
            userId,
            NotificationType.EVENT_REGISTRATION,
            '✅   Registration completed successfully!',
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

// إرسال إشعار تذكير بحدث قادم
export async function sendEventReminderNotification(userId, eventId, eventTitle, eventDate) {
    try {
        const dateStr = eventDate.toDate().toLocaleDateString('ar-SA', { 
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
            `The event "${eventTitle}" start on  ${dateStr}. Don't forget to attend!`,
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

// إرسال إشعار "Notify Me" للحدث القادم
export async function sendUpcomingEventNotification(userId, eventId, eventTitle) {
    try {
        await createNotification(
            userId,
            NotificationType.EVENT_UPCOMING,
            '🎉 The event you requested to be notified about has become available!',
            `The event "${eventTitle}" is now available, hurry up and register!`,
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

// جلب إشعارات المستخدم
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

// الاستماع للإشعارات الجديدة
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

// تحديد إشعار كمقروء
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

// تحديد جميع الإشعارات كمقروءة
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

// حساب عدد الإشعارات غير المقروءة
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

// حفظ طلب "Notify Me" في localStorage
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

        // تجنب التكرار
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

// التحقق من الأحداث القادمة وإرسال الإشعارات
export async function checkUpcomingEventsAndNotify() {
    try {
        const requests = JSON.parse(localStorage.getItem('notifyMeRequests') || '[]');
        const now = new Date();

        for (const request of requests) {
            const eventDate = new Date(request.eventDate);
            const dayBeforeEvent = new Date(eventDate);
            dayBeforeEvent.setDate(dayBeforeEvent.getDate() - 1);

            // إرسال إشعار قبل يوم من الحدث
            if (now >= dayBeforeEvent && now < eventDate) {
                await sendEventReminderNotification(
                    request.userId,
                    request.eventId,
                    request.eventTitle,
                    eventDate
                );

                // حذف الطلب بعد الإرسال
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

// تشغيل فحص دوري للأحداث القادمة (يتم استدعاؤه عند تحميل الصفحة)
export function startNotificationScheduler() {
    // فحص فوري
    checkUpcomingEventsAndNotify();

    // فحص كل ساعة
    setInterval(checkUpcomingEventsAndNotify, 60 * 60 * 1000);
}