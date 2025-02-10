import { SuiObjectChangePublished } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import getExecStuff from "./execStuff";
import { execSync } from "child_process";
import { promises as fs } from "fs";

const getPackageId = async () => {
  let packageId = "";
  let CoinMetadata = "";
  let TreasuryCap = "";
  let BrandRegistry = "";

  try {
    const { keypair, client } = getExecStuff();
    const packagePath = process.cwd();
    const { modules, dependencies } = JSON.parse(
      execSync(
        `sui move build --dump-bytecode-as-base64 --path ${packagePath} --skip-fetch-latest-git-deps`,
        {
          encoding: "utf-8",
        }
      )
    );
    const tx = new Transaction();
    const [upgradeCap] = tx.publish({
      modules,
      dependencies,
    });
    tx.transferObjects([upgradeCap], keypair.getPublicKey().toSuiAddress());
    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
      requestType: "WaitForLocalExecution",
    });
    console.log(result.digest);
    const digest_ = result.digest;

    packageId = ((result.objectChanges?.filter(
      (a) => a.type === "published"
    ) as SuiObjectChangePublished[]) ?? [])[0].packageId.replace(
      /^(0x)(0+)/,
      "0x"
    ) as string;

    if (!digest_) {
      console.log("Digest is not available");
      return { packageId };
    }

    const txn = await client.getTransactionBlock({
      digest: String(digest_),
      options: {
        showEffects: true,
        showInput: false,
        showEvents: false,
        showObjectChanges: true,
        showBalanceChanges: false,
      },
    });
    let output: any;
    output = txn.objectChanges;

    for (let i = 0; i < output.length; i++) {
      const item = output[i];
      if ((await item.type) === "created") {
        if (
          (await item.objectType) ===
          `0x2::coin::CoinMetadata<${packageId}::template::TEMPLATE>`
        ) {
          CoinMetadata = String(item.objectId);
        }

        if (
          (await item.objectType) ===
          `0x2::coin::TreasuryCap<${packageId}::template::TEMPLATE>`
        ) {
          TreasuryCap = String(item.objectId);
        }

        if (
          (await item.objectType) ===
          `${packageId}::template::BrandRegistry<${packageId}::template::TEMPLATE>`
        ) {
          BrandRegistry = String(item.objectId);
        }
      }
    }

    // Write the results to a file
    const content = `export let packageId = '${packageId}';
export const CoinMetadata= '${CoinMetadata}';
export const TreasuryCap = '${TreasuryCap}';
export const typename = '${packageId}::template::TEMPLATE';\n`;

    // await fs.writeFile(`${packagePath}/scripts/utils/packageInfo.ts`, content);
    // await fs.writeFile(`${packagePath}/coin_info/coin.txt`, content);

    return { packageId, CoinMetadata, TreasuryCap };
  } catch (error) {
    console.error(error);
    return { packageId, CoinMetadata, TreasuryCap };
  }
};

// Call the async function and handle the result.
getPackageId()
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.error(error);
  });

export default getPackageId;



//19

