import { StorageAPI } from '../base';
import { HistoryStore } from '../history';
import { QueryStoreItem } from '../query';

// Use localStorage for these tests, cleared before each run
const storage = new StorageAPI();

const q1 = 'query Q1 { name }';
const v1 = '{"var": 1}';
const h1 = '{"Header": "one"}';
const e1 = '{"ext": 1}';

const q2 = 'query Q2 { value }';
const e2 = '{"ext": 2}';

const op1: QueryStoreItem = {
  query: q1,
  variables: v1,
  headers: h1,
  extensions: e1,
  operationName: 'Q1',
};
const op1noExt: QueryStoreItem = {
  query: q1,
  variables: v1,
  headers: h1,
  operationName: 'Q1',
};
const op1Ext2: QueryStoreItem = {
  query: q1,
  variables: v1,
  headers: h1,
  extensions: e2,
  operationName: 'Q1',
};
const op2: QueryStoreItem = { query: q2, extensions: e2, operationName: 'Q2' };

describe('HistoryStore', () => {
  let historyStore: HistoryStore;

  beforeEach(() => {
    storage.clear();
    // Reset history store before each test
    historyStore = new HistoryStore(storage, 20);
  });

  describe('updateHistory', () => {
    it('saves a new item with all fields including extensions', () => {
      historyStore.updateHistory(op1);
      expect(historyStore.queries).toHaveLength(1);
      expect(historyStore.queries[0]).toEqual(expect.objectContaining(op1));
    });

    it('does not save if only extensions were added to the last query', () => {
      historyStore.updateHistory(op1noExt); // Save without extensions
      expect(historyStore.queries).toHaveLength(1);
      historyStore.updateHistory(op1); // Try to save same query + extensions
      expect(historyStore.queries).toHaveLength(1); // Should still be 1
      expect(historyStore.queries[0]).toEqual(
        expect.objectContaining(op1noExt),
      ); // Check it's the original
      expect(historyStore.queries[0].extensions).toBeUndefined();
    });

    it('does not save identical item again (including extensions)', () => {
      historyStore.updateHistory(op1);
      expect(historyStore.queries).toHaveLength(1);
      historyStore.updateHistory(op1); // Try saving identical again
      expect(historyStore.queries).toHaveLength(1);
    });

    it('saves if only extensions changed', () => {
      historyStore.updateHistory(op1); // Save with e1
      expect(historyStore.queries).toHaveLength(1);
      historyStore.updateHistory(op1Ext2); // Save same query/vars/headers with e2
      expect(historyStore.queries).toHaveLength(2);
      // Check last item for most recent
      expect(historyStore.queries.at(-1)).toEqual(
        expect.objectContaining(op1Ext2),
      );
      expect(historyStore.queries[0]).toEqual(expect.objectContaining(op1));
    });

    it('saves distinct items', () => {
      historyStore.updateHistory(op1);
      historyStore.updateHistory(op2);
      expect(historyStore.queries).toHaveLength(2);
      // Check last item for most recent
      expect(historyStore.queries.at(-1)).toEqual(expect.objectContaining(op2));
      expect(historyStore.queries[0]).toEqual(expect.objectContaining(op1));
    });
  });

  describe('toggleFavorite', () => {
    it('toggles favorite status for an item with extensions', () => {
      historyStore.updateHistory(op1);
      expect(historyStore.queries[0].favorite).toBeFalsy();
      expect(historyStore.history.items).toHaveLength(1);
      expect(historyStore.favorite.items).toHaveLength(0);

      // Toggle favorite on
      historyStore.toggleFavorite(op1);
      expect(historyStore.queries).toHaveLength(1);
      expect(historyStore.queries[0].favorite).toBeTruthy();
      expect(historyStore.history.items).toHaveLength(0); // Removed from history store
      expect(historyStore.favorite.items).toHaveLength(1); // Added to favorite store
      expect(historyStore.favorite.items[0]).toEqual(
        expect.objectContaining({ ...op1, favorite: true }),
      );

      // Toggle favorite off
      historyStore.toggleFavorite({ ...op1, favorite: true });
      expect(historyStore.queries).toHaveLength(1);
      expect(historyStore.queries[0].favorite).toBeFalsy();
      expect(historyStore.history.items).toHaveLength(1); // Added back to history store
      expect(historyStore.favorite.items).toHaveLength(0); // Removed from favorite store
      expect(historyStore.history.items[0]).toEqual(
        expect.objectContaining({ ...op1, favorite: false }),
      );
    });
  });

  describe('editLabel', () => {
    it('edits label for an item with extensions', () => {
      historyStore.updateHistory(op1);
      const newLabel = 'My Label';
      historyStore.editLabel({ ...op1, label: newLabel });
      expect(historyStore.queries[0].label).toBe(newLabel);
      // Ensure other fields are preserved
      expect(historyStore.queries[0].extensions).toBe(e1);
    });
    it('edits label for a favorite item with extensions', () => {
      historyStore.updateHistory(op1);
      historyStore.toggleFavorite(op1); // Favorite it
      const newLabel = 'My Fav Label';
      historyStore.editLabel({ ...op1, favorite: true, label: newLabel });
      expect(historyStore.queries[0].label).toBe(newLabel);
      expect(historyStore.queries[0].favorite).toBeTruthy();
      expect(historyStore.queries[0].extensions).toBe(e1);
    });
  });

  describe('deleteHistory', () => {
    it('deletes an item including extensions comparison', () => {
      historyStore.updateHistory(op1);
      historyStore.updateHistory(op1Ext2);
      historyStore.updateHistory(op2);
      expect(historyStore.queries).toHaveLength(3);

      historyStore.deleteHistory(op1Ext2); // Delete the one with e2

      expect(historyStore.queries).toHaveLength(2);
      // Check that the specific item op1Ext2 was deleted
      const stillExists = historyStore.queries.some(
        item =>
          item.query === op1Ext2.query &&
          item.variables === op1Ext2.variables &&
          item.headers === op1Ext2.headers &&
          item.extensions === op1Ext2.extensions &&
          item.operationName === op1Ext2.operationName,
      );
      expect(stillExists).toBeFalsy();
      // Check remaining items are still present
      expect(
        historyStore.queries.some(item => item.extensions === e1),
      ).toBeTruthy();
      expect(historyStore.queries.some(item => item.query === q2)).toBeTruthy();
    });

    it('deletes a favorite item including extensions comparison', () => {
      historyStore.updateHistory(op1);
      historyStore.toggleFavorite(op1); // Favorite it
      expect(historyStore.queries).toHaveLength(1);
      expect(historyStore.queries[0].favorite).toBeTruthy();

      historyStore.deleteHistory({ ...op1, favorite: true });

      expect(historyStore.queries).toHaveLength(0);
    });
  });
});
