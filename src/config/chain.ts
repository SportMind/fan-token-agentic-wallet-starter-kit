/**
 * Chiliz Chain Configuration
 */

export const CHILIZ_CHAIN = {
  mainnet: {
    chainId: 88888,
    name: 'Chiliz Chain',
    rpcUrl: 'https://rpc.chiliz.com',
    explorerUrl: 'https://scan.chiliz.com',
    nativeCurrency: { name: 'Chiliz', symbol: 'CHZ', decimals: 18 },
  },
  testnet: {
    chainId: 88882,
    name: 'Chiliz Spicy Testnet',
    rpcUrl: 'https://spicy-rpc.chiliz.com',
    explorerUrl: 'https://testnet.chiliscan.com',
    faucetUrl: 'https://spicy-faucet.chiliz.com',
    nativeCurrency: { name: 'Chiliz', symbol: 'CHZ', decimals: 18 },
  },
} as const;

export type ChilizNetwork = 'mainnet' | 'testnet';

export function getChilizChain(network: ChilizNetwork = 'testnet') {
  return CHILIZ_CHAIN[network];
}
