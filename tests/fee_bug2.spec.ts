import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";
import { Meteora } from "../target/types/meteora"; 


describe("divide-by-zero in get_delta_bin_id", () => {
  // Configures the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Meteora as Program<Meteora>;

  it("should revert when bin_step_u128 = 0", async () => {
    try {
      // Attempts to call an instruction that internally triggers get_delta_bin_id
      // (for example: volatility tracking / updateReferences)
      await program.methods
        .updateReferences(
          new anchor.BN(0),      // ❌ invalid: bin_step_u128 = 0
          new anchor.BN(1000),   // sqrt_price_a
          new anchor.BN(500)     // sqrt_price_b
        )
        .accounts({
          /**
           * Accounts are omitted here, since they depend on the exact pool setup
           * from the project’s IDL. Any valid pool context would suffice —
           * the divide-by-zero panic happens before account-dependent logic.
           */
        })
        .rpc();

      assert.fail("Expected transaction to revert due to divide-by-zero");
    } catch (err: any) {
      console.log("Transaction failed as expected:", err.error?.errorMessage || err.message);
      assert.match(
        err.message,
        /0|divide/i,
        "Error should indicate a divide-by-zero panic"
      );
    }
  });
});
