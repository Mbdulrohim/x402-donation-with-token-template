/**
 * Price fetching utilities for token prices
 */

export interface TokenPrice {
  usd: number;
  usd_24h_change?: number;
}

export interface PriceData {
  [tokenId: string]: TokenPrice;
}

/**
 * Fetch token prices from CoinGecko API
 * @param tokenIds Array of CoinGecko token IDs (e.g., ['solana', 'usd-coin'])
 * @returns Object with token prices in USD
 */
export async function fetchTokenPrices(tokenIds: string[]): Promise<PriceData> {
  try {
    const ids = tokenIds.join(",");
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch prices: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching token prices:", error);
    // Return fallback prices
    return {
      solana: { usd: 0 },
      "usd-coin": { usd: 1 },
    };
  }
}

/**
 * Get SOL price in USD
 */
export async function getSolPrice(): Promise<number> {
  const prices = await fetchTokenPrices(["solana"]);
  return prices.solana?.usd || 0;
}

/**
 * Get USDC price in USD (should always be ~1)
 */
export async function getUsdcPrice(): Promise<number> {
  const prices = await fetchTokenPrices(["usd-coin"]);
  return prices["usd-coin"]?.usd || 1;
}

/**
 * Calculate USD value for a token amount
 */
export function calculateUsdValue(
  amount: number,
  pricePerToken: number
): number {
  return amount * pricePerToken;
}

/**
 * Format price to display with appropriate decimals
 */
export function formatPrice(price: number): string {
  if (price === 0) return "$0.00";
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  if (price < 100) return `$${price.toFixed(2)}`;
  return `$${price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
