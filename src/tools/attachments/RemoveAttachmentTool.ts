import { BaseTool } from '../base.js';
import { REMOVE_ATTACHMENT_SCRIPT } from '../../omnifocus/scripts/attachments.js';

export class RemoveAttachmentTool extends BaseTool {
  name = 'remove_attachment';
  description = 'Remove an embedded attachment by index';

  inputSchema = {
    type: 'object' as const,
    properties: {
      taskId: {
        type: 'string',
        description: 'ID of the task',
      },
      index: {
        type: 'number',
        description: 'Index of the attachment to remove (from list_attachments)',
      },
    },
    required: ['taskId', 'index'],
  };

  async execute(args: any): Promise<any> {
    try {
      // Invalidate task cache
      this.cache.invalidate('tasks');

      const script = this.omniAutomation.buildScript(REMOVE_ATTACHMENT_SCRIPT, {
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
