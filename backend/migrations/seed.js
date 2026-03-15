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
const fs = require('fs');
const mongoose = require('mongoose');
const Player      = require('../src/models/Player');
const PlayerDetail = require('../src/models/PlayerDetail');
const ScoutReport = require('../src/models/ScoutReport');
const User        = require('../src/models/User');

// Rutas a los JSONs del workspace (en la raíz del proyecto)
const DATA_DIR = path.join(__dirname, '..', '..');

function resolveDataFile(fileName) {
  const candidates = [
    path.join(DATA_DIR, fileName),
    path.join(DATA_DIR, 'documentation', fileName)
  ];

  const found = candidates.find((filePath) => fs.existsSync(filePath));
  if (!found) {
    throw new Error(`No se encontró el archivo ${fileName}. Rutas probadas: ${candidates.join(', ')}`);
  }

  return found;
}

const playersData = require(resolveDataFile('players_Data_production.json'));
const scoutReportData = require(resolveDataFile('scout_report.json'));
const detailedStatsData = require(resolveDataFile('player_statistics_detailed.json'));

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

function toDate(value) {
  return value ? new Date(value) : undefined;
}

function mapGame(game) {
  return {
    matchId: game?.matchId,
    date: toDate(game?.date),
    opponent: game?.opponent,
    result: game?.result,
    goals: game?.goals,
    assists: game?.assists,
    rating: game?.rating,
    minutesPlayed: game?.minutesPlayed
  };
}

