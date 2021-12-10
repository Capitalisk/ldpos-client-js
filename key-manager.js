const util = require('util');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);
const lockfile = require('proper-lockfile');

const DEFAULT_KEY_INDEX_DIR_PATH = path.resolve(__dirname, 'data');
const DEFAULT_KEY_INDEX_FILE_EXTENSION = '';

class KeyManager {
  constructor(options) {
    this.keyIndexDirPath = options.keyIndexDirPath == null ? DEFAULT_KEY_INDEX_DIR_PATH : options.keyIndexDirPath;
    this.keyIndexFileExtension = options.keyIndexFileExtension == null ? DEFAULT_KEY_INDEX_FILE_EXTENSION : options.keyIndexFileExtension;
    this.keyIndexFileLockOptions = {
      onCompromised: () => {},
      ...options.keyIndexFileLockOptions
    };
  }

  async lockFile(targetFilePath) {
    try {
      return await lockfile.lock(targetFilePath, this.keyIndexFileLockOptions);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return () => Promise.resolve();
      }
      throw new Error(
        `Failed to lock the key index file ${targetFilePath} because of error: ${error.message}`
      );
    }
  }

  getKeyFilePath(key) {
    let safeKey = encodeURIComponent(key);
    return path.resolve(__dirname, this.keyIndexDirPath, `${safeKey}${this.keyIndexFileExtension}`);
  }

  async incrementKeyIndex(key) {
    let targetFilePath = this.getKeyFilePath(key);
    let release = await this.lockFile(targetFilePath);
    let keyIndex = await this._loadKeyIndexFromFile(targetFilePath, key);
    await this._saveKeyIndexToFile(targetFilePath, key, ++keyIndex);
    await release();
    return keyIndex;
  }

  async saveKeyIndex(key, value) {
    let targetFilePath = this.getKeyFilePath(key);
    let release = await this.lockFile(targetFilePath);
    let result = await this._saveKeyIndexToFile(targetFilePath, key, value);
    await release();
    return result;
  }

  async loadKeyIndex(key) {
    let targetFilePath = this.getKeyFilePath(key);
    let release = await this.lockFile(targetFilePath);
    let keyIndex = await this._loadKeyIndexFromFile(targetFilePath, key);
    await release();
    return keyIndex;
  }

  async deleteKeyIndex(key) {
    let targetFilePath = this.getKeyFilePath(key);
    let release = await this.lockFile(targetFilePath);
    try {
      await unlink(targetFilePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        await release();
        throw new Error(
          `Failed to delete the ${key} item from the file system because of error: ${error.message}`
        );
      }
    }
    await release();
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
