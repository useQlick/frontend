import { PrivyClientConfig } from '@privy-io/react-auth';

export const privyConfig: PrivyClientConfig = {
  loginMethods: ['wallet', 'email', 'sms', 'google', 'twitter', 'discord'],
  appearance: {
    theme: 'dark',
    accentColor: '#64C967',
    logo: '/logo(2).svg',
    showWalletLoginFirst: true,
  },
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
    requireUserPasswordOnCreate: false,
  },
  defaultChain: {
    id: 1301,
    name: 'Unichain Sepolia',
    network: 'unichain-sepolia',
    nativeCurrency: {
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: {
        http: ['https://sepolia.unichain.org'],
      },
      public: {
        http: ['https://sepolia.unichain.org'],
      },
    },
    blockExplorers: {
      default: { name: 'Unichain Explorer', url: 'https://sepolia.uniscan.xyz' },
    },
  },
  supportedChains: [
    {
      id: 1301,
      name: 'Unichain Sepolia',
      network: 'unichain-sepolia',
      nativeCurrency: {
        decimals: 18,
        name: 'Ethereum',
        symbol: 'ETH',
      },
      rpcUrls: {
        default: {
          http: ['https://sepolia.unichain.org'],
        },
        public: {
          http: ['https://sepolia.unichain.org'],
        },
      },
      blockExplorers: {
        default: { name: 'Unichain Explorer', url: 'https://sepolia.uniscan.xyz' },
      },
    },
    // Add Ethereum mainnet and other common chains for broader wallet support
    {
      id: 1,
      name: 'Ethereum',
      network: 'homestead',
      nativeCurrency: {
        decimals: 18,
        name: 'Ethereum',
        symbol: 'ETH',
      },
      rpcUrls: {
        default: {
          http: ['https://eth.llamarpc.com'],
        },
        public: {
          http: ['https://eth.llamarpc.com'],
        },
      },
      blockExplorers: {
        default: { name: 'Etherscan', url: 'https://etherscan.io' },
      },
    },
  ],
};
