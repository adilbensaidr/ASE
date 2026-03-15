const mongoose = require('mongoose');
const { Schema } = mongoose;
const mixed = Schema.Types.Mixed;

const alertSchema = new mongoose.Schema(
  {
    type: { type: String },
    message: { type: String },
    severity: { type: String },
    date: { type: Date }
  },
  { _id: false }
);

const gameSchema = new Schema(
  {
    matchId: String,
    date: Date,
    opponent: String,
    result: String,
    goals: Number,
    assists: Number,
    rating: Number,
    minutesPlayed: Number
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
      name: String,
      fullName: String,
      displayName: String,
      nationality: String,
      secondNationality: String,
      placeOfBirth: String,
      dateOfBirth: Date,
      age: Number,
      height: Number,
      weight: Number,
      preferredFoot: String,
      profileImage: String
    },
    dataProvider: String,
    dataSource: String,
    season: String,
    version: String,
    lastUpdated: Date,
    lastVerified: Date,
    updateFrequency: String,
    reliability: Number,
    completeness: Number,
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
      transferData: mixed,
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
        last5Games: [gameSchema],
        last10Games: [gameSchema]
      },
      seasonProgression: [
        {
          month: String,
          goals: Number,
          assists: Number,
          appearances: Number,
          averageRating: Number
        }
      ],
      streaks: {
        currentGoalStreak: Number,
        longestGoalStreak: Number,
        currentAssistStreak: Number,
        longestAssistStreak: Number,
        currentCleanSheetStreak: Number
      }
    },
    injuryHistory: {
      currentInjuries: [mixed],
      injuryHistory: [mixed],
      injuryProneness: Number,
      totalDaysInjured: Number,
      availabilityPercentage: Number
    },
    scoutingNotes: {
      overallRating: Number,
      potential: Number,
      readiness: String,
      comparablePlayer: String,
      ceiling: String,
      attributes: mixed,
      scoutComments: [mixed]
    },
    socialMedia: {
      marketability: Number,
      engagementRate: Number,
      followersCount: {
        instagram: Number,
        twitter: Number,
        facebook: Number,
        tiktok: Number
      }
    },
    miscellaneous: {
      languages: [String],
      education: String,
      family: mixed,
      personalityTraits: [String],
      leadership: Number,
      professionalism: Number,
      adaptability: Number
    },
    clubInfo: {
      currentTeam: String,
      teamId: String,
      league: String,
      leagueId: String,
      division: String,
      country: String,
      jerseyNumber: Number,
      position: String,
      secondaryPositions: [String],
      joinedDate: Date,
      playerStatus: String,
      isLoanPlayer: Boolean,
      loanDetails: mixed
    },
    contractInfo: {
      contractStart: Date,
      contractEnd: Date,
      contractLength: Number,
      releaseClause: Number,
      salary: {
        weeklyWage: Number,
        annualSalary: Number,
        currency: String,
        bonuses: mixed
      },
      agentInfo: {
        agentName: String,
        agencyName: String,
        agentFeePercentage: Number
      }
    },
    seasonStats: mixed,
    competitionBreakdown: mixed,
    careerHistory: {
      previousClubs: [mixed],
      youthCareer: [mixed]
    },
    internationalCareer: {
      nationalTeam: String,
      youthTeams: [String],
      caps: Number,
      goals: Number,
      assists: Number,
      debut: Date,
      lastCallUp: Date,
      majorTournaments: [mixed]
    },
    tacticalData: {
      positionData: mixed,
      heatmaps: mixed,
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
