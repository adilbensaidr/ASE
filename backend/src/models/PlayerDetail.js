const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: { type: String },
    message: { type: String },
    severity: { type: String },
    date: { type: Date }
  },
  { _id: false }
);

const playerDetailSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
      unique: true,
      index: true
    },
    sourceKey: String,
    basicInfo: {
      playerId: String,
      fullName: String,
      displayName: String,
      secondNationality: String,
      placeOfBirth: String,
      dateOfBirth: Date
    },
    contactInfo: {
      email: String,
      phone: String,
      agentName: String,
      agentEmail: String,
      agentPhone: String
    },
    marketData: {
      currentMarketValue: Number,
      currency: String,
      valuationDate: Date,
      valueHistory: [
        {
          date: Date,
          value: Number,
          source: String
        }
      ],
      valueTrend: {
        last30Days: Number,
        last90Days: Number,
        last12Months: Number
      }
    },
    formAnalysis: {
      currentForm: {
        formRating: Number,
        consistencyScore: Number,
        momentumIndicator: String,
        last5Games: [
          {
            matchId: String,
            date: Date,
            opponent: String,
            result: String,
            goals: Number,
            assists: Number,
            rating: Number,
            minutesPlayed: Number
          }
        ]
      }
    },
    injuryHistory: {
      injuryProneness: Number,
      totalDaysInjured: Number,
      availabilityPercentage: Number
    },
    scoutingNotes: {
      overallRating: Number,
      potential: Number,
      readiness: String,
      comparablePlayer: String
    },
    socialMedia: {
      marketability: Number
    },
    miscellaneous: {
      leadership: Number,
      professionalism: Number,
      adaptability: Number
    },
    tacticalData: {
      playingStyle: {
        styleDescription: String,
        strengths: [String],
        weaknesses: [String],
        preferredFormation: String,
        roleInTeam: String
      }
    },
    alerts: [alertSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlayerDetail', playerDetailSchema);
