/**
 * Seed script — importa los JSON de ASE Athletics a MongoDB
 * Uso: npm run seed (desde la carpeta backend/)
 *
 * Carga:
 *  - players_Data_production.json  → colección players
 *  - scout_report.json             → colección scoutreports (necesita users)
 */

require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const Player      = require('../src/models/Player');
const PlayerDetail = require('../src/models/PlayerDetail');
const ScoutReport = require('../src/models/ScoutReport');
const User        = require('../src/models/User');

// Rutas a los JSONs del workspace (en la raíz del proyecto)
const DATA_DIR = path.join(__dirname, '..', '..');
const playersData     = require(path.join(DATA_DIR, 'players_Data_production.json'));
const scoutReportData = require(path.join(DATA_DIR, 'scout_report.json'));
const detailedStatsData = require(path.join(DATA_DIR, 'player_statistics_detailed.json'));

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function mapPlayer(p) {
  return {
    name:          p.name,
    position:      p.position,
    age:           p.age,
    team:          p.team,
    nationality:   p.nationality,
    height:        p.height        ?? undefined,
    weight:        p.weight        ?? undefined,
    preferredFoot: p.preferredFoot ?? undefined,
    jerseyNumber:  p.jerseyNumber  ?? undefined,
    stats: {
      appearances:       p.stats?.appearances       ?? 0,
      goals:             p.stats?.goals             ?? 0,
      assists:           p.stats?.assists           ?? 0,
      yellowCards:       p.stats?.yellowCards       ?? 0,
      redCards:          p.stats?.redCards          ?? 0,
      minutesPlayed:     p.stats?.minutesPlayed     ?? 0,
      passAccuracy:      p.stats?.passAccuracy      ?? undefined,
      shotsOnTarget:     p.stats?.shotsOnTarget     ?? undefined,
      totalShots:        p.stats?.totalShots        ?? undefined,
      dribblesCompleted: p.stats?.dribblesCompleted ?? undefined,
      tacklesWon:        p.stats?.tacklesWon        ?? undefined,
      aerialDuelsWon:    p.stats?.aerialDuelsWon    ?? undefined,
      // Goalkeeper específico
      saves:             p.stats?.saves             ?? undefined,
      cleanSheets:       p.stats?.cleanSheets       ?? undefined,
      goalsConceded:     p.stats?.goalsConceded     ?? undefined,
    },
    attributes: {
      pace:        p.attributes?.pace        ?? undefined,
      shooting:    p.attributes?.shooting    ?? undefined,
      passing:     p.attributes?.passing     ?? undefined,
      dribbling:   p.attributes?.dribbling   ?? undefined,
      defending:   p.attributes?.defending   ?? undefined,
      physical:    p.attributes?.physical    ?? undefined,
      finishing:   p.attributes?.finishing   ?? undefined,
      crossing:    p.attributes?.crossing    ?? undefined,
      longShots:   p.attributes?.longShots   ?? undefined,
      positioning: p.attributes?.positioning ?? undefined,
      diving:      p.attributes?.diving      ?? undefined,
      handling:    p.attributes?.handling    ?? undefined,
      kicking:     p.attributes?.kicking     ?? undefined,
      reflexes:    p.attributes?.reflexes    ?? undefined,
    },
    contract: {
      salary:      p.contract?.salary      ?? undefined,
      contractEnd: p.contract?.contractEnd
        ? new Date(p.contract.contractEnd)
        : undefined
    },
    marketValue: p.marketValue ?? undefined,
    imageUrl:    p.imageUrl    ?? undefined,
  };
}

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function mapDetailedProfile(rawKey, item, playerId) {
  if (!item || !item.basicInfo) return null;

  return {
    player: playerId,
    sourceKey: rawKey,
    basicInfo: {
      playerId: item.basicInfo.playerId,
      fullName: item.basicInfo.fullName,
      displayName: item.basicInfo.displayName,
      secondNationality: item.basicInfo.secondNationality,
      placeOfBirth: item.basicInfo.placeOfBirth,
      dateOfBirth: item.basicInfo.dateOfBirth ? new Date(item.basicInfo.dateOfBirth) : undefined
    },
    marketData: {
      currentMarketValue: item.marketData?.currentMarketValue ?? undefined,
      currency: item.marketData?.currency,
      valuationDate: item.marketData?.valuationDate ? new Date(item.marketData.valuationDate) : undefined,
      valueHistory: (item.marketData?.valueHistory || []).map((entry) => ({
        date: entry.date ? new Date(entry.date) : undefined,
        value: entry.value,
        source: entry.source
      })),
      valueTrend: {
        last30Days: item.marketData?.valueTrend?.last30Days,
        last90Days: item.marketData?.valueTrend?.last90Days,
        last12Months: item.marketData?.valueTrend?.last12Months
      }
    },
    formAnalysis: {
      currentForm: {
        formRating: item.formAnalysis?.currentForm?.formRating,
        consistencyScore: item.formAnalysis?.currentForm?.consistencyScore,
        momentumIndicator: item.formAnalysis?.currentForm?.momentumIndicator,
        last5Games: (item.formAnalysis?.currentForm?.last5Games || []).map((game) => ({
          matchId: game.matchId,
          date: game.date ? new Date(game.date) : undefined,
          opponent: game.opponent,
          result: game.result,
          goals: game.goals,
          assists: game.assists,
          rating: game.rating,
          minutesPlayed: game.minutesPlayed
        }))
      }
    },
    injuryHistory: {
      injuryProneness: item.injuryHistory?.injuryProneness,
      totalDaysInjured: item.injuryHistory?.totalDaysInjured,
      availabilityPercentage: item.injuryHistory?.availabilityPercentage
    },
    scoutingNotes: {
      overallRating: item.scoutingNotes?.overallRating,
      potential: item.scoutingNotes?.potential,
      readiness: item.scoutingNotes?.readiness,
      comparablePlayer: item.scoutingNotes?.comparablePlayer
    },
    socialMedia: {
      marketability: item.socialMedia?.marketability
    },
    miscellaneous: {
      leadership: item.miscellaneous?.leadership,
      professionalism: item.miscellaneous?.professionalism,
      adaptability: item.miscellaneous?.adaptability
    },
    tacticalData: {
      playingStyle: {
        styleDescription: item.tacticalData?.playingStyle?.styleDescription,
        strengths: item.tacticalData?.playingStyle?.strengths || [],
        weaknesses: item.tacticalData?.playingStyle?.weaknesses || [],
        preferredFormation: item.tacticalData?.playingStyle?.preferredFormation,
        roleInTeam: item.tacticalData?.playingStyle?.roleInTeam
      }
    },
    alerts: (item.alerts || []).map((alert) => ({
      type: alert.type,
      message: alert.message,
      severity: alert.severity,
      date: alert.date ? new Date(alert.date) : undefined
    }))
  };
}

