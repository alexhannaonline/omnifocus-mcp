import { BaseTool } from '../base.js';
import { GET_FOLDER_CONTENTS_SCRIPT } from '../../omnifocus/scripts/folders.js';

export class GetFolderContentsTool extends BaseTool {
  name = 'get_folder_contents';
  description = 'List contents of a specific folder (child folders and projects)';

  inputSchema = {
    type: 'object' as const,
    properties: {
      folderId: {
        type: 'string',
        description: 'ID of the folder',
      },
    },
    required: ['folderId'],
  };

  async execute(args: any): Promise<any> {
    try {
      const script = this.omniAutomation.buildScript(GET_FOLDER_CONTENTS_SCRIPT, {
        folderId: args.folderId,
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
