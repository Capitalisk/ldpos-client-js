declare type Type = 'forging' | 'multisig' | 'sig';

/**
 * @example
 * const minFees = await client.getMinFees();
 * // Assign the min fees to object
 * fee: minFees.minTransactionFees.transfer
 * @property type - Transaction type
 * @property recipientAddress - Token symbol followed by 40 hexadecimal characters (e.g. clsk57c12965bf0b92aa4eab8b8e87aa9f3a2dac21d8)
 * @property [amount] - Amount to transact 1000000000 being 1 token, not applicable to vote
 * @property fee - Fee of the transaction
 * @property timestamp - Unix timestamp (e.g. Date.now())
 * @property [message] - Message to include in the transaction
 */
declare type Transaction = {
    type: 'transfer' | 'vote' | 'unvote';
    recipientAddress: string;
    amount?: string;
    fee: string;
    timestamp: number;
    message?: string;
};

/**
 * @property senderAddress - Token symbol followed by 40 hexadecimal characters (e.g. clsk57c12965bf0b92aa4eab8b8e87aa9f3a2dac21d8)
 * @property sigPublicKey - Public key
 * @property nextSigPublicKey - Public key
 * @property nextSigKeyIndex - Next sig key index
 * @property id - Transaction id
 * @property senderSignature - Signiture of sender
 */
declare type ExtendedTransaction = {
    senderAddress: string;
    sigPublicKey: string;
    nextSigPublicKey: string;
    nextSigKeyIndex: number;
    id: string;
    senderSignature: string;
};

/**
 * Initialize LDPoSClient
 */
