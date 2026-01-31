import { BaseTool } from '../base.js';
import { DELETE_FOLDER_SCRIPT } from '../../omnifocus/scripts/folders.js';

export class DeleteFolderTool extends BaseTool {
  name = 'delete_folder';
  description = 'Drop a folder (with option to move contents to another folder first)';

  inputSchema = {
    type: 'object' as const,
    properties: {
      folderId: {
        type: 'string',
        description: 'ID of the folder to delete',
      },
      moveContentsTo: {
        type: 'string',
        description: 'ID of folder to move contents to before dropping (omit to orphan contents)',
      },
    },
    required: ['folderId'],
  };

  async execute(args: any): Promise<any> {
    try {
      // Invalidate caches
      this.cache.invalidate('projects');
      this.cache.invalidate('tasks');

      const script = this.omniAutomation.buildScript(DELETE_FOLDER_SCRIPT, {
        folderId: args.folderId,
        moveContentsTo: args.moveContentsTo !== undefined ? args.moveContentsTo : null,
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
