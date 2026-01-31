import { BaseTool } from '../base.js';
import { REMOVE_NOTIFICATION_SCRIPT } from '../../omnifocus/scripts/notifications.js';

export class RemoveNotificationTool extends BaseTool {
  name = 'remove_notification';
  description = 'Remove a specific notification from a task by index';

  inputSchema = {
    type: 'object' as const,
    properties: {
      taskId: {
        type: 'string',
        description: 'ID of the task',
      },
      index: {
        type: 'number',
        description: 'Index of the notification to remove (from list_notifications)',
      },
    },
    required: ['taskId', 'index'],
  };

  async execute(args: any): Promise<any> {
    try {
      // Invalidate task cache
      this.cache.invalidate('tasks');

      const script = this.omniAutomation.buildScript(REMOVE_NOTIFICATION_SCRIPT, {
        taskId: args.taskId,
        index: args.index,
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
