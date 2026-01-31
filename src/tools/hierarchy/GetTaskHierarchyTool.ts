import { BaseTool } from '../base.js';
import { GET_TASK_HIERARCHY_SCRIPT } from '../../omnifocus/scripts/hierarchy.js';

export class GetTaskHierarchyTool extends BaseTool {
  name = 'get_task_hierarchy';
  description = 'Get a task with its full subtask tree (configurable depth)';

  inputSchema = {
    type: 'object' as const,
    properties: {
      taskId: {
        type: 'string',
        description: 'Task ID to get hierarchy for',
      },
      depth: {
        type: 'number',
        description: 'Maximum depth to traverse (omit for unlimited)',
      },
    },
    required: ['taskId'],
  };

  async execute(args: any): Promise<any> {
    try {
      const maxDepth = args.depth !== undefined ? args.depth : null;
      const script = this.omniAutomation.buildScript(GET_TASK_HIERARCHY_SCRIPT, {
        taskId: args.taskId,
        maxDepth: maxDepth,
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
