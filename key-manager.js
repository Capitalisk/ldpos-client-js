const util = require('util');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);
const lockfile = require('lockfile');
const lock = util.promisify(lockfile.lock);
const unlock = util.promisify(lockfile.unlock);

const DEFAULT_KEY_INDEX_DIR_PATH = path.resolve(__dirname, 'data');
const DEFAULT_KEY_INDEX_FILE_EXTENSION = '';
const DEFAULT_LOCK_FILE_EXTENSION = '.lock';
const DEFAULT_LOCK_WAIT = 3000;
const DEFAULT_LOCK_RETRIES = 20;
const DEFAULT_LOCK_RETRY_WAIT = 100;
const DEFAULT_LOCK_POLL_PERIOD = 100;
const DEFAULT_LOCK_STALE = 5000;

class KeyManager {
  constructor(options) {
    this.keyIndexDirPath = options.keyIndexDirPath == null ? DEFAULT_KEY_INDEX_DIR_PATH : options.keyIndexDirPath;
    this.keyIndexFileExtension = options.keyIndexFileExtension == null ? DEFAULT_KEY_INDEX_FILE_EXTENSION : options.keyIndexFileExtension;
    let { lockFileExtension, ...lockOptions } = options.keyIndexFileLockOptions || {};
    this.lockFileExtension = lockFileExtension || DEFAULT_LOCK_FILE_EXTENSION;
    this.lockOptions = {
      wait: DEFAULT_LOCK_WAIT,
      retries: DEFAULT_LOCK_RETRIES,
      retryWait: DEFAULT_LOCK_RETRY_WAIT,
      pollPeriod: DEFAULT_LOCK_POLL_PERIOD,
      stale: DEFAULT_LOCK_STALE,
      ...lockOptions
    };
  }

  async lockFile(targetFilePath) {
    try {
      return await lock(`${targetFilePath}${this.lockFileExtension}`, {...this.lockOptions});
    } catch (error) {
      throw new Error(
        `Failed to lock the key index file ${targetFilePath} because of error: ${error.message}`
      );
    }
  }

  async unlockFile(targetFilePath) {
    return unlock(`${targetFilePath}${this.lockFileExtension}`);
  }

  getKeyFilePath(key) {
    let safeKey = encodeURIComponent(key);
    return path.resolve(this.keyIndexDirPath, `${safeKey}${this.keyIndexFileExtension}`);
  }

  async incrementKeyIndex(key) {
    let targetFilePath = this.getKeyFilePath(key);
    await this.lockFile(targetFilePath);
    let keyIndex = await this._loadKeyIndexFromFile(targetFilePath, key);
    await this._saveKeyIndexToFile(targetFilePath, key, ++keyIndex);
    await this.unlockFile(targetFilePath);
    return keyIndex;
  }

  async saveKeyIndex(key, value) {
    let targetFilePath = this.getKeyFilePath(key);
    await this.lockFile(targetFilePath);
    let result = await this._saveKeyIndexToFile(targetFilePath, key, value);
    await this.unlockFile(targetFilePath);
    return result;
  }

  async loadKeyIndex(key) {
    let targetFilePath = this.getKeyFilePath(key);
    await this.lockFile(targetFilePath);
    let keyIndex = await this._loadKeyIndexFromFile(targetFilePath, key);
    await this.unlockFile(targetFilePath);
    return keyIndex;
  }

  async deleteKeyIndex(key) {
    let targetFilePath = this.getKeyFilePath(key);
    await this.lockFile(targetFilePath);
    try {
      await unlink(targetFilePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        await this.unlockFile(targetFilePath);
        throw new Error(
          `Failed to delete the ${key} item from the file system because of error: ${error.message}`
        );
      }
    }
    await this.unlockFile(targetFilePath);
  }

  async _saveKeyIndexToFile(targetFilePath, key, value) {
    try {
      return await writeFile(targetFilePath, String(value), { encoding: 'utf8', flag: 'w' });
    } catch (error) {
      throw new Error(
        `Failed to save the ${key} item to the file system because of error: ${error.message}`
      );
    }
  }

  async _loadKeyIndexFromFile(targetFilePath, key) {
    try {
      return Number((await readFile(targetFilePath, { encoding: 'utf8' })) || 0);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return 0;
      }
      throw new Error(
        `Failed to load the ${key} item from the file system because of error: ${error.message}`
      );
    }
  }
}

module.exports = KeyManager;
