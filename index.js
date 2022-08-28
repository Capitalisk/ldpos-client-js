/**
 * @typedef {('forging' | 'multisig' | 'sig')} Type
 * @typedef {Object} Transaction
 */

const SCAdapter = require('./sc-adapter');
const KeyManager = require('./key-manager');

const {
  merkle,
  generateWallet,
  computePublicKeysFromPassphrase,
  computeWalletAddressFromPassphrase,
  computeWalletAddressFromPublicKey,
  computeSeedFromPassphrase,
  computePublicKeyFromSeed,
  computeTreeFromSeed,
  computeTreeName,
  computeWalletAddressFromSeed,
  computeTreeIndex,
  computeLeafIndex,
  computeId,
  validatePassphrase,
  validateWalletAddress,
  getAllObjectKeySet,
  getAllObjectKeys,
  stringifyObject,
  stringifyObjectWithMetadata,
  sha256,
  LEAF_COUNT,
  SEED_ENCODING,
  NODE_ENCODING,
  SIGNATURE_ENCODING,
  ID_ENCODING,
  ID_LENGTH,
  WALLET_ADDRESS_BASE_BYTE_LENGTH,
  HEX_REGEX
} = require('./utils');

// TODO: Add methods for proving or disproving a signed transaction based on signatureHash.

class LDPoSClient {
  /**
   * Initialize LDPoSClient
   * @param {Object} [options={}]
   * @param {string} [options.networkSymbol]
   * @param {boolean} [options.verifyNetwork=true]
   * @param {any} [options.adapter]
   * @param {string} [options.hostname]
   * @param {number} [options.port]
   * @param {any} [options.keyManager]
   */
  constructor(options) {
    this.options = options || {};
    let { networkSymbol, verifyNetwork } = this.options;
    this.networkSymbol = networkSymbol;
    this.verifyNetwork = verifyNetwork == null ? true : verifyNetwork;
    if (this.networkSymbol == null) {
      throw new Error('A networkSymbol option must be specified when instantiating the client');
    }
    if (this.options.adapter) {
      this.adapter = this.options.adapter;
    } else {
      if (
        this.options.hostname == null ||
        this.options.port == null
      ) {
        throw new Error(
          'If a custom adapter is not specified, then a hostname and port must be specified'
        );
      }
      this.adapter = new SCAdapter(this.options);
    }
    if (this.options.keyManager) {
      this.keyManager = this.options.keyManager;
    } else {
      this.keyManager = new KeyManager(this.options);
    }
  }

  /**
   * Connect to the chain
   * @param {Object} [options={}]
   * @param {boolean} [options.verifyNetwork=true]
   * @param {string} options.passphrase
   * @param {string} [options.multisigPassphrase]
   * @param {string} [options.forgingPassphrase]
   * @param {string} [options.walletAddress] Can be derived from passphrase
   * @param {number} [options.forgingKeyIndex]
   * @param {number} [options.multisigKeyIndex]
   * @param {number} [options.sigKeyIndex]
   * @returns {void}
   */
  async connect(options) {
    options = options || {};

    if (this.adapter.connect) {
      await this.adapter.connect();
    }

    if (this.verifyNetwork) {
      this.verifyAdapterSupportsMethod('getNetworkSymbol');
      let targetNetworkSymbol = await this.adapter.getNetworkSymbol();
      if (targetNetworkSymbol !== this.networkSymbol) {
        `The network symbol of the target node was different from that of the client; it was ${
          targetNetworkSymbol
        } but the client expected ${
          this.networkSymbol
        }`
      }
    }

    if (!options.passphrase) {
      return;
    }

    this.passphrase = options.passphrase;
    this.seed = computeSeedFromPassphrase(this.passphrase);

    this.sigPassphrase = this.passphrase;
    this.sigSeed = this.seed;

    if (options.multisigPassphrase) {
      this.multisigPassphrase = options.multisigPassphrase;
      this.multisigSeed = computeSeedFromPassphrase(this.multisigPassphrase);
    } else {
      this.multisigPassphrase = this.passphrase;
      this.multisigSeed = this.seed;
    }
    if (options.forgingPassphrase) {
      this.forgingPassphrase = options.forgingPassphrase;
      this.forgingSeed = computeSeedFromPassphrase(this.forgingPassphrase);
    } else {
      this.forgingPassphrase = this.passphrase;
      this.forgingSeed = this.seed;
    }

    if (options.walletAddress == null) {
      this.walletAddress = await computeWalletAddressFromSeed(this.networkSymbol, this.sigSeed);
    } else {
      this.walletAddress = options.walletAddress;
    }

    if (options.forgingKeyIndex == null) {
      this.forgingKeyIndex = await this.loadKeyIndex('forgingKeyIndex');
    } else {
      await this.saveKeyIndex('forgingKeyIndex', options.forgingKeyIndex);
      this.forgingKeyIndex = options.forgingKeyIndex;
    }
    if (options.multisigKeyIndex == null) {
      this.multisigKeyIndex = await this.loadKeyIndex('multisigKeyIndex');
    } else {
      await this.saveKeyIndex('multisigKeyIndex', options.multisigKeyIndex);
      this.multisigKeyIndex = options.multisigKeyIndex;
    }
    if (options.sigKeyIndex == null) {
      this.sigKeyIndex = await this.loadKeyIndex('sigKeyIndex');
    } else {
      await this.saveKeyIndex('sigKeyIndex', options.sigKeyIndex);
      this.sigKeyIndex = options.sigKeyIndex;
    }

    await Promise.all([
      this.makeForgingTreesFromKeyIndex(this.forgingKeyIndex),
      this.makeMultisigTreesFromKeyIndex(this.multisigKeyIndex),
      this.makeSigTreesFromKeyIndex(this.sigKeyIndex)
    ]);
  }

