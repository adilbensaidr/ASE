import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PlayerForm from '../components/PlayerForm';
import api from '../services/api';

function buildDetailDraft(detail) {
  return {
    basicInfo: {
      fullName: detail?.basicInfo?.fullName || '',
      displayName: detail?.basicInfo?.displayName || '',
      secondNationality: detail?.basicInfo?.secondNationality || '',
      placeOfBirth: detail?.basicInfo?.placeOfBirth || '',
      dateOfBirth: detail?.basicInfo?.dateOfBirth ? String(detail.basicInfo.dateOfBirth).slice(0, 10) : ''
    },
    contactInfo: {
      email: detail?.contactInfo?.email || '',
      phone: detail?.contactInfo?.phone || '',
      agentName: detail?.contactInfo?.agentName || '',
      agentEmail: detail?.contactInfo?.agentEmail || ''
    },
    marketData: {
      currentMarketValue: detail?.marketData?.currentMarketValue ?? '',
      currency: detail?.marketData?.currency || 'EUR',
      valuationDate: detail?.marketData?.valuationDate ? String(detail.marketData.valuationDate).slice(0, 10) : '',
      valueTrend: {
        last30Days: detail?.marketData?.valueTrend?.last30Days ?? '',
        last90Days: detail?.marketData?.valueTrend?.last90Days ?? '',
        last12Months: detail?.marketData?.valueTrend?.last12Months ?? ''
      }
    },
    formAnalysis: {
      currentForm: {
        formRating: detail?.formAnalysis?.currentForm?.formRating ?? '',
        consistencyScore: detail?.formAnalysis?.currentForm?.consistencyScore ?? '',
        momentumIndicator: detail?.formAnalysis?.currentForm?.momentumIndicator || 'Steady'
      }
    },
    injuryHistory: {
      injuryProneness: detail?.injuryHistory?.injuryProneness ?? '',
      totalDaysInjured: detail?.injuryHistory?.totalDaysInjured ?? '',
      availabilityPercentage: detail?.injuryHistory?.availabilityPercentage ?? ''
    },
    scoutingNotes: {
      overallRating: detail?.scoutingNotes?.overallRating ?? '',
      potential: detail?.scoutingNotes?.potential ?? '',
      readiness: detail?.scoutingNotes?.readiness || '',
      comparablePlayer: detail?.scoutingNotes?.comparablePlayer || ''
    },
    socialMedia: {
      marketability: detail?.socialMedia?.marketability ?? ''
    },
    miscellaneous: {
      leadership: detail?.miscellaneous?.leadership ?? '',
      professionalism: detail?.miscellaneous?.professionalism ?? '',
      adaptability: detail?.miscellaneous?.adaptability ?? ''
    },
    tacticalData: {
      playingStyle: {
        styleDescription: detail?.tacticalData?.playingStyle?.styleDescription || '',
        strengthsText: (detail?.tacticalData?.playingStyle?.strengths || []).join(', '),
        weaknessesText: (detail?.tacticalData?.playingStyle?.weaknesses || []).join(', '),
        preferredFormation: detail?.tacticalData?.playingStyle?.preferredFormation || '',
        roleInTeam: detail?.tacticalData?.playingStyle?.roleInTeam || ''
      }
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
    const [root, key, leaf] = path.split('.');
    setDetailDraft((prev) => {
      if (!leaf) {
        return {
          ...prev,
          [root]: {
            ...prev[root],
            [key]: value
          }
        };
      }

      return {
        ...prev,
        [root]: {
          ...prev[root],
          [key]: {
            ...prev[root]?.[key],
            [leaf]: value
          }
        }
      };
    });
  };

  const handleUpdate = async (basePayload) => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...basePayload,
        detailedProfile: {
          basicInfo: {
            ...detailDraft.basicInfo,
            dateOfBirth: detailDraft.basicInfo.dateOfBirth || undefined
          },
          contactInfo: {
            email: detailDraft.contactInfo.email || undefined,
            phone: detailDraft.contactInfo.phone || undefined,
            agentName: detailDraft.contactInfo.agentName || undefined,
            agentEmail: detailDraft.contactInfo.agentEmail || undefined
          },
          marketData: {
            currentMarketValue: toNumberOrUndefined(detailDraft.marketData.currentMarketValue),
            currency: detailDraft.marketData.currency || undefined,
            valuationDate: detailDraft.marketData.valuationDate || undefined,
            valueHistory: player?.detailedProfile?.marketData?.valueHistory || [],
            valueTrend: {
              last30Days: toNumberOrUndefined(detailDraft.marketData.valueTrend.last30Days),
              last90Days: toNumberOrUndefined(detailDraft.marketData.valueTrend.last90Days),
              last12Months: toNumberOrUndefined(detailDraft.marketData.valueTrend.last12Months)
            }
          },
          formAnalysis: {
            currentForm: {
              formRating: toNumberOrUndefined(detailDraft.formAnalysis.currentForm.formRating),
              consistencyScore: toNumberOrUndefined(detailDraft.formAnalysis.currentForm.consistencyScore),
              momentumIndicator: detailDraft.formAnalysis.currentForm.momentumIndicator,
              last5Games: player?.detailedProfile?.formAnalysis?.currentForm?.last5Games || []
            }
          },
          injuryHistory: {
            injuryProneness: toNumberOrUndefined(detailDraft.injuryHistory.injuryProneness),
            totalDaysInjured: toNumberOrUndefined(detailDraft.injuryHistory.totalDaysInjured),
            availabilityPercentage: toNumberOrUndefined(detailDraft.injuryHistory.availabilityPercentage)
          },
          scoutingNotes: {
            overallRating: toNumberOrUndefined(detailDraft.scoutingNotes.overallRating),
            potential: toNumberOrUndefined(detailDraft.scoutingNotes.potential),
            readiness: detailDraft.scoutingNotes.readiness || undefined,
            comparablePlayer: detailDraft.scoutingNotes.comparablePlayer || undefined
          },
          socialMedia: {
            marketability: toNumberOrUndefined(detailDraft.socialMedia.marketability)
          },
          miscellaneous: {
            leadership: toNumberOrUndefined(detailDraft.miscellaneous.leadership),
            professionalism: toNumberOrUndefined(detailDraft.miscellaneous.professionalism),
            adaptability: toNumberOrUndefined(detailDraft.miscellaneous.adaptability)
          },
          tacticalData: {
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Full name</label>
                  <input value={detailDraft.basicInfo.fullName} onChange={(e) => updateDetailField('basicInfo.fullName', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Display name</label>
                  <input value={detailDraft.basicInfo.displayName} onChange={(e) => updateDetailField('basicInfo.displayName', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Second nationality</label>
                  <input value={detailDraft.basicInfo.secondNationality} onChange={(e) => updateDetailField('basicInfo.secondNationality', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Place of birth</label>
                  <input value={detailDraft.basicInfo.placeOfBirth} onChange={(e) => updateDetailField('basicInfo.placeOfBirth', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date of birth</label>
                  <input type="date" value={detailDraft.basicInfo.dateOfBirth} onChange={(e) => updateDetailField('basicInfo.dateOfBirth', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email contacto</label>
                  <input type="email" value={detailDraft.contactInfo.email} onChange={(e) => updateDetailField('contactInfo.email', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Teléfono contacto</label>
                  <input value={detailDraft.contactInfo.phone} onChange={(e) => updateDetailField('contactInfo.phone', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Nombre agente</label>
                  <input value={detailDraft.contactInfo.agentName} onChange={(e) => updateDetailField('contactInfo.agentName', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email agente</label>
                  <input type="email" value={detailDraft.contactInfo.agentEmail} onChange={(e) => updateDetailField('contactInfo.agentEmail', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Market value</label>
                  <input type="number" min="0" value={detailDraft.marketData.currentMarketValue} onChange={(e) => updateDetailField('marketData.currentMarketValue', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Currency</label>
                  <input value={detailDraft.marketData.currency} onChange={(e) => updateDetailField('marketData.currency', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Valuation date</label>
                  <input type="date" value={detailDraft.marketData.valuationDate} onChange={(e) => updateDetailField('marketData.valuationDate', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Trend 30d</label>
                  <input type="number" step="0.1" value={detailDraft.marketData.valueTrend.last30Days} onChange={(e) => updateDetailField('marketData.valueTrend.last30Days', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Trend 90d</label>
                  <input type="number" step="0.1" value={detailDraft.marketData.valueTrend.last90Days} onChange={(e) => updateDetailField('marketData.valueTrend.last90Days', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Trend 12m</label>
                  <input type="number" step="0.1" value={detailDraft.marketData.valueTrend.last12Months} onChange={(e) => updateDetailField('marketData.valueTrend.last12Months', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Form rating</label>
                  <input type="number" step="0.1" value={detailDraft.formAnalysis.currentForm.formRating} onChange={(e) => updateDetailField('formAnalysis.currentForm.formRating', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Consistency score</label>
                  <input type="number" step="0.01" value={detailDraft.formAnalysis.currentForm.consistencyScore} onChange={(e) => updateDetailField('formAnalysis.currentForm.consistencyScore', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Momentum</label>
                  <input value={detailDraft.formAnalysis.currentForm.momentumIndicator} onChange={(e) => updateDetailField('formAnalysis.currentForm.momentumIndicator', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Injury proneness</label>
                  <input type="number" step="0.01" value={detailDraft.injuryHistory.injuryProneness} onChange={(e) => updateDetailField('injuryHistory.injuryProneness', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Total days injured</label>
                  <input type="number" min="0" value={detailDraft.injuryHistory.totalDaysInjured} onChange={(e) => updateDetailField('injuryHistory.totalDaysInjured', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Availability %</label>
                  <input type="number" step="0.1" value={detailDraft.injuryHistory.availabilityPercentage} onChange={(e) => updateDetailField('injuryHistory.availabilityPercentage', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Overall rating</label>
                  <input type="number" step="0.1" value={detailDraft.scoutingNotes.overallRating} onChange={(e) => updateDetailField('scoutingNotes.overallRating', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Potential</label>
                  <input type="number" step="0.1" value={detailDraft.scoutingNotes.potential} onChange={(e) => updateDetailField('scoutingNotes.potential', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Readiness</label>
                  <input value={detailDraft.scoutingNotes.readiness} onChange={(e) => updateDetailField('scoutingNotes.readiness', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Comparable player</label>
                  <input value={detailDraft.scoutingNotes.comparablePlayer} onChange={(e) => updateDetailField('scoutingNotes.comparablePlayer', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Marketability</label>
                  <input type="number" step="0.1" value={detailDraft.socialMedia.marketability} onChange={(e) => updateDetailField('socialMedia.marketability', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Leadership</label>
                  <input type="number" step="0.1" value={detailDraft.miscellaneous.leadership} onChange={(e) => updateDetailField('miscellaneous.leadership', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Professionalism</label>
                  <input type="number" step="0.1" value={detailDraft.miscellaneous.professionalism} onChange={(e) => updateDetailField('miscellaneous.professionalism', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Adaptability</label>
                  <input type="number" step="0.1" value={detailDraft.miscellaneous.adaptability} onChange={(e) => updateDetailField('miscellaneous.adaptability', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Style description</label>
                  <textarea rows={3} value={detailDraft.tacticalData.playingStyle.styleDescription} onChange={(e) => updateDetailField('tacticalData.playingStyle.styleDescription', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Role in team</label>
                  <textarea rows={3} value={detailDraft.tacticalData.playingStyle.roleInTeam} onChange={(e) => updateDetailField('tacticalData.playingStyle.roleInTeam', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Strengths (comma separated)</label>
                  <textarea rows={2} value={detailDraft.tacticalData.playingStyle.strengthsText} onChange={(e) => updateDetailField('tacticalData.playingStyle.strengthsText', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Weaknesses (comma separated)</label>
                  <textarea rows={2} value={detailDraft.tacticalData.playingStyle.weaknessesText} onChange={(e) => updateDetailField('tacticalData.playingStyle.weaknessesText', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Preferred formation</label>
                  <input value={detailDraft.tacticalData.playingStyle.preferredFormation} onChange={(e) => updateDetailField('tacticalData.playingStyle.preferredFormation', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Alerts (type|severity|date|message per line)</label>
                  <textarea rows={5} value={detailDraft.alertsText} onChange={(e) => setDetailDraft((prev) => ({ ...prev, alertsText: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
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
