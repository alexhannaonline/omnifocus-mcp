export const GET_TASK_HIERARCHY_SCRIPT = `
  const taskId = {{taskId}};
  const maxDepth = {{maxDepth}};

  try {
    // Find task by ID
    const tasks = doc.flattenedTasks();
    let task = null;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id() === taskId) {
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
        id: t.id(),
        name: t.name(),
        completed: t.completed(),
        flagged: t.flagged()
      };

      // Add optional fields
      try {
        const note = t.note();
        if (note) node.note = note;
      } catch (e) {}

      // Add children if within depth limit
      if (maxDepth === null || currentDepth < maxDepth) {
        try {
          const childTasks = t.tasks();
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
    const tasks = doc.flattenedTasks();
    let parentTask = null;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id() === parentTaskId) {
        parentTask = tasks[i];
        break;
      }
    }
    if (!parentTask) {
      return JSON.stringify({ error: true, message: 'Parent task not found' });
    }

    // Create subtask using position
    const position = taskData.position === 'beginning' ? parentTask.tasks.beginning : parentTask.tasks.ending;

    // Build task object
    const taskObj = {
      name: taskData.name
    };

    if (taskData.note !== undefined) taskObj.note = taskData.note;
    if (taskData.flagged !== undefined) taskObj.flagged = taskData.flagged;
    if (taskData.dueDate !== undefined && taskData.dueDate) taskObj.dueDate = new Date(taskData.dueDate);
    if (taskData.deferDate !== undefined && taskData.deferDate) taskObj.deferDate = new Date(taskData.deferDate);
    if (taskData.estimatedMinutes !== undefined) taskObj.estimatedMinutes = taskData.estimatedMinutes;

    // Create the subtask
    const newTask = app.Task(taskObj);
    position.push(newTask);

    // Handle tags
    const tagsToAdd = [];
    const tagsNotFound = [];
    if (taskData.tags && taskData.tags.length > 0) {
      const existingTags = doc.flattenedTags();
      for (const tagName of taskData.tags) {
        let found = false;
        for (let i = 0; i < existingTags.length; i++) {
          if (existingTags[i].name() === tagName) {
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

    // Try to find the created task and get its ID
    let taskId = null;
    try {
      const childTasks = parentTask.tasks();
      for (let i = childTasks.length - 1; i >= 0; i--) {
        if (childTasks[i].name() === taskData.name) {
          taskId = childTasks[i].id();

          // Add tags
          if (tagsToAdd.length > 0) {
            try {
              childTasks[i].addTags(tagsToAdd);
            } catch (tagError) {
              return JSON.stringify({
                error: true,
                message: "Failed to add tags to subtask: " + tagError.toString()
              });
            }
          }
          break;
        }
      }
    } catch (e) {
      taskId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
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
    const tasks = doc.flattenedTasks();
    let task = null;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id() === taskId) {
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
        if (tasks[i].id() === parentTaskId) {
          parentTask = tasks[i];
          break;
        }
      }
      if (!parentTask) {
        return JSON.stringify({ error: true, message: 'Parent task not found' });
      }

      destination = position === 'beginning' ? parentTask.tasks.beginning : parentTask.tasks.ending;
      destinationType = 'subtask';
    } else {
      // Move to project root or inbox
      const containingProject = task.containingProject();
      if (containingProject) {
        destination = position === 'beginning' ? containingProject.tasks.beginning : containingProject.tasks.ending;
        destinationType = 'project_root';
      } else {
        destination = position === 'beginning' ? doc.inboxTasks.beginning : doc.inboxTasks.ending;
        destinationType = 'inbox';
      }
    }

    // Move task using moveTasks
    doc.moveTasks([task], destination);

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
    const tasks = doc.flattenedTasks();
    let task = null;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id() === taskId) {
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
      sequential: task.sequential(),
      completedByChildren: task.completedByChildren()
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
    const tasks = doc.flattenedTasks();
    let task = null;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id() === taskId) {
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
      const childTasks = task.tasks();
      for (let i = 0; i < childTasks.length; i++) {
        const child = childTasks[i];
        const subtask = {
          id: child.id(),
          name: child.name(),
          completed: child.completed(),
          flagged: child.flagged(),
          hasChildren: child.hasChildren()
        };

        try {
          const note = child.note();
          if (note) subtask.note = note;
        } catch (e) {}

        try {
          const dueDate = child.dueDate();
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
