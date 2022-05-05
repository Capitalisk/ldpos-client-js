const DEFAULT_KEY_INDEX_LOCAL_STORAGE_PREFIX = 'ldpos-';

class LocalStorageKeyManager {
  constructor(options) {
    this.keyIndexLocalStoragePrefix = options.keyIndexLocalStoragePrefix == null ?
      DEFAULT_KEY_INDEX_LOCAL_STORAGE_PREFIX : options.keyIndexLocalStoragePrefix;
  }

  getFullKey(key) {
    return `${this.keyIndexLocalStoragePrefix}${key}`;
  }

  incrementKeyIndex(key) {
    let keyIndex = this.loadKeyIndex(key);
    this.saveKeyIndex(key, ++keyIndex);
    return keyIndex;
  }

  saveKeyIndex(key, value) {
    let fullKey = this.getFullKey(key);
    localStorage.setItem(fullKey, value);
  }

  loadKeyIndex(key) {
    let fullKey = this.getFullKey(key);
    return Number(localStorage.getItem(fullKey) || 0);
  }

  deleteKeyIndex(key) {
    let fullKey = this.getFullKey(key);
    localStorage.removeItem(fullKey);
  }
}

module.exports = LocalStorageKeyManager;
