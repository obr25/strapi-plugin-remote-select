import { describe, expect, it } from 'vitest';
import { getRemoteSelectRegisterOptions } from './getRemoteSelectRegisterOptions';

function findAdvancedItem(options: ReturnType<typeof getRemoteSelectRegisterOptions>, name: string) {
  for (const entry of options.advanced ?? []) {
    if ('items' in entry) {
      const found = entry.items.find((item: any) => item.name === name);
      if (found) return found;
    } else if ((entry as any).name === name) {
      return entry;
    }
  }
  return undefined;
}

describe('getRemoteSelectRegisterOptions', () => {
  describe('unique field', () => {
    it('includes unique checkbox for single base field', () => {
      const options = getRemoteSelectRegisterOptions('base', false);
      expect(findAdvancedItem(options, 'unique')).toBeDefined();
    });

    it('includes unique checkbox for single searchable field', () => {
      const options = getRemoteSelectRegisterOptions('searchable', false);
      expect(findAdvancedItem(options, 'unique')).toBeDefined();
    });

    it('excludes unique checkbox for multi base field', () => {
      const options = getRemoteSelectRegisterOptions('base', true);
      expect(findAdvancedItem(options, 'unique')).toBeUndefined();
    });

    it('excludes unique checkbox for multi searchable field', () => {
      const options = getRemoteSelectRegisterOptions('searchable', true);
      expect(findAdvancedItem(options, 'unique')).toBeUndefined();
    });

    it('defaults to single (isMulti=false) when omitted', () => {
      const options = getRemoteSelectRegisterOptions('base');
      expect(findAdvancedItem(options, 'unique')).toBeDefined();
    });

    it('unique checkbox has correct type and i18n keys', () => {
      const options = getRemoteSelectRegisterOptions('base', false);
      const unique = findAdvancedItem(options, 'unique');
      expect(unique.type).toBe('checkbox');
      expect(unique.intlLabel.id).toBe('form.attribute.item.uniqueField');
      expect(unique.description.id).toBe('form.attribute.item.uniqueField.description');
    });
  });

  describe('always-present advanced fields', () => {
    it('always includes required and private checkboxes', () => {
      for (const isMulti of [true, false]) {
        const options = getRemoteSelectRegisterOptions('base', isMulti);
        expect(findAdvancedItem(options, 'required')).toBeDefined();
        expect(findAdvancedItem(options, 'private')).toBeDefined();
      }
    });
  });
});
