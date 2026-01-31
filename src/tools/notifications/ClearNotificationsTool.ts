import { BaseTool } from '../base.js';
import { CLEAR_NOTIFICATIONS_SCRIPT } from '../../omnifocus/scripts/notifications.js';

export class ClearNotificationsTool extends BaseTool {
  name = 'clear_notifications';
  description = 'Remove all notifications from a task';

  inputSchema = {
    type: 'object' as const,
    properties: {
      taskId: {
        type: 'string',
        description: 'ID of the task',
      },
    },
    required: ['taskId'],
  };

  async execute(args: any): Promise<any> {
    try {
      // Invalidate task cache
      this.cache.invalidate('tasks');

      const script = this.omniAutomation.buildScript(CLEAR_NOTIFICATIONS_SCRIPT, {
        taskId: args.taskId,
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
