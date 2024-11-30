import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { calculateRewards } from './gameService.js';

const PROGRAM_ID = new PublicKey('B1NT1eXqBEnidk3kQ874u1h7VvyqBxTc9qfspgh1ef8A');
const TREASURY_WALLET = new PublicKey('YOUR_TREASURY_WALLET');

export const distributeRewards = async (winners) => {
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL, 'confirmed');
    const wallet = loadServerWallet(); // Implement this to load your server's wallet
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
    const program = new Program(IDL, PROGRAM_ID, provider);

    for (const winner of winners) {
      const winnerPubkey = new PublicKey(winner.wallet);
      
      await program.methods
        .reward(winnerPubkey)
        .accounts({
          authority: wallet.publicKey,
          state: getStatePda(),
          vault: getVaultPda(),
          treasury: TREASURY_WALLET,
          winner: winnerPubkey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
    }

    return true;
  } catch (error) {
    console.error('Error distributing rewards:', error);
    return false;
  }
};