function mapPosition(raw) {
  const value = normalizeName(raw);
  if (['goalkeeper', 'gk'].includes(value)) return 'Goalkeeper';
  if (value.includes('back') || value.includes('defender') || ['cb', 'lb', 'rb'].includes(value)) {
    return 'Defender';
  }
  if (value.includes('wing') || value.includes('forward') || value.includes('striker') || ['st', 'cf', 'lw', 'rw'].includes(value)) {
    return 'Forward';
  }
  return 'Midfielder';
}

function mapDetailedToBasePlayer(item) {
  const technical = item.scoutingNotes?.attributes?.technical || {};
  const basic = item.seasonStats?.basicStats || {};

  return {
    name: item.basicInfo?.name,
    position: mapPosition(item.clubInfo?.position),
    age: Number(item.basicInfo?.age) || 21,
    team: item.clubInfo?.currentTeam || 'Unknown Team',
    nationality: item.basicInfo?.nationality || 'Unknown',
    height: item.basicInfo?.height ?? undefined,
    weight: item.basicInfo?.weight ?? undefined,
    preferredFoot: item.basicInfo?.preferredFoot ?? undefined,
    jerseyNumber: item.clubInfo?.jerseyNumber ?? undefined,
    stats: {
      appearances: basic.appearances ?? 0,
      goals: basic.goals ?? 0,
      assists: basic.assists ?? 0,
      yellowCards: basic.yellowCards ?? 0,
      redCards: basic.redCards ?? 0,
      minutesPlayed: basic.minutesPlayed ?? 0,
      passAccuracy: item.seasonStats?.advancedStats?.passingMetrics?.passAccuracy ?? undefined,
      shotsOnTarget: item.seasonStats?.advancedStats?.shootingMetrics?.shotsOnTarget ?? undefined,
      totalShots: item.seasonStats?.advancedStats?.shootingMetrics?.totalShots ?? undefined,
      dribblesCompleted: item.seasonStats?.advancedStats?.technicalMetrics?.dribbles ?? undefined,
      tacklesWon: item.seasonStats?.advancedStats?.defensiveMetrics?.tacklesWon ?? undefined,
      aerialDuelsWon: item.seasonStats?.advancedStats?.defensiveMetrics?.aerialDuels ?? undefined,
      saves: item.seasonStats?.goalkeepingStats?.saves ?? undefined,
      cleanSheets: basic.cleanSheets ?? undefined,
      goalsConceded: item.seasonStats?.goalkeepingStats?.goalsConceded ?? undefined
    },
    attributes: {
      pace: technical.pace ?? undefined,
      shooting: technical.shooting ?? undefined,
      passing: technical.passing ?? undefined,
      dribbling: technical.dribbling ?? undefined,
      defending: technical.defending ?? undefined,
      physical: technical.physical ?? undefined,
      finishing: item.scoutingNotes?.attributes?.detailed?.finishing ?? undefined,
      crossing: item.scoutingNotes?.attributes?.detailed?.crossing ?? undefined,
      longShots: item.scoutingNotes?.attributes?.detailed?.longShots ?? undefined,
      positioning: item.scoutingNotes?.attributes?.detailed?.positioning ?? undefined,
      diving: item.scoutingNotes?.attributes?.goalkeeper?.diving ?? undefined,
      handling: item.scoutingNotes?.attributes?.goalkeeper?.handling ?? undefined,
      kicking: item.scoutingNotes?.attributes?.goalkeeper?.kicking ?? undefined,
      reflexes: item.scoutingNotes?.attributes?.goalkeeper?.reflexes ?? undefined
    },
    contract: {
      salary: item.contractInfo?.salary?.annualSalary ?? undefined,
      contractEnd: item.contractInfo?.contractEnd ? new Date(item.contractInfo.contractEnd) : undefined
    },
    marketValue: item.marketData?.currentMarketValue ?? undefined,
    imageUrl: item.basicInfo?.profileImage || undefined
  };
}

