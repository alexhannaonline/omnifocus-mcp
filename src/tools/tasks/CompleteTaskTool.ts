import { BaseTool } from '../base.js';
import { COMPLETE_TASK_SCRIPT } from '../../omnifocus/scripts/tasks.js';

export class CompleteTaskTool extends BaseTool {
  name = 'complete_task';
  description = 'Mark a task as completed in OmniFocus';

  inputSchema = {
    type: 'object' as const,
    properties: {
      taskId: {
        type: 'string',
        description: 'ID of the task to complete',
      },
    },
    required: ['taskId'],
  };

  async execute(args: { taskId: string }): Promise<any> {
    try {
      // Invalidate task and analytics cache
      this.cache.invalidate('tasks');
      this.cache.invalidate('analytics');

      const script = this.omniAutomation.buildScript(COMPLETE_TASK_SCRIPT, args);
      const result = await this.omniAutomation.execute(script);

      if (result.error) {
        return result;
      }

      this.logger.info(`Completed task: ${args.taskId}`);

      // Parse the JSON result since the script returns a JSON string
      let parsedResult;
      try {
        parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
      } catch (parseError) {
        this.logger.error(`Failed to parse complete task result: ${result}`);
        return {
          error: true,
          message: 'Failed to parse task completion response'
        };
      }

      return {
        success: true,
        task: parsedResult,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
