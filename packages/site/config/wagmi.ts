import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { metaMask, injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected({
      name: (detected) => {
        if (detected?.isOkxWallet) return 'OKX Wallet';
        if (detected?.isKeplr) return 'Keplr';
        if (detected?.isSubWallet) return 'SubWallet';
        if (detected?.isTalisman) return 'Talisman';
        if (detected?.isBackpack) return 'Backpack';
        if (detected?.isMetaMask) return 'MetaMask';
        return 'Injected';
      },
    }),
  ],
  transports: {
    [sepolia.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
