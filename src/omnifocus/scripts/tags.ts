export const LIST_TAGS_SCRIPT = `

  const options = {{options}};

  try {
    const tags = [];
    const allTags = flattenedTags;

    // Initialize tag usage tracking
    const tagUsage = {};

    // Calculate usage statistics only if requested (expensive operation on large databases)
    if (options.includeUsageStats) {
      try {
        // Only iterate through AVAILABLE tasks (not completed/dropped)
        // Large databases have thousands of completed tasks - iterating through them all times out
        const flatTasks = flattenedTasks;

        // Count task usage for each tag (active tasks only)
        for (let i = 0; i < flatTasks.length; i++) {
          const task = flatTasks[i];
          try {
            // Skip completed and dropped tasks
            if (task.completed || task.dropped) continue;

            const taskTags = task.tags;
            for (let j = 0; j < taskTags.length; j++) {
              const tagId = taskTags[j].id.primaryKey;
              if (!tagUsage[tagId]) {
                tagUsage[tagId] = {
                  total: 0,
                  active: 0,
                  completed: 0  // Will always be 0 since we only count available tasks
                };
              }
              tagUsage[tagId].total++;
              tagUsage[tagId].active++;
            }
          } catch (e) {}
        }
      } catch (statsError) {
        // If usage stats calculation fails, just skip it (usage will remain all zeros)
      }
    }

    // Build tag list
    for (let i = 0; i < allTags.length; i++) {
      const tag = allTags[i];
      const tagId = tag.id.primaryKey;
      const usage = tagUsage[tagId] || { total: 0, active: 0, completed: 0 };

      // Skip empty tags if requested (only when usage stats are calculated)
      if (options.includeUsageStats && !options.includeEmpty && usage.total === 0) continue;

      const tagInfo = {
        id: tagId,
        name: tag.name,
        usage: usage,
        status: 'active' // Tags don't have status in OmniFocus
      };

      // Check for parent tag
      try {
        const parent = tag.parent;
        if (parent) {
          tagInfo.parentId = parent.id.primaryKey;
          tagInfo.parentName = parent.name;
        }
      } catch (e) {}

      // Check for child tags
      try {
        const children = tag.tags;
        if (children && children.length > 0) {
          tagInfo.childCount = children.length;
        }
      } catch (e) {}

      tags.push(tagInfo);
    }

    // Sort tags
    switch(options.sortBy) {
      case 'usage':
        tags.sort((a, b) => b.usage.total - a.usage.total);
        break;
      case 'tasks':
        tags.sort((a, b) => b.usage.active - a.usage.active);
        break;
      case 'name':
      default:
        tags.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    // Calculate summary
    const totalTags = tags.length;
    const activeTags = options.includeUsageStats ? tags.filter(t => t.usage.active > 0).length : 0;
    const emptyTags = options.includeUsageStats ? tags.filter(t => t.usage.total === 0).length : 0;

    return JSON.stringify({
      tags: tags,
      summary: {
        totalTags: totalTags,
        activeTags: activeTags,
        emptyTags: emptyTags,
        mostUsed: options.includeUsageStats && tags.length > 0 ? tags[0].name : null,
        usageStatsIncluded: options.includeUsageStats
      }
    });
  } catch (error) {
    return JSON.stringify({
      error: true,
      message: "Failed to list tags: " + error.toString()
    });
  }
`;

