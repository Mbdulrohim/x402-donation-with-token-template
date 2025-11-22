import { NextRequest, NextResponse } from "next/server";
import {
  getTokenConfig,
  calculateTokensForDonation,
  transferTokens,
} from "@/lib/token";

export interface MintRequest {
  amount: number; // USD amount to spend
}

/**
 * POST /api/mint
 *
 * Mint tokens by paying with USDC via x402 payment
 * This route accepts USDC payment and sends $TOKEN to the buyer
 *
 * Body:
 * {
 *   "amount": 10.00  // USD amount
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get payment details from middleware
    const paymentResponse = request.headers.get("X-PAYMENT-RESPONSE");
    if (!paymentResponse) {
      return NextResponse.json(
        { success: false, error: "Payment verification failed" },
        { status: 402 }
      );
    }

    let payerAddress: string;
    try {
      const decoded = JSON.parse(
        Buffer.from(paymentResponse, "base64").toString()
      );
      payerAddress = decoded.payer;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid payment response" },
        { status: 500 }
      );
    }

    // Parse request body
    const body = (await request.json()) as MintRequest;
    const { amount } = body;

    // Validate amount
    if (!amount || amount < 1) {
      return NextResponse.json(
        { success: false, error: "Amount must be at least $1" },
        { status: 400 }
      );
    }

    // Get token configuration
    const tokenConfig = getTokenConfig();

    // Calculate tokens to mint
    const tokensToMint = calculateTokensForDonation(
      amount,
      tokenConfig.dollarToTokenRatio
    );

    if (tokensToMint <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid mint amount" },
        { status: 400 }
      );
    }

    // Transfer tokens to buyer
    const signature = await transferTokens(payerAddress, tokensToMint);

    return NextResponse.json({
      success: true,
      message: `Successfully minted ${tokensToMint.toLocaleString()} ${
        tokenConfig.symbol
      }!`,
      data: {
        buyer: payerAddress,
        amountUsd: amount,
        tokensMinted: tokensToMint,
        tokenSymbol: tokenConfig.symbol,
        transactionSignature: signature,
      },
    });
  } catch (error) {
    console.error("Mint error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to process mint",
      },
      { status: 500 }
    );
  }
}
