const { createClient } = require('../index');
const blockchainNodeIp = process.argv[2];
const blockchainNodePort = process.argv[3] || 7001;

(async () => {

  // Address: clskbde48efe4fb34f91f3bfad4e4e8feb081b302b0f
  let client = createClient({
    hostname: blockchainNodeIp,
    port: blockchainNodePort,
    networkSymbol: 'clsk',
    chainModuleName: 'capitalisk_chain'
  });

  await client.connect({
    // passphrase: 'clerk aware give dog reopen peasant duty cheese tobacco trouble gold angle'
  });

  // await client.syncAllKeyIndexes();

  // let updateResult = await client.syncAllKeyIndexes();
  // let updateResult = await client.syncKeyIndex('forging');
  // console.log('UPDATED KEYS:', updateResult);
  // console.log('FORGING KEY INDEX AFTER SYNC', client.forgingKeyIndex);

  // Recipient address: imitate forum impose muffin purity harvest area mixed renew orient wife eyebrow
  // let preparedTxn = await client.prepareTransaction({
  //   type: 'transfer',
  //   recipientAddress: 'clskefecd5cf611f1e3939b3f2754ad7d5b8ecd620a4',
  //   amount: '1000000000',
  //   fee: '10000000',
  //   timestamp: 100000,
  //   message: `Test ${i}`
  // });
  //
  // await client.postTransaction(preparedTxn);
  // console.log(`Posted transaction`);

  // let voteTxn = await client.prepareTransaction({
  //   type: 'vote',
  //   delegateAddress: 'clskefecd5cf611f1e3939b3f2754ad7d5b8ecd620a4',
  //   fee: `20000000`,
  //   timestamp: Date.now(),
  //   message: ''
  // });
  //
  // await client.postTransaction(voteTxn);
  //
  // console.log('Prepared transaction:', preparedTxn);
  //
  // let preparedMultisigTxn = await client.prepareMultisigTransaction({
  //   type: 'transfer',
  //   recipientAddress: 'clskefecd5cf611f1e3939b3f2754ad7d5b8ecd620a4',
  //   amount: `100000000`,
  //   fee: `10000000`,
  //   timestamp: Date.now(),
  //   message: 'Testing...'
  // });

  // let multisigTxnSignature = await client.signMultisigTransaction(preparedMultisigTxn);
  // console.log('Multisig transaction signature:', multisigTxnSignature);
  //
  // let accountList = await client.getAccountsByBalance(0, 10, 'desc');
  // console.log('Account list:', accountList);
  //
  // let transactions = await client.getTransactionsByTimestamp(0, 100);
  // console.log('TRANSACTIONS:', transactions);
  //
  // let accountVotes = await client.getAccountVotes(client.walletAddress);
  // console.log('ACCOUNT VOTES:', accountVotes);
  //
  // let block = await client.getBlockAtHeight(2);
  // console.log('BLOCK:', block);

  // let accounts = await client.getAccountsByBalance(0, 100);
  // console.log('ACCOUNTS:', accounts);

  // let pendingTxnCount = await client.getPendingTransactionCount();
  // console.log('PENDING TRANSACTION COUNT:', pendingTxnCount);

  // let blocks = await client.getBlocksBetweenHeights(0, 100);
  // console.log('BLOCKS:', blocks);

  // let minFees = await client.getMinFees();
  // console.log('MIN FEES:', minFees);

  let result = await client.getMaxBlockHeight();
  console.log('MAX BLOCK HEIGHT:', result);

})();
