import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  targetPosition: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  roundEndTime: {
    type: Date,
    required: true,
  },
  currentRound: {
    type: Number,
    default: 1,
  },
});

export default mongoose.model('Game', gameSchema);