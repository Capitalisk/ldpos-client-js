## Classes

<dl>
<dt><a href="#LDPoSClient">LDPoSClient</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#createClient">createClient(options)</a> ⇒ <code>void</code></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Type">Type</a> : <code>&#x27;forging&#x27;</code> | <code>&#x27;multisig&#x27;</code> | <code>&#x27;sig&#x27;</code></dt>
<dd></dd>
<dt><a href="#Transaction">Transaction</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#ExtendedTransaction">ExtendedTransaction</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="LDPoSClient"></a>

## LDPoSClient
**Kind**: global class  

* [LDPoSClient](#LDPoSClient)
    * [new LDPoSClient([options])](#new_LDPoSClient_new)
    * [.connect([options])](#LDPoSClient+connect) ⇒ <code>void</code>
    * [.disconnect()](#LDPoSClient+disconnect) ⇒ <code>void</code>
    * [.syncAllKeyIndexes()](#LDPoSClient+syncAllKeyIndexes) ⇒ <code>Object</code>
    * [.capitalizeString(str)](#LDPoSClient+capitalizeString) ⇒ <code>string</code>
    * [.syncKeyIndex(type, sourceAccount)](#LDPoSClient+syncKeyIndex) ⇒ <code>true</code> \| <code>false</code> \| <code>null</code>
    * [.verifyKeyIndex(type, keyIndex, publicKey, nextPublicKey)](#LDPoSClient+verifyKeyIndex) ⇒ <code>boolean</code>
    * [.incrementKeyIndex(type)](#LDPoSClient+incrementKeyIndex) ⇒ <code>Promise</code>
    * [.loadKeyIndex(type)](#LDPoSClient+loadKeyIndex) ⇒ <code>Promise</code>
    * [.saveKeyIndex(type, value)](#LDPoSClient+saveKeyIndex) ⇒ <code>Promise</code>
    * [.generateWallet()](#LDPoSClient+generateWallet) ⇒ <code>string</code>
    * [.computeWalletAddressFromPassphrase(passphrase)](#LDPoSClient+computeWalletAddressFromPassphrase) ⇒ <code>string</code>
    * [.validatePassphrase(passphrase)](#LDPoSClient+validatePassphrase) ⇒ <code>boolean</code>
    * [.validateWalletAddress(walletAddress)](#LDPoSClient+validateWalletAddress) ⇒ <code>boolean</code>
    * [.sha256(message, [encoding])](#LDPoSClient+sha256) ⇒ <code>string</code>
    * [.getWalletAddress()](#LDPoSClient+getWalletAddress) ⇒ <code>string</code>
    * [.prepareTransaction(transaction)](#LDPoSClient+prepareTransaction) ⇒ <code>Object</code>
    * [.prepareRegisterMultisigWallet(options)](#LDPoSClient+prepareRegisterMultisigWallet) ⇒ <code>void</code>
    * [.prepareRegisterSigDetails(options)](#LDPoSClient+prepareRegisterSigDetails) ⇒ <code>void</code>
    * [.prepareRegisterMultisigDetails(options)](#LDPoSClient+prepareRegisterMultisigDetails) ⇒ <code>void</code>
    * [.prepareRegisterForgingDetails(options)](#LDPoSClient+prepareRegisterForgingDetails) ⇒ <code>void</code>
    * [.verifyTransactionId(transaction)](#LDPoSClient+verifyTransactionId) ⇒ <code>void</code>
    * [.verifyTransaction(transaction)](#LDPoSClient+verifyTransaction) ⇒ <code>void</code>
    * [.prepareMultisigTransaction(transaction)](#LDPoSClient+prepareMultisigTransaction) ⇒ <code>void</code>
    * [.signMultisigTransaction(preparedTransaction)](#LDPoSClient+signMultisigTransaction) ⇒ <code>void</code>
    * [.attachMultisigTransactionSignature(preparedTransaction, signaturePacket)](#LDPoSClient+attachMultisigTransactionSignature) ⇒ <code>void</code>
    * [.verifyMultisigTransactionSignature(transaction, signaturePacket)](#LDPoSClient+verifyMultisigTransactionSignature) ⇒ <code>void</code>
    * [.makeForgingTrees(treeIndex)](#LDPoSClient+makeForgingTrees)
    * [.makeForgingTreesFromKeyIndex(keyIndex)](#LDPoSClient+makeForgingTreesFromKeyIndex)
    * [.incrementForgingKey()](#LDPoSClient+incrementForgingKey)
    * [.makeMultisigTrees(treeIndex)](#LDPoSClient+makeMultisigTrees)
    * [.makeMultisigTreesFromKeyIndex(keyIndex)](#LDPoSClient+makeMultisigTreesFromKeyIndex)
    * [.incrementMultisigKey()](#LDPoSClient+incrementMultisigKey)
    * [.makeSigTrees(treeIndex)](#LDPoSClient+makeSigTrees)
    * [.makeSigTreesFromKeyIndex(keyIndex)](#LDPoSClient+makeSigTreesFromKeyIndex)
    * [.incrementSigKey()](#LDPoSClient+incrementSigKey)
    * [.prepareBlock(block)](#LDPoSClient+prepareBlock) ⇒ <code>void</code>
    * [.signBlock(preparedBlock)](#LDPoSClient+signBlock) ⇒ <code>void</code>
    * [.verifyBlockSignature(preparedBlock, signaturePacket)](#LDPoSClient+verifyBlockSignature) ⇒ <code>void</code>
    * [.verifyBlockId(block)](#LDPoSClient+verifyBlockId) ⇒ <code>void</code>
    * [.verifyBlock(block)](#LDPoSClient+verifyBlock) ⇒ <code>void</code>
    * [.computeTree(type, treeIndex)](#LDPoSClient+computeTree) ⇒ <code>void</code>
    * [.signMessage(message, tree, leafIndex)](#LDPoSClient+signMessage) ⇒ <code>void</code>
    * [.verifyMessage(message, signature, publicRootHash)](#LDPoSClient+verifyMessage) ⇒ <code>void</code>
    * [.getPeers()](#LDPoSClient+getPeers) ⇒ <code>void</code>
    * [.getNodeInfo()](#LDPoSClient+getNodeInfo) ⇒ <code>void</code>
    * [.getNodeInfoChangeConsumer()](#LDPoSClient+getNodeInfoChangeConsumer) ⇒ <code>void</code>
    * [.getNetworkSymbol()](#LDPoSClient+getNetworkSymbol) ⇒ <code>void</code>
    * [.getChainInfo()](#LDPoSClient+getChainInfo) ⇒ <code>void</code>
    * [.getAPIInfo()](#LDPoSClient+getAPIInfo) ⇒ <code>void</code>
    * [.getGenesis()](#LDPoSClient+getGenesis) ⇒ <code>void</code>
    * [.getAccount(walletAddress)](#LDPoSClient+getAccount) ⇒ <code>void</code>
    * [.getAccountsByBalance(offset, limit, order)](#LDPoSClient+getAccountsByBalance) ⇒ <code>void</code>
    * [.getMultisigWalletMembers(walletAddress)](#LDPoSClient+getMultisigWalletMembers) ⇒ <code>void</code>
    * [.getSignedPendingTransaction(transactionId)](#LDPoSClient+getSignedPendingTransaction) ⇒ <code>void</code>
    * [.getOutboundPendingTransactions(walletAddress, offset, limit)](#LDPoSClient+getOutboundPendingTransactions) ⇒ <code>void</code>
    * [.getPendingTransactionCount()](#LDPoSClient+getPendingTransactionCount) ⇒ <code>void</code>
    * [.postTransaction(preparedTransaction)](#LDPoSClient+postTransaction) ⇒ <code>void</code>
    * [.getTransaction(transactionId)](#LDPoSClient+getTransaction) ⇒ <code>void</code>
    * [.getTransactionsByTimestamp(offset, limit, order)](#LDPoSClient+getTransactionsByTimestamp) ⇒ <code>void</code>
    * [.getAccountTransactions(walletAddress, fromTimestamp, offset, limit, order)](#LDPoSClient+getAccountTransactions) ⇒ <code>void</code>
    * [.getInboundTransactions(walletAddress, fromTimestamp, offset, limit, order)](#LDPoSClient+getInboundTransactions) ⇒ <code>void</code>
    * [.getOutboundTransactions(walletAddress, fromTimestamp, offset, limit, order)](#LDPoSClient+getOutboundTransactions) ⇒ <code>void</code>
    * [.getTransactionsFromBlock(blockId, offset, limit)](#LDPoSClient+getTransactionsFromBlock) ⇒ <code>void</code>
    * [.getInboundTransactionsFromBlock(walletAddress, blockId)](#LDPoSClient+getInboundTransactionsFromBlock) ⇒ <code>void</code>
    * [.getOutboundTransactionsFromBlock(walletAddress, blockId)](#LDPoSClient+getOutboundTransactionsFromBlock) ⇒ <code>void</code>
    * [.getLastBlockAtTimestamp(timestamp)](#LDPoSClient+getLastBlockAtTimestamp) ⇒ <code>void</code>
    * [.getMaxBlockHeight()](#LDPoSClient+getMaxBlockHeight) ⇒ <code>void</code>
    * [.getBlocksFromHeight(height, limit)](#LDPoSClient+getBlocksFromHeight) ⇒ <code>void</code>
    * [.getSignedBlocksFromHeight(height, limit)](#LDPoSClient+getSignedBlocksFromHeight) ⇒ <code>void</code>
    * [.getBlocksBetweenHeights(fromHeight, toHeight, limit)](#LDPoSClient+getBlocksBetweenHeights) ⇒ <code>void</code>
    * [.getBlockAtHeight(height)](#LDPoSClient+getBlockAtHeight) ⇒ <code>void</code>
    * [.getBlock(blockId)](#LDPoSClient+getBlock) ⇒ <code>void</code>
    * [.getSignedBlock(blockId)](#LDPoSClient+getSignedBlock) ⇒ <code>void</code>
    * [.getBlocksByTimestamp(offset, limit, order)](#LDPoSClient+getBlocksByTimestamp) ⇒ <code>void</code>
    * [.getDelegatesByVoteWeight(offset, limit, order)](#LDPoSClient+getDelegatesByVoteWeight) ⇒ <code>void</code>
    * [.getForgingDelegates()](#LDPoSClient+getForgingDelegates) ⇒ <code>void</code>
    * [.getDelegate(walletAddress)](#LDPoSClient+getDelegate) ⇒ <code>void</code>
    * [.getDelegateVoters(walletAddress, offset, limit, order)](#LDPoSClient+getDelegateVoters) ⇒ <code>void</code>
    * [.getAccountVotes(walletAddress)](#LDPoSClient+getAccountVotes) ⇒ <code>void</code>
    * [.getMinFees()](#LDPoSClient+getMinFees) ⇒ <code>void</code>
    * [.verifyAdapterSupportsMethod(methodName)](#LDPoSClient+verifyAdapterSupportsMethod)

<a name="new_LDPoSClient_new"></a>

### new LDPoSClient([options])
Initialize LDPoSClient


| Param | Type | Default |
| --- | --- | --- |
| [options] | <code>Object</code> | <code>{}</code> | 
| [options.networkSymbol] | <code>string</code> |  | 
| [options.verifyNetwork] | <code>boolean</code> | <code>true</code> | 
| [options.adapter] | <code>any</code> |  | 
| [options.hostname] | <code>string</code> |  | 
| [options.port] | <code>number</code> |  | 
| [options.keyManager] | <code>any</code> |  | 

<a name="LDPoSClient+connect"></a>

### ldPoSClient.connect([options]) ⇒ <code>void</code>
Connect to the chain

**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> | <code>{}</code> |  |
| [options.verifyNetwork] | <code>boolean</code> | <code>true</code> |  |
| options.passphrase | <code>string</code> |  |  |
| [options.multisigPassphrase] | <code>string</code> |  |  |
| [options.forgingPassphrase] | <code>string</code> |  |  |
| [options.walletAddress] | <code>string</code> |  | Can be derived from passphrase |
| [options.forgingKeyIndex] | <code>number</code> |  |  |
| [options.multisigKeyIndex] | <code>number</code> |  |  |
| [options.sigKeyIndex] | <code>number</code> |  |  |

<a name="LDPoSClient+disconnect"></a>

### ldPoSClient.disconnect() ⇒ <code>void</code>
Disconnect from the adapter

**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
<a name="LDPoSClient+syncAllKeyIndexes"></a>

### ldPoSClient.syncAllKeyIndexes() ⇒ <code>Object</code>
Syncs all key indexes

**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| sig | <code>string</code> | index key |
| multisig | <code>string</code> | index key |
| forging | <code>string</code> | index key |

<a name="LDPoSClient+capitalizeString"></a>

### ldPoSClient.capitalizeString(str) ⇒ <code>string</code>
Transforms string to capitalized string

**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
**Returns**: <code>string</code> - Uppercase string  

| Param | Type |
| --- | --- |
| str | <code>string</code> | 

<a name="LDPoSClient+syncKeyIndex"></a>

### ldPoSClient.syncKeyIndex(type, sourceAccount) ⇒ <code>true</code> \| <code>false</code> \| <code>null</code>
Sync's key index of specific type

**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type | Description |
| --- | --- | --- |
| type | [<code>Type</code>](#Type) | Type of key |
| sourceAccount | <code>string</code> | Token symbol followed by 40 hexadecimal characters (e.g. clsk57c12965bf0b92aa4eab8b8e87aa9f3a2dac21d8) |

<a name="LDPoSClient+verifyKeyIndex"></a>

### ldPoSClient.verifyKeyIndex(type, keyIndex, publicKey, nextPublicKey) ⇒ <code>boolean</code>
Verify key index

**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type | Description |
| --- | --- | --- |
| type | [<code>Type</code>](#Type) | Type of key |
| keyIndex | <code>number</code> | Index number |
| publicKey | <code>string</code> | Public key |
| nextPublicKey | <code>string</code> | Next public key |

<a name="LDPoSClient+incrementKeyIndex"></a>

### ldPoSClient.incrementKeyIndex(type) ⇒ <code>Promise</code>
Increments key index

**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
**Returns**: <code>Promise</code> - Key index number  

| Param | Type | Description |
| --- | --- | --- |
| type | [<code>Type</code>](#Type) | Type of key |

<a name="LDPoSClient+loadKeyIndex"></a>

### ldPoSClient.loadKeyIndex(type) ⇒ <code>Promise</code>
Load key index

**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
**Returns**: <code>Promise</code> - Key index number  

| Param | Type | Description |
| --- | --- | --- |
| type | [<code>Type</code>](#Type) | Type of key |

<a name="LDPoSClient+saveKeyIndex"></a>

### ldPoSClient.saveKeyIndex(type, value) ⇒ <code>Promise</code>
Save key index

**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type | Description |
| --- | --- | --- |
| type | [<code>Type</code>](#Type) | Type of key |
| value | <code>string</code> | Value to add to the key |

<a name="LDPoSClient+generateWallet"></a>

### ldPoSClient.generateWallet() ⇒ <code>string</code>
Generates a wallet based on the network symbol

**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
**Returns**: <code>string</code> - Token symbol followed by 40 hexadecimal characters (e.g. clsk57c12965bf0b92aa4eab8b8e87aa9f3a2dac21d8)  
<a name="LDPoSClient+computeWalletAddressFromPassphrase"></a>

### ldPoSClient.computeWalletAddressFromPassphrase(passphrase) ⇒ <code>string</code>
Computes wallet address from passphrase

**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
**Returns**: <code>string</code> - Token symbol followed by 40 hexadecimal characters (e.g. clsk57c12965bf0b92aa4eab8b8e87aa9f3a2dac21d8)  

| Param | Type | Description |
| --- | --- | --- |
| passphrase | <code>string</code> | Passphrase 12-word mnemonic |

<a name="LDPoSClient+validatePassphrase"></a>

### ldPoSClient.validatePassphrase(passphrase) ⇒ <code>boolean</code>
Validates passphrase

**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type | Description |
| --- | --- | --- |
| passphrase | <code>string</code> | Passphrase 12-word mnemonic |

<a name="LDPoSClient+validateWalletAddress"></a>

### ldPoSClient.validateWalletAddress(walletAddress) ⇒ <code>boolean</code>
Validates wallet address

**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type | Description |
| --- | --- | --- |
| walletAddress | <code>string</code> | Token symbol followed by 40 hexadecimal characters (e.g. clsk57c12965bf0b92aa4eab8b8e87aa9f3a2dac21d8) |

<a name="LDPoSClient+sha256"></a>

### ldPoSClient.sha256(message, [encoding]) ⇒ <code>string</code>
Encodes messages

**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
**Returns**: <code>string</code> - SHA256 string  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| message | <code>string</code> |  | Message to encode |
| [encoding] | <code>string</code> | <code>&quot;&#x27;base64&#x27;&quot;</code> |  |

<a name="LDPoSClient+getWalletAddress"></a>

### ldPoSClient.getWalletAddress() ⇒ <code>string</code>
Only works if a passphrase is provided during the connection phase.

**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
**Returns**: <code>string</code> - Wallet address  
<a name="LDPoSClient+prepareTransaction"></a>

### ldPoSClient.prepareTransaction(transaction) ⇒ <code>Object</code>
Prepare a transaction

**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type | Description |
| --- | --- | --- |
| transaction | [<code>Transaction</code>](#Transaction) | Transaction object |

**Example**  
```js
const minFees = await client.getMinFees();

client.prepareTransaction({
  type: 'transfer',
  recipientAddress: 'clsk65d4b765f0abe4dae5c564b4a6d2d7b70311fd9e',
  amount: '1000000000', // amounts to 1 CLSK
  fee: minFees.minTransactionFees.transfer,
  timestamp: Date.now(),
  message: 'Your first succesful transaction!',
})
```
<a name="LDPoSClient+prepareRegisterMultisigWallet"></a>

### ldPoSClient.prepareRegisterMultisigWallet(options) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="LDPoSClient+prepareRegisterSigDetails"></a>

### ldPoSClient.prepareRegisterSigDetails(options) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="LDPoSClient+prepareRegisterMultisigDetails"></a>

### ldPoSClient.prepareRegisterMultisigDetails(options) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="LDPoSClient+prepareRegisterForgingDetails"></a>

### ldPoSClient.prepareRegisterForgingDetails(options) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="LDPoSClient+verifyTransactionId"></a>

### ldPoSClient.verifyTransactionId(transaction) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| transaction | [<code>Transaction</code>](#Transaction) | 

<a name="LDPoSClient+verifyTransaction"></a>

### ldPoSClient.verifyTransaction(transaction) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| transaction | [<code>Transaction</code>](#Transaction) | 

<a name="LDPoSClient+prepareMultisigTransaction"></a>

### ldPoSClient.prepareMultisigTransaction(transaction) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| transaction | [<code>Transaction</code>](#Transaction) | 

<a name="LDPoSClient+signMultisigTransaction"></a>

### ldPoSClient.signMultisigTransaction(preparedTransaction) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| preparedTransaction | <code>\*</code> | 

<a name="LDPoSClient+attachMultisigTransactionSignature"></a>

### ldPoSClient.attachMultisigTransactionSignature(preparedTransaction, signaturePacket) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| preparedTransaction | <code>\*</code> | 
| signaturePacket | <code>\*</code> | 

<a name="LDPoSClient+verifyMultisigTransactionSignature"></a>

### ldPoSClient.verifyMultisigTransactionSignature(transaction, signaturePacket) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| transaction | [<code>Transaction</code>](#Transaction) | 
| signaturePacket | <code>\*</code> | 

<a name="LDPoSClient+makeForgingTrees"></a>

### ldPoSClient.makeForgingTrees(treeIndex)
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| treeIndex | <code>\*</code> | 

<a name="LDPoSClient+makeForgingTreesFromKeyIndex"></a>

### ldPoSClient.makeForgingTreesFromKeyIndex(keyIndex)
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| keyIndex | <code>\*</code> | 

<a name="LDPoSClient+incrementForgingKey"></a>

### ldPoSClient.incrementForgingKey()
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
<a name="LDPoSClient+makeMultisigTrees"></a>

### ldPoSClient.makeMultisigTrees(treeIndex)
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| treeIndex | <code>\*</code> | 

<a name="LDPoSClient+makeMultisigTreesFromKeyIndex"></a>

### ldPoSClient.makeMultisigTreesFromKeyIndex(keyIndex)
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| keyIndex | <code>\*</code> | 

<a name="LDPoSClient+incrementMultisigKey"></a>

### ldPoSClient.incrementMultisigKey()
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
<a name="LDPoSClient+makeSigTrees"></a>

### ldPoSClient.makeSigTrees(treeIndex)
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| treeIndex | <code>\*</code> | 

<a name="LDPoSClient+makeSigTreesFromKeyIndex"></a>

### ldPoSClient.makeSigTreesFromKeyIndex(keyIndex)
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| keyIndex | <code>\*</code> | 

<a name="LDPoSClient+incrementSigKey"></a>

### ldPoSClient.incrementSigKey()
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
<a name="LDPoSClient+prepareBlock"></a>

### ldPoSClient.prepareBlock(block) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| block | <code>\*</code> | 

<a name="LDPoSClient+signBlock"></a>

### ldPoSClient.signBlock(preparedBlock) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| preparedBlock | <code>\*</code> | 

<a name="LDPoSClient+verifyBlockSignature"></a>

### ldPoSClient.verifyBlockSignature(preparedBlock, signaturePacket) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| preparedBlock | <code>\*</code> | 
| signaturePacket | <code>\*</code> | 

<a name="LDPoSClient+verifyBlockId"></a>

### ldPoSClient.verifyBlockId(block) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| block | <code>\*</code> | 

<a name="LDPoSClient+verifyBlock"></a>

### ldPoSClient.verifyBlock(block) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| block | <code>\*</code> | 

<a name="LDPoSClient+computeTree"></a>

### ldPoSClient.computeTree(type, treeIndex) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| type | <code>\*</code> | 
| treeIndex | <code>\*</code> | 

<a name="LDPoSClient+signMessage"></a>

### ldPoSClient.signMessage(message, tree, leafIndex) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| message | <code>\*</code> | 
| tree | <code>\*</code> | 
| leafIndex | <code>\*</code> | 

<a name="LDPoSClient+verifyMessage"></a>

### ldPoSClient.verifyMessage(message, signature, publicRootHash) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| message | <code>\*</code> | 
| signature | <code>\*</code> | 
| publicRootHash | <code>\*</code> | 

<a name="LDPoSClient+getPeers"></a>

### ldPoSClient.getPeers() ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
<a name="LDPoSClient+getNodeInfo"></a>

### ldPoSClient.getNodeInfo() ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
<a name="LDPoSClient+getNodeInfoChangeConsumer"></a>

### ldPoSClient.getNodeInfoChangeConsumer() ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
<a name="LDPoSClient+getNetworkSymbol"></a>

### ldPoSClient.getNetworkSymbol() ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
<a name="LDPoSClient+getChainInfo"></a>

### ldPoSClient.getChainInfo() ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
<a name="LDPoSClient+getAPIInfo"></a>

### ldPoSClient.getAPIInfo() ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
<a name="LDPoSClient+getGenesis"></a>

### ldPoSClient.getGenesis() ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
<a name="LDPoSClient+getAccount"></a>

### ldPoSClient.getAccount(walletAddress) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| walletAddress | <code>\*</code> | 

<a name="LDPoSClient+getAccountsByBalance"></a>

### ldPoSClient.getAccountsByBalance(offset, limit, order) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| offset | <code>\*</code> | 
| limit | <code>\*</code> | 
| order | <code>\*</code> | 

<a name="LDPoSClient+getMultisigWalletMembers"></a>

### ldPoSClient.getMultisigWalletMembers(walletAddress) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| walletAddress | <code>\*</code> | 

<a name="LDPoSClient+getSignedPendingTransaction"></a>

### ldPoSClient.getSignedPendingTransaction(transactionId) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| transactionId | <code>\*</code> | 

<a name="LDPoSClient+getOutboundPendingTransactions"></a>

### ldPoSClient.getOutboundPendingTransactions(walletAddress, offset, limit) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| walletAddress | <code>\*</code> | 
| offset | <code>\*</code> | 
| limit | <code>\*</code> | 

<a name="LDPoSClient+getPendingTransactionCount"></a>

### ldPoSClient.getPendingTransactionCount() ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
<a name="LDPoSClient+postTransaction"></a>

### ldPoSClient.postTransaction(preparedTransaction) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| preparedTransaction | <code>\*</code> | 

<a name="LDPoSClient+getTransaction"></a>

### ldPoSClient.getTransaction(transactionId) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| transactionId | <code>\*</code> | 

<a name="LDPoSClient+getTransactionsByTimestamp"></a>

### ldPoSClient.getTransactionsByTimestamp(offset, limit, order) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| offset | <code>\*</code> | 
| limit | <code>\*</code> | 
| order | <code>\*</code> | 

<a name="LDPoSClient+getAccountTransactions"></a>

### ldPoSClient.getAccountTransactions(walletAddress, fromTimestamp, offset, limit, order) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| walletAddress | <code>\*</code> | 
| fromTimestamp | <code>\*</code> | 
| offset | <code>\*</code> | 
| limit | <code>\*</code> | 
| order | <code>\*</code> | 

<a name="LDPoSClient+getInboundTransactions"></a>

### ldPoSClient.getInboundTransactions(walletAddress, fromTimestamp, offset, limit, order) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| walletAddress | <code>\*</code> | 
| fromTimestamp | <code>\*</code> | 
| offset | <code>\*</code> | 
| limit | <code>\*</code> | 
| order | <code>\*</code> | 

<a name="LDPoSClient+getOutboundTransactions"></a>

### ldPoSClient.getOutboundTransactions(walletAddress, fromTimestamp, offset, limit, order) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| walletAddress | <code>\*</code> | 
| fromTimestamp | <code>\*</code> | 
| offset | <code>\*</code> | 
| limit | <code>\*</code> | 
| order | <code>\*</code> | 

<a name="LDPoSClient+getTransactionsFromBlock"></a>

### ldPoSClient.getTransactionsFromBlock(blockId, offset, limit) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| blockId | <code>\*</code> | 
| offset | <code>\*</code> | 
| limit | <code>\*</code> | 

<a name="LDPoSClient+getInboundTransactionsFromBlock"></a>

### ldPoSClient.getInboundTransactionsFromBlock(walletAddress, blockId) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| walletAddress | <code>\*</code> | 
| blockId | <code>\*</code> | 

<a name="LDPoSClient+getOutboundTransactionsFromBlock"></a>

### ldPoSClient.getOutboundTransactionsFromBlock(walletAddress, blockId) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| walletAddress | <code>\*</code> | 
| blockId | <code>\*</code> | 

<a name="LDPoSClient+getLastBlockAtTimestamp"></a>

### ldPoSClient.getLastBlockAtTimestamp(timestamp) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| timestamp | <code>\*</code> | 

<a name="LDPoSClient+getMaxBlockHeight"></a>

### ldPoSClient.getMaxBlockHeight() ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
<a name="LDPoSClient+getBlocksFromHeight"></a>

### ldPoSClient.getBlocksFromHeight(height, limit) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| height | <code>\*</code> | 
| limit | <code>\*</code> | 

<a name="LDPoSClient+getSignedBlocksFromHeight"></a>

### ldPoSClient.getSignedBlocksFromHeight(height, limit) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| height | <code>\*</code> | 
| limit | <code>\*</code> | 

<a name="LDPoSClient+getBlocksBetweenHeights"></a>

### ldPoSClient.getBlocksBetweenHeights(fromHeight, toHeight, limit) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| fromHeight | <code>\*</code> | 
| toHeight | <code>\*</code> | 
| limit | <code>\*</code> | 

<a name="LDPoSClient+getBlockAtHeight"></a>

### ldPoSClient.getBlockAtHeight(height) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| height | <code>\*</code> | 

<a name="LDPoSClient+getBlock"></a>

### ldPoSClient.getBlock(blockId) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| blockId | <code>\*</code> | 

<a name="LDPoSClient+getSignedBlock"></a>

### ldPoSClient.getSignedBlock(blockId) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| blockId | <code>\*</code> | 

<a name="LDPoSClient+getBlocksByTimestamp"></a>

### ldPoSClient.getBlocksByTimestamp(offset, limit, order) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| offset | <code>\*</code> | 
| limit | <code>\*</code> | 
| order | <code>\*</code> | 

<a name="LDPoSClient+getDelegatesByVoteWeight"></a>

### ldPoSClient.getDelegatesByVoteWeight(offset, limit, order) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| offset | <code>\*</code> | 
| limit | <code>\*</code> | 
| order | <code>\*</code> | 

<a name="LDPoSClient+getForgingDelegates"></a>

### ldPoSClient.getForgingDelegates() ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
<a name="LDPoSClient+getDelegate"></a>

### ldPoSClient.getDelegate(walletAddress) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| walletAddress | <code>\*</code> | 

<a name="LDPoSClient+getDelegateVoters"></a>

### ldPoSClient.getDelegateVoters(walletAddress, offset, limit, order) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| walletAddress | <code>\*</code> | 
| offset | <code>\*</code> | 
| limit | <code>\*</code> | 
| order | <code>\*</code> | 

<a name="LDPoSClient+getAccountVotes"></a>

### ldPoSClient.getAccountVotes(walletAddress) ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| walletAddress | <code>\*</code> | 

<a name="LDPoSClient+getMinFees"></a>

### ldPoSClient.getMinFees() ⇒ <code>void</code>
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  
<a name="LDPoSClient+verifyAdapterSupportsMethod"></a>

### ldPoSClient.verifyAdapterSupportsMethod(methodName)
**Kind**: instance method of [<code>LDPoSClient</code>](#LDPoSClient)  

| Param | Type |
| --- | --- |
| methodName | <code>\*</code> | 

<a name="createClient"></a>

## createClient(options) ⇒ <code>void</code>
**Kind**: global function  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="Type"></a>

## Type : <code>&#x27;forging&#x27;</code> \| <code>&#x27;multisig&#x27;</code> \| <code>&#x27;sig&#x27;</code>
**Kind**: global typedef  
<a name="Transaction"></a>

## Transaction : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| type | <code>&#x27;transfer&#x27;</code> \| <code>&#x27;vote&#x27;</code> \| <code>&#x27;unvote&#x27;</code> | Transaction type |
| recipientAddress | <code>string</code> | Token symbol followed by 40 hexadecimal characters (e.g. clsk57c12965bf0b92aa4eab8b8e87aa9f3a2dac21d8) |
| [amount] | <code>string</code> | Amount to transact 1000000000 being 1 token, not applicable to vote |
| fee | <code>string</code> | Fee of the transaction |
| timestamp | <code>number</code> | Unix timestamp (e.g. Date.now()) |
| [message] | <code>string</code> | Message to include in the transaction |

**Example**  
```js
const minFees = await client.getMinFees();
// Assign the min fees to object
fee: minFees.minTransactionFees.transfer
```
<a name="ExtendedTransaction"></a>

## ExtendedTransaction : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| senderAddress | <code>string</code> | Token symbol followed by 40 hexadecimal characters (e.g. clsk57c12965bf0b92aa4eab8b8e87aa9f3a2dac21d8) |
| sigPublicKey | <code>string</code> | Public key |
| nextSigPublicKey | <code>string</code> | Public key |
| nextSigKeyIndex | <code>number</code> | Next sig key index |
| id | <code>string</code> | Transaction id |
| senderSignature | <code>string</code> | Signiture of sender |

