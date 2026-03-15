import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PlayerForm from '../components/PlayerForm';
import api from '../services/api';

function prettyJson(value, fallback = '') {
  if (value == null) return fallback;
  if (Array.isArray(value) && value.length === 0) return fallback;
  if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return fallback;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return fallback;
  }
}

function buildDetailDraft(detail) {
  return {
    sourceKey: detail?.sourceKey || '',
    dataProvider: detail?.dataProvider || '',
    dataSource: detail?.dataSource || '',
    season: detail?.season || '',
    version: detail?.version || '',
    lastUpdated: detail?.lastUpdated ? String(detail.lastUpdated).slice(0, 10) : '',
    lastVerified: detail?.lastVerified ? String(detail.lastVerified).slice(0, 10) : '',
    updateFrequency: detail?.updateFrequency || '',
    reliability: detail?.reliability ?? '',
    completeness: detail?.completeness ?? '',
    basicInfo: {
      playerId: detail?.basicInfo?.playerId || '',
      name: detail?.basicInfo?.name || '',
      fullName: detail?.basicInfo?.fullName || '',
      displayName: detail?.basicInfo?.displayName || '',
      nationality: detail?.basicInfo?.nationality || '',
      secondNationality: detail?.basicInfo?.secondNationality || '',
      placeOfBirth: detail?.basicInfo?.placeOfBirth || '',
      dateOfBirth: detail?.basicInfo?.dateOfBirth ? String(detail.basicInfo.dateOfBirth).slice(0, 10) : '',
      age: detail?.basicInfo?.age ?? '',
      height: detail?.basicInfo?.height ?? '',
      weight: detail?.basicInfo?.weight ?? '',
      preferredFoot: detail?.basicInfo?.preferredFoot || '',
      profileImage: detail?.basicInfo?.profileImage || ''
    },
    contactInfo: {
      email: detail?.contactInfo?.email || '',
      phone: detail?.contactInfo?.phone || '',
      agentName: detail?.contactInfo?.agentName || '',
      agentEmail: detail?.contactInfo?.agentEmail || '',
      agentPhone: detail?.contactInfo?.agentPhone || ''
    },
    clubInfo: {
      currentTeam: detail?.clubInfo?.currentTeam || '',
      teamId: detail?.clubInfo?.teamId || '',
      league: detail?.clubInfo?.league || '',
      leagueId: detail?.clubInfo?.leagueId || '',
      division: detail?.clubInfo?.division || '',
      country: detail?.clubInfo?.country || '',
      jerseyNumber: detail?.clubInfo?.jerseyNumber ?? '',
      position: detail?.clubInfo?.position || '',
      secondaryPositionsText: (detail?.clubInfo?.secondaryPositions || []).join(', '),
      joinedDate: detail?.clubInfo?.joinedDate ? String(detail.clubInfo.joinedDate).slice(0, 10) : '',
      playerStatus: detail?.clubInfo?.playerStatus || '',
      isLoanPlayer: Boolean(detail?.clubInfo?.isLoanPlayer),
      loanDetailsText: prettyJson(detail?.clubInfo?.loanDetails)
    },
    contractInfo: {
      contractStart: detail?.contractInfo?.contractStart ? String(detail.contractInfo.contractStart).slice(0, 10) : '',
      contractEnd: detail?.contractInfo?.contractEnd ? String(detail.contractInfo.contractEnd).slice(0, 10) : '',
      contractLength: detail?.contractInfo?.contractLength ?? '',
      releaseClause: detail?.contractInfo?.releaseClause ?? '',
      salary: {
        weeklyWage: detail?.contractInfo?.salary?.weeklyWage ?? '',
        annualSalary: detail?.contractInfo?.salary?.annualSalary ?? '',
        currency: detail?.contractInfo?.salary?.currency || 'EUR',
        bonusesText: prettyJson(detail?.contractInfo?.salary?.bonuses)
      },
      agentInfo: {
        agentName: detail?.contractInfo?.agentInfo?.agentName || '',
        agencyName: detail?.contractInfo?.agentInfo?.agencyName || '',
        agentFeePercentage: detail?.contractInfo?.agentInfo?.agentFeePercentage ?? ''
      }
    },
    marketData: {
      currentMarketValue: detail?.marketData?.currentMarketValue ?? '',
      currency: detail?.marketData?.currency || 'EUR',
      valuationDate: detail?.marketData?.valuationDate ? String(detail.marketData.valuationDate).slice(0, 10) : '',
      transferDataText: prettyJson(detail?.marketData?.transferData),
      valueHistoryText: prettyJson(detail?.marketData?.valueHistory),
      valueTrend: {
        last30Days: detail?.marketData?.valueTrend?.last30Days ?? '',
        last90Days: detail?.marketData?.valueTrend?.last90Days ?? '',
        last12Months: detail?.marketData?.valueTrend?.last12Months ?? ''
      }
    },
    seasonStatsText: prettyJson(detail?.seasonStats),
    competitionBreakdownText: prettyJson(detail?.competitionBreakdown),
    formAnalysis: {
      currentForm: {
        formRating: detail?.formAnalysis?.currentForm?.formRating ?? '',
        consistencyScore: detail?.formAnalysis?.currentForm?.consistencyScore ?? '',
        momentumIndicator: detail?.formAnalysis?.currentForm?.momentumIndicator || 'Steady'
      },
      last5GamesText: prettyJson(detail?.formAnalysis?.currentForm?.last5Games),
      last10GamesText: prettyJson(detail?.formAnalysis?.currentForm?.last10Games),
      seasonProgressionText: prettyJson(detail?.formAnalysis?.seasonProgression),
      streaks: {
        currentGoalStreak: detail?.formAnalysis?.streaks?.currentGoalStreak ?? '',
        longestGoalStreak: detail?.formAnalysis?.streaks?.longestGoalStreak ?? '',
        currentAssistStreak: detail?.formAnalysis?.streaks?.currentAssistStreak ?? '',
        longestAssistStreak: detail?.formAnalysis?.streaks?.longestAssistStreak ?? '',
        currentCleanSheetStreak: detail?.formAnalysis?.streaks?.currentCleanSheetStreak ?? ''
      }
    },
    injuryHistory: {
      currentInjuriesText: prettyJson(detail?.injuryHistory?.currentInjuries),
      injuryHistoryText: prettyJson(detail?.injuryHistory?.injuryHistory),
      injuryProneness: detail?.injuryHistory?.injuryProneness ?? '',
      totalDaysInjured: detail?.injuryHistory?.totalDaysInjured ?? '',
      availabilityPercentage: detail?.injuryHistory?.availabilityPercentage ?? ''
    },
    scoutingNotes: {
      overallRating: detail?.scoutingNotes?.overallRating ?? '',
      potential: detail?.scoutingNotes?.potential ?? '',
      readiness: detail?.scoutingNotes?.readiness || '',
      comparablePlayer: detail?.scoutingNotes?.comparablePlayer || '',
      ceiling: detail?.scoutingNotes?.ceiling || '',
      attributesText: prettyJson(detail?.scoutingNotes?.attributes),
      scoutCommentsText: prettyJson(detail?.scoutingNotes?.scoutComments)
    },
    socialMedia: {
      marketability: detail?.socialMedia?.marketability ?? '',
      engagementRate: detail?.socialMedia?.engagementRate ?? '',
      followersCount: {
        instagram: detail?.socialMedia?.followersCount?.instagram ?? '',
        twitter: detail?.socialMedia?.followersCount?.twitter ?? '',
        facebook: detail?.socialMedia?.followersCount?.facebook ?? '',
        tiktok: detail?.socialMedia?.followersCount?.tiktok ?? ''
      }
    },
    miscellaneous: {
      languagesText: (detail?.miscellaneous?.languages || []).join(', '),
      education: detail?.miscellaneous?.education || '',
      familyText: prettyJson(detail?.miscellaneous?.family),
      personalityTraitsText: (detail?.miscellaneous?.personalityTraits || []).join(', '),
      leadership: detail?.miscellaneous?.leadership ?? '',
      professionalism: detail?.miscellaneous?.professionalism ?? '',
      adaptability: detail?.miscellaneous?.adaptability ?? ''
    },
    careerHistory: {
      previousClubsText: prettyJson(detail?.careerHistory?.previousClubs),
      youthCareerText: prettyJson(detail?.careerHistory?.youthCareer)
    },
    internationalCareer: {
      nationalTeam: detail?.internationalCareer?.nationalTeam || '',
      youthTeamsText: (detail?.internationalCareer?.youthTeams || []).join(', '),
      caps: detail?.internationalCareer?.caps ?? '',
      goals: detail?.internationalCareer?.goals ?? '',
      assists: detail?.internationalCareer?.assists ?? '',
      debut: detail?.internationalCareer?.debut ? String(detail.internationalCareer.debut).slice(0, 10) : '',
      lastCallUp: detail?.internationalCareer?.lastCallUp ? String(detail.internationalCareer.lastCallUp).slice(0, 10) : '',
      majorTournamentsText: prettyJson(detail?.internationalCareer?.majorTournaments)
    },
    tacticalData: {
      playingStyle: {
        styleDescription: detail?.tacticalData?.playingStyle?.styleDescription || '',
        strengthsText: (detail?.tacticalData?.playingStyle?.strengths || []).join(', '),
        weaknessesText: (detail?.tacticalData?.playingStyle?.weaknesses || []).join(', '),
        preferredFormation: detail?.tacticalData?.playingStyle?.preferredFormation || '',
        roleInTeam: detail?.tacticalData?.playingStyle?.roleInTeam || ''
      },
      positionDataText: prettyJson(detail?.tacticalData?.positionData),
      heatmapsText: prettyJson(detail?.tacticalData?.heatmaps)
    },
    alertsText: Array.isArray(detail?.alerts)
      ? detail.alerts
          .map((a) => [a.type || '', a.severity || '', a.date ? String(a.date).slice(0, 10) : '', a.message || ''].join('|'))
          .join('\n')
      : ''
  };
}

