export const LIST_FOLDERS_SCRIPT = `

  function getFolderStatus(s) {
    if (s === Folder.Status.Active) return "active";
    if (s === Folder.Status.Dropped) return "dropped";
    return "unknown";
  }

  const maxDepth = {{maxDepth}};
  const statusFilter = {{statusFilter}};

  try {
    // Recursively build folder tree
    function buildFolderNode(folder, currentDepth) {
      const node = {
        id: folder.id.primaryKey,
        name: folder.name,
        status: getFolderStatus(folder.status)
      };

      // Count projects in folder
      try {
        const projects = folder.projects;
        node.projectCount = projects.length;
      } catch (e) {
        node.projectCount = 0;
      }

      // Add children if within depth limit
      if (maxDepth === null || currentDepth < maxDepth) {
        try {
          const childFolders = folder.folders;
          if (childFolders && childFolders.length > 0) {
            node.children = [];
            for (let i = 0; i < childFolders.length; i++) {
              // Apply status filter
              const childStatus = getFolderStatus(childFolders[i].status);
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
    const allFolders = folders;
    const result = [];

    for (let i = 0; i < allFolders.length; i++) {
      const folderStatus = getFolderStatus(allFolders[i].status);
      if (statusFilter === null || statusFilter === folderStatus) {
        result.push(buildFolderNode(allFolders[i], 0));
      }
    }

    return JSON.stringify({
      folders: result,
      count: result.length
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
      const allFolders = flattenedFolders;
      let parentFolder = null;
      for (let i = 0; i < allFolders.length; i++) {
        if (allFolders[i].id.primaryKey === parentFolderId) {
          parentFolder = allFolders[i];
          break;
        }
      }
      if (!parentFolder) {
        return JSON.stringify({ error: true, message: 'Parent folder not found' });
      }
      position = parentFolder.ending;
    } else {
      // Create at root level
      position = folders.ending;
    }

    // Create the folder
    const newFolder = new Folder(folderName, position);

    // Get the created folder's ID
    let folderId = null;
    try {
      folderId = newFolder.id.primaryKey;
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

  function getFolderStatus(s) {
    if (s === Folder.Status.Active) return "active";
    if (s === Folder.Status.Dropped) return "dropped";
    return "unknown";
  }

  const folderId = {{folderId}};
  const updates = {{updates}};

  try {
    // Find folder by ID
    const allFolders = flattenedFolders;
    let folder = null;
    for (let i = 0; i < allFolders.length; i++) {
      if (allFolders[i].id.primaryKey === folderId) {
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
      name: folder.name,
      status: getFolderStatus(folder.status)
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
    const allFolders = flattenedFolders;
    let folder = null;
    for (let i = 0; i < allFolders.length; i++) {
      if (allFolders[i].id.primaryKey === folderId) {
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
        if (allFolders[i].id.primaryKey === moveContentsTo) {
          targetFolder = allFolders[i];
          break;
        }
      }
      if (!targetFolder) {
        return JSON.stringify({ error: true, message: 'Target folder not found' });
      }

      // Move child folders
      try {
        const childFolders = folder.folders;
        if (childFolders.length > 0) {
          const foldersArray = [];
          for (let i = 0; i < childFolders.length; i++) {
            foldersArray.push(childFolders[i]);
          }
          moveSections(foldersArray, targetFolder.ending);
        }
      } catch (e) {}

      // Move projects
      try {
        const childProjects = folder.projects;
        if (childProjects.length > 0) {
          const projectsArray = [];
          for (let i = 0; i < childProjects.length; i++) {
            projectsArray.push(childProjects[i]);
          }
          moveSections(projectsArray, targetFolder.ending);
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

  function getProjectStatus(s) {
    if (s === Project.Status.Active) return "active";
    if (s === Project.Status.OnHold) return "onHold";
    if (s === Project.Status.Done) return "done";
    if (s === Project.Status.Dropped) return "dropped";
    return "unknown";
  }

  function getFolderStatus(s) {
    if (s === Folder.Status.Active) return "active";
    if (s === Folder.Status.Dropped) return "dropped";
    return "unknown";
  }

  const folderId = {{folderId}};

  try {
    // Find folder by ID
    const allFolders = flattenedFolders;
    let folder = null;
    for (let i = 0; i < allFolders.length; i++) {
      if (allFolders[i].id.primaryKey === folderId) {
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
      const childFolders = folder.folders;
      for (let i = 0; i < childFolders.length; i++) {
        folders.push({
          id: childFolders[i].id.primaryKey,
          name: childFolders[i].name,
          status: getFolderStatus(childFolders[i].status)
        });
      }
    } catch (e) {}

    // Get projects
    const projects = [];
    try {
      const folderProjects = folder.projects;
      for (let i = 0; i < folderProjects.length; i++) {
        projects.push({
          id: folderProjects[i].id.primaryKey,
          name: folderProjects[i].name,
          status: getProjectStatus(folderProjects[i].status)
        });
      }
    } catch (e) {}

    return JSON.stringify({
      folderId: folderId,
      folderName: folder.name,
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
    const allFolders = flattenedFolders;
    let targetFolder = null;
    for (let i = 0; i < allFolders.length; i++) {
      if (allFolders[i].id.primaryKey === targetFolderId) {
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
        if (allFolders[i].id.primaryKey === itemId) {
          folder = allFolders[i];
          break;
        }
      }
      if (!folder) {
        return JSON.stringify({ error: true, message: 'Folder to move not found' });
      }

      // Move folder
      moveSections([folder], targetFolder.ending);

      return JSON.stringify({
        success: true,
        itemId: itemId,
        itemType: 'folder',
        movedTo: targetFolderId
      });

    } else if (itemType === 'project') {
      // Find project to move
      const allProjects = flattenedProjects;
      let project = null;
      for (let i = 0; i < allProjects.length; i++) {
        if (allProjects[i].id.primaryKey === itemId) {
          project = allProjects[i];
          break;
        }
      }
      if (!project) {
        return JSON.stringify({ error: true, message: 'Project to move not found' });
      }

      // Move project
      moveSections([project], targetFolder.ending);

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
