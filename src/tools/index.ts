import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { CacheManager } from '../cache/CacheManager.js';
import { createLogger } from '../utils/logger.js';

// Import task tools
import { ListTasksTool } from './tasks/ListTasksTool.js';
import { GetTaskCountTool } from './tasks/GetTaskCountTool.js';
import { TodaysAgendaTool } from './tasks/TodaysAgendaTool.js';
import { CreateTaskTool } from './tasks/CreateTaskTool.js';
import { UpdateTaskTool } from './tasks/UpdateTaskTool.js';
import { CompleteTaskTool } from './tasks/CompleteTaskTool.js';
import { DeleteTaskTool } from './tasks/DeleteTaskTool.js';

// Import project tools
import { ListProjectsTool } from './projects/ListProjectsTool.js';
import { CreateProjectTool } from './projects/CreateProjectTool.js';
import { UpdateProjectTool } from './projects/UpdateProjectTool.js';
import { CompleteProjectTool } from './projects/CompleteProjectTool.js';
import { DeleteProjectTool } from './projects/DeleteProjectTool.js';

// Import analytics tools
import { ProductivityStatsTool } from './analytics/ProductivityStatsTool.js';
import { TaskVelocityTool } from './analytics/TaskVelocityTool.js';
import { OverdueAnalysisTool } from './analytics/OverdueAnalysisTool.js';

// Import tag tools
import { ListTagsTool } from './tags/ListTagsTool.js';
import { ManageTagsTool } from './tags/ManageTagsTool.js';

// Import export tools
import { ExportTasksTool } from './export/ExportTasksTool.js';
import { ExportProjectsTool } from './export/ExportProjectsTool.js';
import { BulkExportTool } from './export/BulkExportTool.js';

// Import recurring task tools
import { AnalyzeRecurringTasksTool } from './recurring/AnalyzeRecurringTasksTool.js';
import { GetRecurringPatternsTool } from './recurring/GetRecurringPatternsTool.js';

// Import hierarchy tools
import { GetTaskHierarchyTool } from './hierarchy/GetTaskHierarchyTool.js';
import { CreateSubtaskTool } from './hierarchy/CreateSubtaskTool.js';
import { MoveTaskTool } from './hierarchy/MoveTaskTool.js';
import { SetTaskOrderingTool } from './hierarchy/SetTaskOrderingTool.js';
import { ListSubtasksTool } from './hierarchy/ListSubtasksTool.js';

// Import folder tools
import { ListFoldersTool } from './folders/ListFoldersTool.js';
import { CreateFolderTool } from './folders/CreateFolderTool.js';
import { UpdateFolderTool } from './folders/UpdateFolderTool.js';
import { DeleteFolderTool } from './folders/DeleteFolderTool.js';
import { GetFolderContentsTool } from './folders/GetFolderContentsTool.js';
import { MoveToFolderTool } from './folders/MoveToFolderTool.js';

// Import notification tools
import { ListNotificationsTool } from './notifications/ListNotificationsTool.js';
import { AddNotificationTool } from './notifications/AddNotificationTool.js';
import { RemoveNotificationTool } from './notifications/RemoveNotificationTool.js';
import { ClearNotificationsTool } from './notifications/ClearNotificationsTool.js';

// Import attachment tools
import { ListAttachmentsTool } from './attachments/ListAttachmentsTool.js';
import { AddLinkedFileTool } from './attachments/AddLinkedFileTool.js';
import { RemoveAttachmentTool } from './attachments/RemoveAttachmentTool.js';
import { RemoveLinkedFileTool } from './attachments/RemoveLinkedFileTool.js';

const logger = createLogger('tools');

export async function registerTools(server: Server, cache: CacheManager): Promise<void> {
  // Initialize all tools
  const tools = [
    // Task tools - Read operations
    new ListTasksTool(cache),
    new GetTaskCountTool(cache),
    new TodaysAgendaTool(cache),
    
    // Task tools - Write operations
    new CreateTaskTool(cache),
    new UpdateTaskTool(cache),
    new CompleteTaskTool(cache),
    new DeleteTaskTool(cache),
    
    // Project tools
    new ListProjectsTool(cache),
    new CreateProjectTool(cache),
    new UpdateProjectTool(cache),
    new CompleteProjectTool(cache),
    new DeleteProjectTool(cache),
    
    // Analytics tools
    new ProductivityStatsTool(cache),
    new TaskVelocityTool(cache),
    new OverdueAnalysisTool(cache),
    
    // Tag tools
    new ListTagsTool(cache),
    new ManageTagsTool(cache),
    
    // Export tools
    new ExportTasksTool(cache),
    new ExportProjectsTool(cache),
    new BulkExportTool(cache),
    
    // Recurring task tools
    new AnalyzeRecurringTasksTool(cache),
    new GetRecurringPatternsTool(cache),

    // Hierarchy tools
    new GetTaskHierarchyTool(cache),
    new CreateSubtaskTool(cache),
    new MoveTaskTool(cache),
    new SetTaskOrderingTool(cache),
    new ListSubtasksTool(cache),

    // Folder tools
    new ListFoldersTool(cache),
    new CreateFolderTool(cache),
    new UpdateFolderTool(cache),
    new DeleteFolderTool(cache),
    new GetFolderContentsTool(cache),
    new MoveToFolderTool(cache),

    // Notification tools
    new ListNotificationsTool(cache),
    new AddNotificationTool(cache),
    new RemoveNotificationTool(cache),
    new ClearNotificationsTool(cache),

    // Attachment tools
    new ListAttachmentsTool(cache),
    new AddLinkedFileTool(cache),
    new RemoveAttachmentTool(cache),
    new RemoveLinkedFileTool(cache),
  ];
  
  // Register handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: tools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    };
  });
  
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    const tool = tools.find(t => t.name === name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    
    logger.debug(`Executing tool: ${name}`, args);
    const result = await tool.execute(args || {});
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  });
  
}