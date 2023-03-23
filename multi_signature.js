const { AccountCreateTransaction, PrivateKey, Client, KeyList, Hbar, TransferTransaction, AccountId } = require('@hashgraph/sdk');

require('dotenv').config()

const myPk = PrivateKey.fromString(process.env.MY_ACCOUNT_PK);
const myId = process.env.MY_ACCOUNT_ID;

const accountPk1 = PrivateKey.fromString(process.env.PRIVATE_KEY_1);
const accountId1 = process.env.ACCOUNT_ID_1;

const accountPk2 = PrivateKey.fromString(process.env.PRIVATE_KEY_2);
const accountId2 = process.env.ACCOUNT_ID_2;

const accountPk3 = PrivateKey.fromString(process.env.PRIVATE_KEY_3);
const accountId3 = process.env.ACCOUNT_ID_3;

const accountPk4 = PrivateKey.fromString(process.env.PRIVATE_KEY_4);
const accountId4 = process.env.ACCOUNT_ID_4;

const client = Client.forTestnet()
  .setOperator(myId, myPk);

const newKey = new KeyList([
  accountPk1.publicKey,
  accountPk2.publicKey,
  accountPk3.publicKey
], 2);

async function create_wallet() {
    const createMultiSigWallettx = await new AccountCreateTransaction()
      .setKey(newKey)
      .setInitialBalance(20)
      .freezeWith(client)
      .execute(client);

    const accountId = (await createMultiSigWallettx.getReceipt(client)).accountId;

    console.log(`Private key: ${newKey}`);
    console.log(`Account ID: ${accountId}\n`);
    return accountId.toString()
}

async function transactionWith1Sig(multiSigWalletId, signerPk1, recieverId) {
    let transaction = new TransferTransaction()
      .addHbarTransfer(multiSigWalletId, new Hbar(-10))
      .addHbarTransfer(recieverId, new Hbar(10))
      .setNodeAccountIds([new AccountId(3)])
      .freezeWith(client);

    const signature1 = signerPk1.signTransaction(transaction);
    transaction = transaction.addSignature(signerPk1.publicKey, signature1);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    console.log(`1 signature transaction status: ${receipt.status}`);
}

async function transactionWith2Sigs(multiSigWalletId, signerPk1, signerPk2, recieverId) {
    let transaction = new TransferTransaction()
        .addHbarTransfer(multiSigWalletId, new Hbar(-10))
        .addHbarTransfer(recieverId, new Hbar(10))
        .setNodeAccountIds([new AccountId(3)])
        .freezeWith(client);

    const signature1 = signerPk1.signTransaction(transaction);
    const signature2 = signerPk2.signTransaction(transaction);

    transaction = transaction.addSignature(signerPk1.publicKey, signature1).addSignature(signerPk2.publicKey, signature2);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    console.log(`2 signatures transaction status: ${receipt.status}`);
}

async function main() {
    let accountId = await create_wallet();
    
    await transactionWith1Sig(accountId, accountPk1, accountId4).catch(error => console.log(`1 signature transaction status: ${error.status}`));

    await transactionWith2Sigs(accountId, accountPk1, accountPk2, accountId4)

    process.exit()
}

main()