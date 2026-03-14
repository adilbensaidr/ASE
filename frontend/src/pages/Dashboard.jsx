import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import api from '../services/api';
import KPICard from '../components/common/KPICard';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'];

function formatDate(dateValue) {
  if (!dateValue) return '-';
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-ES');
}

function formatCurrency(value) {
  if (value == null) return 'N/A';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
}

function formatRatio(value) {
  if (!Number.isFinite(value)) return '0.0000';
  return value.toFixed(4);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [playersForAdvanced, setPlayersForAdvanced] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsRes, playersRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/players', {
            params: {
              page: 1,
              limit: 500,
              sort: 'name'
            }
          })
        ]);

        setStats(statsRes.data);
        setPlayersForAdvanced(playersRes.data?.players || []);
      } catch (err) {
        setError(err.response?.data?.message || 'No se pudo cargar el dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const topScorer = useMemo(() => stats?.topScorers?.[0], [stats]);

  const marketTrend = useMemo(() => {
    const rows = stats?.marketValueTrend || [];
    return rows
      .filter((row) => row.marketValue != null)
      .map((row) => ({
        name: row.name,
        value: Number(row.marketValue)
      }))
      .sort((a, b) => a.value - b.value);
  }, [stats]);

  const topAssistsPerMinute = useMemo(() => {
    return (playersForAdvanced || [])
      .map((player) => {
        const minutes = Number(player?.stats?.minutesPlayed) || 0;
        const assists = Number(player?.stats?.assists) || 0;
        const ratio = minutes > 0 ? assists / minutes : 0;
        return {
          id: player._id,
          name: player.name,
          team: player.team,
          assists,
          minutes,
          ratio
        };
      })
      .filter((item) => item.minutes > 0 && item.assists > 0)
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 3);
  }, [playersForAdvanced]);

  const topGoalsPerMinute = useMemo(() => {
    return (playersForAdvanced || [])
      .map((player) => {
        const minutes = Number(player?.stats?.minutesPlayed) || 0;
        const goals = Number(player?.stats?.goals) || 0;
        const ratio = minutes > 0 ? goals / minutes : 0;
        return {
          id: player._id,
          name: player.name,
          team: player.team,
          goals,
          minutes,
          ratio
        };
      })
      .filter((item) => item.minutes > 0 && item.goals > 0)
      .sort((a, b) => b.ratio - a.ratio)
        .slice(0, 3);
  }, [playersForAdvanced]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-secondary-900">Dashboard</h1>
        <p className="text-gray-600">Cargando estadisticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-secondary-900">Dashboard</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-secondary-900">Dashboard</h1>
      <p className="text-gray-600">Visualiza las estadisticas y KPIs de los jugadores.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Total jugadores"
          value={stats?.totalPlayers ?? 0}
          subtitle="Plantilla analizada"
          color="blue"
        />
        <KPICard
          title="Edad promedio"
          value={stats?.averageAge ?? '0.0'}
          subtitle="Anios"
          color="slate"
        />
        <KPICard
          title="Top goleador"
          value={topScorer ? `${topScorer.name}` : 'N/A'}
          subtitle={topScorer ? `${topScorer.stats?.goals ?? 0} goles` : 'Sin datos'}
          color="amber"
        />
        <KPICard
          title="Contratos por vencer"
          value={stats?.expiringContracts?.length ?? 0}
          subtitle="Proximos 180 dias"
          color="emerald"
        />
      </div>

      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-secondary-900 mb-4">Analisis avanzado: rendimiento por minuto</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Top 3 asistencias por minuto</h3>
            <div className="space-y-2">
              {topAssistsPerMinute.length === 0 && (
                <p className="text-sm text-gray-500">Sin datos suficientes.</p>
              )}
              {topAssistsPerMinute.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/players/${item.id}`)}
                  className="w-full text-left rounded border border-gray-200 p-3 hover:bg-gray-50 transition"
                >
                  <p className="text-sm font-semibold text-secondary-900">
                    #{idx + 1} {item.name}
                  </p>
                  <p className="text-xs text-gray-600">{item.team || 'Sin equipo'}</p>
                  <p className="text-sm text-gray-700 mt-1">
                    Ratio: {formatRatio(item.ratio)} | {item.assists} asist. en {item.minutes} min
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Top 3 goles por minuto</h3>
            <div className="space-y-2">
              {topGoalsPerMinute.length === 0 && (
                <p className="text-sm text-gray-500">Sin datos suficientes.</p>
              )}
              {topGoalsPerMinute.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/players/${item.id}`)}
                  className="w-full text-left rounded border border-gray-200 p-3 hover:bg-gray-50 transition"
                >
                  <p className="text-sm font-semibold text-secondary-900">
                    #{idx + 1} {item.name}
                  </p>
                  <p className="text-xs text-gray-600">{item.team || 'Sin equipo'}</p>
                  <p className="text-sm text-gray-700 mt-1">
                    Ratio: {formatRatio(item.ratio)} | {item.goals} goles en {item.minutes} min
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-secondary-900 mb-4">Distribucion por posicion</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.byPosition || []}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {(stats?.byPosition || []).map((_, i) => (
                    <Cell key={`pie-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-secondary-900 mb-4">Top 5 goleadores</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.topScorers || []} layout="vertical" margin={{ left: 24, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="stats.goals" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-secondary-900 mb-4">Tendencia de valor de mercado</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marketTrend} margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tickFormatter={(value) => `${Math.round(value / 1000000)}M`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="value" stroke="#0284c7" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-secondary-900 mb-4">Contratos proximos a vencer</h2>
          <div className="overflow-x-auto max-h-72">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-2">Jugador</th>
                  <th className="text-left py-2">Equipo</th>
                  <th className="text-left py-2">Vencimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(stats?.expiringContracts || []).length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-gray-500">
                      No hay contratos por vencer en los proximos 180 dias.
                    </td>
                  </tr>
                )}

                {(stats?.expiringContracts || []).map((contract) => {
                  const dueDate = new Date(contract.contract?.contractEnd || 0);
                  const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / 86400000);
                  const isUrgent = Number.isFinite(daysLeft) && daysLeft <= 60;

                  return (
                    <tr key={contract._id}>
                      <td className="py-2 pr-2 font-medium text-secondary-900">{contract.name}</td>
                      <td className="py-2 pr-2 text-gray-700">{contract.team || '-'}</td>
                      <td className={`py-2 ${isUrgent ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                        {formatDate(contract.contract?.contractEnd)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
