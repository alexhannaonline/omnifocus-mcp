import { BaseTool } from '../base.js';
import { LIST_FOLDERS_SCRIPT } from '../../omnifocus/scripts/folders.js';

export class ListFoldersTool extends BaseTool {
  name = 'list_folders';
  description = 'List all folders with optional nesting depth and status filter';

  inputSchema = {
    type: 'object' as const,
    properties: {
      depth: {
        type: 'number',
        description: 'Maximum depth to traverse (omit for unlimited)',
      },
      status: {
        type: 'string',
        enum: ['active', 'dropped'],
        description: 'Filter by folder status',
      },
    },
  };

  async execute(args: any): Promise<any> {
    try {
      const maxDepth = args.depth !== undefined ? args.depth : null;
      const statusFilter = args.status !== undefined ? args.status : null;

      const script = this.omniAutomation.buildScript(LIST_FOLDERS_SCRIPT, {
        maxDepth: maxDepth,
        statusFilter: statusFilter,
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
