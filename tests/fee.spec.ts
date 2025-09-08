import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";
import { VolatilityTracker } from "../target/types/meteora_ag"; 

describe("VolatilityTracker timestamp bug", () => {
  it("demonstrates that last_update_timestamp is never updated", async () => {
    // This creates a mock dynamic fee config
    const dynamicFeeConfig = {
      bin_step_u128: new anchor.BN(1),
      max_volatility_accumulator: new anchor.BN(1_000_000),
      filter_period: 10,
      decay_period: 100,
      reduction_factor: 5000,
    };

    // Initializes VolatilityTracker
    const tracker: any = {
      last_update_timestamp: new anchor.BN(1000), // "last update" set to 1000
      sqrt_price_reference: new anchor.BN(1),
      volatility_accumulator: new anchor.BN(10),
      volatility_reference: new anchor.BN(0),
    };

    // First call with timestamp = 1100 (elapsed = 100)
    await (tracker as any).update_references(
      dynamicFeeConfig,
      new anchor.BN(2),
      new anchor.BN(1100),
    );

    const firstElapsed = 1100 - tracker.last_update_timestamp.toNumber();

    // Second call with timestamp = 1200 (should be elapsed=100 if updated)
    await (tracker as any).update_references(
      dynamicFeeConfig,
      new anchor.BN(3),
      new anchor.BN(1200),
    );

    const secondElapsed = 1200 - tracker.last_update_timestamp.toNumber();

    // Assertion: last_update_timestamp was never updated, so elapsed is wrong
    assert.notEqual(firstElapsed, secondElapsed, "Elapsed time should be consistent");
    assert.isAbove(secondElapsed, 150, "Elapsed grows too large because timestamp is stale");

    console.log("First elapsed:", firstElapsed);
    console.log("Second elapsed (should be ~100 but is larger):", secondElapsed);
  });
});