import { Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, BN, Idl } from '@coral-xyz/anchor';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { GAME_CONFIG } from '../config/constants';
import { ProgramError, StakingProgram } from '../types/program';

export class SolanaService {
  private connection: Connection;
  private wallet: WalletContextState;
  private program: StakingProgram;

  constructor(connection: Connection, wallet: WalletContextState) {
    this.connection = connection;
    this.wallet = wallet;
    
    const provider = new AnchorProvider(
      connection,
      wallet as any,
      { commitment: 'confirmed' }
    );

    this.program = new Program(
      GAME_CONFIG.IDL,
      provider
    ) as StakingProgram;
  }

  async stake(amount: number): Promise<void> {
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

      const signature = await this.wallet.sendTransaction(tx, this.connection);
      await this.connection.confirmTransaction(signature, 'confirmed');
    } catch (error) {
      console.error('Stake error:', error);
      throw this.handleError(error);
    }
  }

  async getPlayerState() {
    if (!this.wallet.publicKey) throw new Error('Wallet not connected');

    try {
      const [playerPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('player'),
          this.wallet.publicKey.toBuffer(),
        ],
        this.program.programId
      );

      const playerAccount = await this.program.account.playerAccount.fetch(playerPda);
      return {
        key: playerAccount.key.toString(),
        amount: playerAccount.amount / LAMPORTS_PER_SOL
      };
    } catch (error) {
      if ((error as ProgramError).code === 3012) {
        return null;
      }
      throw this.handleError(error);
    }
  }

  async closePlayerAccount(): Promise<void> {
    if (!this.wallet.publicKey) throw new Error('Wallet not connected');

    try {
      const [statePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('state')],
        this.program.programId
      );

      const [playerPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('player'),
          this.wallet.publicKey.toBuffer(),
        ],
        this.program.programId
      );

      const tx = await this.program.methods
        .closePlayerAccount()
        .accounts({
          authority: this.wallet.publicKey,
          state: statePda,
          playerAccount: playerPda,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const signature = await this.wallet.sendTransaction(tx, this.connection);
      await this.connection.confirmTransaction(signature, 'confirmed');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): Error {
    const programError = error as ProgramError;
    if (programError.msg) {
      return new Error(programError.msg);
    }
    return new Error('An unexpected error occurred');
  }
}