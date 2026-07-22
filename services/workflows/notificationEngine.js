/**
 * YantraMitra Platform — Real-Time Notification Engine
 * Dispatches targeted operational alerts to plant operators, shift supervisors,
 * and field maintenance technicians.
 */

class NotificationEngine {
  constructor() {
    this.notifications = [];
  }

  dispatchNotification(recipientRole, title, message, meta = {}) {
    const notification = {
      notificationId: `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      recipientRole, // 'OPERATOR', 'SUPERVISOR', 'MAINTENANCE_TECH', 'EHS_OFFICER'
      title,
      message,
      meta,
      read: false,
      dispatchedAt: new Date().toISOString()
    };
    this.notifications.push(notification);
    return notification;
  }

  getNotificationsForRole(role) {
    return this.notifications.filter(n => n.recipientRole === role || role === 'ALL');
  }

  getAllNotifications() {
    return this.notifications;
  }
}

module.exports = new NotificationEngine();
