const bip39 = require('bip39');
const LiteMerkle = require('lite-merkle');
const SCAdapter = require('./sc-adapter');
const StoreClass = require('./store');

const LEAF_COUNT = 64;
const SEED_ENCODING = 'hex';
const NODE_ENCODING = 'hex';
const SIGNATURE_ENCODING = 'base64';
const ID_ENCODING = 'hex';
const ID_LENGTH = 40;
const WALLET_ADDRESS_BASE_BYTE_LENGTH = 20;
const HEX_REGEX = /^([0-9a-f])*$/;

// TODO: Add methods for proving or disproving a signed transaction based on signatureHash.

class LDPoSClient {
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
    this.merkle = new LiteMerkle({
      leafCount: LEAF_COUNT,
      seedEncoding: SEED_ENCODING,
      nodeEncoding: NODE_ENCODING,
      signatureFormat: SIGNATURE_ENCODING
    });
    if (this.options.store) {
      this.store = this.options.store;
    } else {
      this.store = new StoreClass(this.options);
    }
  }

  computeTreeIndex(keyIndex) {
    return Math.floor(keyIndex / LEAF_COUNT);
  }

  computeLeafIndex(keyIndex) {
    return keyIndex % LEAF_COUNT;
  }

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
    this.seed = this.computeSeedFromPassphrase(this.passphrase);

    this.sigPassphrase = this.passphrase;
    this.sigSeed = this.seed;

    if (options.multisigPassphrase) {
      this.multisigPassphrase = options.multisigPassphrase;
      this.multisigSeed = this.computeSeedFromPassphrase(this.multisigPassphrase);
    } else {
      this.multisigPassphrase = this.passphrase;
      this.multisigSeed = this.seed;
    }
    if (options.forgingPassphrase) {
      this.forgingPassphrase = options.forgingPassphrase;
      this.forgingSeed = this.computeSeedFromPassphrase(this.forgingPassphrase);
    } else {
      this.forgingPassphrase = this.passphrase;
      this.forgingSeed = this.seed;
    }

    if (options.walletAddress == null) {
      this.walletAddress = await this.computeWalletAddressFromSeed(this.sigSeed);
    } else {
      this.walletAddress = options.walletAddress;
    }

    if (options.forgingKeyIndex == null) {
      this.forgingKeyIndex = await this.loadKeyIndex('forgingKeyIndex');
    } else {
      this.forgingKeyIndex = options.forgingKeyIndex;
    }
    if (options.multisigKeyIndex == null) {
      this.multisigKeyIndex = await this.loadKeyIndex('multisigKeyIndex');
    } else {
      this.multisigKeyIndex = options.multisigKeyIndex;
    }
    if (options.sigKeyIndex == null) {
      this.sigKeyIndex = await this.loadKeyIndex('sigKeyIndex');
    } else {
      this.sigKeyIndex = options.sigKeyIndex;
    }

    await Promise.all([
      this.makeForgingTreesFromKeyIndex(this.forgingKeyIndex),
      this.makeMultisigTreesFromKeyIndex(this.multisigKeyIndex),
      this.makeSigTreesFromKeyIndex(this.sigKeyIndex)
    ]);
  }

  disconnect() {
    if (this.adapter.disconnect) {
      this.adapter.disconnect();
    }
  }

  async syncAllKeyIndexes() {
    if (!this.walletAddress) {
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

  capitalizeString(str) {
    return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
  }

  async syncKeyIndex(type, sourceAccount) {
    if (!this.walletAddress) {
      throw new Error(
        'Client must be connected with a passphrase in order to sync a key index'
      );
    }
    if (type !== 'forging' && type !== 'multisig' && type !== 'sig') {
      throw new Error(`The ${type} key index type was invalid`);
    }
    let keyIndexName = `${type}KeyIndex`;
    let [ account, storedkeyIndex ] = await Promise.all([
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

    let isNew = accountNextKeyIndex > storedkeyIndex;
    if (isNew) {
      await this.saveKeyIndex(keyIndexName, accountNextKeyIndex);
      if (type === 'forging') {
        this.forgingKeyIndex = accountNextKeyIndex;
        await this.makeForgingTreesFromKeyIndex(accountNextKeyIndex);
      } else if (type === 'multisig') {
        this.multisigKeyIndex = accountNextKeyIndex;
        await this.makeMultisigTreesFromKeyIndex(accountNextKeyIndex);
      } else {
        this.sigKeyIndex = accountNextKeyIndex;
        await this.makeSigTreesFromKeyIndex(accountNextKeyIndex);
      }
    }
    return isNew;
  }

  async verifyKeyIndex(type, keyIndex, publicKey, nextPublicKey) {
    if (!this.walletAddress) {
      throw new Error(
        'Client must be connected with a passphrase in order to verify a key index'
      );
    }
    if (type !== 'forging' && type !== 'multisig' && type !== 'sig') {
      throw new Error(`The specified type was invalid`);
    }
    let seed = this[`${type}Seed`];
    let treeIndex = this.computeTreeIndex(keyIndex);
    let [ targetTree, targetNextTree ] = await Promise.all([
      this.computeTreeFromSeed(seed, type, treeIndex),
      this.computeTreeFromSeed(seed, type, treeIndex + 1)
    ]);

    return publicKey === targetTree.publicRootHash && nextPublicKey === targetNextTree.publicRootHash;
  }

  async loadKeyIndex(type) {
    return Number((await this.store.loadItem(`${this.walletAddress}-${type}`)) || 0);
  }

  async saveKeyIndex(type, value) {
    return this.store.saveItem(`${this.walletAddress}-${type}`, String(value));
  }

  async generateWallet() {
    let passphrase = bip39.generateMnemonic();
    let address = await this.computeWalletAddressFromPassphrase(passphrase);
    return {
      address,
      passphrase
    };
  }

  computeWalletAddressFromPublicKey(publicKey) {
    return `${this.networkSymbol}${
      Buffer.from(publicKey, NODE_ENCODING)
        .slice(0, WALLET_ADDRESS_BASE_BYTE_LENGTH)
        .toString('hex')
    }`;
  }

  async computePublicKeyFromSeed(seed, type, treeIndex) {
    let sigTree = await this.computeTreeFromSeed(seed, type, treeIndex);
    return sigTree.publicRootHash;
  }

  async computeWalletAddressFromSeed(seed) {
    let publicKey = await this.computePublicKeyFromSeed(seed, 'sig', 0);
    return this.computeWalletAddressFromPublicKey(publicKey);
  }

  async computeWalletAddressFromPassphrase(passphrase) {
    let seed = this.computeSeedFromPassphrase(passphrase);
    let publicKey = await this.computePublicKeyFromSeed(seed, 'sig', 0);
    return this.computeWalletAddressFromPublicKey(publicKey);
  }

  validatePassphrase(passphrase) {
    return bip39.validateMnemonic(passphrase);
  }

  validateWalletAddress(walletAddress) {
    if (typeof walletAddress !== 'string') {
      return false;
    }
    if (walletAddress.indexOf(this.networkSymbol) !== 0) {
      return false;
    }
    let addressBase = walletAddress.slice(this.networkSymbol.length);
    if (addressBase.length !== WALLET_ADDRESS_BASE_BYTE_LENGTH * 2) {
      return false;
    }
    return HEX_REGEX.test(addressBase);
  }

  computeId(object) {
    let objectJSON = this.stringifyObject(object);
    return this.sha256(objectJSON, ID_ENCODING).slice(0, ID_LENGTH);
  }

  sha256(message, encoding) {
    return this.merkle.lamport.sha256(message, encoding);
  }

  getWalletAddress() {
    if (!this.walletAddress) {
      throw new Error(
        'Client must be connected with a passphrase in order to get the wallet address'
      );
    }
    return this.walletAddress;
  }

  async prepareTransaction(transaction) {
    if (!this.sigTree) {
      throw new Error('Client must be connected with a passphrase in order to prepare a transaction');
    }
    let extendedTransaction = {
      ...transaction,
      senderAddress: this.walletAddress
    };

    let transactionId = this.computeId(extendedTransaction);

    extendedTransaction.sigPublicKey = this.sigTree.publicRootHash;
    extendedTransaction.nextSigPublicKey = this.nextSigTree.publicRootHash;
    extendedTransaction.nextSigKeyIndex = this.sigKeyIndex + 1;

    extendedTransaction.id = transactionId;

    let extendedTransactionWithIdJSON = this.stringifyObject(extendedTransaction);
    let leafIndex = this.computeLeafIndex(this.sigKeyIndex);
    let senderSignature = this.merkle.sign(extendedTransactionWithIdJSON, this.sigTree, leafIndex);

    await this.incrementSigKey();

    return {
      ...extendedTransaction,
      senderSignature
    };
  }

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

  async prepareRegisterSigDetails(options) {
    options = options || {};
    let sigPassphrase = options.passphrase || this.sigPassphrase;
    let newNextSigKeyIndex = options.newNextSigKeyIndex || 0;
    let treeIndex = this.computeTreeIndex(newNextSigKeyIndex);
    let seed = this.computeSeedFromPassphrase(sigPassphrase);
    let [ mssTree, nextMSSTree ] = await Promise.all([
      this.computeTreeFromSeed(seed, 'sig', treeIndex),
      this.computeTreeFromSeed(seed, 'sig', treeIndex + 1)
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

  async prepareRegisterMultisigDetails(options) {
    options = options || {};
    let multisigPassphrase = options.multisigPassphrase || this.multisigPassphrase;
    let newNextMultisigKeyIndex = options.newNextMultisigKeyIndex || 0;
    let treeIndex = this.computeTreeIndex(newNextMultisigKeyIndex);
    let seed = this.computeSeedFromPassphrase(multisigPassphrase);
    let [ mssTree, nextMSSTree ] = await Promise.all([
      this.computeTreeFromSeed(seed, 'multisig', treeIndex),
      this.computeTreeFromSeed(seed, 'multisig', treeIndex + 1)
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

  async prepareRegisterForgingDetails(options) {
    options = options || {};
    let forgingPassphrase = options.forgingPassphrase || this.forgingPassphrase;
    let newNextForgingKeyIndex = options.newNextForgingKeyIndex || 0;
    let treeIndex = this.computeTreeIndex(newNextForgingKeyIndex);
    let seed = this.computeSeedFromPassphrase(forgingPassphrase);
    let [ mssTree, nextMSSTree ] = await Promise.all([
      this.computeTreeFromSeed(seed, 'forging', treeIndex),
      this.computeTreeFromSeed(seed, 'forging', treeIndex + 1)
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
    let expectedId = this.computeId(simplifiedTransaction);
    return id === expectedId;
  }

  getAllObjectKeySet(object, seenRefSet) {
    if (!seenRefSet) {
      seenRefSet = new Set();
    }
    let keySet = new Set();
    if (seenRefSet.has(object)) {
      return keySet;
    }
    seenRefSet.add(object);
    if (typeof object !== 'object') {
      return keySet;
    }
    for (let key in object) {
      keySet.add(key);
      let item = object[key];
      let itemKeyList = this.getAllObjectKeySet(item, seenRefSet);
      for (let itemKey of itemKeyList) {
        keySet.add(itemKey);
      }
    }
    return keySet;
  }

  getAllObjectKeys(object) {
    return [...this.getAllObjectKeySet(object)];
  }

  stringifyObject(object) {
    let keyList = this.getAllObjectKeys(object);
    return JSON.stringify(object, keyList.sort());
  }

  stringifyObjectWithMetadata(object, metadata) {
    let objectString = this.stringifyObject(object);
    let metadataString = this.stringifyObject(metadata);
    return `[${objectString},${metadataString}]`;
  }

  verifyTransaction(transaction) {
    if (!this.verifyTransactionId(transaction)) {
      return false;
    }
    let { senderSignature, signatures, ...transactionWithoutSignatures } = transaction;
    let transactionJSON = this.stringifyObject(transactionWithoutSignatures);
    return this.merkle.verify(transactionJSON, senderSignature, transaction.sigPublicKey);
  }

  prepareMultisigTransaction(transaction) {
    if (!this.walletAddress && !transaction.senderAddress) {
      throw new Error(
        'Client must be connected with a passphrase in order to prepare a multisig transaction without specifying a senderAddress'
      );
    }
    let extendedTransaction = {
      ...transaction,
      senderAddress: transaction.senderAddress || this.walletAddress
    };

    extendedTransaction.id = this.computeId(extendedTransaction);
    extendedTransaction.signatures = [];

    return extendedTransaction;
  }

  async signMultisigTransaction(preparedTransaction) {
    if (!this.multisigTree) {
      throw new Error('Client must be connected with a passphrase in order to sign a multisig transaction');
    }
    let { senderSignature, signatures, ...transactionWithoutSignatures } = preparedTransaction;

    let metaPacket = {
      signerAddress: this.walletAddress,
      multisigPublicKey: this.multisigTree.publicRootHash,
      nextMultisigPublicKey: this.nextMultisigTree.publicRootHash,
      nextMultisigKeyIndex: this.multisigKeyIndex + 1
    };

    let signablePacketJSON = this.stringifyObjectWithMetadata(transactionWithoutSignatures, metaPacket);
    let leafIndex = this.computeLeafIndex(this.multisigKeyIndex);
    let signature = this.merkle.sign(signablePacketJSON, this.multisigTree, leafIndex);

    await this.incrementMultisigKey();

    return {
      ...metaPacket,
      signature
    };
  }

  attachMultisigTransactionSignature(preparedTransaction, signaturePacket) {
    preparedTransaction.signatures.push(signaturePacket);
    return preparedTransaction;
  }

  verifyMultisigTransactionSignature(transaction, signaturePacket) {
    let { senderSignature, signatures, ...transactionWithoutSignatures } = transaction;
    let { signature, ...metaPacket } = signaturePacket;

    let signablePacketJSON = this.stringifyObjectWithMetadata(transactionWithoutSignatures, metaPacket);
    return this.merkle.verify(signablePacketJSON, signature, metaPacket.multisigPublicKey);
  }

  computeTreeName(type, treeIndex) {
    return `${this.networkSymbol}-${type}-${treeIndex}`;
  }

  async makeForgingTrees(treeIndex) {
    let [ forgingTree, nextForgingTree ] = await Promise.all([
      this.computeTreeFromSeed(this.forgingSeed, 'forging', treeIndex),
      this.computeTreeFromSeed(this.forgingSeed, 'forging', treeIndex + 1)
    ]);
    this.forgingTree = forgingTree;
    this.forgingPublicKey = this.forgingTree.publicRootHash;
    this.nextForgingTree = nextForgingTree;
    this.nextForgingPublicKey = this.nextForgingTree.publicRootHash;
  }

  async makeForgingTreesFromKeyIndex(keyIndex) {
    await this.makeForgingTrees(this.computeTreeIndex(keyIndex));
  }

  async incrementForgingKey() {
    if (!this.walletAddress) {
      throw new Error(
        'Client must be connected with a passphrase in order to increment the forging key'
      );
    }
    let currentTreeIndex = this.computeTreeIndex(this.forgingKeyIndex);
    this.forgingKeyIndex++;
    await this.saveKeyIndex('forgingKeyIndex', this.forgingKeyIndex);
    let newTreeIndex = this.computeTreeIndex(this.forgingKeyIndex);

    if (newTreeIndex !== currentTreeIndex) {
      await this.makeForgingTrees(newTreeIndex);
    }
  }

  async makeMultisigTrees(treeIndex) {
    let [ multisigTree, nextMultisigTree ] = await Promise.all([
      this.computeTreeFromSeed(this.multisigSeed, 'multisig', treeIndex),
      this.computeTreeFromSeed(this.multisigSeed, 'multisig', treeIndex + 1)
    ]);
    this.multisigTree = multisigTree;
    this.multisigPublicKey = this.multisigTree.publicRootHash;
    this.nextMultisigTree = nextMultisigTree;
    this.nextMultisigPublicKey = this.nextMultisigTree.publicRootHash;
  }

  async makeMultisigTreesFromKeyIndex(keyIndex) {
    await this.makeMultisigTrees(this.computeTreeIndex(keyIndex));
  }

  async incrementMultisigKey() {
    if (!this.walletAddress) {
      throw new Error(
        'Client must be connected with a passphrase in order to increment the multisig key'
      );
    }
    let currentTreeIndex = this.computeTreeIndex(this.multisigKeyIndex);
    this.multisigKeyIndex++;
    await this.saveKeyIndex('multisigKeyIndex', this.multisigKeyIndex);
    let newTreeIndex = this.computeTreeIndex(this.multisigKeyIndex);

    if (newTreeIndex !== currentTreeIndex) {
      await this.makeMultisigTrees(newTreeIndex);
    }
  }

  async makeSigTrees(treeIndex) {
    let [ sigTree, nextSigTree ] = await Promise.all([
      this.computeTreeFromSeed(this.sigSeed, 'sig', treeIndex),
      this.computeTreeFromSeed(this.sigSeed, 'sig', treeIndex + 1)
    ]);
    this.sigTree = sigTree;
    this.sigPublicKey = this.sigTree.publicRootHash;
    this.nextSigTree = nextSigTree;
    this.nextSigPublicKey = this.nextSigTree.publicRootHash;
  }

  async makeSigTreesFromKeyIndex(keyIndex) {
    await this.makeSigTrees(this.computeTreeIndex(keyIndex));
  }

  async incrementSigKey() {
    if (!this.walletAddress) {
      throw new Error(
        'Client must be connected with a passphrase in order to increment the sig key'
      );
    }
    let currentTreeIndex = this.computeTreeIndex(this.sigKeyIndex);
    this.sigKeyIndex++;
    await this.saveKeyIndex('sigKeyIndex', this.sigKeyIndex);
    let newTreeIndex = this.computeTreeIndex(this.sigKeyIndex);

    if (newTreeIndex !== currentTreeIndex) {
      await this.makeSigTrees(newTreeIndex);
    }
  }

  async prepareBlock(block) {
    if (!this.forgingTree) {
      throw new Error('Client must be connected with a passphrase in order to prepare a block');
    }
    let extendedBlock = {
      ...block,
      forgerAddress: this.walletAddress
    };

    let blockId = this.computeId(extendedBlock);

    extendedBlock.forgingPublicKey = this.forgingTree.publicRootHash;
    extendedBlock.nextForgingPublicKey = this.nextForgingTree.publicRootHash;
    extendedBlock.nextForgingKeyIndex = this.forgingKeyIndex + 1;

    extendedBlock.id = blockId;

    let extendedBlockWithIdJSON = this.stringifyObject(extendedBlock);
    let leafIndex = this.computeLeafIndex(this.forgingKeyIndex);
    let forgerSignature = this.merkle.sign(extendedBlockWithIdJSON, this.forgingTree, leafIndex);

    await this.incrementForgingKey();

    return {
      ...extendedBlock,
      forgerSignature,
      signatures: []
    };
  }

  async signBlock(preparedBlock) {
    if (!this.forgingTree) {
      throw new Error('Client must be connected with a passphrase in order to sign a block');
    }
    let { forgerSignature, signatures, ...blockWithoutSignatures } = preparedBlock;

    let metaPacket = {
      blockId: blockWithoutSignatures.id,
      signerAddress: this.walletAddress,
      forgingPublicKey: this.forgingTree.publicRootHash,
      nextForgingPublicKey: this.nextForgingTree.publicRootHash,
      nextForgingKeyIndex: this.forgingKeyIndex + 1
    };

    let signablePacketJSON = this.stringifyObjectWithMetadata(blockWithoutSignatures, metaPacket);
    let leafIndex = this.computeLeafIndex(this.forgingKeyIndex);
    let signature = this.merkle.sign(signablePacketJSON, this.forgingTree, leafIndex);

    await this.incrementForgingKey();

    return {
      ...metaPacket,
      signature
    };
  }

  verifyBlockSignature(preparedBlock, signaturePacket) {
    let { forgerSignature, signatures, ...blockWithoutSignatures } = preparedBlock;
    let { signature, ...metaPacket } = signaturePacket;

    let signablePacketJSON = this.stringifyObjectWithMetadata(blockWithoutSignatures, metaPacket);
    return this.merkle.verify(signablePacketJSON, signature, metaPacket.forgingPublicKey);
  }

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
    let expectedId = this.computeId(simplifiedBlock);
    return id === expectedId;
  }

  verifyBlock(block) {
    if (!this.verifyBlockId(block)) {
      return false;
    }
    let { forgerSignature, signatures, ...blockWithoutSignatures } = block;
    let blockJSON = this.stringifyObject(blockWithoutSignatures);
    return this.merkle.verify(blockJSON, block.forgerSignature, block.forgingPublicKey);
  }

  computeSeedFromPassphrase(passphrase) {
    return bip39.mnemonicToSeedSync(passphrase).toString(SEED_ENCODING);
  }

  async computeTreeFromSeed(seed, type, treeIndex) {
    let treeName = this.computeTreeName(type, treeIndex);
    return this.merkle.generateMSSTree(seed, treeName);
  }

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
    return this.computeTreeFromSeed(seed, type, treeIndex);
  }

  signMessage(message, tree, leafIndex) {
    return this.merkle.sign(message, tree, leafIndex);
  }

  verifyMessage(message, signature, publicRootHash) {
    return this.merkle.verify(message, signature, publicRootHash);
  }

  async getNetworkSymbol() {
    return this.networkSymbol;
  }

  async getAccount(walletAddress) {
    this.verifyAdapterSupportsMethod('getAccount');
    return this.adapter.getAccount(walletAddress);
  }

  async getAccountsByBalance(offset, limit, order) {
    this.verifyAdapterSupportsMethod('getAccountsByBalance');
    return this.adapter.getAccountsByBalance(offset, limit, order);
  }

  async getMultisigWalletMembers(walletAddress) {
    this.verifyAdapterSupportsMethod('getMultisigWalletMembers');
    return this.adapter.getMultisigWalletMembers(walletAddress);
  }

  async getSignedPendingTransaction(transactionId) {
    this.verifyAdapterSupportsMethod('getSignedPendingTransaction');
    return this.adapter.getSignedPendingTransaction(transactionId);
  }

  async getOutboundPendingTransactions(walletAddress, offset, limit) {
    this.verifyAdapterSupportsMethod('getOutboundPendingTransactions');
    return this.adapter.getOutboundPendingTransactions(walletAddress, offset, limit);
  }

  async getPendingTransactionCount() {
    this.verifyAdapterSupportsMethod('getPendingTransactionCount');
    return this.adapter.getPendingTransactionCount();
  }

  async postTransaction(preparedTransaction) {
    this.verifyAdapterSupportsMethod('postTransaction');
    return this.adapter.postTransaction(preparedTransaction);
  }

  async getTransaction(transactionId) {
    this.verifyAdapterSupportsMethod('getTransaction');
    return this.adapter.getTransaction(transactionId);
  }

  async getTransactionsByTimestamp(offset, limit, order) {
    this.verifyAdapterSupportsMethod('getTransactionsByTimestamp');
    return this.adapter.getTransactionsByTimestamp(offset, limit, order);
  }

  async getInboundTransactions(walletAddress, fromTimestamp, offset, limit, order) {
    this.verifyAdapterSupportsMethod('getInboundTransactions');
    return this.adapter.getInboundTransactions(walletAddress, fromTimestamp, offset, limit, order);
  }

  async getOutboundTransactions(walletAddress, fromTimestamp, offset, limit, order) {
    this.verifyAdapterSupportsMethod('getOutboundTransactions');
    return this.adapter.getOutboundTransactions(walletAddress, fromTimestamp, offset, limit, order);
  }

  async getTransactionsFromBlock(blockId, offset, limit) {
    this.verifyAdapterSupportsMethod('getTransactionsFromBlock');
    return this.adapter.getTransactionsFromBlock(blockId, offset, limit);
  }

  async getInboundTransactionsFromBlock(walletAddress, blockId) {
    this.verifyAdapterSupportsMethod('getInboundTransactionsFromBlock');
    return this.adapter.getInboundTransactionsFromBlock(walletAddress, blockId);
  }

  async getOutboundTransactionsFromBlock(walletAddress, blockId) {
    this.verifyAdapterSupportsMethod('getOutboundTransactionsFromBlock');
    return this.adapter.getOutboundTransactionsFromBlock(walletAddress, blockId);
  }

  async getLastBlockAtTimestamp(timestamp) {
    this.verifyAdapterSupportsMethod('getLastBlockAtTimestamp');
    return this.adapter.getLastBlockAtTimestamp(timestamp);
  }

  async getMaxBlockHeight() {
    this.verifyAdapterSupportsMethod('getMaxBlockHeight');
    return this.adapter.getMaxBlockHeight();
  }

  async getBlocksFromHeight(height, limit) {
    this.verifyAdapterSupportsMethod('getBlocksFromHeight');
    return this.adapter.getBlocksFromHeight(height, limit);
  }

  async getSignedBlocksFromHeight(height, limit) {
    this.verifyAdapterSupportsMethod('getSignedBlocksFromHeight');
    return this.adapter.getSignedBlocksFromHeight(height, limit);
  }

  async getBlocksBetweenHeights(fromHeight, toHeight, limit) {
    this.verifyAdapterSupportsMethod('getBlocksBetweenHeights');
    return this.adapter.getBlocksBetweenHeights(fromHeight, toHeight, limit);
  }

  async getBlockAtHeight(height) {
    this.verifyAdapterSupportsMethod('getBlockAtHeight');
    return this.adapter.getBlockAtHeight(height);
  }

  async getBlock(blockId) {
    this.verifyAdapterSupportsMethod('getBlock');
    return this.adapter.getBlock(blockId);
  }

  async getBlocksByTimestamp(offset, limit, order) {
    this.verifyAdapterSupportsMethod('getBlocksByTimestamp');
    return this.adapter.getBlocksByTimestamp(offset, limit, order);
  }

  async getDelegatesByVoteWeight(offset, limit, order) {
    this.verifyAdapterSupportsMethod('getDelegatesByVoteWeight');
    return this.adapter.getDelegatesByVoteWeight(offset, limit, order);
  }

  async getForgingDelegates() {
    this.verifyAdapterSupportsMethod('getForgingDelegates');
    return this.adapter.getForgingDelegates();
  }

  async getDelegate(walletAddress) {
    this.verifyAdapterSupportsMethod('getDelegate');
    return this.adapter.getDelegate(walletAddress);
  }

  async getAccountVotes(walletAddress) {
    this.verifyAdapterSupportsMethod('getAccountVotes');
    return this.adapter.getAccountVotes(walletAddress);
  }

  async getMinFees() {
    this.verifyAdapterSupportsMethod('getMinFees');
    return this.adapter.getMinFees();
  }

  verifyAdapterSupportsMethod(methodName) {
    if (!this.adapter[methodName]) {
      throw new Error(
        `Client adapter does not support the ${methodName} method`
      );
    }
  }
}

function createClient(options) {
  return new LDPoSClient(options);
}

module.exports = {
  LDPoSClient,
  createClient
};