declare class LDPoSClient {
    constructor(options?: {
        networkSymbol?: string;
        verifyNetwork?: boolean;
        adapter?: any;
        hostname?: string;
        port?: number;
        keyManager?: any;
    });
    /**
     * Connect to the chain
     * @param [options.walletAddress] - Can be derived from passphrase
     */
    connect(options?: {
        verifyNetwork?: boolean;
        passphrase: string;
        multisigPassphrase?: string;
        forgingPassphrase?: string;
        walletAddress?: string;
        forgingKeyIndex?: number;
        multisigKeyIndex?: number;
        sigKeyIndex?: number;
    }): void;
    /**
     * Disconnect from the adapter
     */
    disconnect(): void;
    /**
     * Syncs all key indexes
     * @property sig - index key
     * @property multisig - index key
     * @property forging - index key
     */
    syncAllKeyIndexes(): {
        sig: string;
        multisig: string;
        forging: string;
    };
    /**
     * Transforms string to capitalized string
     * @returns Uppercase string
     */
    capitalizeString(str: string): string;
    /**
     * Sync's key index of specific type
     * @param type - Type of key
     * @param sourceAccount - Token symbol followed by 40 hexadecimal characters (e.g. clsk57c12965bf0b92aa4eab8b8e87aa9f3a2dac21d8)
     */
    syncKeyIndex(type: Type, sourceAccount: string): true | false | null;
    /**
     * Verify key index
     * @param type - Type of key
     * @param keyIndex - Index number
     * @param publicKey - Public key
     * @param nextPublicKey - Next public key
     */
    verifyKeyIndex(type: Type, keyIndex: number, publicKey: string, nextPublicKey: string): boolean;
    /**
     * Increments key index
     * @param type - Type of key
     * @returns Key index number
     */
    incrementKeyIndex(type: Type): Promise;
    /**
     * Load key index
     * @param type - Type of key
     * @returns Key index number
     */
    loadKeyIndex(type: Type): Promise;
    /**
     * Save key index
     * @param type - Type of key
     * @param value - Value to add to the key
     */
    saveKeyIndex(type: Type, value: string): Promise;
    /**
     * Generates a wallet based on the network symbol
     * @returns Token symbol followed by 40 hexadecimal characters (e.g. clsk57c12965bf0b92aa4eab8b8e87aa9f3a2dac21d8)
     */
    generateWallet(): string;
    /**
     * Computes wallet address from passphrase
     * @param passphrase - Passphrase 12-word mnemonic
     * @returns Token symbol followed by 40 hexadecimal characters (e.g. clsk57c12965bf0b92aa4eab8b8e87aa9f3a2dac21d8)
     */
    computeWalletAddressFromPassphrase(passphrase: string): string;
    /**
     * Validates passphrase
     * @param passphrase - Passphrase 12-word mnemonic
     */
    validatePassphrase(passphrase: string): boolean;
    /**
     * Validates wallet address
     * @param walletAddress - Token symbol followed by 40 hexadecimal characters (e.g. clsk57c12965bf0b92aa4eab8b8e87aa9f3a2dac21d8)
     */
    validateWalletAddress(walletAddress: string): boolean;
    /**
     * Encodes messages
     * @param message - Message to encode
     * @returns SHA256 string
     */
    sha256(message: string, encoding?: string): string;
    /**
     * Only works if a passphrase is provided during the connection phase.
     * @returns Wallet address
     */
    getWalletAddress(): string;
    /**
     * Prepare a transaction
     * @example
     * const minFees = await client.getMinFees();
     *
     * client.prepareTransaction({
     *   type: 'transfer',
     *   recipientAddress: 'clsk65d4b765f0abe4dae5c564b4a6d2d7b70311fd9e',
     *   amount: '1000000000', // amounts to 1 CLSK
     *   fee: minFees.minTransactionFees.transfer,
     *   timestamp: Date.now(),
     *   message: 'Your first succesful transaction!',
     * })
     * @param transaction - Transaction object
     */
    prepareTransaction(transaction: Transaction): any;
    prepareRegisterMultisigWallet(options: any): void;
    prepareRegisterSigDetails(options: any): void;
    prepareRegisterMultisigDetails(options: any): void;
    prepareRegisterForgingDetails(options: any): void;
    verifyTransactionId(transaction: Transaction): void;
    verifyTransaction(transaction: Transaction): void;
    prepareMultisigTransaction(transaction: Transaction): void;
    signMultisigTransaction(preparedTransaction: any): void;
    attachMultisigTransactionSignature(preparedTransaction: any, signaturePacket: any): void;
    verifyMultisigTransactionSignature(transaction: Transaction, signaturePacket: any): void;
    makeForgingTrees(treeIndex: any): void;
    makeForgingTreesFromKeyIndex(keyIndex: any): void;
    incrementForgingKey(): void;
    makeMultisigTrees(treeIndex: any): void;
    makeMultisigTreesFromKeyIndex(keyIndex: any): void;
    incrementMultisigKey(): void;
    makeSigTrees(treeIndex: any): void;
    makeSigTreesFromKeyIndex(keyIndex: any): void;
    incrementSigKey(): void;
    prepareBlock(block: any): void;
    signBlock(preparedBlock: any): void;
    verifyBlockSignature(preparedBlock: any, signaturePacket: any): void;
    verifyBlockId(block: any): void;
    verifyBlock(block: any): void;
    computeTree(type: any, treeIndex: any): void;
    signMessage(message: any, tree: any, leafIndex: any): void;
    verifyMessage(message: any, signature: any, publicRootHash: any): void;
    getPeers(): void;
    getNodeInfo(): void;
    getNodeInfoChangeConsumer(): void;
    getNetworkSymbol(): void;
    getChainInfo(): void;
    getAPIInfo(): void;
    getGenesis(): void;
    getAccount(walletAddress: any): void;
    getAccountsByBalance(offset: any, limit: any, order: any): void;
    getMultisigWalletMembers(walletAddress: any): void;
    getSignedPendingTransaction(transactionId: any): void;
    getOutboundPendingTransactions(walletAddress: any, offset: any, limit: any): void;
    getPendingTransactionCount(): void;
    postTransaction(preparedTransaction: any): void;
    getTransaction(transactionId: any): void;
    getTransactionsByTimestamp(offset: any, limit: any, order: any): void;
    getAccountTransactions(walletAddress: any, fromTimestamp: any, offset: any, limit: any, order: any): void;
    getInboundTransactions(walletAddress: any, fromTimestamp: any, offset: any, limit: any, order: any): void;
    getOutboundTransactions(walletAddress: any, fromTimestamp: any, offset: any, limit: any, order: any): void;
    getTransactionsFromBlock(blockId: any, offset: any, limit: any): void;
    getInboundTransactionsFromBlock(walletAddress: any, blockId: any): void;
    getOutboundTransactionsFromBlock(walletAddress: any, blockId: any): void;
    getLastBlockAtTimestamp(timestamp: any): void;
    getMaxBlockHeight(): void;
    getBlocksFromHeight(height: any, limit: any): void;
    getSignedBlocksFromHeight(height: any, limit: any): void;
    getBlocksBetweenHeights(fromHeight: any, toHeight: any, limit: any): void;
    getBlockAtHeight(height: any): void;
    getBlock(blockId: any): void;
    getSignedBlock(blockId: any): void;
    getBlocksByTimestamp(offset: any, limit: any, order: any): void;
    getDelegatesByVoteWeight(offset: any, limit: any, order: any): void;
    getForgingDelegates(): void;
    getDelegate(walletAddress: any): void;
    getDelegateVoters(walletAddress: any, offset: any, limit: any, order: any): void;
    getAccountVotes(walletAddress: any): void;
    getMinFees(): void;
    verifyAdapterSupportsMethod(methodName: any): void;
}

declare function createClient(options: any): void;

