const { Client, TopicCreateTransaction, PrivateKey, TopicMessageSubmitTransaction } = require("@hashgraph/sdk");
require('dotenv').config();

const accountPk1 = PrivateKey.fromString(process.env.PRIVATE_KEY_1);
const accountId1 = process.env.ACCOUNT_ID_1;

const client = Client.forTestnet().setOperator(accountId1, accountPk1);

async function main() {
  // create topic transaction and execute it
  const topicTx = new TopicCreateTransaction();
  
  const topicResult = await topicTx.execute(client);
  const topicReceipt = await topicResult.getReceipt(client);

  const topicId = topicReceipt.topicId; 

  console.log(`Topic id: ${topicId}`);
  console.log(`Topic link: https://hashscan.io/testnet/topic/${topicId}\n`);

  const message = new Date().toTimeString();

  // create message trasaction and execute it 
  const messageTransaction = new TopicMessageSubmitTransaction({
    topicId,
    message,
  });

  const messageResult = await messageTransaction.execute(client);

  const messageReceipt = await messageResult.getReceipt(client);
  
  console.log(`Message content: ${message}`)
  console.log(`Message submit result: ${messageReceipt.status}`);

  process.exit();
}

main()