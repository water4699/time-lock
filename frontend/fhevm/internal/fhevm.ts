import { isAddress, Eip1193Provider, JsonRpcProvider } from "ethers";
import type {
  FhevmInitSDKOptions,
  FhevmInitSDKType,
  FhevmLoadSDKType,
  FhevmWindowType,
} from "./fhevmTypes";
import { isFhevmWindowType, RelayerSDKLoader } from "./RelayerSDKLoader";
import { publicKeyStorageGet, publicKeyStorageSet } from "./PublicKeyStorage";
import { FhevmInstance, FhevmInstanceConfig } from "../fhevmTypes";

export class FhevmReactError extends Error {
  code: string;
  constructor(code: string, message?: string, options?: ErrorOptions) {
    super(message, options);
    this.code = code;
    this.name = "FhevmReactError";
  }
}

function throwFhevmError(
  code: string,
  message?: string,
  cause?: unknown
): never {
  throw new FhevmReactError(code, message, cause ? { cause } : undefined);
}

const isFhevmInitialized = (): boolean => {
  if (!isFhevmWindowType(window, console.log)) {
    return false;
  }
  return window.relayerSDK.__initialized__ === true;
};

const fhevmLoadSDK: FhevmLoadSDKType = () => {
  const loader = new RelayerSDKLoader({ trace: console.log });
  return loader.load();
};

const fhevmInitSDK: FhevmInitSDKType = async (
  options?: FhevmInitSDKOptions
) => {
  if (!isFhevmWindowType(window, console.log)) {
    throw new Error("window.relayerSDK is not available");
  }
  const result = await window.relayerSDK.initSDK(options);
  window.relayerSDK.__initialized__ = result;
  if (!result) {
    throw new Error("window.relayerSDK.initSDK failed.");
  }
  return true;
};

function checkIsAddress(a: unknown): a is `0x${string}` {
  if (typeof a !== "string") {
    return false;
  }
  if (!isAddress(a)) {
    return false;
  }
  return true;
}

export class FhevmAbortError extends Error {
  constructor(message = "FHEVM operation was cancelled") {
    super(message);
    this.name = "FhevmAbortError";
  }
}

type FhevmRelayerStatusType =
  | "sdk-loading"
  | "sdk-loaded"
  | "sdk-initializing"
  | "sdk-initialized"
  | "creating";

async function getChainId(providerOrUrl: Eip1193Provider | string): Promise<number> {
  try {
    if (typeof providerOrUrl === "string") {
      const rpc = new JsonRpcProvider(providerOrUrl, undefined, {
        staticNetwork: true,
      });
      try {
        const chainId = await Promise.race([
          rpc.send("eth_chainId", []),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Provider request timeout")), 10000)
          ),
        ]);
        return Number.parseInt(chainId as string, 16);
      } finally {
        rpc.destroy();
      }
    } else {
      const chainId = await Promise.race([
        providerOrUrl.request({ method: "eth_chainId" }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Provider request timeout")), 10000)
        ),
      ]);
      return Number.parseInt(chainId as string, 16);
    }
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes("Failed to fetch") || errorMessage.includes("fetch")) {
      if (typeof providerOrUrl === "string") {
        if (providerOrUrl.includes("localhost") || providerOrUrl.includes("127.0.0.1")) {
          return 31337;
        }
        throw new Error("CHAIN_ID_UNAVAILABLE");
      }
      throw new Error("CHAIN_ID_UNAVAILABLE");
    }
    throw error;
  }
}

async function getWeb3Client(rpcUrl: string) {
  const rpc = new JsonRpcProvider(rpcUrl, undefined, {
    staticNetwork: true,
  });
  try {
    const version = await Promise.race([
      rpc.send("web3_clientVersion", []),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("RPC request timeout")), 10000)
      ),
    ]);
    return version;
  } catch (e: any) {
    throw e;
  } finally {
    rpc.destroy();
  }
}

async function tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl: string): Promise<
  | {
      ACLAddress: `0x${string}`;
      InputVerifierAddress: `0x${string}`;
      KMSVerifierAddress: `0x${string}`;
    }
  | undefined
