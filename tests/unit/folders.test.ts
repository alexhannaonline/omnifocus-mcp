import { describe, it, expect } from 'vitest';
import {
  LIST_FOLDERS_SCRIPT,
  CREATE_FOLDER_SCRIPT,
  UPDATE_FOLDER_SCRIPT,
  DELETE_FOLDER_SCRIPT,
  GET_FOLDER_CONTENTS_SCRIPT,
  MOVE_TO_FOLDER_SCRIPT,
} from '../../src/omnifocus/scripts/folders';

describe('Folder Scripts', () => {
  it('should return JSON stringified results', () => {
    const returnPattern = /return JSON\.stringify\(/g;

    expect(LIST_FOLDERS_SCRIPT.match(returnPattern)).not.toBeNull();
    expect(CREATE_FOLDER_SCRIPT.match(returnPattern)).not.toBeNull();
    expect(UPDATE_FOLDER_SCRIPT.match(returnPattern)).not.toBeNull();
    expect(DELETE_FOLDER_SCRIPT.match(returnPattern)).not.toBeNull();
    expect(GET_FOLDER_CONTENTS_SCRIPT.match(returnPattern)).not.toBeNull();
    expect(MOVE_TO_FOLDER_SCRIPT.match(returnPattern)).not.toBeNull();
  });

  it('should use correct method calls with parentheses', () => {
    expect(LIST_FOLDERS_SCRIPT).toContain('folder.id()');
    expect(LIST_FOLDERS_SCRIPT).toContain('folder.name()');
    expect(LIST_FOLDERS_SCRIPT).toContain('folder.status.name()');
    expect(LIST_FOLDERS_SCRIPT).toContain('folder.folders()');
    expect(LIST_FOLDERS_SCRIPT).toContain('folder.projects()');

    expect(GET_FOLDER_CONTENTS_SCRIPT).toContain('folder.folders()');
    expect(GET_FOLDER_CONTENTS_SCRIPT).toContain('folder.projects()');
  });

  it('should use correct folder creation patterns', () => {
    expect(CREATE_FOLDER_SCRIPT).toContain('app.Folder(folderName, position)');
    expect(CREATE_FOLDER_SCRIPT).toContain('doc.folders.ending');
    expect(CREATE_FOLDER_SCRIPT).toContain('parentFolder.folders.ending');
  });

  it('should handle folder status updates', () => {
    expect(UPDATE_FOLDER_SCRIPT).toContain('Folder.Status.Active');
    expect(UPDATE_FOLDER_SCRIPT).toContain('Folder.Status.Dropped');
  });

  it('should use moveSections for moving items', () => {
    expect(DELETE_FOLDER_SCRIPT).toContain('doc.moveSections');
    expect(MOVE_TO_FOLDER_SCRIPT).toContain('doc.moveSections');
  });

  it('should include placeholders for parameters', () => {
    expect(LIST_FOLDERS_SCRIPT).toContain('{{maxDepth}}');
    expect(LIST_FOLDERS_SCRIPT).toContain('{{statusFilter}}');

    expect(CREATE_FOLDER_SCRIPT).toContain('{{folderName}}');
    expect(CREATE_FOLDER_SCRIPT).toContain('{{parentFolderId}}');

    expect(UPDATE_FOLDER_SCRIPT).toContain('{{folderId}}');
    expect(UPDATE_FOLDER_SCRIPT).toContain('{{updates}}');

    expect(DELETE_FOLDER_SCRIPT).toContain('{{folderId}}');
    expect(DELETE_FOLDER_SCRIPT).toContain('{{moveContentsTo}}');

    expect(GET_FOLDER_CONTENTS_SCRIPT).toContain('{{folderId}}');

    expect(MOVE_TO_FOLDER_SCRIPT).toContain('{{itemId}}');
    expect(MOVE_TO_FOLDER_SCRIPT).toContain('{{itemType}}');
    expect(MOVE_TO_FOLDER_SCRIPT).toContain('{{targetFolderId}}');
  });

  it('should handle recursive folder tree building', () => {
    expect(LIST_FOLDERS_SCRIPT).toContain('buildFolderNode');
    expect(LIST_FOLDERS_SCRIPT).toContain('currentDepth');
  });
});