function toNumberOrUndefined(value) {
  if (value === '' || value == null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseJsonOrThrow(value, label, fallback = undefined) {
  const text = String(value || '').trim();
  if (!text) return fallback;

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`JSON inválido en ${label}`);
  }
}

function setNestedValue(object, path, value) {
  const keys = path.split('.');
  const clone = { ...object };
  let current = clone;

  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    current[key] = { ...(current[key] || {}) };
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return clone;
}

function parseAlerts(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [type, severity, date, ...messageParts] = line.split('|').map((p) => p.trim());
      return {
        type: type || undefined,
        severity: severity || undefined,
        date: date || undefined,
        message: messageParts.join('|') || undefined
      };
    });
}

export default function PlayerEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [detailDraft, setDetailDraft] = useState(buildDetailDraft(null));
  const playerFormId = `player-form-${id}`;

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get(`/players/${id}`);
        setPlayer(data);
        setDetailDraft(buildDetailDraft(data.detailedProfile));
      } catch (err) {
        setError(err.response?.data?.message || 'No se pudo cargar el jugador');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [id]);

  const updateDetailField = (path, value) => {
    setDetailDraft((prev) => setNestedValue(prev, path, value));
  };

  const handleUpdate = async (basePayload) => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...basePayload,
        detailedProfile: {
          sourceKey: detailDraft.sourceKey || undefined,
          dataProvider: detailDraft.dataProvider || undefined,
          dataSource: detailDraft.dataSource || undefined,
          season: detailDraft.season || undefined,
          version: detailDraft.version || undefined,
          lastUpdated: detailDraft.lastUpdated || undefined,
          lastVerified: detailDraft.lastVerified || undefined,
          updateFrequency: detailDraft.updateFrequency || undefined,
          reliability: toNumberOrUndefined(detailDraft.reliability),
          completeness: toNumberOrUndefined(detailDraft.completeness),
          basicInfo: {
            ...detailDraft.basicInfo,
            age: toNumberOrUndefined(detailDraft.basicInfo.age),
            height: toNumberOrUndefined(detailDraft.basicInfo.height),
            weight: toNumberOrUndefined(detailDraft.basicInfo.weight),
            dateOfBirth: detailDraft.basicInfo.dateOfBirth || undefined
          },
          contactInfo: {
            email: detailDraft.contactInfo.email || undefined,
            phone: detailDraft.contactInfo.phone || undefined,
            agentName: detailDraft.contactInfo.agentName || undefined,
            agentEmail: detailDraft.contactInfo.agentEmail || undefined,
            agentPhone: detailDraft.contactInfo.agentPhone || undefined
          },
          clubInfo: {
            currentTeam: detailDraft.clubInfo.currentTeam || undefined,
            teamId: detailDraft.clubInfo.teamId || undefined,
            league: detailDraft.clubInfo.league || undefined,
            leagueId: detailDraft.clubInfo.leagueId || undefined,
            division: detailDraft.clubInfo.division || undefined,
            country: detailDraft.clubInfo.country || undefined,
            jerseyNumber: toNumberOrUndefined(detailDraft.clubInfo.jerseyNumber),
            position: detailDraft.clubInfo.position || undefined,
            secondaryPositions: splitCsv(detailDraft.clubInfo.secondaryPositionsText),
            joinedDate: detailDraft.clubInfo.joinedDate || undefined,
            playerStatus: detailDraft.clubInfo.playerStatus || undefined,
            isLoanPlayer: detailDraft.clubInfo.isLoanPlayer,
            loanDetails: player?.detailedProfile?.clubInfo?.loanDetails
          },
          contractInfo: {
            contractStart: detailDraft.contractInfo.contractStart || undefined,
            contractEnd: detailDraft.contractInfo.contractEnd || undefined,
            contractLength: toNumberOrUndefined(detailDraft.contractInfo.contractLength),
            releaseClause: toNumberOrUndefined(detailDraft.contractInfo.releaseClause),
            salary: {
              weeklyWage: toNumberOrUndefined(detailDraft.contractInfo.salary.weeklyWage),
              annualSalary: toNumberOrUndefined(detailDraft.contractInfo.salary.annualSalary),
              currency: detailDraft.contractInfo.salary.currency || undefined,
              bonuses: player?.detailedProfile?.contractInfo?.salary?.bonuses
            },
            agentInfo: {
              agentName: detailDraft.contractInfo.agentInfo.agentName || undefined,
              agencyName: detailDraft.contractInfo.agentInfo.agencyName || undefined,
              agentFeePercentage: toNumberOrUndefined(detailDraft.contractInfo.agentInfo.agentFeePercentage)
            }
          },
          marketData: {
            currentMarketValue: toNumberOrUndefined(detailDraft.marketData.currentMarketValue),
            currency: detailDraft.marketData.currency || undefined,
            valuationDate: detailDraft.marketData.valuationDate || undefined,
            transferData: player?.detailedProfile?.marketData?.transferData,
            valueHistory: player?.detailedProfile?.marketData?.valueHistory || [],
            valueTrend: {
              last30Days: toNumberOrUndefined(detailDraft.marketData.valueTrend.last30Days),
              last90Days: toNumberOrUndefined(detailDraft.marketData.valueTrend.last90Days),
              last12Months: toNumberOrUndefined(detailDraft.marketData.valueTrend.last12Months)
            }
          },
          seasonStats: player?.detailedProfile?.seasonStats,
          competitionBreakdown: player?.detailedProfile?.competitionBreakdown,
          formAnalysis: {
            currentForm: {
              formRating: toNumberOrUndefined(detailDraft.formAnalysis.currentForm.formRating),
              consistencyScore: toNumberOrUndefined(detailDraft.formAnalysis.currentForm.consistencyScore),
              momentumIndicator: detailDraft.formAnalysis.currentForm.momentumIndicator,
              last5Games: player?.detailedProfile?.formAnalysis?.currentForm?.last5Games || [],
              last10Games: player?.detailedProfile?.formAnalysis?.currentForm?.last10Games || []
            },
            seasonProgression: player?.detailedProfile?.formAnalysis?.seasonProgression || [],
            streaks: {
              currentGoalStreak: toNumberOrUndefined(detailDraft.formAnalysis.streaks.currentGoalStreak),
              longestGoalStreak: toNumberOrUndefined(detailDraft.formAnalysis.streaks.longestGoalStreak),
              currentAssistStreak: toNumberOrUndefined(detailDraft.formAnalysis.streaks.currentAssistStreak),
              longestAssistStreak: toNumberOrUndefined(detailDraft.formAnalysis.streaks.longestAssistStreak),
              currentCleanSheetStreak: toNumberOrUndefined(detailDraft.formAnalysis.streaks.currentCleanSheetStreak)
            }
          },
          injuryHistory: {
            currentInjuries: player?.detailedProfile?.injuryHistory?.currentInjuries || [],
            injuryHistory: player?.detailedProfile?.injuryHistory?.injuryHistory || [],
            injuryProneness: toNumberOrUndefined(detailDraft.injuryHistory.injuryProneness),
            totalDaysInjured: toNumberOrUndefined(detailDraft.injuryHistory.totalDaysInjured),
            availabilityPercentage: toNumberOrUndefined(detailDraft.injuryHistory.availabilityPercentage)
          },
          scoutingNotes: {
            overallRating: toNumberOrUndefined(detailDraft.scoutingNotes.overallRating),
            potential: toNumberOrUndefined(detailDraft.scoutingNotes.potential),
            readiness: detailDraft.scoutingNotes.readiness || undefined,
            comparablePlayer: detailDraft.scoutingNotes.comparablePlayer || undefined,
            ceiling: detailDraft.scoutingNotes.ceiling || undefined,
            attributes: player?.detailedProfile?.scoutingNotes?.attributes,
            scoutComments: player?.detailedProfile?.scoutingNotes?.scoutComments || []
          },
          socialMedia: {
            marketability: toNumberOrUndefined(detailDraft.socialMedia.marketability),
            engagementRate: toNumberOrUndefined(detailDraft.socialMedia.engagementRate),
            followersCount: {
              instagram: toNumberOrUndefined(detailDraft.socialMedia.followersCount.instagram),
              twitter: toNumberOrUndefined(detailDraft.socialMedia.followersCount.twitter),
              facebook: toNumberOrUndefined(detailDraft.socialMedia.followersCount.facebook),
              tiktok: toNumberOrUndefined(detailDraft.socialMedia.followersCount.tiktok)
            }
          },
          miscellaneous: {
            languages: splitCsv(detailDraft.miscellaneous.languagesText),
            education: detailDraft.miscellaneous.education || undefined,
            family: player?.detailedProfile?.miscellaneous?.family,
            personalityTraits: splitCsv(detailDraft.miscellaneous.personalityTraitsText),
            leadership: toNumberOrUndefined(detailDraft.miscellaneous.leadership),
            professionalism: toNumberOrUndefined(detailDraft.miscellaneous.professionalism),
            adaptability: toNumberOrUndefined(detailDraft.miscellaneous.adaptability)
          },
          careerHistory: {
            previousClubs: player?.detailedProfile?.careerHistory?.previousClubs || [],
            youthCareer: player?.detailedProfile?.careerHistory?.youthCareer || []
          },
          internationalCareer: {
            nationalTeam: detailDraft.internationalCareer.nationalTeam || undefined,
            youthTeams: splitCsv(detailDraft.internationalCareer.youthTeamsText),
            caps: toNumberOrUndefined(detailDraft.internationalCareer.caps),
            goals: toNumberOrUndefined(detailDraft.internationalCareer.goals),
            assists: toNumberOrUndefined(detailDraft.internationalCareer.assists),
            debut: detailDraft.internationalCareer.debut || undefined,
            lastCallUp: detailDraft.internationalCareer.lastCallUp || undefined,
            majorTournaments: player?.detailedProfile?.internationalCareer?.majorTournaments || []
          },
          tacticalData: {
            positionData: player?.detailedProfile?.tacticalData?.positionData,
            heatmaps: player?.detailedProfile?.tacticalData?.heatmaps,
            playingStyle: {
              styleDescription: detailDraft.tacticalData.playingStyle.styleDescription || undefined,
              strengths: splitCsv(detailDraft.tacticalData.playingStyle.strengthsText),
              weaknesses: splitCsv(detailDraft.tacticalData.playingStyle.weaknessesText),
              preferredFormation: detailDraft.tacticalData.playingStyle.preferredFormation || undefined,
              roleInTeam: detailDraft.tacticalData.playingStyle.roleInTeam || undefined
            }
          },
          alerts: parseAlerts(detailDraft.alertsText)
        }
      };

      await api.put(`/players/${id}`, payload);
      navigate(`/players/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar el jugador');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-gray-600">Cargando jugador...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">Editar Jugador</h1>
        <p className="text-gray-600 mt-1">Actualiza la informacion de {player?.name || 'este jugador'}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {player && (
          <div className="space-y-8">
            <PlayerForm
              initialValues={player}
              loading={saving}
              submitLabel="Guardar cambios"
              onSubmit={handleUpdate}
              formId={playerFormId}
              showSubmitButton={false}
            />

            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h2 className="text-xl font-bold text-secondary-900">Perfil avanzado</h2>

              <div className="space-y-6">
                <section className="space-y-3">
                  <h3 className="text-lg font-semibold text-secondary-900">Metadatos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-sm text-gray-600 mb-1">Source key</label><input value={detailDraft.sourceKey} onChange={(e) => updateDetailField('sourceKey', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Data provider</label><input value={detailDraft.dataProvider} onChange={(e) => updateDetailField('dataProvider', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Data source</label><input value={detailDraft.dataSource} onChange={(e) => updateDetailField('dataSource', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Season</label><input value={detailDraft.season} onChange={(e) => updateDetailField('season', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Version</label><input value={detailDraft.version} onChange={(e) => updateDetailField('version', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Update frequency</label><input value={detailDraft.updateFrequency} onChange={(e) => updateDetailField('updateFrequency', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Last updated</label><input type="date" value={detailDraft.lastUpdated} onChange={(e) => updateDetailField('lastUpdated', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Last verified</label><input type="date" value={detailDraft.lastVerified} onChange={(e) => updateDetailField('lastVerified', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Reliability</label><input type="number" step="0.01" value={detailDraft.reliability} onChange={(e) => updateDetailField('reliability', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Completeness</label><input type="number" step="0.01" value={detailDraft.completeness} onChange={(e) => updateDetailField('completeness', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-semibold text-secondary-900">Información personal y contacto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-sm text-gray-600 mb-1">Player ID</label><input value={detailDraft.basicInfo.playerId} onChange={(e) => updateDetailField('basicInfo.playerId', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Name</label><input value={detailDraft.basicInfo.name} onChange={(e) => updateDetailField('basicInfo.name', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Full name</label><input value={detailDraft.basicInfo.fullName} onChange={(e) => updateDetailField('basicInfo.fullName', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Display name</label><input value={detailDraft.basicInfo.displayName} onChange={(e) => updateDetailField('basicInfo.displayName', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Nationality</label><input value={detailDraft.basicInfo.nationality} onChange={(e) => updateDetailField('basicInfo.nationality', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Second nationality</label><input value={detailDraft.basicInfo.secondNationality} onChange={(e) => updateDetailField('basicInfo.secondNationality', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Place of birth</label><input value={detailDraft.basicInfo.placeOfBirth} onChange={(e) => updateDetailField('basicInfo.placeOfBirth', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Date of birth</label><input type="date" value={detailDraft.basicInfo.dateOfBirth} onChange={(e) => updateDetailField('basicInfo.dateOfBirth', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Age</label><input type="number" min="0" value={detailDraft.basicInfo.age} onChange={(e) => updateDetailField('basicInfo.age', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Height</label><input type="number" min="0" value={detailDraft.basicInfo.height} onChange={(e) => updateDetailField('basicInfo.height', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Weight</label><input type="number" min="0" value={detailDraft.basicInfo.weight} onChange={(e) => updateDetailField('basicInfo.weight', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Preferred foot</label><input value={detailDraft.basicInfo.preferredFoot} onChange={(e) => updateDetailField('basicInfo.preferredFoot', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Profile image URL</label><input value={detailDraft.basicInfo.profileImage} onChange={(e) => updateDetailField('basicInfo.profileImage', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Email contacto</label><input type="email" value={detailDraft.contactInfo.email} onChange={(e) => updateDetailField('contactInfo.email', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Teléfono contacto</label><input value={detailDraft.contactInfo.phone} onChange={(e) => updateDetailField('contactInfo.phone', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Nombre agente</label><input value={detailDraft.contactInfo.agentName} onChange={(e) => updateDetailField('contactInfo.agentName', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Email agente</label><input type="email" value={detailDraft.contactInfo.agentEmail} onChange={(e) => updateDetailField('contactInfo.agentEmail', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Teléfono agente</label><input value={detailDraft.contactInfo.agentPhone} onChange={(e) => updateDetailField('contactInfo.agentPhone', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-semibold text-secondary-900">Club y contrato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-sm text-gray-600 mb-1">Current team</label><input value={detailDraft.clubInfo.currentTeam} onChange={(e) => updateDetailField('clubInfo.currentTeam', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Team ID</label><input value={detailDraft.clubInfo.teamId} onChange={(e) => updateDetailField('clubInfo.teamId', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">League</label><input value={detailDraft.clubInfo.league} onChange={(e) => updateDetailField('clubInfo.league', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">League ID</label><input value={detailDraft.clubInfo.leagueId} onChange={(e) => updateDetailField('clubInfo.leagueId', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Division</label><input value={detailDraft.clubInfo.division} onChange={(e) => updateDetailField('clubInfo.division', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Country</label><input value={detailDraft.clubInfo.country} onChange={(e) => updateDetailField('clubInfo.country', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Jersey number</label><input type="number" min="0" value={detailDraft.clubInfo.jerseyNumber} onChange={(e) => updateDetailField('clubInfo.jerseyNumber', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Position</label><input value={detailDraft.clubInfo.position} onChange={(e) => updateDetailField('clubInfo.position', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Secondary positions</label><input value={detailDraft.clubInfo.secondaryPositionsText} onChange={(e) => updateDetailField('clubInfo.secondaryPositionsText', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Joined date</label><input type="date" value={detailDraft.clubInfo.joinedDate} onChange={(e) => updateDetailField('clubInfo.joinedDate', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Player status</label><input value={detailDraft.clubInfo.playerStatus} onChange={(e) => updateDetailField('clubInfo.playerStatus', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 mt-7"><input type="checkbox" checked={detailDraft.clubInfo.isLoanPlayer} onChange={(e) => updateDetailField('clubInfo.isLoanPlayer', e.target.checked)} /> Is loan player</label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-sm text-gray-600 mb-1">Contract start</label><input type="date" value={detailDraft.contractInfo.contractStart} onChange={(e) => updateDetailField('contractInfo.contractStart', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Contract end</label><input type="date" value={detailDraft.contractInfo.contractEnd} onChange={(e) => updateDetailField('contractInfo.contractEnd', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Contract length</label><input type="number" min="0" value={detailDraft.contractInfo.contractLength} onChange={(e) => updateDetailField('contractInfo.contractLength', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Release clause</label><input type="number" min="0" value={detailDraft.contractInfo.releaseClause} onChange={(e) => updateDetailField('contractInfo.releaseClause', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Weekly wage</label><input type="number" min="0" value={detailDraft.contractInfo.salary.weeklyWage} onChange={(e) => updateDetailField('contractInfo.salary.weeklyWage', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Annual salary</label><input type="number" min="0" value={detailDraft.contractInfo.salary.annualSalary} onChange={(e) => updateDetailField('contractInfo.salary.annualSalary', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Salary currency</label><input value={detailDraft.contractInfo.salary.currency} onChange={(e) => updateDetailField('contractInfo.salary.currency', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Agent name</label><input value={detailDraft.contractInfo.agentInfo.agentName} onChange={(e) => updateDetailField('contractInfo.agentInfo.agentName', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Agency name</label><input value={detailDraft.contractInfo.agentInfo.agencyName} onChange={(e) => updateDetailField('contractInfo.agentInfo.agencyName', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Agent fee %</label><input type="number" step="0.1" value={detailDraft.contractInfo.agentInfo.agentFeePercentage} onChange={(e) => updateDetailField('contractInfo.agentInfo.agentFeePercentage', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-semibold text-secondary-900">Mercado, forma, lesiones y scouting</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-sm text-gray-600 mb-1">Market value</label><input type="number" min="0" value={detailDraft.marketData.currentMarketValue} onChange={(e) => updateDetailField('marketData.currentMarketValue', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Currency</label><input value={detailDraft.marketData.currency} onChange={(e) => updateDetailField('marketData.currency', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Valuation date</label><input type="date" value={detailDraft.marketData.valuationDate} onChange={(e) => updateDetailField('marketData.valuationDate', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Trend 30d</label><input type="number" step="0.1" value={detailDraft.marketData.valueTrend.last30Days} onChange={(e) => updateDetailField('marketData.valueTrend.last30Days', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Trend 90d</label><input type="number" step="0.1" value={detailDraft.marketData.valueTrend.last90Days} onChange={(e) => updateDetailField('marketData.valueTrend.last90Days', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Trend 12m</label><input type="number" step="0.1" value={detailDraft.marketData.valueTrend.last12Months} onChange={(e) => updateDetailField('marketData.valueTrend.last12Months', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Form rating</label><input type="number" step="0.1" value={detailDraft.formAnalysis.currentForm.formRating} onChange={(e) => updateDetailField('formAnalysis.currentForm.formRating', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Consistency score</label><input type="number" step="0.01" value={detailDraft.formAnalysis.currentForm.consistencyScore} onChange={(e) => updateDetailField('formAnalysis.currentForm.consistencyScore', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Momentum</label><input value={detailDraft.formAnalysis.currentForm.momentumIndicator} onChange={(e) => updateDetailField('formAnalysis.currentForm.momentumIndicator', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Current goal streak</label><input type="number" min="0" value={detailDraft.formAnalysis.streaks.currentGoalStreak} onChange={(e) => updateDetailField('formAnalysis.streaks.currentGoalStreak', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Longest goal streak</label><input type="number" min="0" value={detailDraft.formAnalysis.streaks.longestGoalStreak} onChange={(e) => updateDetailField('formAnalysis.streaks.longestGoalStreak', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Current assist streak</label><input type="number" min="0" value={detailDraft.formAnalysis.streaks.currentAssistStreak} onChange={(e) => updateDetailField('formAnalysis.streaks.currentAssistStreak', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Longest assist streak</label><input type="number" min="0" value={detailDraft.formAnalysis.streaks.longestAssistStreak} onChange={(e) => updateDetailField('formAnalysis.streaks.longestAssistStreak', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Current clean sheet streak</label><input type="number" min="0" value={detailDraft.formAnalysis.streaks.currentCleanSheetStreak} onChange={(e) => updateDetailField('formAnalysis.streaks.currentCleanSheetStreak', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Injury proneness</label><input type="number" step="0.01" value={detailDraft.injuryHistory.injuryProneness} onChange={(e) => updateDetailField('injuryHistory.injuryProneness', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Total days injured</label><input type="number" min="0" value={detailDraft.injuryHistory.totalDaysInjured} onChange={(e) => updateDetailField('injuryHistory.totalDaysInjured', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Availability %</label><input type="number" step="0.1" value={detailDraft.injuryHistory.availabilityPercentage} onChange={(e) => updateDetailField('injuryHistory.availabilityPercentage', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Overall rating</label><input type="number" step="0.1" value={detailDraft.scoutingNotes.overallRating} onChange={(e) => updateDetailField('scoutingNotes.overallRating', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Potential</label><input type="number" step="0.1" value={detailDraft.scoutingNotes.potential} onChange={(e) => updateDetailField('scoutingNotes.potential', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Readiness</label><input value={detailDraft.scoutingNotes.readiness} onChange={(e) => updateDetailField('scoutingNotes.readiness', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Comparable player</label><input value={detailDraft.scoutingNotes.comparablePlayer} onChange={(e) => updateDetailField('scoutingNotes.comparablePlayer', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Ceiling</label><input value={detailDraft.scoutingNotes.ceiling} onChange={(e) => updateDetailField('scoutingNotes.ceiling', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Marketability</label><input type="number" step="0.1" value={detailDraft.socialMedia.marketability} onChange={(e) => updateDetailField('socialMedia.marketability', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Engagement rate</label><input type="number" step="0.1" value={detailDraft.socialMedia.engagementRate} onChange={(e) => updateDetailField('socialMedia.engagementRate', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Instagram followers</label><input type="number" min="0" value={detailDraft.socialMedia.followersCount.instagram} onChange={(e) => updateDetailField('socialMedia.followersCount.instagram', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Twitter followers</label><input type="number" min="0" value={detailDraft.socialMedia.followersCount.twitter} onChange={(e) => updateDetailField('socialMedia.followersCount.twitter', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Facebook followers</label><input type="number" min="0" value={detailDraft.socialMedia.followersCount.facebook} onChange={(e) => updateDetailField('socialMedia.followersCount.facebook', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">TikTok followers</label><input type="number" min="0" value={detailDraft.socialMedia.followersCount.tiktok} onChange={(e) => updateDetailField('socialMedia.followersCount.tiktok', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Leadership</label><input type="number" step="0.1" value={detailDraft.miscellaneous.leadership} onChange={(e) => updateDetailField('miscellaneous.leadership', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Professionalism</label><input type="number" step="0.1" value={detailDraft.miscellaneous.professionalism} onChange={(e) => updateDetailField('miscellaneous.professionalism', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Adaptability</label><input type="number" step="0.1" value={detailDraft.miscellaneous.adaptability} onChange={(e) => updateDetailField('miscellaneous.adaptability', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Languages</label><input value={detailDraft.miscellaneous.languagesText} onChange={(e) => updateDetailField('miscellaneous.languagesText', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Education</label><input value={detailDraft.miscellaneous.education} onChange={(e) => updateDetailField('miscellaneous.education', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Personality traits</label><input value={detailDraft.miscellaneous.personalityTraitsText} onChange={(e) => updateDetailField('miscellaneous.personalityTraitsText', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-semibold text-secondary-900">Estilo y bloques avanzados</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm text-gray-600 mb-1">Style description</label><textarea rows={3} value={detailDraft.tacticalData.playingStyle.styleDescription} onChange={(e) => updateDetailField('tacticalData.playingStyle.styleDescription', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Role in team</label><textarea rows={3} value={detailDraft.tacticalData.playingStyle.roleInTeam} onChange={(e) => updateDetailField('tacticalData.playingStyle.roleInTeam', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Strengths (comma separated)</label><textarea rows={2} value={detailDraft.tacticalData.playingStyle.strengthsText} onChange={(e) => updateDetailField('tacticalData.playingStyle.strengthsText', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Weaknesses (comma separated)</label><textarea rows={2} value={detailDraft.tacticalData.playingStyle.weaknessesText} onChange={(e) => updateDetailField('tacticalData.playingStyle.weaknessesText', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Preferred formation</label><input value={detailDraft.tacticalData.playingStyle.preferredFormation} onChange={(e) => updateDetailField('tacticalData.playingStyle.preferredFormation', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Alerts (type|severity|date|message por línea)</label><textarea rows={5} value={detailDraft.alertsText} onChange={(e) => setDetailDraft((prev) => ({ ...prev, alertsText: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-sm text-gray-600 mb-1">National team</label><input value={detailDraft.internationalCareer.nationalTeam} onChange={(e) => updateDetailField('internationalCareer.nationalTeam', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Youth teams</label><input value={detailDraft.internationalCareer.youthTeamsText} onChange={(e) => updateDetailField('internationalCareer.youthTeamsText', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Caps</label><input type="number" min="0" value={detailDraft.internationalCareer.caps} onChange={(e) => updateDetailField('internationalCareer.caps', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Goals</label><input type="number" min="0" value={detailDraft.internationalCareer.goals} onChange={(e) => updateDetailField('internationalCareer.goals', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Assists</label><input type="number" min="0" value={detailDraft.internationalCareer.assists} onChange={(e) => updateDetailField('internationalCareer.assists', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Debut</label><input type="date" value={detailDraft.internationalCareer.debut} onChange={(e) => updateDetailField('internationalCareer.debut', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1">Last call up</label><input type="date" value={detailDraft.internationalCareer.lastCallUp} onChange={(e) => updateDetailField('internationalCareer.lastCallUp', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
                  </div>
                </section>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  form={playerFormId}
                  disabled={saving}
                  className="bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-medium"
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