// ──────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB conectado');

  // 1. Limpiar colecciones
  await Promise.all([
    Player.deleteMany({}),
    PlayerDetail.deleteMany({}),
    ScoutReport.deleteMany({})
  ]);
  console.log('🗑️  Colecciones limpiadas');

  // 2. Insertar jugadores
  const playerDocs = playersData.players.map(mapPlayer);
  const insertedPlayers = await Player.insertMany(playerDocs);
  console.log(`⚽ ${insertedPlayers.length} jugadores insertados`);

  // 2.1 Insertar perfiles detallados y sincronizar marketValue
  const playerByName = new Map(
    insertedPlayers.map((p) => [normalizeName(p.name), p])
  );

  const detailedRoot = detailedStatsData.playerDataSchema || {};
  const detailedDocs = [];
  let linkedDetails = 0;
  let createdFromDetailed = 0;

  for (const [rawKey, item] of Object.entries(detailedRoot)) {
    if (!item || !item.basicInfo?.name) continue;

    let found = playerByName.get(normalizeName(item.basicInfo.name));

    if (!found) {
      const basePayload = mapDetailedToBasePlayer(item);
      if (!basePayload.name) continue;

      found = await Player.create(basePayload);
      playerByName.set(normalizeName(found.name), found);
      createdFromDetailed += 1;
    }

    const mapped = mapDetailedProfile(rawKey, item, found._id);
    if (!mapped) continue;

    detailedDocs.push(mapped);
    linkedDetails += 1;

    if (found.marketValue == null && mapped.marketData?.currentMarketValue != null) {
      found.marketValue = mapped.marketData.currentMarketValue;
      await found.save();
    }
  }

  if (detailedDocs.length > 0) {
    await PlayerDetail.insertMany(detailedDocs);
  }
  console.log(`📚 ${linkedDetails} perfiles detallados vinculados`);
  console.log(`🧩 ${createdFromDetailed} jugadores creados desde dataset detallado`);

  // 3. Crear usuario demo para los reportes (si no existe)
  let demoUser = await User.findOne({ email: 'demo@ase-athletics.com' });
  if (!demoUser) {
    demoUser = await User.create({
      name:     'Demo Scout',
      email:    'demo@ase-athletics.com',
      password: 'demo1234'
    });
    console.log('👤 Usuario demo creado  →  demo@ase-athletics.com / demo1234');
  }

  // 4. Insertar reportes de scouting
  // Los IDs del JSON original son numéricos y no coinciden 1:1 con los _id de Mongo,
  // así que intentamos hacer match por nombre de jugador.
  const playersByName = {};
  insertedPlayers.forEach(p => { playersByName[p.name.toLowerCase()] = p._id; });

  const reportDocs = scoutReportData.scoutingReports
    .map(r => {
      // Intentar match exacto y luego parcial
      const key = r.playerName?.toLowerCase();
      const playerId =
        playersByName[key] ||
        Object.entries(playersByName).find(([k]) => k.includes(key?.split(' ')[1] ?? ''))?.[1];

      if (!playerId) {
        console.warn(`⚠️  No se encontró jugador para el reporte: "${r.playerName}" — omitido`);
        return null;
      }

      return {
        player: playerId,
        scout:  demoUser._id,
        matchDetails: {
          opponent:      r.matchDetails?.opponent,
          competition:   r.matchDetails?.competition,
          result:        r.matchDetails?.result,
          matchDate:     r.date ? new Date(r.date) : undefined,
          minutesPlayed: r.matchDetails?.minutesPlayed,
          position:      r.matchDetails?.position
        },
        ratings: {
          technical: r.ratings?.technical,
          physical:  r.ratings?.physical,
          mental:    r.ratings?.mental,
          tactical:  r.ratings?.tactical,
          finishing: r.ratings?.finishing,
          passing:   r.ratings?.passing,
          dribbling: r.ratings?.dribbling,
          defending: r.ratings?.defending,
          workRate:  r.ratings?.workRate
        },
        overallRating:  r.overallRating,
        strengths:      r.strengths   ?? [],
        weaknesses:     r.weaknesses  ?? [],
        keyMoments:     r.keyMoments  ?? [],
        recommendation: mapRecommendation(r.recommendation),
        notes:          r.notes
      };
    })
    .filter(Boolean);

  if (reportDocs.length > 0) {
    await ScoutReport.insertMany(reportDocs);
    console.log(`📋 ${reportDocs.length} reportes de scouting insertados`);
  }

  console.log('\n🎉 Seed completado correctamente');
  console.log('─────────────────────────────────────────');
  console.log('Credenciales demo:');
  console.log('  Email:    demo@ase-athletics.com');
  console.log('  Password: demo1234');
  console.log('─────────────────────────────────────────\n');

  await mongoose.disconnect();
}

function mapRecommendation(text) {
  if (!text) return undefined;
  const t = text.toLowerCase();
  if (t.includes('sign') || t.includes('strong performer') || t.includes('valuable')) return 'Sign';
  if (t.includes('monitor') || t.includes('watch') || t.includes('potential')) return 'Monitor';
  return 'Pass';
}

seed().catch(err => {
  console.error('❌ Error en el seed:', err);
  process.exit(1);
});
