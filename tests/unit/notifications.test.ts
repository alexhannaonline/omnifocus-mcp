import { describe, it, expect } from 'vitest';
import {
  LIST_NOTIFICATIONS_SCRIPT,
  ADD_NOTIFICATION_SCRIPT,
  REMOVE_NOTIFICATION_SCRIPT,
  CLEAR_NOTIFICATIONS_SCRIPT,
} from '../../src/omnifocus/scripts/notifications';

describe('Notification Scripts', () => {
  it('should return JSON stringified results', () => {
    const returnPattern = /return JSON\.stringify\(/g;

    expect(LIST_NOTIFICATIONS_SCRIPT.match(returnPattern)).not.toBeNull();
    expect(ADD_NOTIFICATION_SCRIPT.match(returnPattern)).not.toBeNull();
    expect(REMOVE_NOTIFICATION_SCRIPT.match(returnPattern)).not.toBeNull();
    expect(CLEAR_NOTIFICATIONS_SCRIPT.match(returnPattern)).not.toBeNull();
  });

  it('should use correct method calls with parentheses', () => {
    expect(LIST_NOTIFICATIONS_SCRIPT).toContain('task.notifications()');
    expect(LIST_NOTIFICATIONS_SCRIPT).toContain('notif.kind.name()');
    expect(LIST_NOTIFICATIONS_SCRIPT).toContain('notif.absoluteFireDate()');
    expect(LIST_NOTIFICATIONS_SCRIPT).toContain('notif.relativeFireOffset()');
    expect(LIST_NOTIFICATIONS_SCRIPT).toContain('notif.nextFireDate()');
    expect(LIST_NOTIFICATIONS_SCRIPT).toContain('notif.isSnoozed()');

    expect(CLEAR_NOTIFICATIONS_SCRIPT).toContain('task.notifications()');
  });

  it('should use addNotification for adding notifications', () => {
    expect(ADD_NOTIFICATION_SCRIPT).toContain('task.addNotification(fireDate)');
    expect(ADD_NOTIFICATION_SCRIPT).toContain('task.addNotification(offsetSeconds)');
  });

  it('should validate relative notifications require due date', () => {
    expect(ADD_NOTIFICATION_SCRIPT).toContain('task.dueDate()');
    expect(ADD_NOTIFICATION_SCRIPT).toContain('Cannot add relative notification to task without due date');
  });

  it('should use removeNotification for removing', () => {
    expect(REMOVE_NOTIFICATION_SCRIPT).toContain('task.removeNotification(notification)');
    expect(CLEAR_NOTIFICATIONS_SCRIPT).toContain('task.removeNotification(notifications[i])');
  });

  it('should include placeholders for parameters', () => {
    expect(LIST_NOTIFICATIONS_SCRIPT).toContain('{{taskId}}');

    expect(ADD_NOTIFICATION_SCRIPT).toContain('{{taskId}}');
    expect(ADD_NOTIFICATION_SCRIPT).toContain('{{notificationType}}');
    expect(ADD_NOTIFICATION_SCRIPT).toContain('{{date}}');
    expect(ADD_NOTIFICATION_SCRIPT).toContain('{{offsetMinutes}}');

    expect(REMOVE_NOTIFICATION_SCRIPT).toContain('{{taskId}}');
    expect(REMOVE_NOTIFICATION_SCRIPT).toContain('{{index}}');

    expect(CLEAR_NOTIFICATIONS_SCRIPT).toContain('{{taskId}}');
  });

  it('should handle notification types', () => {
    expect(ADD_NOTIFICATION_SCRIPT).toContain('notificationType === \'absolute\'');
    expect(ADD_NOTIFICATION_SCRIPT).toContain('notificationType === \'relative\'');
  });
});
