import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  mintTo,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import bs58 from "bs58";

// Use Devnet
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

async function main() {
  console.log("🚀 Starting ATA Fix Verification Script...");

  // 1. Setup Actors
  // Use provided funded key for Donor (Replace with your own funded key)
  // const donorSecret = bs58.decode("YOUR_PRIVATE_KEY_HERE");
  // const donor = Keypair.fromSecretKey(donorSecret);
  const donor = Keypair.generate(); // Default to random (needs airdrop)

  const merchant = Keypair.generate();

  console.log(`Donor: ${donor.publicKey.toBase58()}`);
  console.log(`Merchant: ${merchant.publicKey.toBase58()}`);

  // Check Balance
  const balance = await connection.getBalance(donor.publicKey);
  console.log(`Donor Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  if (balance < 0.01 * LAMPORTS_PER_SOL) {
    console.error("❌ Donor wallet has insufficient funds!");
    process.exit(1);
  }

  // 3. Create a Test Token Mint
  console.log("🪙 Creating Test Token Mint...");
  // We create a NEW mint every time to ensure fresh state for the test
  const mint = await createMint(connection, donor, donor.publicKey, null, 9);
  console.log(`Mint: ${mint.toBase58()}`);

  // 4. Get Donor's ATA and Mint tokens to it
  const donorATA = await getOrCreateAssociatedTokenAccount(
    connection,
    donor,
    mint,
    donor.publicKey
  );
  console.log(`Donor ATA: ${donorATA.address.toBase58()}`);

  await mintTo(
    connection,
    donor,
    mint,
    donorATA.address,
    donor,
    1000 * 10 ** 9 // 1000 tokens
  );
  console.log("✅ Minted 1000 tokens to Donor.");

  // 5. Attempt Transfer WITHOUT Merchant ATA (Should Fail)
  console.log("\n🧪 Test 1: Transfer to Merchant WITHOUT ATA...");

  // Calculate where the Merchant ATA *should* be
  const merchantATAAddress = await getAssociatedTokenAddress(
    mint,
    merchant.publicKey
  );
  console.log(`Expected Merchant ATA: ${merchantATAAddress.toBase58()}`);

  try {
    const transferIx = createTransferInstruction(
      donorATA.address,
      merchantATAAddress, // This account does not exist yet!
      donor.publicKey,
      10 * 10 ** 9
    );

    const tx = new Transaction().add(transferIx);
    await sendAndConfirmTransaction(connection, tx, [donor]);
    console.error(
      "❌ Test 1 FAILED: Transfer succeeded but should have failed!"
    );
  } catch (e: any) {
    console.log("✅ Test 1 PASSED: Transfer failed as expected.");
    // console.log(`   Error: ${e.message || e}`);
  }

  // 6. Apply Fix: Create Merchant ATA
  console.log("\n🛠️ Applying Fix: Creating Merchant ATA...");
  try {
    const createATAIx = createAssociatedTokenAccountInstruction(
      donor.publicKey, // Payer (Donor pays for rent)
      merchantATAAddress,
      merchant.publicKey, // Owner
      mint
    );

    const tx = new Transaction().add(createATAIx);
    await sendAndConfirmTransaction(connection, tx, [donor]);
    console.log("✅ Merchant ATA created successfully.");
  } catch (e) {
    console.error("❌ Failed to create Merchant ATA:", e);
    process.exit(1);
  }

  // 7. Retry Transfer (Should Succeed)
  console.log("\n🧪 Test 2: Retry Transfer with ATA...");
  try {
    const transferIx = createTransferInstruction(
      donorATA.address,
      merchantATAAddress, // Now it exists!
      donor.publicKey,
      10 * 10 ** 9
    );

    const tx = new Transaction().add(transferIx);
    const sig = await sendAndConfirmTransaction(connection, tx, [donor]);
    console.log(`✅ Test 2 PASSED: Transfer succeeded! Signature: ${sig}`);
  } catch (e) {
    console.error(
      "❌ Test 2 FAILED: Transfer failed even after creating ATA:",
      e
    );
    process.exit(1);
  }

  console.log("\n🎉 Verification Complete: The ATA creation logic works!");
}

main().catch(console.error);
