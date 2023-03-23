const { PrivateKey, Client, AccountCreateTransaction, Hbar, AccountBalanceQuery } = require("@hashgraph/sdk")
require('dotenv').config()

const myPk = PrivateKey.fromString(process.env.MY_ACCOUNT_PK);
const myId = process.env.MY_ACCOUNT_ID;

const client = Client.forTestnet();
client.setOperator(myId, myPk);

async function main() {
  for(let i = 1; i <= 5; i++) {
    let newAccountPrivateKey = PrivateKey.generateED25519();
    let newAccountPublicKey = newAccountPrivateKey.publicKey;

    let newAccountTx = new AccountCreateTransaction()
      .setKey(newAccountPublicKey)
      .setInitialBalance(new Hbar(800));
    
    let newAccountResult = await newAccountTx.execute(client);

    let newAccountReceipt = await newAccountResult.getReceipt(client);

    let newAccountId = newAccountReceipt.accountId;

    console.log(`ACCOUNT_ID_${i} = ${newAccountId.toString()}`);
    console.log(`PUBLIC_KEY_${i} = ${newAccountPublicKey.toString()}`);
    console.log(`PRIVATE_KEY_${i} = ${newAccountPrivateKey.toString()}`);
    console.log('')
  }
  
  process.exit()
}

main()