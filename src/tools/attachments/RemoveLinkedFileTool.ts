import { BaseTool } from '../base.js';
import { REMOVE_LINKED_FILE_SCRIPT } from '../../omnifocus/scripts/attachments.js';

export class RemoveLinkedFileTool extends BaseTool {
  name = 'remove_linked_file';
  description = 'Unlink a file reference from a task';

  inputSchema = {
    type: 'object' as const,
    properties: {
      taskId: {
        type: 'string',
        description: 'ID of the task',
      },
      url: {
        type: 'string',
        description: 'URL of the linked file to remove (from list_attachments)',
      },
    },
    required: ['taskId', 'url'],
  };

  async execute(args: any): Promise<any> {
    try {
      // Invalidate task cache
      this.cache.invalidate('tasks');

      const script = this.omniAutomation.buildScript(REMOVE_LINKED_FILE_SCRIPT, {
        taskId: args.taskId,
        urlString: args.url,
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
