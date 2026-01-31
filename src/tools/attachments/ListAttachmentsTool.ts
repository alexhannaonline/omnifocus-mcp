import { BaseTool } from '../base.js';
import { LIST_ATTACHMENTS_SCRIPT } from '../../omnifocus/scripts/attachments.js';

export class ListAttachmentsTool extends BaseTool {
  name = 'list_attachments';
  description = 'List attachment metadata on a task (embedded attachments and linked files)';

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
      const script = this.omniAutomation.buildScript(LIST_ATTACHMENTS_SCRIPT, {
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
