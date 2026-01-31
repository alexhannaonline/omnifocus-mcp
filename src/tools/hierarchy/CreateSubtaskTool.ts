import { BaseTool } from '../base.js';
import { CREATE_SUBTASK_SCRIPT } from '../../omnifocus/scripts/hierarchy.js';

export class CreateSubtaskTool extends BaseTool {
  name = 'create_subtask';
  description = 'Create a task as a child of an existing task';

  inputSchema = {
    type: 'object' as const,
    properties: {
      parentTaskId: {
        type: 'string',
        description: 'ID of the parent task',
      },
      name: {
        type: 'string',
        description: 'Name of the subtask',
      },
      note: {
        type: 'string',
        description: 'Task note/description',
      },
      flagged: {
        type: 'boolean',
        description: 'Whether task is flagged',
      },
      dueDate: {
        type: 'string',
        format: 'date-time',
        description: 'Due date for the task',
      },
      deferDate: {
        type: 'string',
        format: 'date-time',
        description: 'Defer date for the task',
      },
      estimatedMinutes: {
        type: 'number',
        description: 'Estimated time in minutes',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags to apply to the task',
      },
      position: {
        type: 'string',
        enum: ['beginning', 'ending'],
        description: 'Position in parent\'s task list (default: ending)',
      },
    },
    required: ['parentTaskId', 'name'],
  };

  async execute(args: any): Promise<any> {
    try {
      // Invalidate task cache on create
      this.cache.invalidate('tasks');

      const taskData = {
        name: args.name,
        note: args.note,
        flagged: args.flagged,
        dueDate: args.dueDate,
        deferDate: args.deferDate,
        estimatedMinutes: args.estimatedMinutes,
        tags: args.tags,
        position: args.position || 'ending',
      };

      const script = this.omniAutomation.buildScript(CREATE_SUBTASK_SCRIPT, {
        parentTaskId: args.parentTaskId,
        taskData: taskData,
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
