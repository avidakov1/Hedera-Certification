const {
  Client,
  Hbar,
  ContractCreateFlow,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  PrivateKey,
} = require("@hashgraph/sdk");
require('dotenv').config();

const accountPk1 = PrivateKey.fromString(process.env.PRIVATE_KEY_1);
const accountId1 = process.env.ACCOUNT_ID_1;

const client = Client.forTestnet();
client.setOperator(accountId1, accountPk1);
client.setDefaultMaxTransactionFee(new Hbar(100));

const contractJsonFile = require("./CertificationC1.json");

async function deployContract() {
  const contractTx = await new ContractCreateFlow()
      .setBytecode(contractJsonFile.bytecode)
      .setGas(100_000)
      .execute(client);

  const contractId = (await contractTx.getReceipt(client)).contractId;
  return contractId
}

async function callContractFunction1(contractId, val1, val2) {
  const tx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(100_000)
      .setFunction("function1", new ContractFunctionParameters().addUint16(val1).addUint16(val2))
      .execute(client);
  
  let record = await tx.getRecord(client);

  return Buffer.from((record).contractFunctionResult.bytes).toJSON().data.at(-1)
}

async function callContractFunction2(contractId, function1Result) {
  const tx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(100_000)
      .setFunction("function2", new ContractFunctionParameters().addUint16(function1Result))
      .execute(client);

  return Buffer.from((await tx.getRecord(client)).contractFunctionResult.bytes).toJSON().data.at(-1)
}

async function main() {
  let contractId = await deployContract();
  let function1Result = await callContractFunction1(contractId, 4, 3);
  let function2Result = await callContractFunction2(contractId, function1Result);
  console.log(`Contract function1 result: ${function1Result}\n`);
  console.log(`Contract function2 result: ${function2Result}`);

  process.exit()
}

main()