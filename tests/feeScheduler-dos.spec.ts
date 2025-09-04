import * as anchor from "@project-serum/anchor";
import { Program } from "@coral-xyz/anchor";
import { DynamicBondingCurve } from "../target/types/dynamic_bonding_curve";
import { BN } from "bn.js";
import { expect } from "chai";

describe("FeeScheduler Pre-Activation DoS", () => {
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);
  const program = anchor.workspace.DynamicBondingCurve as Program<DynamicBondingCurve>;

  it("fails when activationPoint is set in the future", async () => {
    const currentPoint = new BN(900);
    const activationPoint = new BN(1000);
    const periodFrequency = new BN(10);

    try {
      await program.methods
        // if getBaseFeeNumerator is not exposed, replace this with `swap`
        .getBaseFeeNumerator(currentPoint, activationPoint, periodFrequency)
        .rpc();

      expect.fail("Expected revert, but transaction succeeded");
    } catch (err: any) {
      console.log("PoC triggered error:", err.toString());
      expect(err.toString()).to.include("SubUnderflow");
    }
  });
});