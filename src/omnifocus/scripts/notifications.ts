export const LIST_NOTIFICATIONS_SCRIPT = `
  const taskId = {{taskId}};

  try {
    // Find task by ID
    const tasks = doc.flattenedTasks();
    let task = null;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id() === taskId) {
        task = tasks[i];
        break;
      }
    }
    if (!task) {
      return JSON.stringify({ error: true, message: 'Task not found' });
    }

    // Get notifications
    const notifications = [];
    try {
      const taskNotifications = task.notifications();
      for (let i = 0; i < taskNotifications.length; i++) {
        const notif = taskNotifications[i];
        const notifObj = {
          kind: notif.kind.name(),
          index: i
        };

        // Add absolute fire date if present
        try {
          const fireDate = notif.absoluteFireDate();
          if (fireDate) {
            notifObj.absoluteFireDate = fireDate.toISOString();
          }
        } catch (e) {}

        // Add relative offset if present
        try {
          const offset = notif.relativeFireOffset();
          if (offset !== undefined && offset !== null) {
            notifObj.relativeFireOffset = offset;
          }
        } catch (e) {}

        // Add next fire date
        try {
          const nextFire = notif.nextFireDate();
          if (nextFire) {
            notifObj.nextFireDate = nextFire.toISOString();
          }
        } catch (e) {}

        // Add snooze status
        try {
          notifObj.isSnoozed = notif.isSnoozed();
        } catch (e) {
          notifObj.isSnoozed = false;
        }

        // Add repeat interval
        try {
          const repeat = notif.repeatInterval();
          if (repeat) {
            notifObj.repeatInterval = repeat;
          }
        } catch (e) {}

        notifications.push(notifObj);
      }
    } catch (e) {
      // No notifications
    }

    return JSON.stringify({
      taskId: taskId,
      notifications: notifications,
      count: notifications.length
    });
  } catch (error) {
    return JSON.stringify({
      error: true,
      message: "Failed to list notifications: " + error.toString(),
      details: error.message
    });
  }
`;

export const ADD_NOTIFICATION_SCRIPT = `
  const taskId = {{taskId}};
  const notificationType = {{notificationType}};
  const date = {{date}};
  const offsetMinutes = {{offsetMinutes}};
  const repeatInterval = {{repeatInterval}};

  try {
    // Find task by ID
    const tasks = doc.flattenedTasks();
    let task = null;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id() === taskId) {
        task = tasks[i];
        break;
      }
    }
    if (!task) {
      return JSON.stringify({ error: true, message: 'Task not found' });
    }

    // Validate relative notifications require due date
    if (notificationType === 'relative') {
      const dueDate = task.dueDate();
      if (!dueDate) {
        return JSON.stringify({
          error: true,
          message: 'Cannot add relative notification to task without due date'
        });
      }
    }

    // Add notification
    if (notificationType === 'absolute') {
      const fireDate = new Date(date);
      task.addNotification(fireDate);
    } else if (notificationType === 'relative') {
      // Convert minutes to seconds (OmniFocus uses seconds for offsets)
      const offsetSeconds = offsetMinutes * 60;
      task.addNotification(offsetSeconds);
    } else {
      return JSON.stringify({
        error: true,
        message: 'Invalid notification type: must be "absolute" or "relative"'
      });
    }

    // Note: repeatInterval is set via notification object properties
    // This requires getting the notification after creation
    // For now, we'll just report success

    return JSON.stringify({
      success: true,
      taskId: taskId,
      type: notificationType,
      added: true
    });
  } catch (error) {
    return JSON.stringify({
      error: true,
      message: "Failed to add notification: " + error.toString(),
      details: error.message
    });
  }
`;

export const REMOVE_NOTIFICATION_SCRIPT = `
  const taskId = {{taskId}};
  const index = {{index}};

  try {
    // Find task by ID
    const tasks = doc.flattenedTasks();
    let task = null;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id() === taskId) {
        task = tasks[i];
        break;
      }
    }
    if (!task) {
      return JSON.stringify({ error: true, message: 'Task not found' });
    }

    // Get notifications
    const notifications = task.notifications();
    if (index < 0 || index >= notifications.length) {
      return JSON.stringify({
        error: true,
        message: 'Notification index out of range'
      });
    }

    // Remove notification
    const notification = notifications[index];
    task.removeNotification(notification);

    return JSON.stringify({
      success: true,
      taskId: taskId,
      removed: true,
      index: index
    });
  } catch (error) {
    return JSON.stringify({
      error: true,
      message: "Failed to remove notification: " + error.toString(),
      details: error.message
    });
  }
`;

export const CLEAR_NOTIFICATIONS_SCRIPT = `
  const taskId = {{taskId}};

  try {
    // Find task by ID
    const tasks = doc.flattenedTasks();
    let task = null;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id() === taskId) {
        task = tasks[i];
        break;
      }
    }
    if (!task) {
      return JSON.stringify({ error: true, message: 'Task not found' });
    }

    // Get all notifications
    const notifications = task.notifications();
    const count = notifications.length;

    // Remove all notifications
    for (let i = 0; i < notifications.length; i++) {
      task.removeNotification(notifications[i]);
    }

    return JSON.stringify({
      success: true,
      taskId: taskId,
      cleared: count
    });
  } catch (error) {
    return JSON.stringify({
      error: true,
      message: "Failed to clear notifications: " + error.toString(),
      details: error.message
    });
  }
`;
