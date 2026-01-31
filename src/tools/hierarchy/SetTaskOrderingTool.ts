import { BaseTool } from '../base.js';
import { SET_TASK_ORDERING_SCRIPT } from '../../omnifocus/scripts/hierarchy.js';

export class SetTaskOrderingTool extends BaseTool {
  name = 'set_task_ordering';
  description = 'Set sequential/parallel and completedByChildren properties on a task';

  inputSchema = {
    type: 'object' as const,
    properties: {
      taskId: {
        type: 'string',
        description: 'ID of the task',
      },
      sequential: {
        type: 'boolean',
        description: 'Whether children are sequential (true) or parallel (false)',
      },
      completedByChildren: {
        type: 'boolean',
        description: 'Whether task is auto-completed when all children are done',
      },
    },
    required: ['taskId'],
  };

  async execute(args: any): Promise<any> {
    try {
      // Invalidate task cache on update
      this.cache.invalidate('tasks');

      const script = this.omniAutomation.buildScript(SET_TASK_ORDERING_SCRIPT, {
        taskId: args.taskId,
        sequential: args.sequential,
        completedByChildren: args.completedByChildren,
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
