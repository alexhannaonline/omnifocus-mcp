import { BaseTool } from '../base.js';
import { ADD_NOTIFICATION_SCRIPT } from '../../omnifocus/scripts/notifications.js';

export class AddNotificationTool extends BaseTool {
  name = 'add_notification';
  description = 'Add a notification to a task (absolute date or relative to due date)';

  inputSchema = {
    type: 'object' as const,
    properties: {
      taskId: {
        type: 'string',
        description: 'ID of the task',
      },
      type: {
        type: 'string',
        enum: ['absolute', 'relative'],
        description: 'Type of notification: absolute (specific date) or relative (offset from due date)',
      },
      date: {
        type: 'string',
        format: 'date-time',
        description: 'Fire date for absolute notifications (ISO string)',
      },
      offsetMinutes: {
        type: 'number',
        description: 'Offset in minutes from due date for relative notifications (negative = before, positive = after)',
      },
      repeatInterval: {
        type: 'number',
        description: 'Repeat interval in seconds (0 = no repeat)',
      },
    },
    required: ['taskId', 'type'],
  };

  async execute(args: any): Promise<any> {
    try {
      // Invalidate task cache
      this.cache.invalidate('tasks');

      const script = this.omniAutomation.buildScript(ADD_NOTIFICATION_SCRIPT, {
        taskId: args.taskId,
        notificationType: args.type,
        date: args.date !== undefined ? args.date : null,
        offsetMinutes: args.offsetMinutes !== undefined ? args.offsetMinutes : null,
        repeatInterval: args.repeatInterval !== undefined ? args.repeatInterval : null,
      });
      const result = await this.omniAutomation.execute(script);

      if (result.error) {
        return result;
      }

      return typeof result === 'string' ? JSON.parse(result) : result;
    } catch (error) {
      return this.handleError(error);
    }
  }
}