> {
  try {
    const version = await getWeb3Client(rpcUrl);
    if (
      typeof version !== "string" ||
      !version.toLowerCase().includes("hardhat")
    ) {
      return undefined;
    }
  } catch (e: any) {
    console.debug(`[FHEVM] Could not connect to ${rpcUrl} - this is normal if using a different network or if the node is not running`);
    return undefined;
  }

  try {
    const metadata = await getFHEVMRelayerMetadata(rpcUrl);
    if (!metadata || typeof metadata !== "object") {
      return undefined;
    }
    if (
      !(
        "ACLAddress" in metadata &&
        typeof metadata.ACLAddress === "string" &&
        metadata.ACLAddress.startsWith("0x")
      )
    ) {
      return undefined;
    }
    if (
      !(
        "InputVerifierAddress" in metadata &&
        typeof metadata.InputVerifierAddress === "string" &&
        metadata.InputVerifierAddress.startsWith("0x")
      )
    ) {
      return undefined;
    }
    if (
      !(
        "KMSVerifierAddress" in metadata &&
        typeof metadata.KMSVerifierAddress === "string" &&
        metadata.KMSVerifierAddress.startsWith("0x")
      )
    ) {
      return undefined;
    }
    return metadata;
  } catch (e: any) {
    const errorMsg = e?.message || String(e);
    if (errorMsg.includes("Failed to fetch") || errorMsg.includes("fetch")) {
      console.debug(`[FHEVM] Could not fetch relayer metadata from ${rpcUrl} - this is normal if not using FHEVM Hardhat node`);
    } else {
      console.debug(`[FHEVM] Relayer metadata not available from ${rpcUrl} - this is normal`);
    }
    return undefined;
  }
}

async function getFHEVMRelayerMetadata(rpcUrl: string) {
  const rpc = new JsonRpcProvider(rpcUrl, undefined, {
    staticNetwork: true,
  });
  try {
    const version = await Promise.race([
      rpc.send("fhevm_relayer_metadata", []),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("RPC request timeout")), 10000)
      ),
    ]);
    return version;
  } catch (e: any) {
    throw e;
  } finally {
    rpc.destroy();
  }
}

type MockResolveResult = { isMock: true; chainId: number; rpcUrl: string };
type GenericResolveResult = { isMock: false; chainId: number; rpcUrl?: string };
type ResolveResult = MockResolveResult | GenericResolveResult;

async function resolve(
  providerOrUrl: Eip1193Provider | string,
  mockChains?: Record<number, string>
): Promise<ResolveResult> {
  try {
    const chainId = await getChainId(providerOrUrl);
    let rpcUrl = typeof providerOrUrl === "string" ? providerOrUrl : undefined;

    const _mockChains: Record<number, string> = {
      31337: "http://localhost:8545",
      ...(mockChains ?? {}),
    };

    if (Object.hasOwn(_mockChains, chainId)) {
      if (!rpcUrl) {
        rpcUrl = _mockChains[chainId];
      }
      return { isMock: true, chainId, rpcUrl };
    }

    return { isMock: false, chainId, rpcUrl };
  } catch (error: any) {
    if (typeof providerOrUrl === "string") {
      const _mockChains: Record<number, string> = {
        31337: "http://localhost:8545",
        ...(mockChains ?? {}),
      };

      for (const [chainId, url] of Object.entries(_mockChains)) {
        if (providerOrUrl === url || providerOrUrl.includes(url.replace("http://", "").replace("https://", ""))) {
          console.debug(`[FHEVM] Using mock chain ${chainId} for ${providerOrUrl} (chainId fetch failed but URL matches)`);
          return { isMock: true, chainId: Number(chainId), rpcUrl: providerOrUrl };
        }
      }

      if (providerOrUrl.includes("localhost") || providerOrUrl.includes("127.0.0.1")) {
        console.debug(`[FHEVM] Assuming localhost URL ${providerOrUrl} is mock chain 31337`);
        return { isMock: true, chainId: 31337, rpcUrl: providerOrUrl };
      }
    }

    const errorMessage = error?.message || String(error);
    if (errorMessage.includes("Failed to fetch") || errorMessage.includes("fetch")) {
      if (typeof providerOrUrl === "string") {
        const _mockChains: Record<number, string> = {
          31337: "http://localhost:8545",
          ...(mockChains ?? {}),
        };

        for (const [chainId, url] of Object.entries(_mockChains)) {
          if (providerOrUrl === url || providerOrUrl.includes(url.replace("http://", "").replace("https://", ""))) {
            return { isMock: true, chainId: Number(chainId), rpcUrl: providerOrUrl };
          }
        }

        if (providerOrUrl.includes("localhost") || providerOrUrl.includes("127.0.0.1")) {
          return { isMock: true, chainId: 31337, rpcUrl: providerOrUrl };
        }
      }
    }
    throw error;
  }
}