function mapDetailedProfile(rawKey, item, playerId) {
  if (!item || !item.basicInfo) return null;

  return {
    player: playerId,
    sourceKey: rawKey,
    basicInfo: {
      playerId: item.basicInfo.playerId,
      name: item.basicInfo.name,
      fullName: item.basicInfo.fullName,
      displayName: item.basicInfo.displayName,
      nationality: item.basicInfo.nationality,
      secondNationality: item.basicInfo.secondNationality,
      placeOfBirth: item.basicInfo.placeOfBirth,
      dateOfBirth: toDate(item.basicInfo.dateOfBirth),
      age: item.basicInfo.age,
      height: item.basicInfo.height,
      weight: item.basicInfo.weight,
      preferredFoot: item.basicInfo.preferredFoot,
      profileImage: item.basicInfo.profileImage
    },
    dataProvider: item.dataProvider,
    dataSource: item.dataSource,
    season: item.season,
    version: item.version,
    lastUpdated: toDate(item.lastUpdated),
    lastVerified: toDate(item.lastVerified),
    updateFrequency: item.updateFrequency,
    reliability: item.reliability,
    completeness: item.completeness,
    clubInfo: {
      currentTeam: item.clubInfo?.currentTeam,
      teamId: item.clubInfo?.teamId,
      league: item.clubInfo?.league,
      leagueId: item.clubInfo?.leagueId,
      division: item.clubInfo?.division,
      country: item.clubInfo?.country,
      jerseyNumber: item.clubInfo?.jerseyNumber,
      position: item.clubInfo?.position,
      secondaryPositions: item.clubInfo?.secondaryPositions || [],
      joinedDate: toDate(item.clubInfo?.joinedDate),
      playerStatus: item.clubInfo?.playerStatus,
      isLoanPlayer: item.clubInfo?.isLoanPlayer,
      loanDetails: item.clubInfo?.loanDetails ?? undefined
    },
    marketData: {
      currentMarketValue: item.marketData?.currentMarketValue ?? undefined,
      currency: item.marketData?.currency,
      valuationDate: toDate(item.marketData?.valuationDate),
      transferData: item.marketData?.transferData ?? undefined,
      valueHistory: (item.marketData?.valueHistory || []).map((entry) => ({
        date: toDate(entry.date),
        value: entry.value,
        source: entry.source
      })),
      valueTrend: {
        last30Days: item.marketData?.valueTrend?.last30Days,
        last90Days: item.marketData?.valueTrend?.last90Days,
        last12Months: item.marketData?.valueTrend?.last12Months
      }
    },
    contractInfo: {
      contractStart: toDate(item.contractInfo?.contractStart),
      contractEnd: toDate(item.contractInfo?.contractEnd),
      contractLength: item.contractInfo?.contractLength,
      releaseClause: item.contractInfo?.releaseClause,
      salary: {
        weeklyWage: item.contractInfo?.salary?.weeklyWage,
        annualSalary: item.contractInfo?.salary?.annualSalary,
        currency: item.contractInfo?.salary?.currency,
        bonuses: item.contractInfo?.salary?.bonuses ?? undefined
      },
      agentInfo: {
        agentName: item.contractInfo?.agentInfo?.agentName,
        agencyName: item.contractInfo?.agentInfo?.agencyName,
        agentFeePercentage: item.contractInfo?.agentInfo?.agentFeePercentage
      }
    },
    seasonStats: item.seasonStats
      ? {
          ...item.seasonStats,
          goalkeepingStats: item.seasonStats.goalkeepingStats ?? undefined
        }
      : undefined,
    formAnalysis: {
      currentForm: {
        formRating: item.formAnalysis?.currentForm?.formRating,
        consistencyScore: item.formAnalysis?.currentForm?.consistencyScore,
        momentumIndicator: item.formAnalysis?.currentForm?.momentumIndicator,
        last5Games: (item.formAnalysis?.currentForm?.last5Games || []).map(mapGame),
        last10Games: (item.formAnalysis?.currentForm?.last10Games || []).map(mapGame)
      },
      seasonProgression: (item.formAnalysis?.seasonProgression || []).map((entry) => ({
        month: entry.month,
        goals: entry.goals,
        assists: entry.assists,
        appearances: entry.appearances,
        averageRating: entry.averageRating
      })),
      streaks: {
        currentGoalStreak: item.formAnalysis?.streaks?.currentGoalStreak,
        longestGoalStreak: item.formAnalysis?.streaks?.longestGoalStreak,
        currentAssistStreak: item.formAnalysis?.streaks?.currentAssistStreak,
        longestAssistStreak: item.formAnalysis?.streaks?.longestAssistStreak,
        currentCleanSheetStreak: item.formAnalysis?.streaks?.currentCleanSheetStreak
      }
    },
    injuryHistory: {
      currentInjuries: item.injuryHistory?.currentInjuries || [],
      injuryHistory: (item.injuryHistory?.injuryHistory || []).map((entry) => ({
        ...entry,
        injuryDate: toDate(entry.injuryDate),
        returnDate: toDate(entry.returnDate)
      })),
      injuryProneness: item.injuryHistory?.injuryProneness,
      totalDaysInjured: item.injuryHistory?.totalDaysInjured,
      availabilityPercentage: item.injuryHistory?.availabilityPercentage
    },
    scoutingNotes: {
      overallRating: item.scoutingNotes?.overallRating,
      potential: item.scoutingNotes?.potential,
      readiness: item.scoutingNotes?.readiness,
      comparablePlayer: item.scoutingNotes?.comparablePlayer,
      ceiling: item.scoutingNotes?.ceiling,
      attributes: item.scoutingNotes?.attributes ?? undefined,
      scoutComments: (item.scoutingNotes?.scoutComments || []).map((comment) => ({
        ...comment,
        date: toDate(comment.date)
      }))
    },
    socialMedia: {
      marketability: item.socialMedia?.marketability,
      engagementRate: item.socialMedia?.engagementRate,
      followersCount: {
        instagram: item.socialMedia?.followersCount?.instagram,
        twitter: item.socialMedia?.followersCount?.twitter,
        facebook: item.socialMedia?.followersCount?.facebook,
        tiktok: item.socialMedia?.followersCount?.tiktok
      }
    },
    miscellaneous: {
      languages: item.miscellaneous?.languages || [],
      education: item.miscellaneous?.education,
      family: item.miscellaneous?.family ?? undefined,
      personalityTraits: item.miscellaneous?.personalityTraits || [],
      leadership: item.miscellaneous?.leadership,
      professionalism: item.miscellaneous?.professionalism,
      adaptability: item.miscellaneous?.adaptability
    },
    careerHistory: {
      previousClubs: (item.careerHistory?.previousClubs || []).map((club) => ({
        ...club,
        startDate: toDate(club.startDate),
        endDate: toDate(club.endDate)
      })),
      youthCareer: item.careerHistory?.youthCareer || []
    },
    competitionBreakdown: item.competitionBreakdown ?? undefined,
    internationalCareer: {
      nationalTeam: item.internationalCareer?.nationalTeam,
      youthTeams: item.internationalCareer?.youthTeams || [],
      caps: item.internationalCareer?.caps,
      goals: item.internationalCareer?.goals,
      assists: item.internationalCareer?.assists,
      debut: toDate(item.internationalCareer?.debut),
      lastCallUp: toDate(item.internationalCareer?.lastCallUp),
      majorTournaments: item.internationalCareer?.majorTournaments || []
    },
    tacticalData: {
      positionData: item.tacticalData?.positionData ?? undefined,
      heatmaps: item.tacticalData?.heatmaps ?? undefined,
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
  // así que hacemos match robusto por nombre. Si no existe jugador, lo creamos mínimo.
  const allPlayers = await Player.find().select('_id name').lean();
  const playersByName = new Map(
    allPlayers.map((player) => [normalizeName(player.name), player._id])
  );

  const reportDocs = [];

  for (const report of scoutReportData.scoutingReports || []) {
    const normalizedPlayerName = normalizeName(report.playerName);
    let playerId = playersByName.get(normalizedPlayerName);

    if (!playerId) {
      const tokens = normalizedPlayerName.split(' ').filter(Boolean);
      if (tokens.length) {
        const partialMatch = Array.from(playersByName.entries()).find(([name]) =>
          tokens.some((token) => token.length > 2 && name.includes(token))
        );
        playerId = partialMatch?.[1];
      }
    }

    if (!playerId && report.playerName) {
      const createdPlayer = await Player.create({
        name: report.playerName,
        position: mapPosition(report.matchDetails?.position),
        age: 21,
        team: 'Unknown Team',
        nationality: 'Unknown',
        stats: { appearances: 0, goals: 0, assists: 0, minutesPlayed: 0 }
      });

      playerId = createdPlayer._id;
      playersByName.set(normalizedPlayerName, playerId);
      console.warn(`⚠️  Jugador no encontrado para reporte: "${report.playerName}" — creado automáticamente`);
    }

    if (!playerId) {
      console.warn(`⚠️  No se pudo resolver jugador para reporte: "${report.playerName}" — omitido`);
      continue;
    }

    reportDocs.push({
      player: playerId,
      scout: demoUser._id,
      matchDetails: {
        opponent: report.matchDetails?.opponent,
        competition: report.matchDetails?.competition,
        result: report.matchDetails?.result,
        matchDate: report.date ? new Date(report.date) : undefined,
        minutesPlayed: report.matchDetails?.minutesPlayed,
        position: report.matchDetails?.position
      },
      ratings: {
        technical: report.ratings?.technical,
        physical: report.ratings?.physical,
        mental: report.ratings?.mental,
        tactical: report.ratings?.tactical,
        finishing: report.ratings?.finishing,
        passing: report.ratings?.passing,
        dribbling: report.ratings?.dribbling,
        defending: report.ratings?.defending,
        workRate: report.ratings?.workRate
      },
      overallRating: report.overallRating,
      strengths: report.strengths ?? [],
      weaknesses: report.weaknesses ?? [],
      keyMoments: report.keyMoments ?? [],
      recommendation: mapRecommendation(report.recommendation),
      notes: report.notes
    });
  }

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
