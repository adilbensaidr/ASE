import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ratingFields = [
  'technical',
  'physical',
  'mental',
  'tactical',
  'finishing',
  'passing',
  'dribbling',
  'defending',
  'workRate'
];

const emptyForm = {
  player: '',
  recommendation: 'Monitor',
  notes: '',
  strengthsText: '',
  weaknessesText: '',
  keyMomentsText: '',
  matchDetails: {
    opponent: '',
    competition: '',
    result: '',
    matchDate: '',
    minutesPlayed: '',
    position: ''
  },
  ratings: {
    technical: 6,
    physical: 6,
    mental: 6,
    tactical: 6,
    finishing: 6,
    passing: 6,
    dribbling: 6,
    defending: 6,
    workRate: 6
  }
};

function toCSVList(text) {
  return String(text || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function averageRatings(ratings) {
  const values = Object.values(ratings).map((value) => Number(value));
  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(1));
}

function toDateInput(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [playerFilter, setPlayerFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingReportId, setEditingReportId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const isEditing = Boolean(editingReportId);

  const fetchReports = async (player = '') => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await api.get('/reports', {
        params: {
          player: player || undefined,
          limit: 50
        }
      });

      setReports(data.reports || []);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const playersRes = await api.get('/players', { params: { page: 1, limit: 200, sort: 'name' } });
        setPlayers(playersRes.data.players || []);
      } catch {
        setPlayers([]);
      }
      fetchReports('');
    };

    fetchInitial();
  }, []);

  useEffect(() => {
    fetchReports(playerFilter);
  }, [playerFilter]);

  const recommendationBadge = useMemo(
    () => ({
      Sign: 'bg-emerald-100 text-emerald-700',
      Monitor: 'bg-amber-100 text-amber-700',
      Pass: 'bg-red-100 text-red-700'
    }),
    []
  );

  const openCreate = () => {
    setEditingReportId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (report) => {
    setEditingReportId(report._id);
    setForm({
      player: report.player?._id || report.player || '',
      recommendation: report.recommendation || 'Monitor',
      notes: report.notes || '',
      strengthsText: (report.strengths || []).join(', '),
      weaknessesText: (report.weaknesses || []).join(', '),
      keyMomentsText: (report.keyMoments || []).join(', '),
      matchDetails: {
        opponent: report.matchDetails?.opponent || '',
        competition: report.matchDetails?.competition || '',
        result: report.matchDetails?.result || '',
        matchDate: toDateInput(report.matchDetails?.matchDate),
        minutesPlayed: report.matchDetails?.minutesPlayed ?? '',
        position: report.matchDetails?.position || ''
      },
      ratings: {
        technical: report.ratings?.technical ?? 6,
        physical: report.ratings?.physical ?? 6,
        mental: report.ratings?.mental ?? 6,
        tactical: report.ratings?.tactical ?? 6,
        finishing: report.ratings?.finishing ?? 6,
        passing: report.ratings?.passing ?? 6,
        dribbling: report.ratings?.dribbling ?? 6,
        defending: report.ratings?.defending ?? 6,
        workRate: report.ratings?.workRate ?? 6
      }
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const ok = window.confirm('Seguro que quieres eliminar este reporte?');
    if (!ok) return;

    try {
      await api.delete(`/reports/${id}`);
      setReports((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo eliminar el reporte');
    }
  };

  const updateField = (path, value) => {
    if (path.startsWith('matchDetails.')) {
      const key = path.replace('matchDetails.', '');
      setForm((prev) => ({
        ...prev,
        matchDetails: {
          ...prev.matchDetails,
          [key]: value
        }
      }));
      return;
    }

    if (path.startsWith('ratings.')) {
      const key = path.replace('ratings.', '');
      setForm((prev) => ({
        ...prev,
        ratings: {
          ...prev.ratings,
          [key]: Number(value)
        }
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [path]: value }));
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!form.player) {
      setError('Debes seleccionar un jugador');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        player: form.player,
        recommendation: form.recommendation,
        notes: form.notes,
        strengths: toCSVList(form.strengthsText),
        weaknesses: toCSVList(form.weaknessesText),
        keyMoments: toCSVList(form.keyMomentsText),
        matchDetails: {
          opponent: form.matchDetails.opponent,
          competition: form.matchDetails.competition,
          result: form.matchDetails.result,
          matchDate: form.matchDetails.matchDate || undefined,
          minutesPlayed: form.matchDetails.minutesPlayed ? Number(form.matchDetails.minutesPlayed) : undefined,
          position: form.matchDetails.position
        },
        ratings: form.ratings,
        overallRating: averageRatings(form.ratings)
      };

      if (isEditing) {
        await api.put(`/reports/${editingReportId}`, payload);
      } else {
        await api.post('/reports', payload);
      }

      setShowForm(false);
      setEditingReportId(null);
      setForm(emptyForm);
      fetchReports(playerFilter);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el reporte');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-secondary-900">Reportes de Scouting</h1>
        <button
          type="button"
          onClick={openCreate}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          Nuevo Reporte
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Filtrar por jugador</label>
            <select
              value={playerFilter}
              onChange={(e) => setPlayerFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Todos los jugadores</option>
              {players.map((player) => (
                <option key={player._id} value={player._id}>{player.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="md:hidden space-y-3">
          {loading && (
            <div className="py-4 text-center text-gray-500">Cargando reportes...</div>
          )}

          {!loading && reports.length === 0 && (
            <div className="py-4 text-center text-gray-500">No hay reportes para el filtro actual</div>
          )}

          {!loading && reports.map((report) => (
            <div key={report._id} className="border border-gray-200 rounded-lg p-3 bg-white space-y-2">
              <button
                type="button"
                onClick={() => navigate(`/reports/${report._id}`)}
                className="text-left w-full"
              >
                <p className="font-semibold text-secondary-900">{report.player?.name || 'N/A'}</p>
                <p className="text-xs text-gray-500">Scout: {report.scout?.name || 'N/A'}</p>
                <p className="text-xs text-gray-500">
                  Fecha: {report.matchDetails?.matchDate ? new Date(report.matchDetails.matchDate).toLocaleDateString('es-ES') : '-'}
                </p>
              </button>

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">Rating: {report.overallRating ?? 'N/A'}</p>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${recommendationBadge[report.recommendation] || 'bg-gray-100 text-gray-700'}`}>
                  {report.recommendation || 'N/A'}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => openEdit(report)}
                  className="text-primary-600 hover:text-primary-700 text-sm"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(report._id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="py-2 font-bold">Jugador</th>
                <th className="py-2 font-bold">Scout</th>
                <th className="py-2 font-bold">Fecha</th>
                <th className="py-2 font-bold">Rating</th>
                <th className="py-2 font-bold">Recomendacion</th>
                <th className="py-2 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500">Cargando reportes...</td>
                </tr>
              )}

              {!loading && reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500">No hay reportes para el filtro actual</td>
                </tr>
              )}

              {!loading && reports.map((report) => (
                <tr
                  key={report._id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/reports/${report._id}`)}
                >
                  <td className="py-2 pr-2 font-medium text-secondary-900">{report.player?.name || 'N/A'}</td>
                  <td className="py-2 pr-2 text-gray-700">{report.scout?.name || 'N/A'}</td>
                  <td className="py-2 pr-2 text-gray-700">
                    {report.matchDetails?.matchDate ? new Date(report.matchDetails.matchDate).toLocaleDateString('es-ES') : '-'}
                  </td>
                  <td className="py-2 pr-2 text-gray-700">{report.overallRating ?? 'N/A'}</td>
                  <td className="py-2 pr-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${recommendationBadge[report.recommendation] || 'bg-gray-100 text-gray-700'}`}>
                      {report.recommendation || 'N/A'}
                    </span>
                  </td>
                  <td className="py-2 pr-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(report);
                        }}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(report._id);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-secondary-900 mb-4">
            {isEditing ? 'Editar reporte' : 'Nuevo reporte'}
          </h2>

          <form onSubmit={submitForm} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Jugador</label>
                <select
                  value={form.player}
                  onChange={(e) => updateField('player', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Seleccionar jugador</option>
                  {players.map((player) => (
                    <option key={player._id} value={player._id}>{player.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Recomendacion</label>
                <select
                  value={form.recommendation}
                  onChange={(e) => updateField('recommendation', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="Sign">Sign</option>
                  <option value="Monitor">Monitor</option>
                  <option value="Pass">Pass</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Rival</label>
                <input
                  type="text"
                  value={form.matchDetails.opponent}
                  onChange={(e) => updateField('matchDetails.opponent', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Competicion</label>
                <input
                  type="text"
                  value={form.matchDetails.competition}
                  onChange={(e) => updateField('matchDetails.competition', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Resultado</label>
                <input
                  type="text"
                  value={form.matchDetails.result}
                  onChange={(e) => updateField('matchDetails.result', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Fecha del partido</label>
                <input
                  type="date"
                  value={form.matchDetails.matchDate}
                  onChange={(e) => updateField('matchDetails.matchDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Minutos jugados</label>
                <input
                  type="number"
                  min="0"
                  value={form.matchDetails.minutesPlayed}
                  onChange={(e) => updateField('matchDetails.minutesPlayed', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Posicion en partido</label>
                <input
                  type="text"
                  value={form.matchDetails.position}
                  onChange={(e) => updateField('matchDetails.position', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-secondary-900 mb-3">Ratings (1-10)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ratingFields.map((field) => (
                  <div key={field}>
                    <label className="block text-sm text-gray-600 mb-1 capitalize">{field}</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={form.ratings[field]}
                        onChange={(e) => updateField(`ratings.${field}`, e.target.value)}
                        className="w-full"
                      />
                      <span className="text-sm font-semibold w-6 text-right">{form.ratings[field]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Fortalezas (separadas por coma)</label>
                <textarea
                  rows={3}
                  value={form.strengthsText}
                  onChange={(e) => updateField('strengthsText', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Debilidades (separadas por coma)</label>
                <textarea
                  rows={3}
                  value={form.weaknessesText}
                  onChange={(e) => updateField('weaknessesText', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Momentos clave (separados por coma)</label>
              <textarea
                rows={2}
                value={form.keyMomentsText}
                onChange={(e) => updateField('keyMomentsText', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Notas</label>
              <textarea
                rows={4}
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingReportId(null);
                  setForm(emptyForm);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-60"
              >
                {saving ? 'Guardando...' : isEditing ? 'Actualizar reporte' : 'Crear reporte'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
