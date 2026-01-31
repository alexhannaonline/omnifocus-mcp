export const GET_TASK_HIERARCHY_SCRIPT = `

  const taskId = {{taskId}};
  const maxDepth = {{maxDepth}};

  try {
    // Find task by ID
    const tasks = flattenedTasks;
    let task = null;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id.primaryKey === taskId) {
        task = tasks[i];
        break;
      }
    }
    if (!task) {
      return JSON.stringify({ error: true, message: 'Task not found' });
    }

    // Recursively build hierarchy
    function buildTaskNode(t, currentDepth) {
      const node = {
        id: t.id.primaryKey,
        name: t.name,
        completed: t.completed,
        flagged: t.flagged
      };

      // Add optional fields
      try {
        const note = t.note;
        if (note) node.note = note;
      } catch (e) {}

      // Add children if within depth limit
      if (maxDepth === null || currentDepth < maxDepth) {
        try {
          const childTasks = t.children;
          if (childTasks && childTasks.length > 0) {
            node.children = [];
            for (let i = 0; i < childTasks.length; i++) {
              node.children.push(buildTaskNode(childTasks[i], currentDepth + 1));
            }
          }
        } catch (e) {}
      }

      return node;
    }

    const hierarchy = buildTaskNode(task, 0);

    return JSON.stringify(hierarchy);
  } catch (error) {
    return JSON.stringify({
      error: true,
      message: "Failed to get task hierarchy: " + error.toString(),
      details: error.message
    });
  }
`;

export const CREATE_SUBTASK_SCRIPT = `

  const parentTaskId = {{parentTaskId}};
  const taskData = {{taskData}};

  try {
    // Find parent task by ID
    const tasks = flattenedTasks;
    let parentTask = null;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id.primaryKey === parentTaskId) {
        parentTask = tasks[i];
        break;
      }
    }
    if (!parentTask) {
      return JSON.stringify({ error: true, message: 'Parent task not found' });
    }

    // Create subtask using parent task's position endpoints
    const position = taskData.position === 'beginning' ? parentTask.beginning : parentTask.ending;

    // Create the subtask
    const newTask = new Task(taskData.name, position);

    if (taskData.note != null) newTask.note = taskData.note;
    if (taskData.flagged != null) newTask.flagged = taskData.flagged;
    if (taskData.dueDate != null) newTask.dueDate = new Date(taskData.dueDate);
    if (taskData.deferDate != null) newTask.deferDate = new Date(taskData.deferDate);
    if (taskData.estimatedMinutes != null) newTask.estimatedMinutes = taskData.estimatedMinutes;

    // Handle tags
    const tagsToAdd = [];
    const tagsNotFound = [];
    if (taskData.tags && taskData.tags.length > 0) {
      const existingTags = flattenedTags;
      for (const tagName of taskData.tags) {
        let found = false;
        for (let i = 0; i < existingTags.length; i++) {
          if (existingTags[i].name === tagName) {
            tagsToAdd.push(existingTags[i]);
            found = true;
            break;
          }
        }
        if (!found) {
          tagsNotFound.push(tagName);
        }
      }
    }

    // Get the ID directly from the created task
    let taskId = null;
    try {
      taskId = newTask.id.primaryKey;
    } catch (e) {}

    // Add tags to the new task
    if (tagsToAdd.length > 0) {
      try {
        for (const t of tagsToAdd) {
          newTask.addTag(t);
        }
      } catch (tagError) {
        return JSON.stringify({
          error: true,
          message: "Failed to add tags to subtask: " + tagError.toString()
        });
      }
    }

    const warnings = [];
    if (tagsNotFound.length > 0) {
      warnings.push("Tags not found and were not added: " + tagsNotFound.join(", "));
    }

    const result = {
      success: true,
      taskId: taskId,
      parentTaskId: parentTaskId,
      task: {
        id: taskId,
        name: taskData.name,
        flagged: taskData.flagged || false
      }
    };

    if (warnings.length > 0) {
      result.warnings = warnings;
    }

    return JSON.stringify(result);
  } catch (error) {
    return JSON.stringify({
      error: true,
      message: "Failed to create subtask: " + error.toString(),
      details: error.message
    });
  }
`;

