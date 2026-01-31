import { describe, it, expect } from 'vitest';
import {
  LIST_ATTACHMENTS_SCRIPT,
  ADD_LINKED_FILE_SCRIPT,
  REMOVE_ATTACHMENT_SCRIPT,
  REMOVE_LINKED_FILE_SCRIPT,
} from '../../src/omnifocus/scripts/attachments';

describe('Attachment Scripts', () => {
  it('should return JSON stringified results', () => {
    const returnPattern = /return JSON\.stringify\(/g;

    expect(LIST_ATTACHMENTS_SCRIPT.match(returnPattern)).not.toBeNull();
    expect(ADD_LINKED_FILE_SCRIPT.match(returnPattern)).not.toBeNull();
    expect(REMOVE_ATTACHMENT_SCRIPT.match(returnPattern)).not.toBeNull();
    expect(REMOVE_LINKED_FILE_SCRIPT.match(returnPattern)).not.toBeNull();
  });

  it('should use correct method calls with parentheses', () => {
    expect(LIST_ATTACHMENTS_SCRIPT).toContain('task.attachments()');
    expect(LIST_ATTACHMENTS_SCRIPT).toContain('task.linkedFileURLs()');
    expect(LIST_ATTACHMENTS_SCRIPT).toContain('attachment.preferredFilename()');
    expect(LIST_ATTACHMENTS_SCRIPT).toContain('attachment.type()');
    expect(LIST_ATTACHMENTS_SCRIPT).toContain('urls[i].string()');

    expect(REMOVE_ATTACHMENT_SCRIPT).toContain('task.attachments()');
  });

  it('should use URL.fromString for URL handling', () => {
    expect(ADD_LINKED_FILE_SCRIPT).toContain('URL.fromString(path)');
    expect(REMOVE_LINKED_FILE_SCRIPT).toContain('URL.fromString(urlString)');
  });

  it('should use addLinkedFileURL for adding linked files', () => {
    expect(ADD_LINKED_FILE_SCRIPT).toContain('task.addLinkedFileURL(url)');
  });

  it('should use removeAttachmentAtIndex for removing attachments', () => {
    expect(REMOVE_ATTACHMENT_SCRIPT).toContain('task.removeAttachmentAtIndex(index)');
  });

  it('should use removeLinkedFileWithURL for removing linked files', () => {
    expect(REMOVE_LINKED_FILE_SCRIPT).toContain('task.removeLinkedFileWithURL(url)');
  });

  it('should include placeholders for parameters', () => {
    expect(LIST_ATTACHMENTS_SCRIPT).toContain('{{taskId}}');

    expect(ADD_LINKED_FILE_SCRIPT).toContain('{{taskId}}');
    expect(ADD_LINKED_FILE_SCRIPT).toContain('{{path}}');

    expect(REMOVE_ATTACHMENT_SCRIPT).toContain('{{taskId}}');
    expect(REMOVE_ATTACHMENT_SCRIPT).toContain('{{index}}');

    expect(REMOVE_LINKED_FILE_SCRIPT).toContain('{{taskId}}');
    expect(REMOVE_LINKED_FILE_SCRIPT).toContain('{{urlString}}');
  });

  it('should validate URLs', () => {
    expect(ADD_LINKED_FILE_SCRIPT).toContain('Invalid file path or URL');
    expect(REMOVE_LINKED_FILE_SCRIPT).toContain('Invalid URL');
  });
});
