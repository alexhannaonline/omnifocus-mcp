import { BaseTool } from '../base.js';
import { DELETE_TASK_SCRIPT } from '../../omnifocus/scripts/tasks.js';

export class DeleteTaskTool extends BaseTool {
  name = 'delete_task';
  description = 'Delete (drop) a task in OmniFocus';

  inputSchema = {
    type: 'object' as const,
    properties: {
      taskId: {
        type: 'string',
        description: 'ID of the task to delete',
      },
    },
    required: ['taskId'],
  };

  async execute(args: { taskId: string }): Promise<any> {
    try {
      // Invalidate task cache
      this.cache.invalidate('tasks');

      const script = this.omniAutomation.buildScript(DELETE_TASK_SCRIPT, args);
      const result = await this.omniAutomation.execute(script);

      if (result.error) {
        return result;
      }

      // Parse the JSON result since the script returns a JSON string
      let parsedResult;
      try {
        parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
      } catch (parseError) {
        this.logger.error(`Failed to parse delete task result: ${result}`);
        return {
          error: true,
          message: 'Failed to parse task deletion response'
        };
      }

      this.logger.info(`Deleted task: ${parsedResult.name} (${args.taskId})`);
      return {
        success: true,
        task: parsedResult,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
