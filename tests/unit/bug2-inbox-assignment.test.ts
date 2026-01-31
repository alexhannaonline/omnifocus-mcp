import { describe, it, expect } from 'vitest';
import { UPDATE_TASK_SCRIPT_SIMPLE, UPDATE_TASK_SCRIPT } from '../../src/omnifocus/scripts/tasks';

describe('Bug 2: Inbox Assignment Fix', () => {
  describe('UPDATE_TASK_SCRIPT_SIMPLE', () => {
    it('should set assignedContainer to null when projectId is empty string', () => {
      // Empty string projectId triggers move to inbox
      expect(UPDATE_TASK_SCRIPT_SIMPLE).toContain('if (updates.projectId === "")');
      // Setting assignedContainer to null moves task to inbox in Omni Automation
      expect(UPDATE_TASK_SCRIPT_SIMPLE).toContain('task.assignedContainer = null;');

      // Should NOT use the broken doc.inbox assignment
      expect(UPDATE_TASK_SCRIPT_SIMPLE).not.toContain('task.assignedContainer = doc.inbox');
    });
  });

  describe('UPDATE_TASK_SCRIPT', () => {
    it('should set assignedContainer to null when projectId is empty string', () => {
      // Full script should also use empty string check + null assignment
      expect(UPDATE_TASK_SCRIPT).toContain('if (updates.projectId === "")');
      expect(UPDATE_TASK_SCRIPT).toContain('task.assignedContainer = null;');

      // Should NOT use the broken doc.inbox assignment
      expect(UPDATE_TASK_SCRIPT).not.toContain('task.assignedContainer = doc.inbox');
    });
  });

  describe('Documentation', () => {
    it('should document the Omni Automation pattern for moving tasks to inbox', () => {
      // In OmniFocus Omni Automation:
      // - task.assignedContainer = null moves task to inbox
      // - task.assignedContainer = project assigns to project
      // - Empty string projectId ("") is the API convention for "move to inbox"

      const correctPattern = 'task.assignedContainer = null;';
      const brokenPattern = 'task.assignedContainer = doc.inbox;';

      expect(UPDATE_TASK_SCRIPT_SIMPLE).toContain(correctPattern);
      expect(UPDATE_TASK_SCRIPT_SIMPLE).not.toContain(brokenPattern);
    });
  });
});
