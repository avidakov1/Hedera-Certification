const {
  PrivateKey,
  Client,
  TransferTransaction,
  Hbar,
  ScheduleCreateTransaction,
  Transaction,
  AccountBalanceQuery,
} = require("@hashgraph/sdk");
require('dotenv').config();

const accountId1 = process.env.ACCOUNT_ID_1;
const accountPk1 = PrivateKey.fromString(process.env.PRIVATE_KEY_1);

const accountId2 = process.env.ACCOUNT_ID_2;

const client = Client.forTestnet();
client.setOperator(accountId1, accountPk1);

async function createEncodedScheduledTx(giverId, giverPk, receiverId, transferAmountInHbars) {
  const transactionToSchedule = new TransferTransaction()
    .addHbarTransfer(giverId, new Hbar(-transferAmountInHbars))
    .addHbarTransfer(receiverId, new Hbar(transferAmountInHbars) )

  const scheduledTransaction = new ScheduleCreateTransaction()
    .setScheduledTransaction(transactionToSchedule)
    .setScheduleMemo('Hedera Test Schedule Transaction')
    .setAdminKey(giverPk)
    .freezeWith(client)
    .toBytes();
  
  const transactionBytes = Buffer.from(scheduledTransaction).toString('base64');
  console.log(`Transaction in Base64: ${transactionBytes}\n`);
  
  return transactionBytes;
}

async function decodeAndSubmitTx(encodedTransaction, giverPk) {
  let decodedTx = await Transaction.fromBytes(Buffer.from(encodedTransaction, 'base64'))
    .sign(giverPk);

  let decodedResult = await decodedTx.execute(client);

  try {
    let decodedReceipt = await decodedResult.getReceipt(client);

    console.log(`Result of scheduled transaction: ${decodedReceipt.status}\n`)
  }
  catch (err) {
    console.log(`Result of scheduled transaction: ${err.status}\n`)
  }
}

async function checkAccountBalance(accountId) {
  const checkBalanceTx = await new AccountBalanceQuery()
    .setAccountId(accountId)
    .execute(client);
  
  console.log(`Account ${accountId} balance: ${checkBalanceTx.hbars}`);
}

async function main() {
  console.log(`Account balances before:`);

  await checkAccountBalance(accountId1);
  await checkAccountBalance(accountId2);

  console.log('');

  let encodedTx = await createEncodedScheduledTx(accountId1, accountPk1, accountId2, 10);
  
  await decodeAndSubmitTx(encodedTx, accountPk1);

  await new Promise((resolve) => setTimeout(resolve, 1000))

  console.log(`Account balances after:`);

  await checkAccountBalance(accountId1);
  await checkAccountBalance(accountId2);

  console.log('');

  process.exit()
}

main()