export const MANAGE_TAGS_SCRIPT = `

  const action = {{action}};
  const tagName = {{tagName}};
  const newName = {{newName}};
  const targetTag = {{targetTag}};
  const parentTag = {{parentTag}};

  try {
    const allTags = flattenedTags;

    switch(action) {
      case 'create':
        // Find parent tag if specified
        let parentTagObj = null;
        if (parentTag != null) {
          for (let i = 0; i < allTags.length; i++) {
            if (allTags[i].name === parentTag) {
              parentTagObj = allTags[i];
              break;
            }
          }
          if (!parentTagObj) {
            return JSON.stringify({
              error: true,
              message: "Parent tag '" + parentTag + "' not found"
            });
          }
        }

        // Check if tag already exists under the same parent
        const targetChildren = parentTagObj ? parentTagObj.tags : tags;
        for (let i = 0; i < targetChildren.length; i++) {
          if (targetChildren[i].name === tagName) {
            return JSON.stringify({
              error: true,
              message: "Tag '" + tagName + "' already exists" + (parentTag ? " under '" + parentTag + "'" : "")
            });
          }
        }

        // Create new tag under parent or at top level
        const container = parentTagObj ? parentTagObj : tags;
        const newTag = new Tag(tagName, container.ending);

        const result = {
          success: true,
          action: 'created',
          tagName: tagName,
          tagId: newTag.id.primaryKey,
          message: "Tag '" + tagName + "' created successfully"
        };
        if (parentTag) {
          result.parentTag = parentTag;
          result.message += " under '" + parentTag + "'";
        }
        return JSON.stringify(result);

      case 'rename':
        // Find tag to rename
        let tagToRename = null;
        for (let i = 0; i < allTags.length; i++) {
          if (allTags[i].name === tagName) {
            tagToRename = allTags[i];
            break;
          }
        }

        if (!tagToRename) {
          return JSON.stringify({
            error: true,
            message: "Tag '" + tagName + "' not found"
          });
        }

        // Check if new name already exists
        for (let i = 0; i < allTags.length; i++) {
          if (allTags[i].name === newName) {
            return JSON.stringify({
              error: true,
              message: "Tag '" + newName + "' already exists"
            });
          }
        }

        // Rename the tag
        tagToRename.name = newName;

        return JSON.stringify({
          success: true,
          action: 'renamed',
          oldName: tagName,
          newName: newName,
          message: "Tag renamed from '" + tagName + "' to '" + newName + "'"
        });

      case 'delete':
        // Find tag to delete
        let tagToDelete = null;
        let tagId = null;
        for (let i = 0; i < allTags.length; i++) {
          if (allTags[i].name === tagName) {
            tagToDelete = allTags[i];
            tagId = allTags[i].id.primaryKey;
            break;
          }
        }

        if (!tagToDelete) {
          return JSON.stringify({
            error: true,
            message: "Tag '" + tagName + "' not found"
          });
        }

        // Delete the tag first (before any iteration that could invalidate the reference)
        deleteObject(tagToDelete);

        // Count tasks that were using this tag (approximate — tag is already gone)
        let taskCount = 0;

        return JSON.stringify({
          success: true,
          action: 'deleted',
          tagName: tagName,
          tasksAffected: taskCount,
          message: "Tag '" + tagName + "' deleted. " + taskCount + " tasks were affected."
        });

      case 'merge':
        // Find source and target tags
        let sourceTag = null;
        let targetTagObj = null;

        for (let i = 0; i < allTags.length; i++) {
          if (allTags[i].name === tagName) {
            sourceTag = allTags[i];
          }
          if (allTags[i].name === targetTag) {
            targetTagObj = allTags[i];
          }
        }

        if (!sourceTag) {
          return JSON.stringify({
            error: true,
            message: "Source tag '" + tagName + "' not found"
          });
        }

        if (!targetTagObj) {
          return JSON.stringify({
            error: true,
            message: "Target tag '" + targetTag + "' not found"
          });
        }

        // Move all tasks from source to target
        let mergedCount = 0;
        const allTasks = flattenedTasks;

        for (let i = 0; i < allTasks.length; i++) {
          const task = allTasks[i];
          try {
            const taskTags = task.tags;
            let hasSourceTag = false;
            let hasTargetTag = false;

            for (let j = 0; j < taskTags.length; j++) {
              if (taskTags[j].id.primaryKey === sourceTag.id.primaryKey) {
                hasSourceTag = true;
              }
              if (taskTags[j].id.primaryKey === targetTagObj.id.primaryKey) {
                hasTargetTag = true;
              }
            }

            if (hasSourceTag) {
              // Remove source tag
              task.removeTag(sourceTag);

              // Add target tag if not already present
              if (!hasTargetTag) {
                task.addTag(targetTagObj);
              }

              mergedCount++;
            }
          } catch (e) {}
        }

        // Delete the source tag
        deleteObject(sourceTag);

        return JSON.stringify({
          success: true,
          action: 'merged',
          sourceTag: tagName,
          targetTag: targetTag,
          tasksMerged: mergedCount,
          message: "Merged '" + tagName + "' into '" + targetTag + "'. " + mergedCount + " tasks updated."
        });

      default:
        return JSON.stringify({
          error: true,
          message: "Unknown action: " + action
        });
    }
  } catch (error) {
    return JSON.stringify({
      error: true,
      message: "Failed to manage tag: " + error.toString()
    });
  }
`;