  /**
   * Disconnect from the adapter
   * @returns {void}
   */
  disconnect() {
    if (this.adapter.disconnect) {
      this.adapter.disconnect();
    }
  }

  /**
   * Syncs all key indexes
   * @returns {Object}
   */
  async syncAllKeyIndexes() {
    if (!this.passphrase) {
      throw new Error(
        'Client must be connected with a passphrase in order to sync key indexes'
      );
    }
    let accountPromise = this.getAccount(this.walletAddress);
    try {
      let [ sig, multisig, forging ] = await Promise.all([
        this.syncKeyIndex('sig', accountPromise),
        this.syncKeyIndex('multisig', accountPromise),
        this.syncKeyIndex('forging', accountPromise)
      ]);
      return {
        sig,
        multisig,
        forging
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Transforms string to capitalized string
   * @param {string} str
   * @returns {string} Uppercase string
   */
  capitalizeString(str) {
    return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
  }

  /**
   * Sync's key index of specific type
   * @param {Type} type 
   * @param {string} sourceAccount 
   * @returns {true | false | null}
   */
  async syncKeyIndex(type, sourceAccount) {
    if (!this.passphrase) {
      throw new Error(
        'Client must be connected with a passphrase in order to sync a key index'
      );
    }
    if (type !== 'forging' && type !== 'multisig' && type !== 'sig') {
      throw new Error(`The ${type} key index type was invalid`);
    }
    let keyIndexName = `${type}KeyIndex`;
    let [ account, storedKeyIndex ] = await Promise.all([
      (async () => {
        try {
          return sourceAccount ? await sourceAccount : await this.getAccount(this.walletAddress);
        } catch (error) {
          if (error.name !== 'AccountDidNotExistError') {
            throw error;
          }
        }
        return null;
      })(),
      this.loadKeyIndex(keyIndexName)
    ]);
    if (!account) {
      return false;
    }
    let accountNextKeyIndexName = `next${this.capitalizeString(keyIndexName)}`;
    let accountNextKeyIndex = account[accountNextKeyIndexName];
    if (!Number.isInteger(accountNextKeyIndex) || accountNextKeyIndex < 1) {
      return false;
    }
    let accountKeyIndex = accountNextKeyIndex - 1;
    let publicKeyName = `${type}PublicKey`;
    let accountPublicKey = account[publicKeyName];
    let accountNextPublicKey = account[`next${this.capitalizeString(publicKeyName)}`];

    let isKeyIndexValid = await this.verifyKeyIndex(type, accountKeyIndex, accountPublicKey, accountNextPublicKey);
    if (!isKeyIndexValid) {
      throw new Error(
        `The target node sent back a key index which does not correspond to the ${
          type
        } public key of the account`
      );
    }

    let isNew = accountKeyIndex > storedKeyIndex;
    if (isNew) {
      await this.saveKeyIndex(keyIndexName, accountKeyIndex);
      if (type === 'forging') {
        this.forgingKeyIndex = accountKeyIndex;
        await this.makeForgingTreesFromKeyIndex(accountKeyIndex);
      } else if (type === 'multisig') {
        this.multisigKeyIndex = accountKeyIndex;
        await this.makeMultisigTreesFromKeyIndex(accountKeyIndex);
      } else {
        this.sigKeyIndex = accountKeyIndex;
        await this.makeSigTreesFromKeyIndex(accountKeyIndex);
      }
    }
    return isNew;
  }

  /**
   * 
   * @param {Type} type 
   * @param {number} keyIndex 
   * @param {string} publicKey 
   * @param {string} nextPublicKey 
   * @returns {boolean}
   */
  async verifyKeyIndex(type, keyIndex, publicKey, nextPublicKey) {
    if (!this.passphrase) {
      throw new Error(
        'Client must be connected with a passphrase in order to verify a key index'
      );
    }
    if (type !== 'forging' && type !== 'multisig' && type !== 'sig') {
      throw new Error(`The specified type was invalid`);
    }
    let seed = this[`${type}Seed`];
    let treeIndex = computeTreeIndex(keyIndex);
    let [ targetTree, targetNextTree ] = await Promise.all([
      computeTreeFromSeed(this.networkSymbol, seed, type, treeIndex),
      computeTreeFromSeed(this.networkSymbol, seed, type, treeIndex + 1)
    ]);

    return publicKey === targetTree.publicRootHash && nextPublicKey === targetNextTree.publicRootHash;
  }

  /**
   *
   * @param {Type} type
   * @returns
   */
  async incrementKeyIndex(type) {
    return this.keyManager.incrementKeyIndex(`${this.walletAddress}-${type}`);
  }

  /**
   *
   * @param {Type} type
   * @returns
   */
  async loadKeyIndex(type) {
    return this.keyManager.loadKeyIndex(`${this.walletAddress}-${type}`);
  }

  /**
   *
   * @param {Type} type
   * @param {*} value
   * @returns
   */
  async saveKeyIndex(type, value) {
    return this.keyManager.saveKeyIndex(`${this.walletAddress}-${type}`, value);
  }

  /**
   * Generates a wallet based on the network symbol
   * @returns {string} Wallet address
   */
  async generateWallet() {
    return generateWallet(this.networkSymbol);
  }

  /**
   * Computes wallet address from passphrase
   * @param {string} passphrase Passphrase 12-word mnemonic
   * @returns {string} Wallet address
   */
  async computeWalletAddressFromPassphrase(passphrase) {
    return computeWalletAddressFromPassphrase(this.networkSymbol, passphrase);
  }

  /**
   * Validates passphrase
   * @param {string} passphrase  Passphrase 12-word mnemonic
   * @returns {boolean}
   */
  validatePassphrase(passphrase) {
    return validatePassphrase(passphrase);
  }

  /**
   * Validates wallet address
   * @param {string} walletAddress Token symbol followed by 40 hexadecimal characters (e.g. clsk57c12965bf0b92aa4eab8b8e87aa9f3a2dac21d8)
   * @returns {boolean}
   */
  validateWalletAddress(walletAddress) {
    return validateWalletAddress(this.networkSymbol, walletAddress);
  }

  /**
   * Encodes messages
   * @param {string} message 
   * @param {*} encoding 
   * @returns {string}
   */
  sha256(message, encoding) {
    return sha256(message, encoding);
  }

  /**
   * Get's a wallets address
   * @description Only works if a passphrase is provided during the connection phase.
   * @returns {string} Wallet address
   */
  getWalletAddress() {
    if (!this.passphrase) {
      throw new Error(
        'Client must be connected with a passphrase in order to get the wallet address'
      );
    }
    return this.walletAddress;
  }

  /**
   * 
   * @param {*} transaction 
   * @returns 
   */
  async prepareTransaction(transaction) {
    if (!this.passphrase) {
      throw new Error('Client must be connected with a passphrase in order to prepare a transaction');
    }
    let extendedTransaction = {
      ...transaction,
      senderAddress: this.walletAddress
    };

    let transactionId = computeId(extendedTransaction);

    await this.incrementSigKey();

    extendedTransaction.sigPublicKey = this.sigTree.publicRootHash;
    extendedTransaction.nextSigPublicKey = this.nextSigTree.publicRootHash;
    extendedTransaction.nextSigKeyIndex = this.sigKeyIndex + 1;

    extendedTransaction.id = transactionId;
    let extendedTransactionWithIdJSON = stringifyObject(extendedTransaction);
    let leafIndex = computeLeafIndex(this.sigKeyIndex);
    let senderSignature = merkle.sign(extendedTransactionWithIdJSON, this.sigTree, leafIndex);

    return {
      ...extendedTransaction,
      senderSignature
    };
  }

  /**
   * 
   * @param {*} options 
   * @returns 
   */
  async prepareRegisterMultisigWallet(options) {
    options = options || {};
    let { memberAddresses, requiredSignatureCount } = options;
    return this.prepareTransaction({
      type: 'registerMultisigWallet',
      fee: options.fee,
      memberAddresses,
      requiredSignatureCount,
      timestamp: options.timestamp == null ? Date.now() : options.timestamp,
      message: options.message == null ? '' : options.message
    });
  }

  /**
   * 
   * @param {*} options 
   * @returns 
   */
  async prepareRegisterSigDetails(options) {
    options = options || {};
    let sigPassphrase = options.sigPassphrase || this.sigPassphrase;
    let newNextSigKeyIndex = options.newNextSigKeyIndex || 0;
    let treeIndex = computeTreeIndex(newNextSigKeyIndex);
    let seed = computeSeedFromPassphrase(sigPassphrase);
    let [ mssTree, nextMSSTree ] = await Promise.all([
      computeTreeFromSeed(this.networkSymbol, seed, 'sig', treeIndex),
      computeTreeFromSeed(this.networkSymbol, seed, 'sig', treeIndex + 1)
    ]);
    return this.prepareTransaction({
      type: 'registerSigDetails',
      fee: options.fee,
      newSigPublicKey: mssTree.publicRootHash,
      newNextSigPublicKey: nextMSSTree.publicRootHash,
      newNextSigKeyIndex,
      timestamp: options.timestamp == null ? Date.now() : options.timestamp,
      message: options.message == null ? '' : options.message
    });
  }

  /**
   * 
   * @param {*} options 
   * @returns 
   */
  async prepareRegisterMultisigDetails(options) {
    options = options || {};
    let multisigPassphrase = options.multisigPassphrase || this.multisigPassphrase;
    let newNextMultisigKeyIndex = options.newNextMultisigKeyIndex || 0;
    let treeIndex = computeTreeIndex(newNextMultisigKeyIndex);
    let seed = computeSeedFromPassphrase(multisigPassphrase);
    let [ mssTree, nextMSSTree ] = await Promise.all([
      computeTreeFromSeed(this.networkSymbol, seed, 'multisig', treeIndex),
      computeTreeFromSeed(this.networkSymbol, seed, 'multisig', treeIndex + 1)
    ]);
    return this.prepareTransaction({
      type: 'registerMultisigDetails',
      fee: options.fee,
      newMultisigPublicKey: mssTree.publicRootHash,
      newNextMultisigPublicKey: nextMSSTree.publicRootHash,
      newNextMultisigKeyIndex,
      timestamp: options.timestamp == null ? Date.now() : options.timestamp,
      message: options.message == null ? '' : options.message
    });
  }

  /**
   * 
   * @param {*} options 
   * @returns 
   */
  async prepareRegisterForgingDetails(options) {
    options = options || {};
    let forgingPassphrase = options.forgingPassphrase || this.forgingPassphrase;
    let newNextForgingKeyIndex = options.newNextForgingKeyIndex || 0;
    let treeIndex = computeTreeIndex(newNextForgingKeyIndex);
    let seed = computeSeedFromPassphrase(forgingPassphrase);
    let [ mssTree, nextMSSTree ] = await Promise.all([
      computeTreeFromSeed(this.networkSymbol, seed, 'forging', treeIndex),
      computeTreeFromSeed(this.networkSymbol, seed, 'forging', treeIndex + 1)
    ]);
    return this.prepareTransaction({
      type: 'registerForgingDetails',
      fee: options.fee,
      newForgingPublicKey: mssTree.publicRootHash,
      newNextForgingPublicKey: nextMSSTree.publicRootHash,
      newNextForgingKeyIndex,
      timestamp: options.timestamp == null ? Date.now() : options.timestamp,
      message: options.message == null ? '' : options.message
    });
  }

  /**
   * 
   * @param {*} transaction 
   * @returns 
   */
  verifyTransactionId(transaction) {
    let {
      id,
      senderSignature,
      senderSignatureHash,
      signatures,
      sigPublicKey,
      nextSigPublicKey,
      nextSigKeyIndex,
      ...simplifiedTransaction
    } = transaction;
    let expectedId = computeId(simplifiedTransaction);
    return id === expectedId;
  }

  /**
   * 
   * @param {*} transaction 
   * @returns 
   */
  verifyTransaction(transaction) {
    if (!this.verifyTransactionId(transaction)) {
      return false;
    }
    let { senderSignature, signatures, ...rawTransaction } = transaction;
    let transactionJSON = stringifyObject(rawTransaction);
    return merkle.verify(transactionJSON, senderSignature, transaction.sigPublicKey);
  }

  /**
   * 
   * @param {*} transaction 
   * @returns 
   */
  prepareMultisigTransaction(transaction) {
    if (!this.passphrase && !transaction.senderAddress) {
      throw new Error(
        'Client must be connected with a passphrase in order to prepare a multisig transaction without specifying a senderAddress'
      );
    }
    let extendedTransaction = {
      ...transaction,
      senderAddress: transaction.senderAddress || this.walletAddress
    };

    extendedTransaction.id = computeId(extendedTransaction);
    extendedTransaction.signatures = [];

    return extendedTransaction;
  }

  /**
   * 
   * @param {*} preparedTransaction 
   * @returns 
   */
  async signMultisigTransaction(preparedTransaction) {
    if (!this.passphrase) {
      throw new Error('Client must be connected with a passphrase in order to sign a multisig transaction');
    }
    let { senderSignature, signatures, ...rawTransaction } = preparedTransaction;

    await this.incrementMultisigKey();

    let metaPacket = {
      signerAddress: this.walletAddress,
      multisigPublicKey: this.multisigTree.publicRootHash,
      nextMultisigPublicKey: this.nextMultisigTree.publicRootHash,
      nextMultisigKeyIndex: this.multisigKeyIndex + 1
    };

    let signablePacketJSON = stringifyObjectWithMetadata(rawTransaction, metaPacket);
    let leafIndex = computeLeafIndex(this.multisigKeyIndex);
    let signature = merkle.sign(signablePacketJSON, this.multisigTree, leafIndex);

    return {
      ...metaPacket,
      signature
    };
  }

  /**
   * 
   * @param {*} preparedTransaction 
   * @param {*} signaturePacket 
   * @returns 
   */
  attachMultisigTransactionSignature(preparedTransaction, signaturePacket) {
    preparedTransaction.signatures.push(signaturePacket);
    return preparedTransaction;
  }

  /**
   * 
   * @param {*} transaction 
   * @param {*} signaturePacket 
   * @returns 
   */
  verifyMultisigTransactionSignature(transaction, signaturePacket) {
    let { senderSignature, signatures, ...rawTransaction } = transaction;
    let { signature, ...metaPacket } = signaturePacket;

    let signablePacketJSON = stringifyObjectWithMetadata(rawTransaction, metaPacket);
    return merkle.verify(signablePacketJSON, signature, metaPacket.multisigPublicKey);
  }

  /**
   * 
   * @param {*} treeIndex 
   */
  async makeForgingTrees(treeIndex) {
    let [ forgingTree, nextForgingTree ] = await Promise.all([
      computeTreeFromSeed(this.networkSymbol, this.forgingSeed, 'forging', treeIndex),
      computeTreeFromSeed(this.networkSymbol, this.forgingSeed, 'forging', treeIndex + 1)
    ]);
    this.forgingTree = forgingTree;
    this.forgingPublicKey = this.forgingTree.publicRootHash;
    this.nextForgingTree = nextForgingTree;
    this.nextForgingPublicKey = this.nextForgingTree.publicRootHash;
  }

  /**
   * 
   * @param {*} keyIndex 
   */
  async makeForgingTreesFromKeyIndex(keyIndex) {
    await this.makeForgingTrees(computeTreeIndex(keyIndex));
  }

  /**
   * 
   */
  async incrementForgingKey() {
    if (!this.passphrase) {
      throw new Error(
        'Client must be connected with a passphrase in order to increment the forging key'
      );
    }
    let currentTreeIndex = computeTreeIndex(this.forgingKeyIndex);
    this.forgingKeyIndex = await this.incrementKeyIndex('forgingKeyIndex');
    let newTreeIndex = computeTreeIndex(this.forgingKeyIndex);

    if (newTreeIndex !== currentTreeIndex) {
      await this.makeForgingTrees(newTreeIndex);
    }
  }

  /**
   * 
   * @param {*} treeIndex 
   */
  async makeMultisigTrees(treeIndex) {
    let [ multisigTree, nextMultisigTree ] = await Promise.all([
      computeTreeFromSeed(this.networkSymbol, this.multisigSeed, 'multisig', treeIndex),
      computeTreeFromSeed(this.networkSymbol, this.multisigSeed, 'multisig', treeIndex + 1)
    ]);
    this.multisigTree = multisigTree;
    this.multisigPublicKey = this.multisigTree.publicRootHash;
    this.nextMultisigTree = nextMultisigTree;
    this.nextMultisigPublicKey = this.nextMultisigTree.publicRootHash;
  }

  /**
   * 
   * @param {*} keyIndex 
   */
  async makeMultisigTreesFromKeyIndex(keyIndex) {
    await this.makeMultisigTrees(computeTreeIndex(keyIndex));
  }

  /**
   * 
   */
  async incrementMultisigKey() {
    if (!this.passphrase) {
      throw new Error(
        'Client must be connected with a passphrase in order to increment the multisig key'
      );
    }
    let currentTreeIndex = computeTreeIndex(this.multisigKeyIndex);
    this.multisigKeyIndex = await this.incrementKeyIndex('multisigKeyIndex');
    let newTreeIndex = computeTreeIndex(this.multisigKeyIndex);

    if (newTreeIndex !== currentTreeIndex) {
      await this.makeMultisigTrees(newTreeIndex);
    }
  }

  /**
   * 
   * @param {*} treeIndex 
   */
  async makeSigTrees(treeIndex) {
    let [ sigTree, nextSigTree ] = await Promise.all([
      computeTreeFromSeed(this.networkSymbol, this.sigSeed, 'sig', treeIndex),
      computeTreeFromSeed(this.networkSymbol, this.sigSeed, 'sig', treeIndex + 1)
    ]);
    this.sigTree = sigTree;
    this.sigPublicKey = this.sigTree.publicRootHash;
    this.nextSigTree = nextSigTree;
    this.nextSigPublicKey = this.nextSigTree.publicRootHash;
  }

  /**
   * 
   * @param {*} keyIndex 
   */
  async makeSigTreesFromKeyIndex(keyIndex) {
    await this.makeSigTrees(computeTreeIndex(keyIndex));
  }

  /**
   * 
   */
  async incrementSigKey() {
    if (!this.passphrase) {
      throw new Error(
        'Client must be connected with a passphrase in order to increment the sig key'
      );
    }
    let currentTreeIndex = computeTreeIndex(this.sigKeyIndex);
    this.sigKeyIndex = await this.incrementKeyIndex('sigKeyIndex');
    let newTreeIndex = computeTreeIndex(this.sigKeyIndex);

    if (newTreeIndex !== currentTreeIndex) {
      await this.makeSigTrees(newTreeIndex);
    }
  }

  /**
   * 
   * @param {*} block 
   * @returns 
   */
  async prepareBlock(block) {
    if (!this.passphrase) {
      throw new Error('Client must be connected with a passphrase in order to prepare a block');
    }
    let extendedBlock = {
      ...block,
      forgerAddress: this.walletAddress
    };

    let blockId = computeId(extendedBlock);

    await this.incrementForgingKey();

    extendedBlock.forgingPublicKey = this.forgingTree.publicRootHash;
    extendedBlock.nextForgingPublicKey = this.nextForgingTree.publicRootHash;
    extendedBlock.nextForgingKeyIndex = this.forgingKeyIndex + 1;

    extendedBlock.id = blockId;

    let extendedBlockWithIdJSON = stringifyObject(extendedBlock);
    let leafIndex = computeLeafIndex(this.forgingKeyIndex);
    let forgerSignature = merkle.sign(extendedBlockWithIdJSON, this.forgingTree, leafIndex);

    return {
      ...extendedBlock,
      forgerSignature,
      signatures: []
    };
  }

  /**
   * 
   * @param {*} preparedBlock 
   * @returns 
   */
  async signBlock(preparedBlock) {
    if (!this.passphrase) {
      throw new Error('Client must be connected with a passphrase in order to sign a block');
    }
    let { forgerSignature, signatures, ...rawBlock } = preparedBlock;

    await this.incrementForgingKey();

    let metaPacket = {
      blockId: rawBlock.id,
      signerAddress: this.walletAddress,
      forgingPublicKey: this.forgingTree.publicRootHash,
      nextForgingPublicKey: this.nextForgingTree.publicRootHash,
      nextForgingKeyIndex: this.forgingKeyIndex + 1
    };

    let signablePacketJSON = stringifyObjectWithMetadata(rawBlock, metaPacket);
    let leafIndex = computeLeafIndex(this.forgingKeyIndex);
    let signature = merkle.sign(signablePacketJSON, this.forgingTree, leafIndex);

    return {
      ...metaPacket,
      signature
    };
  }

  /**
   * 
   * @param {*} preparedBlock 
   * @param {*} signaturePacket 
   * @returns 
   */
  verifyBlockSignature(preparedBlock, signaturePacket) {
    let { forgerSignature, signatures, ...rawBlock } = preparedBlock;
    let { signature, ...metaPacket } = signaturePacket;

    let signablePacketJSON = stringifyObjectWithMetadata(rawBlock, metaPacket);
    return merkle.verify(signablePacketJSON, signature, metaPacket.forgingPublicKey);
  }

  /**
   * 
   * @param {*} block 
   * @returns 
   */
  verifyBlockId(block) {
    let {
      id,
      forgerSignature,
      signatures,
      forgingPublicKey,
      nextForgingPublicKey,
      nextForgingKeyIndex,
      ...simplifiedBlock
    } = block;
    let expectedId = computeId(simplifiedBlock);
    return id === expectedId;
  }

  /**
   * 
   * @param {*} block 
   * @returns 
   */
  verifyBlock(block) {
    if (!this.verifyBlockId(block)) {
      return false;
    }
    let { forgerSignature, signatures, ...rawBlock } = block;
    let blockJSON = stringifyObject(rawBlock);
    return merkle.verify(blockJSON, block.forgerSignature, block.forgingPublicKey);
  }

  /**
   * 
   * @param {*} type 
   * @param {*} treeIndex 
   * @returns 
   */
  async computeTree(type, treeIndex) {
    let seed;
    if (type === 'sig') {
      seed = this.sigSeed;
    } else if (type === 'multisig') {
      seed = this.multisigSeed;
    } else if (type === 'forging') {
      seed = this.forgingSeed;
    } else {
      throw new Error(
        `Tree type ${type} is invalid - It must be either sig, multisig or forging`
      );
    }
    if (!seed) {
      throw new Error(
        `Client must be instantiated with a ${
          type
        } passphrase in order to compute an MSS tree of that type`
      );
    }
    return computeTreeFromSeed(this.networkSymbol, seed, type, treeIndex);
  }

  /**
   * 
   * @param {*} message 
   * @param {*} tree 
   * @param {*} leafIndex 
   * @returns 
   */
  signMessage(message, tree, leafIndex) {
    return merkle.sign(message, tree, leafIndex);
  }

  /**
   * 
   * @param {*} message 
   * @param {*} signature 
   * @param {*} publicRootHash 
   * @returns 
   */
  verifyMessage(message, signature, publicRootHash) {
    return merkle.verify(message, signature, publicRootHash);
  }

  /**
   * 
   * @returns 
   */
  async getPeers() {
    this.verifyAdapterSupportsMethod('getPeers');
    return this.adapter.getPeers();
  }

  /**
   * 
   * @returns 
   */
  async getNodeInfo() {
    this.verifyAdapterSupportsMethod('getNodeInfo');
    return this.adapter.getNodeInfo();
  }

  /**
   * 
   * @returns 
   */
  getNodeInfoChangeConsumer() {
    this.verifyAdapterSupportsMethod('getNodeInfoChangeConsumer');
    return this.adapter.getNodeInfoChangeConsumer();
  }

  /**
   * 
   * @returns 
   */
  async getNetworkSymbol() {
    return this.networkSymbol;
  }

  /**
   * 
   * @returns 
   */
  async getChainInfo() {
    this.verifyAdapterSupportsMethod('getChainInfo');
    return this.adapter.getChainInfo();
  }

  /**
   * 
   * @returns 
   */
  async getAPIInfo() {
    this.verifyAdapterSupportsMethod('getAPIInfo');
    return this.adapter.getAPIInfo();
  }

  /**
   * 
   * @returns 
   */
  async getGenesis() {
    this.verifyAdapterSupportsMethod('getGenesis');
    return this.adapter.getGenesis();
  }

  /**
   * 
   * @param {*} walletAddress 
   * @returns 
   */
  async getAccount(walletAddress) {
    this.verifyAdapterSupportsMethod('getAccount');
    return this.adapter.getAccount(walletAddress);
  }

  /**
   * 
   * @param {*} offset 
   * @param {*} limit 
   * @param {*} order 
   * @returns 
   */
  async getAccountsByBalance(offset, limit, order) {
    this.verifyAdapterSupportsMethod('getAccountsByBalance');
    return this.adapter.getAccountsByBalance(offset, limit, order);
  }

  /**
   * 
   * @param {*} walletAddress 
   * @returns 
   */
  async getMultisigWalletMembers(walletAddress) {
    this.verifyAdapterSupportsMethod('getMultisigWalletMembers');
    return this.adapter.getMultisigWalletMembers(walletAddress);
  }

  /**
   * 
   * @param {*} transactionId 
   * @returns 
   */
  async getSignedPendingTransaction(transactionId) {
    this.verifyAdapterSupportsMethod('getSignedPendingTransaction');
    return this.adapter.getSignedPendingTransaction(transactionId);
  }

  /**
   * 
   * @param {*} walletAddress 
   * @param {*} offset 
   * @param {*} limit 
   * @returns 
   */
  async getOutboundPendingTransactions(walletAddress, offset, limit) {
    this.verifyAdapterSupportsMethod('getOutboundPendingTransactions');
    return this.adapter.getOutboundPendingTransactions(walletAddress, offset, limit);
  }

  /**
   * 
   * @returns 
   */
  async getPendingTransactionCount() {
    this.verifyAdapterSupportsMethod('getPendingTransactionCount');
    return this.adapter.getPendingTransactionCount();
  }

  /**
   * 
   * @param {*} preparedTransaction 
   * @returns 
   */
  async postTransaction(preparedTransaction) {
    this.verifyAdapterSupportsMethod('postTransaction');
    return this.adapter.postTransaction(preparedTransaction);
  }

  /**
   * 
   * @param {*} transactionId 
   * @returns 
   */
  async getTransaction(transactionId) {
    this.verifyAdapterSupportsMethod('getTransaction');
    return this.adapter.getTransaction(transactionId);
  }

  /**
   * 
   * @param {*} offset 
   * @param {*} limit 
   * @param {*} order 
   * @returns 
   */
  async getTransactionsByTimestamp(offset, limit, order) {
    this.verifyAdapterSupportsMethod('getTransactionsByTimestamp');
    return this.adapter.getTransactionsByTimestamp(offset, limit, order);
  }

  /**
   * 
   * @param {*} walletAddress 
   * @param {*} fromTimestamp 
   * @param {*} offset 
   * @param {*} limit 
   * @param {*} order 
   * @returns 
   */
  async getAccountTransactions(walletAddress, fromTimestamp, offset, limit, order) {
    this.verifyAdapterSupportsMethod('getAccountTransactions');
    return this.adapter.getAccountTransactions(walletAddress, fromTimestamp, offset, limit, order);
  }

  /**
   * 
   * @param {*} walletAddress 
   * @param {*} fromTimestamp 
   * @param {*} offset 
   * @param {*} limit 
   * @param {*} order 
   * @returns 
   */
  async getInboundTransactions(walletAddress, fromTimestamp, offset, limit, order) {
    this.verifyAdapterSupportsMethod('getInboundTransactions');
    return this.adapter.getInboundTransactions(walletAddress, fromTimestamp, offset, limit, order);
  }

  /**
   * 
   * @param {*} walletAddress 
   * @param {*} fromTimestamp 
   * @param {*} offset 
   * @param {*} limit 
   * @param {*} order 
   * @returns 
   */
  async getOutboundTransactions(walletAddress, fromTimestamp, offset, limit, order) {
    this.verifyAdapterSupportsMethod('getOutboundTransactions');
    return this.adapter.getOutboundTransactions(walletAddress, fromTimestamp, offset, limit, order);
  }

  /**
   * 
   * @param {*} blockId 
   * @param {*} offset 
   * @param {*} limit 
   * @returns 
   */
  async getTransactionsFromBlock(blockId, offset, limit) {
    this.verifyAdapterSupportsMethod('getTransactionsFromBlock');
    return this.adapter.getTransactionsFromBlock(blockId, offset, limit);
  }

  /**
   * 
   * @param {*} walletAddress 
   * @param {*} blockId 
   * @returns 
   */
  async getInboundTransactionsFromBlock(walletAddress, blockId) {
    this.verifyAdapterSupportsMethod('getInboundTransactionsFromBlock');
    return this.adapter.getInboundTransactionsFromBlock(walletAddress, blockId);
  }

  /**
   * 
   * @param {*} walletAddress 
   * @param {*} blockId 
   * @returns 
   */
  async getOutboundTransactionsFromBlock(walletAddress, blockId) {
    this.verifyAdapterSupportsMethod('getOutboundTransactionsFromBlock');
    return this.adapter.getOutboundTransactionsFromBlock(walletAddress, blockId);
  }

  /**
   * 
   * @param {*} timestamp 
   * @returns 
   */
  async getLastBlockAtTimestamp(timestamp) {
    this.verifyAdapterSupportsMethod('getLastBlockAtTimestamp');
    return this.adapter.getLastBlockAtTimestamp(timestamp);
  }

  /**
   * 
   * @returns 
   */
  async getMaxBlockHeight() {
    this.verifyAdapterSupportsMethod('getMaxBlockHeight');
    return this.adapter.getMaxBlockHeight();
  }

  /**
   * 
   * @param {*} height 
   * @param {*} limit 
   * @returns 
   */
  async getBlocksFromHeight(height, limit) {
    this.verifyAdapterSupportsMethod('getBlocksFromHeight');
    return this.adapter.getBlocksFromHeight(height, limit);
  }

  /**
   * 
   * @param {*} height 
   * @param {*} limit 
   * @returns 
   */
  async getSignedBlocksFromHeight(height, limit) {
    this.verifyAdapterSupportsMethod('getSignedBlocksFromHeight');
    return this.adapter.getSignedBlocksFromHeight(height, limit);
  }

  /**
   * 
   * @param {*} fromHeight 
   * @param {*} toHeight 
   * @param {*} limit 
   * @returns 
   */
  async getBlocksBetweenHeights(fromHeight, toHeight, limit) {
    this.verifyAdapterSupportsMethod('getBlocksBetweenHeights');
    return this.adapter.getBlocksBetweenHeights(fromHeight, toHeight, limit);
  }

  /**
   * 
   * @param {*} height 
   * @returns 
   */
  async getBlockAtHeight(height) {
    this.verifyAdapterSupportsMethod('getBlockAtHeight');
    return this.adapter.getBlockAtHeight(height);
  }

  /**
   * 
   * @param {*} blockId 
   * @returns 
   */
  async getBlock(blockId) {
    this.verifyAdapterSupportsMethod('getBlock');
    return this.adapter.getBlock(blockId);
  }

  /**
   * 
   * @param {*} blockId 
   * @returns 
   */
  async getSignedBlock(blockId) {
    this.verifyAdapterSupportsMethod('getSignedBlock');
    return this.adapter.getSignedBlock(blockId);
  }

  /**
   * 
   * @param {*} offset 
   * @param {*} limit 
   * @param {*} order 
   * @returns 
   */
  async getBlocksByTimestamp(offset, limit, order) {
    this.verifyAdapterSupportsMethod('getBlocksByTimestamp');
    return this.adapter.getBlocksByTimestamp(offset, limit, order);
  }

  /**
   * 
   * @param {*} offset 
   * @param {*} limit 
   * @param {*} order 
   * @returns 
   */
  async getDelegatesByVoteWeight(offset, limit, order) {
    this.verifyAdapterSupportsMethod('getDelegatesByVoteWeight');
    return this.adapter.getDelegatesByVoteWeight(offset, limit, order);
  }

  /**
   * 
   * @returns 
   */
  async getForgingDelegates() {
    this.verifyAdapterSupportsMethod('getForgingDelegates');
    return this.adapter.getForgingDelegates();
  }

  /**
   * 
   * @param {*} walletAddress 
   * @returns 
   */
  async getDelegate(walletAddress) {
    this.verifyAdapterSupportsMethod('getDelegate');
    return this.adapter.getDelegate(walletAddress);
  }

  /**
   * 
   * @param {*} walletAddress 
   * @param {*} offset 
   * @param {*} limit 
   * @param {*} order 
   * @returns 
   */
  async getDelegateVoters(walletAddress, offset, limit, order) {
    this.verifyAdapterSupportsMethod('getDelegateVoters');
    return this.adapter.getDelegateVoters(walletAddress, offset, limit, order);
  }

  /**
   * 
   * @param {*} walletAddress 
   * @returns 
   */
  async getAccountVotes(walletAddress) {
    this.verifyAdapterSupportsMethod('getAccountVotes');
    return this.adapter.getAccountVotes(walletAddress);
  }

  /**
   * 
   * @returns 
   */
  async getMinFees() {
    this.verifyAdapterSupportsMethod('getMinFees');
    return this.adapter.getMinFees();
  }

  /**
   * 
   * @param {*} methodName 
   */
  verifyAdapterSupportsMethod(methodName) {
    if (!this.adapter[methodName]) {
      throw new Error(
        `Client adapter does not support the ${methodName} method`
      );
    }
  }
}

/**
 * 
 * @param {*} options 
 * @returns 
 */
function createClient(options) {
  return new LDPoSClient(options);
}

module.exports = {
  LDPoSClient,
  createClient,
  merkle,
  generateWallet,
  computePublicKeysFromPassphrase,
  computeWalletAddressFromPassphrase,
  computeWalletAddressFromPublicKey,
  computeSeedFromPassphrase,
  computePublicKeyFromSeed,
  computeTreeFromSeed,
  computeTreeName,
  computeWalletAddressFromSeed,
  computeTreeIndex,
  computeLeafIndex,
  computeId,
  validatePassphrase,
  validateWalletAddress,
  getAllObjectKeySet,
  getAllObjectKeys,
  stringifyObject,
  stringifyObjectWithMetadata,
  sha256,
  LEAF_COUNT,
  SEED_ENCODING,
  NODE_ENCODING,
  SIGNATURE_ENCODING,
  ID_ENCODING,
  ID_LENGTH,
  WALLET_ADDRESS_BASE_BYTE_LENGTH,
  HEX_REGEX
};
