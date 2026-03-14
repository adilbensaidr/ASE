const mongoose = require('mongoose');

const scoutReportSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true
    },
    scout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    matchDetails: {
      opponent:      String,
      competition:   String,
      result:        String,
      matchDate:     Date,
      minutesPlayed: Number,
      position:      String
    },
    ratings: {
      technical: { type: Number, min: 1, max: 10 },
      physical:  { type: Number, min: 1, max: 10 },
      mental:    { type: Number, min: 1, max: 10 },
      tactical:  { type: Number, min: 1, max: 10 },
      finishing: { type: Number, min: 1, max: 10 },
      passing:   { type: Number, min: 1, max: 10 },
      dribbling: { type: Number, min: 1, max: 10 },
      defending: { type: Number, min: 1, max: 10 },
      workRate:  { type: Number, min: 1, max: 10 }
    },
    overallRating:  { type: Number, min: 1, max: 10 },
    strengths:      [String],
    weaknesses:     [String],
    keyMoments:     [String],
    recommendation: { type: String, enum: ['Sign', 'Monitor', 'Pass'] },
    notes:          String
  },
  { timestamps: true }
);

scoutReportSchema.index({ player: 1, createdAt: -1 });
scoutReportSchema.index({ scout: 1 });

module.exports = mongoose.model('ScoutReport', scoutReportSchema);
