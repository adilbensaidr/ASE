const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true },
    position:      {
      type: String,
      required: true,
      enum: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']
    },
    age:           { type: Number, required: true, min: 15, max: 45 },
    team:          { type: String, required: true, trim: true },
    nationality:   { type: String, required: true, trim: true },
    height:        Number,
    weight:        Number,
    preferredFoot: { type: String, enum: ['Left', 'Right', 'Both'] },
    jerseyNumber:  Number,
    stats: {
      appearances:       { type: Number, default: 0 },
      goals:             { type: Number, default: 0 },
      assists:           { type: Number, default: 0 },
      yellowCards:       { type: Number, default: 0 },
      redCards:          { type: Number, default: 0 },
      minutesPlayed:     { type: Number, default: 0 },
      passAccuracy:      Number,
      shotsOnTarget:     Number,
      totalShots:        Number,
      dribblesCompleted: Number,
      tacklesWon:        Number,
      aerialDuelsWon:    Number,
      // Estad\u00edsticas de portero
      saves:             Number,
      cleanSheets:       Number,
      goalsConceded:     Number
    },
    attributes: {
      pace:        Number,
      shooting:    Number,
      passing:     Number,
      dribbling:   Number,
      defending:   Number,
      physical:    Number,
      finishing:   Number,
      crossing:    Number,
      longShots:   Number,
      positioning: Number,
      // Especificos de portero
      diving:      Number,
      handling:    Number,
      kicking:     Number,
      reflexes:    Number
    },
    contract: {
      salary:      Number,
      contractEnd: Date
    },
    marketValue: Number,
    imageUrl:    String
  },
  { timestamps: true }
);

// \u00cdndice de texto completo para b\u00fasqueda
playerSchema.index({ name: 'text', team: 'text', nationality: 'text' });
// \u00cdndices compuestos para filtrado eficiente
playerSchema.index({ position: 1, team: 1, age: 1 });
playerSchema.index({ 'stats.goals': -1 });

module.exports = mongoose.model('Player', playerSchema);
