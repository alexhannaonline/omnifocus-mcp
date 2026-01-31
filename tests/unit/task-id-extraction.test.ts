import { describe, it, expect, vi } from 'vitest';
import { LIST_TASKS_SCRIPT } from 'src/omnifocus/scripts/tasks';

describe('Task ID Extraction', () => {
  it('should use task.id.primaryKey property for task ID extraction', () => {
    // Check that the script uses task.id.primaryKey property correctly
    const taskIdPattern = /task\.id\.primaryKey/g;
    const matches = LIST_TASKS_SCRIPT.match(taskIdPattern);

    console.log('Checking for task.id.primaryKey property access...');
    if (matches) {
      console.log(`Found ${matches.length} instances of task.id.primaryKey property access`);
    }

    // Should find task.id.primaryKey property access for task objects
    expect(matches).not.toBeNull();
    expect(matches?.length).toBeGreaterThan(0);
  });

  it('should use project.id.primaryKey property for project ID extraction', () => {
    const projectIdPattern = /project\.id\.primaryKey/g;
    const matches = LIST_TASKS_SCRIPT.match(projectIdPattern);

    if (matches) {
      console.log(`Found ${matches.length} instances of project.id.primaryKey property access`);
    }

    // primaryKey is a property in Omni Automation - this is correct
    expect(matches).not.toBeNull();
    expect(matches?.length).toBeGreaterThan(0);
  });

  it('should verify consistent ID extraction patterns using primaryKey', () => {
    // Task IDs use primaryKey property
    const taskIdPattern = /id: task\.id\.primaryKey/g;
    const taskIdMatches = LIST_TASKS_SCRIPT.match(taskIdPattern);

    // Project IDs also use primaryKey property
    const projectIdPattern = /project\.id\.primaryKey/g;
    const projectMatches = LIST_TASKS_SCRIPT.match(projectIdPattern);

    console.log(`\nID extraction patterns:`);
    console.log(`- Found ${taskIdMatches?.length || 0} id: task.id.primaryKey assignments`);
    console.log(`- Found ${projectMatches?.length || 0} project.id.primaryKey property access`);

    // Should have task ID property access for object creation
    expect(taskIdMatches).not.toBeNull();
    // Should have project ID property access
    expect(projectMatches).not.toBeNull();
  });
});
