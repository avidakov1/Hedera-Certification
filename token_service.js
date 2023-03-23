const { PrivateKey, TokenCreateTransaction, Client, CustomRoyaltyFee, Hbar, TokenMintTransaction, CustomFixedFee, TokenSupplyType, TokenType, TransferTransaction, TokenAssociateTransaction } = require("@hashgraph/sdk");
require('dotenv').config()

const accountId1 = process.env.ACCOUNT_ID_1;
const accountPk1 = PrivateKey.fromString(process.env.PRIVATE_KEY_1);

const accountId2 = process.env.ACCOUNT_ID_2;

const accountId3 = process.env.ACCOUNT_ID_3;
const accountPk3 = PrivateKey.fromString(process.env.PRIVATE_KEY_3);

const nftSupplyKey = PrivateKey.generate();

const client = Client.forTestnet().setOperator(accountId1, accountPk1);

async function createNFT(tokenName, tokenSymbol, maxSupply, treasuryAccountId, supplyKey, feeCollectorAccountId, fallbackFee) {
  // creating token tx
  let createTokenTx = await new TokenCreateTransaction()
    .setTokenName(tokenName)
    .setTokenSymbol(tokenSymbol)
    .setTreasuryAccountId(treasuryAccountId)
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Finite)
    .setDecimals(0)
    .setInitialSupply(0)
    .setMaxSupply(maxSupply)
    .setSupplyKey(supplyKey)
    .setCustomFees([
      new CustomRoyaltyFee()
        .setNumerator(1)
        .setDenominator(10)
        .setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(fallbackFee)))
        .setFeeCollectorAccountId(feeCollectorAccountId)
    ])
    .freezeWith(client);
  
  let createTokenResult = await createTokenTx.execute(client);

  let cerateTokenReceipt = await createTokenResult.getReceipt(client);

  console.log(`Token Creation: ${cerateTokenReceipt.status}`);
  console.log(`Token Id: ${cerateTokenReceipt.tokenId}`);
  console.log(`Token link: https://hashscan.io/testnet/token/${cerateTokenReceipt.tokenId}`);

  return cerateTokenReceipt.tokenId;
}

async function mintTokens(tokenId, supplyKey, treasuryAccountId, receiverId, receiverPk) {
  // minting 5 tokens
  for(let i = 1; i<=5; i++) {
    const mintTokenTx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .addMetadata(Buffer.from(`NFT ${i}`))
      .freezeWith(client)
      .sign(supplyKey)
    
    const mintTokenResponse = await mintTokenTx.execute(client);

    await mintTokenResponse.getReceipt(client);
  }

  // associating account 3 so that it can recieve token
  let associateReceiverTx = new TokenAssociateTransaction()
    .setAccountId(receiverId)
    .setTokenIds([tokenId])
    .freezeWith(client)
  
  let associateReceiverSign = await associateReceiverTx.sign(receiverPk)

  let associateReceiverResult = await associateReceiverSign.execute(client);

  let associateReceiverReceipt = await associateReceiverResult.getReceipt(client);

  console.log(`Associate account ${receiverId} with token ${tokenId}: ${associateReceiverReceipt.status}`);

  // sending 2nd token to account 3
  const transferTokenTx = new TransferTransaction()
    .addNftTransfer(tokenId, 2, treasuryAccountId, receiverId)
    
  const transferTokenResult = await transferTokenTx.execute(client)

  const transferTokenReceipt = await transferTokenResult.getReceipt(client);

  console.log(`Transfer second token to ${receiverId}: ${transferTokenReceipt.status}`)
}

async function main() {
  const tokenId = await createNFT('Hedera nft token 23 03', 'HNT', 5, accountId1, nftSupplyKey, accountId2, 200);
  await mintTokens(tokenId, nftSupplyKey, accountId1, accountId3, accountPk3);

  process.exit();
}

main()
