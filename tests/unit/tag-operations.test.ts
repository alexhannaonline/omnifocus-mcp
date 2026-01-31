import { describe, it, expect } from 'vitest';
import { LIST_TAGS_SCRIPT, MANAGE_TAGS_SCRIPT } from 'src/omnifocus/scripts/tags';

describe('Tag Operations Fix Verification', () => {
  it('should use correct property access without parentheses', () => {
    // Verify tag property access uses Omni Automation style (no parentheses)
    expect(LIST_TAGS_SCRIPT).toContain('tag.parent');
    expect(LIST_TAGS_SCRIPT).toContain('task.tags');
    expect(LIST_TAGS_SCRIPT).toContain('tag.name');
    expect(LIST_TAGS_SCRIPT).toContain('tag.id.primaryKey');
  });

  it('should use singular methods for tag manipulation', () => {
    // Verify we're using the correct singular methods (Omni Automation pattern)
    expect(MANAGE_TAGS_SCRIPT).toContain('task.removeTag(sourceTag)');
    expect(MANAGE_TAGS_SCRIPT).toContain('task.addTag(targetTagObj)');

    // Should not contain plural methods (JXA pattern)
    expect(MANAGE_TAGS_SCRIPT).not.toContain('task.removeTags(');
    expect(MANAGE_TAGS_SCRIPT).not.toContain('task.addTags(');
  });

  it('should return JSON stringified results', () => {
    // Verify all return statements use JSON.stringify
    const returnPattern = /return JSON\.stringify\(/g;
    const listMatches = LIST_TAGS_SCRIPT.match(returnPattern);
    const manageMatches = MANAGE_TAGS_SCRIPT.match(returnPattern);

    expect(listMatches).not.toBeNull();
    expect(listMatches!.length).toBeGreaterThan(0);
    expect(manageMatches).not.toBeNull();
    expect(manageMatches!.length).toBeGreaterThan(0);
  });
});
