import { BaseTool } from '../base.js';
import { CREATE_FOLDER_SCRIPT } from '../../omnifocus/scripts/folders.js';

export class CreateFolderTool extends BaseTool {
  name = 'create_folder';
  description = 'Create a folder, optionally nested inside another folder';

  inputSchema = {
    type: 'object' as const,
    properties: {
      name: {
        type: 'string',
        description: 'Name of the folder',
      },
      parentFolderId: {
        type: 'string',
        description: 'ID of parent folder (omit to create at root level)',
      },
    },
    required: ['name'],
  };

  async execute(args: any): Promise<any> {
    try {
      // Invalidate projects cache (affects folder structure)
      this.cache.invalidate('projects');

      const script = this.omniAutomation.buildScript(CREATE_FOLDER_SCRIPT, {
        folderName: args.name,
        parentFolderId: args.parentFolderId !== undefined ? args.parentFolderId : null,
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
