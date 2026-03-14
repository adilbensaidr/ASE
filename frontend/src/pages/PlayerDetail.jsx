import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const attributeKeys = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
const detailCardClass = 'bg-white rounded-lg p-4 border border-gray-200 space-y-3';

function AttributeBar({ label, value }) {
  const safeValue = Number(value) || 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 capitalize">{label}</span>
        <span className="text-secondary-900 font-semibold">{safeValue}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-primary-500" style={{ width: `${Math.min(100, Math.max(0, safeValue))}%` }} />
      </div>
    </div>
  );
}

function BasicInfoCard({ data }) {
  if (!data || typeof data !== 'object') return null;
  
  return (
    <div className={detailCardClass}>
      <h3 className="text-base font-bold text-gray-900">Información personal</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-600 font-medium">Nombre</p>
          <p className="font-semibold text-gray-900">{data.fullName || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Mostrar como</p>
          <p className="font-semibold text-gray-900">{data.displayName || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Nac.</p>
          <p className="font-semibold text-gray-900">{data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString('es-ES') : 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Lugar de nacimiento</p>
          <p className="font-semibold text-gray-900">{data.placeOfBirth || 'N/A'}</p>
        </div>
      </div>
      {data.secondNationality && (
        <div className="text-sm pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-600 font-medium">Segunda nacionalidad</p>
          <p className="font-semibold text-gray-900">{data.secondNationality}</p>
        </div>
      )}
    </div>
  );
}

function ContactInfoCard({ data }) {
  const contact = data || {};

  return (
    <div className={detailCardClass}>
      <h3 className="text-base font-bold text-gray-900">Información de contacto</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-600 font-medium">Email</p>
          <p className="font-semibold text-gray-900 break-all">{contact.email || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Teléfono</p>
          <p className="font-semibold text-gray-900">{contact.phone || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Agente</p>
          <p className="font-semibold text-gray-900">{contact.agentName || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Email agente</p>
          <p className="font-semibold text-gray-900 break-all">{contact.agentEmail || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}

function ContractInfoCard({ data }) {
  const contract = data || {};
  const salary = contract.salary;
  const endDate = contract.contractEnd;

  return (
    <div className={detailCardClass}>
      <h3 className="text-base font-bold text-gray-900">Contrato</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-600 font-medium">Cuánto cobra</p>
          <p className="font-semibold text-gray-900">
            {typeof salary === 'number' ? `€ ${salary.toLocaleString('es-ES')}` : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Fin de contrato</p>
          <p className="font-semibold text-gray-900">
            {endDate ? new Date(endDate).toLocaleDateString('es-ES') : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}

function MarketDataCard({ data }) {
  if (!data || typeof data !== 'object') return null;

  const getTrendColor = (value) => {
    if (!value) return 'text-gray-600';
    return value > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getTrendArrow = (value) => {
    if (!value) return '→';
    return value > 0 ? '↑' : '↓';
  };

  const trend30 = Number(data.valueTrend?.last30Days ?? data.valueTrend?.trend30d);
  const trend90 = Number(data.valueTrend?.last90Days ?? data.valueTrend?.trend90d);
  const trend12m = Number(data.valueTrend?.last12Months ?? data.valueTrend?.trend12m);

  // Preparar datos para el gráfico usando valueHistory y/o tendencias
  const chartData = [];
  
  // Añadir valores históricos si existen
  if (Array.isArray(data.valueHistory) && data.valueHistory.length > 0) {
    // Ordenar por fecha descendente y mapear a formato para el gráfico
    const sortedHistory = [...data.valueHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedHistory.forEach((entry) => {
      const date = new Date(entry.date);
      const formattedDate = date.toLocaleDateString('es-ES', { month: '2-digit', year: '2-digit' });
      chartData.push({
        period: formattedDate,
        value: entry.value,
        fullDate: entry.date
      });
    });
  }
  
  // Añadir valor actual
  if (data.currentMarketValue) {
    const currentDate = new Date(data.valuationDate || new Date());
    const formattedDate = currentDate.toLocaleDateString('es-ES', { month: '2-digit', year: '2-digit' });
    
    chartData.push({
      period: formattedDate,
      value: data.currentMarketValue,
      fullDate: data.valuationDate || new Date()
    });
  }

  // Si no hay historial real, reconstruimos puntos aproximados con tendencias
  if (chartData.length <= 1 && data.currentMarketValue) {
    const baseValue = Number(data.currentMarketValue);
    const approxData = [];

    if (!Number.isNaN(trend12m)) {
      approxData.push({ period: '12m', value: Math.round(baseValue / (1 + trend12m / 100)) });
    }
    if (!Number.isNaN(trend90)) {
      approxData.push({ period: '90d', value: Math.round(baseValue / (1 + trend90 / 100)) });
    }
    if (!Number.isNaN(trend30)) {
      approxData.push({ period: '30d', value: Math.round(baseValue / (1 + trend30 / 100)) });
    }

    if (approxData.length > 0) {
      chartData.splice(0, chartData.length, ...approxData, {
        period: 'Actual',
        value: baseValue,
        fullDate: data.valuationDate || new Date()
      });
    }
  }

  return (
    <div className={detailCardClass}>
      <h3 className="text-base font-bold text-gray-900">Valor de mercado</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-gray-600 font-medium">Valor actual</p>
          <p className="text-xl font-bold text-gray-900">€ {data.currentMarketValue?.toLocaleString('es-ES') || 'N/A'}</p>
          <p className="text-xs text-gray-600 mt-1">Moneda: {data.currency || 'N/A'}</p>
          <p className="text-xs text-gray-500 mt-1">{data.valuationDate ? new Date(data.valuationDate).toLocaleDateString('es-ES') : ''}</p>
        </div>
        <div className="flex flex-col justify-center md:col-span-2">
          <p className="text-xs text-gray-600 font-medium mb-2">Tendencia</p>
          <div className="flex gap-2 flex-wrap">
            {!Number.isNaN(trend30) && (
              <span className={`text-sm font-bold ${getTrendColor(trend30)}`}>
                30d: {getTrendArrow(trend30)} {Math.abs(trend30).toFixed(1)}%
              </span>
            )}
            {!Number.isNaN(trend90) && (
              <span className={`text-sm font-bold ${getTrendColor(trend90)}`}>
                90d: {getTrendArrow(trend90)} {Math.abs(trend90).toFixed(1)}%
              </span>
            )}
            {!Number.isNaN(trend12m) && (
              <span className={`text-sm font-bold ${getTrendColor(trend12m)}`}>
                12m: {getTrendArrow(trend12m)} {Math.abs(trend12m).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-600 font-medium mb-3">Evolución del valor</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="period" 
                stroke="#6b7280" 
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `€${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                formatter={(value) => `€${value.toLocaleString('es-ES')}`}
                labelStyle={{ color: '#1f2937' }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function FormAnalysisCard({ data }) {
  if (!data || typeof data !== 'object') return null;

  const formRating = Number(data.currentForm?.formRating) || Number(data.formRating) || 0;
  const consistency = data.currentForm?.consistencyScore ?? data.consistencyScore ?? 'N/A';
  const momentum = data.currentForm?.momentumIndicator ?? data.momentumIndicator ?? 'N/A';

  return (
    <div className={detailCardClass}>
      <h3 className="text-base font-bold text-gray-900">Forma</h3>
      
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-gray-600 font-medium">Rating</p>
          <p className="text-2xl font-bold text-gray-900">{formRating || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Consistencia</p>
          <p className="text-2xl font-bold text-gray-900">{consistency}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Momentum</p>
          <p className="text-2xl font-bold text-gray-900">{momentum}</p>
        </div>
      </div>
    </div>
  );
}

function InjuryHistoryCard({ data }) {
  if (!data || typeof data !== 'object') return null;

  const propensity = data.injuryProneness ?? 'N/A';

  return (
    <div className={detailCardClass}>
      <h3 className="text-base font-bold text-gray-900">Lesiones</h3>
      
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-gray-600 font-medium">Disponibilidad</p>
          <p className="text-2xl font-bold text-gray-900">{data.availabilityPercentage || 0}%</p>
        </div>

        <div>
          <p className="text-xs text-gray-600 font-medium">Propensión</p>
          <p className="text-2xl font-bold text-gray-900">{propensity}</p>
        </div>

        <div>
          <p className="text-xs text-gray-600 font-medium">Días lesionado</p>
          <p className="text-2xl font-bold text-gray-900">{data.totalDaysInjured || 0}</p>
        </div>
      </div>
    </div>
  );
}

function ScoutingNotesCard({ data }) {
  if (!data || typeof data !== 'object') return null;

  return (
    <div className={detailCardClass}>
      <h3 className="text-base font-bold text-gray-900">Scouting</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-600 font-medium">Rating</p>
          <p className="text-xl font-bold text-gray-900">{data.overallRating || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Potencial</p>
          <p className="text-xl font-bold text-gray-900">{data.potential || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Madurez</p>
          <p className="text-xl font-bold text-gray-900">{data.readiness || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Comparable</p>
          <p className="text-xs font-semibold text-gray-900 truncate">{data.comparablePlayer || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}

function TacticalDataCard({ data }) {
  if (!data || typeof data !== 'object') return null;

  const tactical = data.playingStyle || data;

  const strengths = Array.isArray(tactical.strengths) 
    ? tactical.strengths 
    : typeof tactical.strengths === 'string' 
      ? tactical.strengths.split(',').map(s => s.trim())
      : [];

  const weaknesses = Array.isArray(tactical.weaknesses) 
    ? tactical.weaknesses 
    : typeof tactical.weaknesses === 'string' 
      ? tactical.weaknesses.split(',').map(s => s.trim())
      : [];

  const hasData = tactical.styleDescription || tactical.preferredFormation || tactical.roleInTeam || strengths.length > 0 || weaknesses.length > 0;
  if (!hasData) return null;

  return (
    <div className={detailCardClass}>
      <h3 className="text-base font-bold text-gray-900">Táctica y estilo</h3>
      
      <div className="space-y-3">
        {tactical.styleDescription && (
          <div className="border-t border-gray-100 pt-2">
            <p className="text-xs text-gray-600 font-medium mb-1">Estilo de juego</p>
            <p className="text-sm text-gray-900">{tactical.styleDescription}</p>
          </div>
        )}

        {(tactical.preferredFormation || tactical.roleInTeam) && (
          <div className="grid grid-cols-2 gap-3">
            {tactical.preferredFormation && (
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Formación preferida</p>
                <p className="text-lg font-bold text-gray-900">{tactical.preferredFormation}</p>
              </div>
            )}
            {tactical.roleInTeam && (
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Rol en equipo</p>
                <p className="text-sm font-semibold text-gray-900">{tactical.roleInTeam}</p>
              </div>
            )}
          </div>
        )}

        {(strengths.length > 0 || weaknesses.length > 0) && (
          <div>
            <p className="text-xs text-gray-600 font-medium mb-2">Perfil técnico</p>
            <div className="grid grid-cols-2 gap-2">
              {strengths.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-700 mb-1">✓ Fortalezas</p>
                  <div className="flex flex-wrap gap-1">
                    {strengths.map((str, i) => (
                      <span key={i} className="bg-green-100 text-green-900 text-xs px-2 py-0.5 rounded-sm">
                        {str}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {weaknesses.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-700 mb-1">✗ Débilidades</p>
                  <div className="flex flex-wrap gap-1">
                    {weaknesses.map((weak, i) => (
                      <span key={i} className="bg-red-100 text-red-900 text-xs px-2 py-0.5 rounded-sm">
                        {weak}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SocialMediaCard({ data }) {
  if (!data || typeof data !== 'object') return null;

  return (
    <div className={detailCardClass}>
      <h3 className="text-base font-bold text-gray-900 mb-3">Redes sociales</h3>
      
      <div>
        <p className="text-xs text-gray-600 font-medium mb-2">Comercializabilidad</p>
        <p className="text-3xl font-bold text-gray-900 mb-2">{data.marketability || 0}/10</p>
      </div>
    </div>
  );
}

function MiscellaneousCard({ data }) {
  if (!data || typeof data !== 'object') return null;

  const attributes = [
    { label: 'Liderazgo', value: data.leadership },
    { label: 'Profesionalismo', value: data.professionalism },
    { label: 'Adaptabilidad', value: data.adaptability }
  ];

  const hasData = attributes.some(a => a.value !== undefined);
  if (!hasData) return null;

  return (
    <div className={detailCardClass}>
      <h3 className="text-base font-bold text-gray-900">Características</h3>
      
      <div className="grid grid-cols-3 gap-3">
        {attributes.map((attr) => (
          attr.value !== undefined && (
            <div key={attr.label}>
              <p className="text-xs text-gray-600 font-medium">{attr.label}</p>
              <p className="text-2xl font-bold text-gray-900">{attr.value}</p>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function AlertsCard({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const alertColors = {
    'critical': 'bg-red-100 border-red-300 text-red-900',
    'warning': 'bg-yellow-100 border-yellow-300 text-yellow-900',
    'info': 'bg-blue-100 border-blue-300 text-blue-900',
    'success': 'bg-green-100 border-green-300 text-green-900'
  };

  return (
    <div className={detailCardClass}>
      <h3 className="text-base font-bold text-gray-900">Alertas</h3>
      
      {data.map((alert, idx) => {
        const colorClass = alertColors[alert.severity?.toLowerCase()] || alertColors.info;
        return (
          <div key={idx} className={`rounded p-2 border text-sm ${colorClass}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <p className="font-semibold text-xs">{alert.type || 'Alerta'}</p>
                {alert.message && <p className="text-xs mt-0.5">{alert.message}</p>}
              </div>
              {alert.date && (
                <p className="text-xs opacity-75 whitespace-nowrap">
                  {new Date(alert.date).toLocaleDateString('es-ES')}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PlayerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [player, setPlayer] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [playerRes, reportsRes] = await Promise.all([
          api.get(`/players/${id}`),
          api.get('/reports', { params: { player: id, limit: 5 } }).catch(() => ({ data: { reports: [] } }))
        ]);

        setPlayer(playerRes.data);
        setImageError(false);
        const maybeReports = reportsRes.data?.reports || reportsRes.data || [];
        setReports(Array.isArray(maybeReports) ? maybeReports.slice(0, 5) : []);
      } catch (err) {
        console.error('Error cargando jugador:', err);
        setError(err.response?.data?.message || 'No se pudo cargar el jugador');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const kpis = useMemo(() => {
    return [
      { label: 'Partidos', value: player?.stats?.appearances ?? 0 },
      { label: 'Goles', value: player?.stats?.goals ?? 0 },
      { label: 'Asistencias', value: player?.stats?.assists ?? 0 },
      { label: 'Minutos', value: player?.stats?.minutesPlayed ?? 0 }
    ];
  }, [player]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/players/${id}`);
      navigate('/players');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo eliminar el jugador');
      setShowConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const detailed = player?.detailedProfile || null;
  const hasValidImage = !!player?.imageUrl && !imageError;

  if (loading) {
    return <p className="text-gray-600">Cargando perfil...</p>;
  }

  if (!player) {
    return <p className="text-gray-600">Jugador no encontrado.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl border border-gray-200 bg-gray-100 overflow-hidden flex items-center justify-center">
            {hasValidImage ? (
              <img
                src={player.imageUrl}
                alt={player.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-xs font-medium text-gray-500 text-center px-2">Sin imagen</span>
            )}
          </div>

          <div>
          <h1 className="text-3xl font-bold text-secondary-900">{player.name}</h1>
          <p className="text-gray-600 mt-1">
            {player.position} · {player.team} · {player.nationality}
          </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate(`/players/${id}/edit`)}
            className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium"
          >
            Eliminar
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <section className="flex flex-wrap gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-lg shadow p-4 border-l-4 border-primary-500 flex-1 min-w-[160px]">
            <p className="text-sm text-gray-500">{kpi.label}</p>
            <p className="text-2xl font-bold text-secondary-900 mt-1">{kpi.value}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-bold text-secondary-900">Atributos del jugador</h2>
          {attributeKeys.map((key) => (
            <AttributeBar key={key} label={key} value={player.attributes?.[key]} />
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-3">
          <h2 className="text-xl font-bold text-secondary-900">Ultimos reportes de scouting</h2>
          {reports.length === 0 && (
            <p className="text-gray-500 text-sm">Aun no hay reportes asociados para este jugador.</p>
          )}
          {reports.map((report) => (
            <div
              key={report._id}
              onClick={() => navigate(`/reports/${report._id}`)}
              className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition"
            >
              <p className="font-semibold text-secondary-900">
                {report.matchDetails?.competition || 'Partido'} vs {report.matchDetails?.opponent || 'Rival'}
              </p>
              <p className="text-sm text-gray-600">
                Recomendacion: {report.recommendation || 'N/A'} · Rating: {report.overallRating || 'N/A'}
              </p>
              {report.notes && <p className="text-sm text-gray-500 mt-1">{report.notes}</p>}
              <p className="text-xs text-primary-600 mt-2 font-medium">Ver reporte</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-secondary-900">Perfil avanzado</h2>
          <button
            type="button"
            onClick={() => navigate(`/players/${id}/edit`)}
            className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white"
          >
            Editar jugador
          </button>
        </div>

        {!detailed && (
          <p className="text-sm text-gray-500">
            Este jugador aun no tiene perfil avanzado. Puedes crearlo desde Editar jugador.
          </p>
        )}

        {detailed && (
          <div className="flex flex-wrap gap-3 items-start">
            <div className="w-full md:w-[calc(50%-0.375rem)]"><BasicInfoCard data={detailed.basicInfo} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><ContactInfoCard data={detailed.contactInfo} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><ContractInfoCard data={player.contract} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><MarketDataCard data={detailed.marketData} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><FormAnalysisCard data={detailed.formAnalysis} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><InjuryHistoryCard data={detailed.injuryHistory} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><ScoutingNotesCard data={detailed.scoutingNotes} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><TacticalDataCard data={detailed.tacticalData} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><SocialMediaCard data={detailed.socialMedia} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><MiscellaneousCard data={detailed.miscellaneous} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><AlertsCard data={detailed.alerts} /></div>
          </div>
        )}
      </section>

      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-secondary-900">Eliminar jugador</h3>
            <p className="text-gray-600 text-sm">
              Esta accion eliminara al jugador y sus reportes asociados. No se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 rounded-lg border border-gray-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-70"
              >
                {deleting ? 'Eliminando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
