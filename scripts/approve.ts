import * as dotenv from "dotenv";
import { Transaction } from "@mysten/sui/transactions";
import getExecStuff from "./utils/execStuff";
import { bcs } from "@mysten/bcs";
import { table } from "console";
dotenv.config();

const packageId = process.env.PACKAGE_ID;
const moduleName = "dao_sui";
const functionName = "approve_project";
const ADMIN_CAP = process.env.ADMIN_CAP;

const approveProject = async (votes: number, projectId: string) => {
  const tx = new Transaction();

  const { keypair, client } = getExecStuff();
  console.log(tx.object(projectId), "tx project id");

  tx.moveCall({
    target: `${packageId}::${moduleName}::${functionName}`,
    arguments: [tx.object(ADMIN_CAP), tx.pure.u8(votes), tx.object(projectId)],
  });

  try {
    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
    });
    const transaction = await client.waitForTransaction({
      digest: result.digest,
      options: {
        showEffects: true,
      },
    });
    console.log(`Transaction Digest: ${transaction.digest}`);
    return transaction;
  } catch (e) {
    console.error(`Failed to approve project:`, e);
    throw e;
  }
};

async function get_funds(projectObjectId: string) {
  try {
    const tx = new Transaction();
    const { keypair, client } = getExecStuff();

    // Call the get_funds function
    tx.moveCall({
      target: `${packageId}::${moduleName}::get_funds`,
      arguments: [tx.gas, tx.object(projectObjectId)],
    });

    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
    });

    const transaction = await client.waitForTransaction({
      digest: result.digest,
      options: {
        showEffects: true,
      },
    });
    console.log(`Transaction Digest: ${transaction.digest}`);
    return transaction;
  } catch (e) {
    console.error(`Failed to approve project:`, e);
    throw e;
  }
}

approveProject(
  2,
  "0xe47c00491ad82c92814968b634a31efbb96d0e4208e16bdeacc15268401f08d2"
);
