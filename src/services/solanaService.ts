import { Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { GAME_CONFIG } from '../config/constants';
import { ProgramError } from '../types/program';
import { toast } from 'react-hot-toast';
import * as anchor from "@coral-xyz/anchor";
const { BN } = anchor;

export class SolanaService {
  private connection: Connection;
  private wallet: WalletContextState;
  private program: Program;

  constructor(connection: Connection, wallet: WalletContextState) {
    this.connection = connection;
    this.wallet = wallet;
    
    const provider = new AnchorProvider(
      connection,
      wallet as any,
      { commitment: 'processed' }
    );

    this.program = new Program(
      GAME_CONFIG.IDL,
      provider
    );
  }

  async stake(amount: number): Promise<string> {
    if (!this.wallet.publicKey) throw new Error('Wallet not connected');

    try {
      const [statePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('state')],
        this.program.programId
      );

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('vault')],
        this.program.programId
      );

      const [playerPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('player'),
          this.wallet.publicKey.toBuffer(),
        ],
        this.program.programId
      );

      const lamports = new BN(amount * LAMPORTS_PER_SOL);

      const tx = await this.program.methods
        .stake(lamports)
        .accounts({
          authority: this.wallet.publicKey,
          state: statePda,
          vault: vaultPda,
          playerAccount: playerPda,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const latestBlockhash = await this.connection.getLatestBlockhash();
      tx.recentBlockhash = latestBlockhash.blockhash;
      tx.feePayer = this.wallet.publicKey;

      const signedTx = await this.wallet.signTransaction?.(tx);
      if (!signedTx) throw new Error('Failed to sign transaction');

      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      
      await this.connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
      });

      return signature;
    } catch (error) {
      console.error('Stake error:', error);
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): Error {
    console.error('Detailed error:', error);
    const programError = error as ProgramError;
    
    if (programError.msg) {
      return new Error(programError.msg);
    }
    
    switch (programError.code) {
      case 6000:
        return new Error('Program is already initialized');
      case 6001:
        return new Error('Unauthorized action');
      case 6003:
        return new Error('Insufficient stake amount');
      default:
        return new Error('Transaction failed. Please try again.');
    }
  }
}