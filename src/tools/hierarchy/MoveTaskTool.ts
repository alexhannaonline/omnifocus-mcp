import { BaseTool } from '../base.js';
import { MOVE_TASK_SCRIPT } from '../../omnifocus/scripts/hierarchy.js';

export class MoveTaskTool extends BaseTool {
  name = 'move_task';
  description = 'Move a task to a different parent (or to project root/inbox if no parent specified)';

  inputSchema = {
    type: 'object' as const,
    properties: {
      taskId: {
        type: 'string',
        description: 'ID of the task to move',
      },
      parentTaskId: {
        type: 'string',
        description: 'ID of the new parent task (omit to move to project root or inbox)',
      },
      position: {
        type: 'string',
        enum: ['beginning', 'ending'],
        description: 'Position in destination (default: ending)',
      },
    },
    required: ['taskId'],
  };

  async execute(args: any): Promise<any> {
    try {
      // Invalidate task cache on move
      this.cache.invalidate('tasks');

      const script = this.omniAutomation.buildScript(MOVE_TASK_SCRIPT, {
        taskId: args.taskId,
        parentTaskId: args.parentTaskId !== undefined ? args.parentTaskId : null,
        position: args.position || 'ending',
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
