import { BaseTool } from '../base.js';
import { ADD_LINKED_FILE_SCRIPT } from '../../omnifocus/scripts/attachments.js';

export class AddLinkedFileTool extends BaseTool {
  name = 'add_linked_file';
  description = 'Link an external file to a task by path or URL';

  inputSchema = {
    type: 'object' as const,
    properties: {
      taskId: {
        type: 'string',
        description: 'ID of the task',
      },
      path: {
        type: 'string',
        description: 'File path or URL to link (e.g., file:///path/to/file or https://example.com)',
      },
    },
    required: ['taskId', 'path'],
  };

  async execute(args: any): Promise<any> {
    try {
      // Invalidate task cache
      this.cache.invalidate('tasks');

      const script = this.omniAutomation.buildScript(ADD_LINKED_FILE_SCRIPT, {
        taskId: args.taskId,
        path: args.path,
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
