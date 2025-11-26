"use client";

import type { ReactNode } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";
import { MetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { MetaMaskEthersSignerProvider } from "@/hooks/metamask/useMetaMaskEthersSigner";

// Local Hardhat network
const localhost = {
  id: 31337,
  name: 'Localhost',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://localhost:8545'] },
  },
} as const;

// Sepolia test network
const sepolia = {
  id: 11155111,
  name: 'Sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia.infura.io/v3/b18fb7e6ca7045ac83c41157ab93f990'] },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
  },
} as const;

// RainbowKit configuration with your WalletConnect Project ID
const config = getDefaultConfig({
  appName: "Encrypted Study Schedule",
  projectId: "ef3325a718834a2b1b4134d3f520933d", // Your WalletConnect Project ID
  chains: [localhost, sepolia],
  ssr: true,
  appDescription: "Encrypted Study Schedule - Local Development",
  appUrl: "http://localhost:3000",
  appIcon: "http://localhost:3000/study-logo.svg",
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <MetaMaskProvider>
      <MetaMaskEthersSignerProvider initialMockChains={{ 31337: "http://localhost:8545" }}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider locale="en">
              <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </MetaMaskEthersSignerProvider>
    </MetaMaskProvider>
  );
}

