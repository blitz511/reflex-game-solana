import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { GAME_CONFIG } from '../config/constants';

const PROGRAM_ID = new PublicKey('B1NT1eXqBEnidk3kQ874u1h7VvyqBxTc9qfspgh1ef8A');
const TREASURY_WALLET = new PublicKey('YOUR_TREASURY_WALLET'); // Replace with your wallet

export class SolanaService {
  private connection: Connection;
  private program: Program;

  constructor(connection: Connection, wallet: any) {
    this.connection = connection;
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
    this.program = new Program(IDL, PROGRAM_ID, provider);
  }

  async initializeGame() {
    const [statePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('state')],
      PROGRAM_ID
    );

    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault')],
      PROGRAM_ID
    );

    await this.program.methods
      .initialize(TREASURY_WALLET)
      .accounts({
        authority: this.program.provider.wallet.publicKey,
        state: statePda,
        vault: vaultPda,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
  }

  async stake(amount: number) {
    const [statePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('state')],
      PROGRAM_ID
    );

    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault')],
      PROGRAM_ID
    );

    const [playerPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('player'),
        this.program.provider.wallet.publicKey.toBuffer(),
      ],
      PROGRAM_ID
    );

    await this.program.methods
      .stake(new BN(amount * LAMPORTS_PER_SOL))
      .accounts({
        authority: this.program.provider.wallet.publicKey,
        state: statePda,
        vault: vaultPda,
        playerAccount: playerPda,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
  }

  async distributeRewards(winner: PublicKey) {
    const [statePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('state')],
      PROGRAM_ID
    );

    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault')],
      PROGRAM_ID
    );

    await this.program.methods
      .reward(winner)
      .accounts({
        authority: this.program.provider.wallet.publicKey,
        state: statePda,
        vault: vaultPda,
        treasury: TREASURY_WALLET,
        winner,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
  }
}