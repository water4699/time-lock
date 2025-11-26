"use client";

import { Logo } from "./Logo";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navigation() {
  return (
    <nav className="flex w-full px-4 sm:px-6 lg:px-8 h-fit py-6 sm:py-8 justify-between items-center">
      <div className="flex items-center gap-3 sm:gap-4">
        <Logo width={48} height={48} className="w-10 h-10 sm:w-12 sm:h-12" />
        <h1 className="text-lg sm:text-2xl font-bold text-white">Encrypted Study Schedule</h1>
      </div>
      <div className="flex items-center">
        <ConnectButton />
      </div>
    </nav>
  );
}
