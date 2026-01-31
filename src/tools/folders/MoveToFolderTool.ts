import { BaseTool } from '../base.js';
import { MOVE_TO_FOLDER_SCRIPT } from '../../omnifocus/scripts/folders.js';

export class MoveToFolderTool extends BaseTool {
  name = 'move_to_folder';
  description = 'Move a project or folder into a different folder';

  inputSchema = {
    type: 'object' as const,
    properties: {
      itemId: {
        type: 'string',
        description: 'ID of the item to move',
      },
      itemType: {
        type: 'string',
        enum: ['project', 'folder'],
        description: 'Type of item to move',
      },
      targetFolderId: {
        type: 'string',
        description: 'ID of the target folder',
      },
    },
    required: ['itemId', 'itemType', 'targetFolderId'],
  };

  async execute(args: any): Promise<any> {
    try {
      // Invalidate projects cache
      this.cache.invalidate('projects');

      const script = this.omniAutomation.buildScript(MOVE_TO_FOLDER_SCRIPT, {
        itemId: args.itemId,
        itemType: args.itemType,
        targetFolderId: args.targetFolderId,
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
