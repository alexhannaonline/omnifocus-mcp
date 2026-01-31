import { BaseTool } from '../base.js';
import { UPDATE_FOLDER_SCRIPT } from '../../omnifocus/scripts/folders.js';

export class UpdateFolderTool extends BaseTool {
  name = 'update_folder';
  description = 'Update folder properties (name, status)';

  inputSchema = {
    type: 'object' as const,
    properties: {
      folderId: {
        type: 'string',
        description: 'ID of the folder',
      },
      name: {
        type: 'string',
        description: 'New name for the folder',
      },
      status: {
        type: 'string',
        enum: ['active', 'dropped'],
        description: 'New status for the folder',
      },
    },
    required: ['folderId'],
  };

  async execute(args: any): Promise<any> {
    try {
      // Invalidate projects cache
      this.cache.invalidate('projects');

      const updates: any = {};
      if (args.name !== undefined) updates.name = args.name;
      if (args.status !== undefined) updates.status = args.status;

      const script = this.omniAutomation.buildScript(UPDATE_FOLDER_SCRIPT, {
        folderId: args.folderId,
        updates: updates,
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
