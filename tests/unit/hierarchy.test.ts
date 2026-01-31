import { describe, it, expect } from 'vitest';
import {
  GET_TASK_HIERARCHY_SCRIPT,
  CREATE_SUBTASK_SCRIPT,
  MOVE_TASK_SCRIPT,
  SET_TASK_ORDERING_SCRIPT,
  LIST_SUBTASKS_SCRIPT,
} from '../../src/omnifocus/scripts/hierarchy';

describe('Hierarchy Scripts', () => {
  it('should return JSON stringified results', () => {
    const returnPattern = /return JSON\.stringify\(/g;

    expect(GET_TASK_HIERARCHY_SCRIPT.match(returnPattern)).not.toBeNull();
    expect(CREATE_SUBTASK_SCRIPT.match(returnPattern)).not.toBeNull();
    expect(MOVE_TASK_SCRIPT.match(returnPattern)).not.toBeNull();
    expect(SET_TASK_ORDERING_SCRIPT.match(returnPattern)).not.toBeNull();
    expect(LIST_SUBTASKS_SCRIPT.match(returnPattern)).not.toBeNull();
  });

  it('should use correct method calls with parentheses', () => {
    // Verify method calls use parentheses
    expect(GET_TASK_HIERARCHY_SCRIPT).toContain('task.id()');
    expect(GET_TASK_HIERARCHY_SCRIPT).toContain('task.name()');
    expect(GET_TASK_HIERARCHY_SCRIPT).toContain('task.completed()');
    expect(GET_TASK_HIERARCHY_SCRIPT).toContain('task.tasks()');

    expect(LIST_SUBTASKS_SCRIPT).toContain('task.id()');
    expect(LIST_SUBTASKS_SCRIPT).toContain('task.tasks()');
    expect(LIST_SUBTASKS_SCRIPT).toContain('task.hasChildren()');
  });

  it('should use correct position syntax for subtask creation', () => {
    // Verify position handling
    expect(CREATE_SUBTASK_SCRIPT).toContain('parentTask.tasks.beginning');
    expect(CREATE_SUBTASK_SCRIPT).toContain('parentTask.tasks.ending');
  });

  it('should use moveTasks for task movement', () => {
    expect(MOVE_TASK_SCRIPT).toContain('doc.moveTasks([task], destination)');
  });

  it('should handle task ordering properties', () => {
    expect(SET_TASK_ORDERING_SCRIPT).toContain('task.sequential');
    expect(SET_TASK_ORDERING_SCRIPT).toContain('task.completedByChildren');
  });

  it('should include placeholders for parameters', () => {
    expect(GET_TASK_HIERARCHY_SCRIPT).toContain('{{taskId}}');
    expect(GET_TASK_HIERARCHY_SCRIPT).toContain('{{maxDepth}}');

    expect(CREATE_SUBTASK_SCRIPT).toContain('{{parentTaskId}}');
    expect(CREATE_SUBTASK_SCRIPT).toContain('{{taskData}}');

    expect(MOVE_TASK_SCRIPT).toContain('{{taskId}}');
    expect(MOVE_TASK_SCRIPT).toContain('{{parentTaskId}}');

    expect(SET_TASK_ORDERING_SCRIPT).toContain('{{taskId}}');
    expect(SET_TASK_ORDERING_SCRIPT).toContain('{{sequential}}');
    expect(SET_TASK_ORDERING_SCRIPT).toContain('{{completedByChildren}}');

    expect(LIST_SUBTASKS_SCRIPT).toContain('{{taskId}}');
  });

  it('should handle tag assignment in subtask creation', () => {
    expect(CREATE_SUBTASK_SCRIPT).toContain('addTags(tagsToAdd)');
    expect(CREATE_SUBTASK_SCRIPT).toContain('tagsNotFound');
  });
});
