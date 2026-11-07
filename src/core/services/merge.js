/**
 * Merge freshly discovered services into the existing list without disturbing
 * manual additions/edits, duplicates, or services the user has dismissed.
 *
 * @param {import('../types.js').Service[]} existing
 * @param {import('../types.js').Service[]} discovered
 * @param {string[]} [dismissed] - Discovered service ids the user deleted.
 * @returns {import('../types.js').Service[]}
 */
export function mergeDiscovered(existing, discovered, dismissed = []) {
  const existingIds = new Set(existing.map((s) => s.id));
  const existingUrls = new Set(existing.map((s) => s.url));
  const dismissedIds = new Set(dismissed);

  const merged = [...existing];
  for (const item of discovered) {
    if (existingIds.has(item.id)) continue;
    if (dismissedIds.has(item.id)) continue;
    if (existingUrls.has(item.url)) continue;
    merged.push(item);
    existingIds.add(item.id);
    existingUrls.add(item.url);
  }
  return merged;
}
