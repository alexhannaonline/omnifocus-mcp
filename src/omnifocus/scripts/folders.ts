export const LIST_FOLDERS_SCRIPT = `
  const maxDepth = {{maxDepth}};
  const statusFilter = {{statusFilter}};

  try {
    // Recursively build folder tree
    function buildFolderNode(folder, currentDepth) {
      const node = {
        id: folder.id(),
        name: folder.name(),
        status: folder.status.name()
      };

      // Count projects in folder
      try {
        const projects = folder.projects();
        node.projectCount = projects.length;
      } catch (e) {
        node.projectCount = 0;
      }

      // Add children if within depth limit
      if (maxDepth === null || currentDepth < maxDepth) {
        try {
          const childFolders = folder.folders();
          if (childFolders && childFolders.length > 0) {
            node.children = [];
            for (let i = 0; i < childFolders.length; i++) {
              // Apply status filter
              const childStatus = childFolders[i].status.name();
              if (statusFilter === null || statusFilter === childStatus) {
                node.children.push(buildFolderNode(childFolders[i], currentDepth + 1));
              }
            }
          }
        } catch (e) {}
      }

      return node;
    }

    // Get all top-level folders
    const allFolders = doc.folders();
    const folders = [];

    for (let i = 0; i < allFolders.length; i++) {
      const folderStatus = allFolders[i].status.name();
      if (statusFilter === null || statusFilter === folderStatus) {
        folders.push(buildFolderNode(allFolders[i], 0));
      }
    }

    return JSON.stringify({
      folders: folders,
      count: folders.length
    });
  } catch (error) {
    return JSON.stringify({
      error: true,
      message: "Failed to list folders: " + error.toString(),
      details: error.message
    });
  }
`;

export const CREATE_FOLDER_SCRIPT = `
  const folderName = {{folderName}};
  const parentFolderId = {{parentFolderId}};

  try {
    let position = null;

    if (parentFolderId !== null) {
      // Find parent folder
      const allFolders = doc.flattenedFolders();
      let parentFolder = null;
      for (let i = 0; i < allFolders.length; i++) {
        if (allFolders[i].id() === parentFolderId) {
          parentFolder = allFolders[i];
          break;
        }
      }
      if (!parentFolder) {
        return JSON.stringify({ error: true, message: 'Parent folder not found' });
      }
      position = parentFolder.folders.ending;
    } else {
      // Create at root level
      position = doc.folders.ending;
    }

    // Create the folder
    const newFolder = app.Folder(folderName, position);
    position.push(newFolder);

    // Try to find the created folder and get its ID
    let folderId = null;
    try {
      if (parentFolderId !== null) {
        const allFolders = doc.flattenedFolders();
        for (let i = 0; i < allFolders.length; i++) {
          if (allFolders[i].id() === parentFolderId) {
            const childFolders = allFolders[i].folders();
            for (let j = childFolders.length - 1; j >= 0; j--) {
              if (childFolders[j].name() === folderName) {
                folderId = childFolders[j].id();
                break;
              }
            }
            break;
          }
        }
      } else {
        const topLevelFolders = doc.folders();
        for (let i = topLevelFolders.length - 1; i >= 0; i--) {
          if (topLevelFolders[i].name() === folderName) {
            folderId = topLevelFolders[i].id();
            break;
          }
        }
      }
    } catch (e) {
      folderId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    }

    return JSON.stringify({
      success: true,
      folderId: folderId,
      name: folderName,
      parentFolderId: parentFolderId
    });
  } catch (error) {
    return JSON.stringify({
      error: true,
      message: "Failed to create folder: " + error.toString(),
      details: error.message
    });
  }
`;

export const UPDATE_FOLDER_SCRIPT = `
  const folderId = {{folderId}};
  const updates = {{updates}};

  try {
    // Find folder by ID
    const allFolders = doc.flattenedFolders();
    let folder = null;
    for (let i = 0; i < allFolders.length; i++) {
      if (allFolders[i].id() === folderId) {
        folder = allFolders[i];
        break;
      }
    }
    if (!folder) {
      return JSON.stringify({ error: true, message: 'Folder not found' });
    }

    // Apply updates
    if (updates.name !== undefined) {
      folder.name = updates.name;
    }
    if (updates.status !== undefined) {
      if (updates.status === 'active') {
        folder.status = Folder.Status.Active;
      } else if (updates.status === 'dropped') {
        folder.status = Folder.Status.Dropped;
      }
    }

    return JSON.stringify({
      success: true,
      folderId: folderId,
      name: folder.name(),
      status: folder.status.name()
    });
  } catch (error) {
    return JSON.stringify({
      error: true,
      message: "Failed to update folder: " + error.toString(),
      details: error.message
    });
  }
`;

