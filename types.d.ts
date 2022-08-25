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
     * Transforms string to capitalized string
     * @returns Uppercase string
     */
    capitalizeString(str: string): string;
}

