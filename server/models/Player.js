import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  wallet: {
    type: String,
    required: true,
    unique: true,
  },
  stakedAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  score: {
    type: Number,
    default: 0,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Player', playerSchema);