export const DELETE_FOLDER_SCRIPT = `
  const folderId = {{folderId}};
  const moveContentsTo = {{moveContentsTo}};

  try {
    // Find folder by ID
    const allFolders = doc.flattenedFolders();
    let folder = null;
    for (let i = 0; i < allFolders.length; i++) {
      if (allFolders[i].id() === folderId) {
        folder = allFolders[i];
        break;
      }
    }
    if (!folder) {
      return JSON.stringify({ error: true, message: 'Folder not found' });
    }

    // Move contents if requested
    if (moveContentsTo !== null) {
      let targetFolder = null;
      for (let i = 0; i < allFolders.length; i++) {
        if (allFolders[i].id() === moveContentsTo) {
          targetFolder = allFolders[i];
          break;
        }
      }
      if (!targetFolder) {
        return JSON.stringify({ error: true, message: 'Target folder not found' });
      }

      // Move child folders
      try {
        const childFolders = folder.folders();
        if (childFolders.length > 0) {
          const foldersArray = [];
          for (let i = 0; i < childFolders.length; i++) {
            foldersArray.push(childFolders[i]);
          }
          doc.moveSections(foldersArray, targetFolder.folders.ending);
        }
      } catch (e) {}

      // Move projects
      try {
        const projects = folder.projects();
        if (projects.length > 0) {
          const projectsArray = [];
          for (let i = 0; i < projects.length; i++) {
            projectsArray.push(projects[i]);
          }
          doc.moveSections(projectsArray, targetFolder.projects.ending);
        }
      } catch (e) {}
    }

    // Drop the folder
    folder.status = Folder.Status.Dropped;

    return JSON.stringify({
      success: true,
      folderId: folderId,
      contentsMoved: moveContentsTo !== null
    });
  } catch (error) {
    return JSON.stringify({
      error: true,
      message: "Failed to delete folder: " + error.toString(),
      details: error.message
    });
  }
`;

export const GET_FOLDER_CONTENTS_SCRIPT = `
  const folderId = {{folderId}};

  try {
    // Find folder by ID
    const allFolders = doc.flattenedFolders();
    let folder = null;
    for (let i = 0; i < allFolders.length; i++) {
      if (allFolders[i].id() === folderId) {
        folder = allFolders[i];
        break;
      }
    }
    if (!folder) {
      return JSON.stringify({ error: true, message: 'Folder not found' });
    }

    // Get child folders
    const folders = [];
    try {
      const childFolders = folder.folders();
      for (let i = 0; i < childFolders.length; i++) {
        folders.push({
          id: childFolders[i].id(),
          name: childFolders[i].name(),
          status: childFolders[i].status.name()
        });
      }
    } catch (e) {}

    // Get projects
    const projects = [];
    try {
      const folderProjects = folder.projects();
      for (let i = 0; i < folderProjects.length; i++) {
        projects.push({
          id: folderProjects[i].id(),
          name: folderProjects[i].name(),
          status: folderProjects[i].status.name()
        });
      }
    } catch (e) {}

    return JSON.stringify({
      folderId: folderId,
      folderName: folder.name(),
      folders: folders,
      projects: projects
    });
  } catch (error) {
    return JSON.stringify({
      error: true,
      message: "Failed to get folder contents: " + error.toString(),
      details: error.message
    });
  }
`;

export const MOVE_TO_FOLDER_SCRIPT = `
  const itemId = {{itemId}};
  const itemType = {{itemType}};
  const targetFolderId = {{targetFolderId}};

  try {
    // Find target folder
    const allFolders = doc.flattenedFolders();
    let targetFolder = null;
    for (let i = 0; i < allFolders.length; i++) {
      if (allFolders[i].id() === targetFolderId) {
        targetFolder = allFolders[i];
        break;
      }
    }
    if (!targetFolder) {
      return JSON.stringify({ error: true, message: 'Target folder not found' });
    }

    if (itemType === 'folder') {
      // Find folder to move
      let folder = null;
      for (let i = 0; i < allFolders.length; i++) {
        if (allFolders[i].id() === itemId) {
          folder = allFolders[i];
          break;
        }
      }
      if (!folder) {
        return JSON.stringify({ error: true, message: 'Folder to move not found' });
      }

      // Move folder
      doc.moveSections([folder], targetFolder.folders.ending);

      return JSON.stringify({
        success: true,
        itemId: itemId,
        itemType: 'folder',
        movedTo: targetFolderId
      });

    } else if (itemType === 'project') {
      // Find project to move
      const allProjects = doc.flattenedProjects();
      let project = null;
      for (let i = 0; i < allProjects.length; i++) {
        if (allProjects[i].id() === itemId) {
          project = allProjects[i];
          break;
        }
      }
      if (!project) {
        return JSON.stringify({ error: true, message: 'Project to move not found' });
      }

      // Move project
      doc.moveSections([project], targetFolder.projects.ending);

      return JSON.stringify({
        success: true,
        itemId: itemId,
        itemType: 'project',
        movedTo: targetFolderId
      });

    } else {
      return JSON.stringify({ error: true, message: 'Invalid itemType: must be "folder" or "project"' });
    }
  } catch (error) {
    return JSON.stringify({
      error: true,
      message: "Failed to move item: " + error.toString(),
      details: error.message
    });
  }
`;
