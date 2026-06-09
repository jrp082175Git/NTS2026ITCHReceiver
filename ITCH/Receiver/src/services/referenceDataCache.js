export class ReferenceDataCache {
  constructor() {
    this.cache = new Map();
  }

  update(orderBookId, data) {
    const existing = this.cache.get(orderBookId) || {};
    this.cache.set(orderBookId, { ...existing, ...data });
  }

  get(orderBookId) {
    return this.cache.get(orderBookId);
  }

  clear() {
    this.cache.clear();
  }
}