export const createFhevmInstance = async (parameters: {
  provider: Eip1193Provider | string;
  mockChains?: Record<number, string>;
  signal: AbortSignal;
  onStatusChange?: (status: FhevmRelayerStatusType) => void;
}): Promise<FhevmInstance> => {
  const throwIfAborted = () => {
    if (signal.aborted) throw new FhevmAbortError();
  };

  const notify = (status: FhevmRelayerStatusType) => {
    if (onStatusChange) onStatusChange(status);
  };

  const {
    signal,
    onStatusChange,
    provider: providerOrUrl,
    mockChains,
  } = parameters;

  // Resolve chainId
  const { isMock, rpcUrl, chainId } = await resolve(providerOrUrl, mockChains);

  if (isMock && rpcUrl) {
    console.log("[FHEVM] Detected mock chain, attempting to fetch Hardhat node metadata...", {
      chainId,
      rpcUrl,
    });

    const fhevmRelayerMetadata =
      await tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl);

    if (fhevmRelayerMetadata) {
      console.log("[FHEVM] Hardhat node FHEVM metadata found, using mock instance:", fhevmRelayerMetadata);
      notify("creating");
      const fhevmMock = await import("./mock/fhevmMock");
      const mockInstance = await fhevmMock.fhevmMockCreateInstance({
        rpcUrl,
        chainId,
        metadata: fhevmRelayerMetadata,
      });

      throwIfAborted();
      console.log("[FHEVM] Mock FHEVM instance created successfully");
      return mockInstance;
    } else {
      console.warn("[FHEVM] Hardhat node FHEVM metadata not found. This may cause issues if Hardhat node is not running with FHEVM support.");
      // Fallback: Use hardcoded FHEVM metadata for local development
      console.warn("[createFhevmInstance] Using hardcoded FHEVM metadata for local development");
      const hardcodedMetadata = {
        ACLAddress: "0x50157CFfD6bBFA2DECe204a89ec419c23ef5755D" as `0x${string}`,
        InputVerifierAddress: "0x901F8942346f7AB3a01F6D7613119Bca447Bb030" as `0x${string}`,
        KMSVerifierAddress: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC" as `0x${string}`,
      };

      notify("creating");

      const fhevmMock = await import("./mock/fhevmMock");
      const mockInstance = await fhevmMock.fhevmMockCreateInstance({
        rpcUrl,
        chainId,
        metadata: hardcodedMetadata,
      });

      throwIfAborted();

      return mockInstance;
    }
  }

  throwIfAborted();

  if (!isFhevmWindowType(window, console.log)) {
    notify("sdk-loading");

    // throws an error if failed
    await fhevmLoadSDK();
    throwIfAborted();

    notify("sdk-loaded");
  }

  // notify that state === "sdk-loaded"

  if (!isFhevmInitialized()) {
    notify("sdk-initializing");

    // throws an error if failed
    await fhevmInitSDK();
    throwIfAborted();

    notify("sdk-initialized");
  }

  const relayerSDK = (window as unknown as FhevmWindowType).relayerSDK;

  const aclAddress = relayerSDK.SepoliaConfig.aclContractAddress;
  if (!checkIsAddress(aclAddress)) {
    throw new Error(`Invalid address: ${aclAddress}`);
  }

  const pub = await publicKeyStorageGet(aclAddress);
  throwIfAborted();

  const config: FhevmInstanceConfig = {
    ...relayerSDK.SepoliaConfig,
    network: providerOrUrl,
    publicKey: pub.publicKey,
    publicParams: pub.publicParams,
  };

  // notify that state === "creating"
  notify("creating");

  const instance = await relayerSDK.createInstance(config);

  // Save the key even if aborted
  await publicKeyStorageSet(
    aclAddress,
    instance.getPublicKey(),
    instance.getPublicParams(2048)
  );

  throwIfAborted();

  return instance;
};

