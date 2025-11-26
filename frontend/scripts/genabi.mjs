import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "StudySchedule";

// <root>/time-lock
const rel = "..";

// <root>/time-lock/frontend/abi
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

const dir = path.resolve(rel);
const dirname = path.basename(dir);

const line =
  "\n===================================================================\n";

if (!fs.existsSync(dir)) {
  console.error(
    `${line}Unable to locate ${rel}. Expecting <root>/${dirname}${line}`
  );
  process.exit(1);
}

if (!fs.existsSync(outdir)) {
  console.error(`${line}Unable to locate ${outdir}.${line}`);
  process.exit(1);
}

// Check if we're in Vercel environment
const isVercel = process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL;

const deploymentsDir = path.join(dir, "deployments");

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);

  if (!fs.existsSync(chainDeploymentDir)) {
    if (isVercel) {
      // In Vercel environment, use fallback values
      console.log(`[Vercel] Using fallback for ${chainName} deployment`);
      if (chainName === "localhost") {
        return {
          abi: [], // Will be filled from existing ABI file
          address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
          chainId
        };
      } else if (chainName === "sepolia") {
        return {
          abi: [], // Will be filled from existing ABI file
          address: "0xf09ca095e56b11AB5a34677B4798C7186892A137",
          chainId
        };
      }
    }

    console.error(
      `${line}Unable to locate '${chainDeploymentDir}' directory.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
    );
    if (!optional) {
      process.exit(1);
    }
    return undefined;
  }

  const jsonString = fs.readFileSync(
    path.join(chainDeploymentDir, `${contractName}.json`),
    "utf-8"
  );

  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;

  return obj;
}

// Localhost deployment
const deployLocalhost = readDeployment("localhost", 31337, CONTRACT_NAME, false);

// Sepolia is optional
let deploySepolia = readDeployment("sepolia", 11155111, CONTRACT_NAME, true);
if (!deploySepolia) {
  deploySepolia = { abi: deployLocalhost.abi, address: "0x0000000000000000000000000000000000000000" };
}

// In Vercel environment, if ABI is empty, try to read from existing ABI file
if (isVercel && (!deployLocalhost.abi || deployLocalhost.abi.length === 0)) {
  try {
    const existingAbiPath = path.join(outdir, `${CONTRACT_NAME}ABI.ts`);
    if (fs.existsSync(existingAbiPath)) {
      const existingContent = fs.readFileSync(existingAbiPath, 'utf-8');
      // Extract ABI from existing file
      const abiMatch = existingContent.match(/abi:\s*(\[[\s\S]*?\])/);
      if (abiMatch) {
        deployLocalhost.abi = JSON.parse(abiMatch[1]);
        deploySepolia.abi = deployLocalhost.abi;
        console.log('[Vercel] Successfully loaded ABI from existing file');
      }
    }
  } catch (error) {
    console.error('[Vercel] Failed to load existing ABI:', error.message);
  }
}

if (deployLocalhost && deploySepolia) {
  if (
    JSON.stringify(deployLocalhost.abi) !== JSON.stringify(deploySepolia.abi)
  ) {
    console.error(
      `${line}Deployments on localhost and Sepolia differ. Cant use the same abi on both networks. Consider re-deploying the contracts on both networks.${line}`
    );
    process.exit(1);
  }
}

const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: deployLocalhost.abi }, null, 2)} as const;
\n`;
const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = { 
  "11155111": { address: "${deploySepolia.address}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${deployLocalhost.address}", chainId: 31337, chainName: "hardhat" },
};
`;

console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);
console.log(tsAddresses);

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(
  path.join(outdir, `${CONTRACT_NAME}Addresses.ts`),
  tsAddresses,
  "utf-8"
);

