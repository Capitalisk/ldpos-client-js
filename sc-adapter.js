const socketClusterClient = require('socketcluster-client');
const querystring = require('querystring');

const RPC_REQUEST_PROCEDURE = 'rpc-request';

class SCAdapter {
  constructor(options) {
    let queryData = {
      protocolVersion: options.peerProtocolVersion || '1.1',
      version: options.clientVersion || '2.0.0',
      isPassive: true
    };
    if (options.nethash != null) {
      queryData.nethash = options.nethash;
    }
    this.socket = socketClusterClient.create({
      hostname: options.hostname,
      port: options.port,
      path: options.path == null ? '/socketcluster/' : options.path,
      protocolVersion: options.socketProtocolVersion || 2,
      query: querystring.stringify(queryData),
      autoConnect: false,
      ...options
    });
    this.chainModuleName = options.chainModuleName || 'ldpos_chain';
  }

  async connect() {
    if (this.socket.state === this.socket.OPEN) {
      return;
    }
    this.socket.connect();
    let event = await Promise.race([
      this.socket.listener('connect').once(),
      this.socket.listener('connectAbort').once()
    ]);
    if (event.code) {
      throw new Error(
        `Failed to connect because of error ${event.code}: ${event.reason}`
      );
    }
  }

  disconnect() {
    this.socket.disconnect();
  }

  async getNodeInfo() {
    let response = await this.socket.invoke(RPC_REQUEST_PROCEDURE, {
      procedure: 'status'
    });
    if (!response || !response.data) {
      throw new Error('Node status RPC response format was invalid');
    }
    return response.data;
  }

  getNodeInfoChangeConsumer() {
    return this.socket.receiver('nodeInfoChanged').createConsumer();
  }

  async getPeers() {
    let response = await this.socket.invoke(RPC_REQUEST_PROCEDURE, {
      procedure: 'list'
    });
    if (!response || !response.data || !Array.isArray(response.data.peers)) {
      throw new Error('Peer list RPC response format was invalid');
    }
    return response.data.peers;
  }

  async invokeModuleProcedure(chainModuleName, action, data) {
    let result;
    try {
      result = await this.socket.invoke(RPC_REQUEST_PROCEDURE, {
        procedure: `${chainModuleName}:${action}`,
        data
      });
    } catch (error) {
      let err = new Error(error.message);
      // Copy custom error properties such as name and sourceError
      for (let key in error) {
        err[key] = error[key];
      }
      throw err;
    }
    if (!result) {
      throw new Error(
        'Peer sent back RPC result in an invalid format - Expected an object with a data property'
      );
    }
    return result.data;
  }

  async getNetworkSymbol() {
    return this.invokeModuleProcedure(this.chainModuleName, 'getNetworkSymbol');
  }

  async getChainInfo() {
    return this.invokeModuleProcedure(this.chainModuleName, 'getChainInfo');
  }

  async getGenesis() {
    return this.invokeModuleProcedure(this.chainModuleName, 'getGenesis');
  }

  async getAPIInfo() {
    return this.invokeModuleProcedure(this.chainModuleName, 'getAPIInfo');
  }

  async getAccount(walletAddress) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getAccount', { walletAddress });
  }

  async getAccountsByBalance(offset, limit, order) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getAccountsByBalance', { offset, limit, order });
  }

  async getMultisigWalletMembers(walletAddress) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getMultisigWalletMembers', { walletAddress });
  }

  async getSignedPendingTransaction(transactionId) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getSignedPendingTransaction', { transactionId });
  }

  async getOutboundPendingTransactions(walletAddress, offset, limit) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getOutboundPendingTransactions', { walletAddress, offset, limit });
  }

  async getPendingTransactionCount() {
    return this.invokeModuleProcedure(this.chainModuleName, 'getPendingTransactionCount');
  }

  async postTransaction(transaction) {
    return this.invokeModuleProcedure(this.chainModuleName, 'postTransaction', { transaction });
  }

  async getTransaction(transactionId) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getTransaction', { transactionId });
  }

  async getTransactionsByTimestamp(offset, limit, order) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getTransactionsByTimestamp', { offset, limit, order });
  }

  async getAccountTransactions(walletAddress, fromTimestamp, offset, limit, order) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getAccountTransactions', { walletAddress, fromTimestamp, offset, limit, order });
  }

  async getInboundTransactions(walletAddress, fromTimestamp, offset, limit, order) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getInboundTransactions', { walletAddress, fromTimestamp, offset, limit, order });
  }

  async getOutboundTransactions(walletAddress, fromTimestamp, offset, limit, order) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getOutboundTransactions', { walletAddress, fromTimestamp, offset, limit, order });
  }

  async getTransactionsFromBlock(blockId, offset, limit) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getTransactionsFromBlock', { blockId, offset, limit });
  }

  async getInboundTransactionsFromBlock(walletAddress, blockId) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getInboundTransactionsFromBlock', { walletAddress, blockId });
  }

  async getOutboundTransactionsFromBlock(walletAddress, blockId) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getOutboundTransactionsFromBlock', { walletAddress, blockId });
  }

  async getLastBlockAtTimestamp(timestamp) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getLastBlockAtTimestamp', { timestamp });
  }

  async getMaxBlockHeight() {
    return this.invokeModuleProcedure(this.chainModuleName, 'getMaxBlockHeight');
  }

  async getBlocksFromHeight(height, limit) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getBlocksFromHeight', { height, limit });
  }

  async getSignedBlocksFromHeight(height, limit) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getSignedBlocksFromHeight', { height, limit });
  }

  async getBlocksBetweenHeights(fromHeight, toHeight, limit) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getBlocksBetweenHeights', { fromHeight, toHeight, limit });
  }

  async getBlockAtHeight(height) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getBlockAtHeight', { height });
  }

  async getBlock(blockId) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getBlock', { blockId });
  }

  async getSignedBlock(blockId) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getSignedBlock', { blockId });
  }

  async getBlocksByTimestamp(offset, limit, order) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getBlocksByTimestamp', { offset, limit, order });
  }

  async getDelegatesByVoteWeight(offset, limit, order) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getDelegatesByVoteWeight', { offset, limit, order });
  }

  async getForgingDelegates() {
    return this.invokeModuleProcedure(this.chainModuleName, 'getForgingDelegates');
  }

  async getDelegate(walletAddress) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getDelegate', { walletAddress });
  }

  async getDelegateVoters(walletAddress, offset, limit, order) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getDelegateVoters', { walletAddress, offset, limit, order });
  }

  async getAccountVotes(walletAddress) {
    return this.invokeModuleProcedure(this.chainModuleName, 'getAccountVotes', { walletAddress });
  }

  async getMinFees() {
    return this.invokeModuleProcedure(this.chainModuleName, 'getMinFees');
  }
}

module.exports = SCAdapter;
