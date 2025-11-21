import { useCallback, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";

interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: any[];
}

interface UseJupiterSwapReturn {
  getQuote: (
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps?: number
  ) => Promise<SwapQuote | null>;
  executeSwap: (quote: SwapQuote) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook for Jupiter swap integration
 * https://station.jup.ag/docs/apis/swap-api
 */
export function useJupiterSwap(): UseJupiterSwapReturn {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get a swap quote from Jupiter
   */
  const getQuote = useCallback(
    async (
      inputMint: string,
      outputMint: string,
      amount: number,
      slippageBps: number = 50 // 0.5% slippage
    ): Promise<SwapQuote | null> => {
      setError(null);
      setIsLoading(true);

      try {
        // Convert amount to lamports/smallest unit
        const amountInSmallestUnit = Math.floor(amount * 1_000_000_000); // For SOL (9 decimals)

        const params = new URLSearchParams({
          inputMint,
          outputMint,
          amount: amountInSmallestUnit.toString(),
          slippageBps: slippageBps.toString(),
        });

        const url = `https://quote-api.jup.ag/v6/quote?${params.toString()}`;
        console.log("Fetching Jupiter quote:", url);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Jupiter API error:", response.status, errorText);
          throw new Error(`Failed to get quote: ${response.status} - ${errorText}`);
        }

        const quote = await response.json();
        console.log("Jupiter quote received:", quote);
        return quote;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get quote";
        setError(errorMessage);
        console.error("Error getting Jupiter quote:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Execute a swap with Jupiter
   */
  const executeSwap = useCallback(
    async (quote: SwapQuote): Promise<string | null> => {
      if (!publicKey || !signTransaction) {
        setError("Wallet not connected");
        return null;
      }

      setError(null);
      setIsLoading(true);

      try {
        // Get swap transaction
        const swapResponse = await fetch("https://quote-api.jup.ag/v6/swap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quoteResponse: quote,
            userPublicKey: publicKey.toString(),
            wrapAndUnwrapSol: true,
            // computeUnitPriceMicroLamports: 'auto', // Uncomment for priority fees
          }),
        });

        if (!swapResponse.ok) {
          throw new Error(
            `Failed to get swap transaction: ${swapResponse.statusText}`
          );
        }

        const { swapTransaction } = await swapResponse.json();

        // Deserialize the transaction
        const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
        const transaction =
          VersionedTransaction.deserialize(swapTransactionBuf);

        // Sign the transaction
        const signedTransaction = await signTransaction(transaction);

        // Send the transaction
        const signature = await connection.sendRawTransaction(
          signedTransaction.serialize(),
          {
            skipPreflight: false,
            maxRetries: 3,
          }
        );

        // Confirm the transaction
        const latestBlockhash = await connection.getLatestBlockhash();
        await connection.confirmTransaction(
          {
            signature,
            ...latestBlockhash,
          },
          "confirmed"
        );

        return signature;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to execute swap";
        setError(errorMessage);
        console.error("Error executing Jupiter swap:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [publicKey, signTransaction, connection]
  );

  return {
    getQuote,
    executeSwap,
    isLoading,
    error,
  };
}
