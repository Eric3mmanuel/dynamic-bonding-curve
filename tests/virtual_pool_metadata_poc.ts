import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";

describe("PoC: missing discriminator in VirtualPoolMetadata::space()", () => {
  // Provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Program name (Anchor workspace inferred from Cargo.toml 'dynamic-bonding-curve')
  const program = anchor.workspace.DynamicBondingCurve as Program;

  it("fails to init VirtualPoolMetadata due to under-allocated space", async () => {
    // Dummy parameters for metadata creation
    const params = {
      name: "EricCode4renabug",
      website: "https://EricCode4renabug.io",
      logo: "https://EricCode4renabug.io/logo.png",
    };

    // Derive PDA for VirtualPoolMetadata
    
    const [metadataPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from("virtual_pool_metadata"),
        provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );

    try {
      // Attempt to initialize the account with buggy space()
      const tx = await program.methods
        .createVirtualPoolMetadata(params)
        .accounts({
          metadata: metadataPda,
          payer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("❌ Unexpected success, tx:", tx);
    } catch (err) {
      console.log("✅ Expected failure due to under-allocated space:", err.toString());
    }
  });
});