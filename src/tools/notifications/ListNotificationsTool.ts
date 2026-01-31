import { BaseTool } from '../base.js';
import { LIST_NOTIFICATIONS_SCRIPT } from '../../omnifocus/scripts/notifications.js';

export class ListNotificationsTool extends BaseTool {
  name = 'list_notifications';
  description = 'List all notifications on a task';

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
      const script = this.omniAutomation.buildScript(LIST_NOTIFICATIONS_SCRIPT, {
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
