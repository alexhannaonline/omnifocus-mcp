import { BaseTool } from '../base.js';
import { LIST_SUBTASKS_SCRIPT } from '../../omnifocus/scripts/hierarchy.js';

export class ListSubtasksTool extends BaseTool {
  name = 'list_subtasks';
  description = 'List direct children of a task (shallow, for large trees)';

  inputSchema = {
    type: 'object' as const,
    properties: {
      taskId: {
        type: 'string',
        description: 'ID of the parent task',
      },
    },
    required: ['taskId'],
  };

  async execute(args: any): Promise<any> {
    try {
      const script = this.omniAutomation.buildScript(LIST_SUBTASKS_SCRIPT, {
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
