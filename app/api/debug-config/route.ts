import { NextResponse } from "next/server";
import { getTokenConfig } from "@/lib/token";

export async function GET() {
  try {
    const config = getTokenConfig();
    const middlewareMint =
      process.env.NEXT_PUBLIC_TOKEN_MINT ||
      process.env.NEXT_PUBLIC_TOKEN_MINT_ADDRESS;

    return NextResponse.json({
      success: true,
      config,
      middlewareMint,
      env: {
        NEXT_PUBLIC_TOKEN_MINT: process.env.NEXT_PUBLIC_TOKEN_MINT,
        NEXT_PUBLIC_TOKEN_MINT_ADDRESS:
          process.env.NEXT_PUBLIC_TOKEN_MINT_ADDRESS,
        RESOURCE_SERVER_WALLET_ADDRESS: process.env
          .RESOURCE_SERVER_WALLET_ADDRESS
          ? "SET"
          : "MISSING",
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      env: {
        NEXT_PUBLIC_TOKEN_MINT: process.env.NEXT_PUBLIC_TOKEN_MINT,
        NEXT_PUBLIC_TOKEN_MINT_ADDRESS:
          process.env.NEXT_PUBLIC_TOKEN_MINT_ADDRESS,
      },
    });
  }
}