export const MOVE_TASK_SCRIPT = `

  const taskId = {{taskId}};
  const parentTaskId = {{parentTaskId}};
  const position = {{position}};

  try {
    // Find task to move
    const tasks = flattenedTasks;
    let task = null;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id.primaryKey === taskId) {
        task = tasks[i];
        break;
      }
    }
    if (!task) {
      return JSON.stringify({ error: true, message: 'Task not found' });
    }

    // Determine destination
    let destination = null;
    let destinationType = 'inbox';

    if (parentTaskId !== null) {
      // Find parent task
      let parentTask = null;
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id.primaryKey === parentTaskId) {
          parentTask = tasks[i];
          break;
        }
      }
      if (!parentTask) {
        return JSON.stringify({ error: true, message: 'Parent task not found' });
      }

      destination = position === 'beginning' ? parentTask.beginning : parentTask.ending;
      destinationType = 'subtask';
    } else {
      // Move to project root or inbox
      const containingProject = task.containingProject;
      if (containingProject) {
        destination = position === 'beginning' ? containingProject.beginning : containingProject.ending;
        destinationType = 'project_root';
      } else {
        destination = position === 'beginning' ? inbox.beginning : inbox.ending;
        destinationType = 'inbox';
      }
    }

    // Move task using moveTasks
    moveTasks([task], destination);

    return JSON.stringify({
      success: true,
      taskId: taskId,
      movedTo: destinationType,
      parentTaskId: parentTaskId
    });
  } catch (error) {
    return JSON.stringify({
      error: true,
      message: "Failed to move task: " + error.toString(),
      details: error.message
    });
  }
`;

export const SET_TASK_ORDERING_SCRIPT = `

  const taskId = {{taskId}};
  const sequential = {{sequential}};
  const completedByChildren = {{completedByChildren}};

  try {
    // Find task by ID
    const tasks = flattenedTasks;
    let task = null;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id.primaryKey === taskId) {
        task = tasks[i];
        break;
      }
    }
    if (!task) {
      return JSON.stringify({ error: true, message: 'Task not found' });
    }

    // Set ordering properties
    if (sequential !== undefined) {
      task.sequential = sequential;
    }
    if (completedByChildren !== undefined) {
      task.completedByChildren = completedByChildren;
    }

    return JSON.stringify({
      success: true,
      taskId: taskId,
      sequential: task.sequential,
      completedByChildren: task.completedByChildren
    });
  } catch (error) {
    return JSON.stringify({
      error: true,
      message: "Failed to set task ordering: " + error.toString(),
      details: error.message
    });
  }
`;

export const LIST_SUBTASKS_SCRIPT = `

  const taskId = {{taskId}};

  try {
    // Find task by ID
    const tasks = flattenedTasks;
    let task = null;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id.primaryKey === taskId) {
        task = tasks[i];
        break;
      }
    }
    if (!task) {
      return JSON.stringify({ error: true, message: 'Task not found' });
    }

    // Get direct children
    const subtasks = [];
    try {
      const childTasks = task.children;
      for (let i = 0; i < childTasks.length; i++) {
        const child = childTasks[i];
        const subtask = {
          id: child.id.primaryKey,
          name: child.name,
          completed: child.completed,
          flagged: child.flagged,
          hasChildren: child.hasChildren
        };

        try {
          const note = child.note;
          if (note) subtask.note = note;
        } catch (e) {}

        try {
          const dueDate = child.dueDate;
          if (dueDate) subtask.dueDate = dueDate.toISOString();
        } catch (e) {}

        subtasks.push(subtask);
      }
    } catch (e) {
      // No children
    }

    return JSON.stringify({
      taskId: taskId,
      subtasks: subtasks,
      count: subtasks.length
    });
  } catch (error) {
    return JSON.stringify({
      error: true,
      message: "Failed to list subtasks: " + error.toString(),
      details: error.message
    });
  }
`;
