import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { expect } from "chai";
import { DynamicBondingCurve } from "../target/types/dynamic_bonding_curve";

describe("PoC: U256 → u64 unchecked conversion panic", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .DynamicBondingCurve as Program<DynamicBondingCurve>;

  // Dummy pool + user accounts
  const pool = Keypair.generate();
  const user = Keypair.generate();

  it("should panic when U256 exceeds u64::MAX", async () => {
    try {
      // Craft input that forces a value > u64::MAX
      // Example: total_shares = 2^65, clearly larger than u64::MAX (≈1.8e19)
      const hugeShares = new anchor.BN("36893488147419103232"); // 2^65

      // Call an instruction that leads to virtual_pool calculation
      await program.methods
        .initializeVirtualPool(hugeShares) // <-- adjust to real method signature
        .accounts({
          pool: pool.publicKey,
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([pool, user])
        .rpc();

      // If no error, the program is vulnerable
      expect.fail("Expected program to panic but it executed successfully");

    } catch (err: any) {
      console.log("Caught error:", err.toString());

      // Panic error code appears if try_into().unwrap() failed
      expect(err.toString()).to.include("Program failed to complete");
    }
  });
});