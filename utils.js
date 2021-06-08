const bip39 = require('bip39');
const LiteMerkle = require('lite-merkle');

const LEAF_COUNT = 64;
const SEED_ENCODING = 'hex';
const NODE_ENCODING = 'hex';
const SIGNATURE_ENCODING = 'base64';

const ID_ENCODING = 'hex';
const ID_LENGTH = 40;
const WALLET_ADDRESS_BASE_BYTE_LENGTH = 20;
const HEX_REGEX = /^([0-9a-f])*$/;

const merkle = new LiteMerkle({
  leafCount: LEAF_COUNT,
  seedEncoding: SEED_ENCODING,
  nodeEncoding: NODE_ENCODING,
  signatureFormat: SIGNATURE_ENCODING
});

async function generateWallet(networkSymbol) {
  if (networkSymbol == null) {
    throw new Error('Missing networkSymbol argument');
  }
  let passphrase = bip39.generateMnemonic();
  let address = await computeWalletAddressFromPassphrase(networkSymbol, passphrase);
  return {
    address,
    passphrase
  };
}

async function computePublicKeysFromPassphrase(networkSymbol, passphrase) {
  if (passphrase == null) {
    throw new Error('Missing passphrase argument');
  }
  let seed = computeSeedFromPassphrase(passphrase);
  let [ sigPublicKey, multisigPublicKey, forgingPublicKey ] = await Promise.all([
    computePublicKeyFromSeed(networkSymbol, seed, 'sig', 0),
    computePublicKeyFromSeed(networkSymbol, seed, 'multisig', 0),
    computePublicKeyFromSeed(networkSymbol, seed, 'forging', 0)
  ]);
  return {
    sigPublicKey,
    multisigPublicKey,
    forgingPublicKey
  };
}

async function computeWalletAddressFromPassphrase(networkSymbol, passphrase) {
  if (passphrase == null) {
    throw new Error('Missing passphrase argument');
  }
  let seed = computeSeedFromPassphrase(passphrase);
  let publicKey = await computePublicKeyFromSeed(networkSymbol, seed, 'sig', 0);
  return computeWalletAddressFromPublicKey(networkSymbol, publicKey);
}

function computeWalletAddressFromPublicKey(networkSymbol, publicKey) {
  return `${networkSymbol}${
    Buffer.from(publicKey, NODE_ENCODING)
      .slice(0, WALLET_ADDRESS_BASE_BYTE_LENGTH)
      .toString('hex')
  }`;
}

function computeSeedFromPassphrase(passphrase) {
  return bip39.mnemonicToSeedSync(passphrase).toString(SEED_ENCODING);
}

async function computePublicKeyFromSeed(networkSymbol, seed, type, treeIndex) {
  let sigTree = await computeTreeFromSeed(networkSymbol, seed, type, treeIndex);
  return sigTree.publicRootHash;
}

async function computeTreeFromSeed(networkSymbol, seed, type, treeIndex) {
  let treeName = computeTreeName(networkSymbol, type, treeIndex);
  return merkle.generateMSSTree(seed, treeName);
}

function computeTreeName(networkSymbol, type, treeIndex) {
  if (treeIndex == null) {
    treeIndex = 0;
  }
  return `${networkSymbol}-${type}-${treeIndex}`;
}

async function computeWalletAddressFromSeed(networkSymbol, seed) {
  let publicKey = await computePublicKeyFromSeed(networkSymbol, seed, 'sig', 0);
  return computeWalletAddressFromPublicKey(networkSymbol, publicKey);
}

function computeTreeIndex(keyIndex) {
  return Math.floor(keyIndex / LEAF_COUNT);
}

function computeLeafIndex(keyIndex) {
  return keyIndex % LEAF_COUNT;
}

function computeId(object) {
  let objectJSON = stringifyObject(object);
  return sha256(objectJSON, ID_ENCODING).slice(0, ID_LENGTH);
}

function validatePassphrase(passphrase) {
  return bip39.validateMnemonic(passphrase);
}

function validateWalletAddress(networkSymbol, walletAddress) {
  if (typeof walletAddress !== 'string') {
    return false;
  }
  if (walletAddress.indexOf(networkSymbol) !== 0) {
    return false;
  }
  let addressBase = walletAddress.slice(networkSymbol.length);
  if (addressBase.length !== WALLET_ADDRESS_BASE_BYTE_LENGTH * 2) {
    return false;
  }
  return HEX_REGEX.test(addressBase);
}

function getAllObjectKeySet(object, seenRefSet) {
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
    let itemKeyList = getAllObjectKeySet(item, seenRefSet);
    for (let itemKey of itemKeyList) {
      keySet.add(itemKey);
    }
  }
  return keySet;
}

function getAllObjectKeys(object) {
  return [...getAllObjectKeySet(object)];
}

function stringifyObject(object) {
  let keyList = getAllObjectKeys(object);
  return JSON.stringify(object, keyList.sort());
}

function stringifyObjectWithMetadata(object, metadata) {
  let objectString = stringifyObject(object);
  let metadataString = stringifyObject(metadata);
  return `[${objectString},${metadataString}]`;
}

function sha256(message, encoding) {
  return merkle.lamport.sha256(message, encoding);
}

module.exports = {
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
