export const LIST_ATTACHMENTS_SCRIPT = `
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

    // Get attachments
    const attachments = [];
    try {
      const taskAttachments = task.attachments();
      for (let i = 0; i < taskAttachments.length; i++) {
        const attachment = taskAttachments[i];
        const attachmentObj = {
          index: i
        };

        try {
          const filename = attachment.preferredFilename();
          if (filename) {
            attachmentObj.name = filename;
          }
        } catch (e) {}

        try {
          const type = attachment.type();
          if (type) {
            attachmentObj.type = type;
          }
        } catch (e) {}

        attachments.push(attachmentObj);
      }
    } catch (e) {
      // No attachments
    }

    // Get linked files
    const linkedFiles = [];
    try {
      const urls = task.linkedFileURLs();
      for (let i = 0; i < urls.length; i++) {
        linkedFiles.push({
          url: urls[i].string()
        });
      }
    } catch (e) {
      // No linked files
    }

    return JSON.stringify({
      taskId: taskId,
      attachments: attachments,
      linkedFiles: linkedFiles
    });
  } catch (error) {
    return JSON.stringify({
      error: true,
      message: "Failed to list attachments: " + error.toString(),
      details: error.message
    });
  }
`;

export const ADD_LINKED_FILE_SCRIPT = `
  const taskId = {{taskId}};
  const path = {{path}};

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

    // Add linked file
    const url = URL.fromString(path);
    if (!url) {
      return JSON.stringify({
        error: true,
        message: 'Invalid file path or URL'
      });
    }

    task.addLinkedFileURL(url);

    return JSON.stringify({
      success: true,
      taskId: taskId,
      linkedFile: path
    });
  } catch (error) {
    return JSON.stringify({
      error: true,
      message: "Failed to add linked file: " + error.toString(),
      details: error.message
    });
  }
`;

export const REMOVE_ATTACHMENT_SCRIPT = `
  const taskId = {{taskId}};
  const index = {{index}};

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

    // Get attachments
    const attachments = task.attachments();
    if (index < 0 || index >= attachments.length) {
      return JSON.stringify({
        error: true,
        message: 'Attachment index out of range'
      });
    }

    // Remove attachment
    task.removeAttachmentAtIndex(index);

    return JSON.stringify({
      success: true,
      taskId: taskId,
      removed: true,
      index: index
    });
  } catch (error) {
    return JSON.stringify({
      error: true,
      message: "Failed to remove attachment: " + error.toString(),
      details: error.message
    });
  }
`;

export const REMOVE_LINKED_FILE_SCRIPT = `
  const taskId = {{taskId}};
  const urlString = {{urlString}};

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

    // Remove linked file
    const url = URL.fromString(urlString);
    if (!url) {
      return JSON.stringify({
        error: true,
        message: 'Invalid URL'
      });
    }

    task.removeLinkedFileWithURL(url);

    return JSON.stringify({
      success: true,
      taskId: taskId,
      removed: true,
      url: urlString
    });
  } catch (error) {
    return JSON.stringify({
      error: true,
      message: "Failed to remove linked file: " + error.toString(),
      details: error.message
    });
  }
`;
