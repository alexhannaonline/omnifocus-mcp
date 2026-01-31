import { describe, it, expect } from 'vitest';
import {
  LIST_TASKS_SCRIPT,
  CREATE_TASK_SCRIPT,
  UPDATE_TASK_SCRIPT,
  COMPLETE_TASK_SCRIPT,
  DELETE_TASK_SCRIPT
} from 'src/omnifocus/scripts/tasks';
import {
  LIST_PROJECTS_SCRIPT,
  CREATE_PROJECT_SCRIPT,
  UPDATE_PROJECT_SCRIPT,
  COMPLETE_PROJECT_SCRIPT,
  DELETE_PROJECT_SCRIPT
} from 'src/omnifocus/scripts/projects';

/**
 * Note: This test verifies the correct Omni Automation API usage for ID extraction.
 * In OmniFocus Omni Automation:
 * - task.id.primaryKey returns the task ID (property access)
 * - project.id.primaryKey returns the project ID (property access)
 *
 * This test ensures we're using the correct Omni Automation API patterns.
 */
describe('Verify ID Extraction Fix', () => {
  it('should use correct ID extraction patterns in task scripts', () => {
    // Task scripts should use task.id.primaryKey for task IDs
    expect(LIST_TASKS_SCRIPT).toContain('id: task.id.primaryKey');
    expect(UPDATE_TASK_SCRIPT).toContain('task.id.primaryKey');
    expect(COMPLETE_TASK_SCRIPT).toContain('task.id.primaryKey');
    expect(DELETE_TASK_SCRIPT).toContain('id.primaryKey');

    // Task scripts should use project.id.primaryKey for project IDs
    expect(LIST_TASKS_SCRIPT).toContain('taskObj.projectId = project.id.primaryKey');
    expect(UPDATE_TASK_SCRIPT).toContain('projects[i].id.primaryKey === updates.projectId');
  });

  it('should use project.id.primaryKey in project scripts', () => {
    // Project scripts should use project.id.primaryKey for project IDs
    expect(LIST_PROJECTS_SCRIPT).toContain('id: project.id.primaryKey');
    expect(CREATE_PROJECT_SCRIPT).toContain('id: newProject.id.primaryKey');
    expect(UPDATE_PROJECT_SCRIPT).toContain('allProjects[i].id.primaryKey === projectId');
    expect(COMPLETE_PROJECT_SCRIPT).toContain('projects[i].id.primaryKey === projectId');
    expect(DELETE_PROJECT_SCRIPT).toContain('projects[i].id.primaryKey === projectId');
  });

  it('should verify ID comparison patterns', () => {
    // Task lookups use task.id.primaryKey
    expect(UPDATE_TASK_SCRIPT).toContain('tasks[i].id.primaryKey === taskId');
    expect(COMPLETE_TASK_SCRIPT).toContain('tasks[i].id.primaryKey === taskId');
    expect(DELETE_TASK_SCRIPT).toContain('tasks[i].id.primaryKey === taskId');

    // Project lookups use project.id.primaryKey
    expect(UPDATE_PROJECT_SCRIPT).toContain('allProjects[i].id.primaryKey === projectId');
    expect(COMPLETE_PROJECT_SCRIPT).toContain('projects[i].id.primaryKey === projectId');
    expect(DELETE_PROJECT_SCRIPT).toContain('projects[i].id.primaryKey === projectId');
  });
});
