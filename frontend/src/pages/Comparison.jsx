import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Legend,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import api from '../services/api';

const COMPARISON_KEY = 'comparisonPlayers';
const COLORS = ['#0ea5e9', '#ef4444', '#10b981', '#f59e0b'];
const ATTRS = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];

function toDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-ES', { month: '2-digit', year: '2-digit' });
}

function buildPerformanceSeries(players) {
  const pointsByDate = new Map();

  players.forEach((player) => {
    const name = player.name;
    const games = Array.isArray(player?.detailedProfile?.formAnalysis?.currentForm?.last5Games)
      ? [...player.detailedProfile.formAnalysis.currentForm.last5Games]
      : [];

    if (games.length > 0) {
      games
        .filter((game) => game?.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .forEach((game) => {
          const key = toDateKey(game.date);
          if (!key) return;

          const prev = pointsByDate.get(key) || { period: formatDateLabel(key), timestamp: key };
          prev[`${name}__goals`] = Number(game.goals ?? 0);
          prev[`${name}__assists`] = Number(game.assists ?? 0);
          pointsByDate.set(key, prev);
        });
      return;
    }

    const fallbackKey = 'actual';
    const prev = pointsByDate.get(fallbackKey) || { period: 'Actual', timestamp: fallbackKey };
    prev[`${name}__goals`] = Number(player?.stats?.goals ?? 0);
    prev[`${name}__assists`] = Number(player?.stats?.assists ?? 0);
    pointsByDate.set(fallbackKey, prev);
  });

  return Array.from(pointsByDate.values()).sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
}

function buildMarketValueSeries(players) {
  const pointsByDate = new Map();

  players.forEach((player) => {
    const name = player.name;
    const marketData = player?.detailedProfile?.marketData || {};
    const history = Array.isArray(marketData.valueHistory) ? [...marketData.valueHistory] : [];
    const trend30 = Number(marketData.valueTrend?.last30Days ?? marketData.valueTrend?.trend30d);
    const trend90 = Number(marketData.valueTrend?.last90Days ?? marketData.valueTrend?.trend90d);
    const trend12m = Number(marketData.valueTrend?.last12Months ?? marketData.valueTrend?.trend12m);

    if (history.length > 0) {
      history
        .filter((entry) => entry?.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .forEach((entry) => {
          const key = toDateKey(entry.date);
          if (!key) return;
          const prev = pointsByDate.get(key) || { period: formatDateLabel(key), timestamp: key };
          prev[name] = Number(entry.value ?? 0);
          pointsByDate.set(key, prev);
        });
    }

    const currentMarketValue = Number(player.marketValue ?? marketData.currentMarketValue ?? 0);

    if (history.length === 0 && currentMarketValue > 0) {
      if (!Number.isNaN(trend12m)) {
        const prev = pointsByDate.get('12m') || { period: '12m', timestamp: '12m' };
        prev[name] = Math.round(currentMarketValue / (1 + trend12m / 100));
        pointsByDate.set('12m', prev);
      }

      if (!Number.isNaN(trend90)) {
        const prev = pointsByDate.get('90d') || { period: '90d', timestamp: '90d' };
        prev[name] = Math.round(currentMarketValue / (1 + trend90 / 100));
        pointsByDate.set('90d', prev);
      }

      if (!Number.isNaN(trend30)) {
        const prev = pointsByDate.get('30d') || { period: '30d', timestamp: '30d' };
        prev[name] = Math.round(currentMarketValue / (1 + trend30 / 100));
        pointsByDate.set('30d', prev);
      }

      const actualPoint = pointsByDate.get('Actual') || { period: 'Actual', timestamp: 'Actual' };
      actualPoint[name] = currentMarketValue;
      pointsByDate.set('Actual', actualPoint);
      return;
    }

    if (currentMarketValue > 0) {
      const valuationKey = toDateKey(marketData.valuationDate || new Date()) || 'actual';
      const prev = pointsByDate.get(valuationKey) || { period: formatDateLabel(valuationKey), timestamp: valuationKey };
      prev[name] = currentMarketValue;
      pointsByDate.set(valuationKey, prev);
    }
  });

  const periodOrder = ['12m', '90d', '30d', 'Actual'];

  return Array.from(pointsByDate.values()).sort((a, b) => {
    const ia = periodOrder.indexOf(String(a.timestamp));
    const ib = periodOrder.indexOf(String(b.timestamp));

    if (ia !== -1 || ib !== -1) {
      return (ia === -1 ? Number.MAX_SAFE_INTEGER : ia) - (ib === -1 ? Number.MAX_SAFE_INTEGER : ib);
    }

    return String(a.timestamp).localeCompare(String(b.timestamp));
  });
}

function readSelectedIds() {
  try {
    const raw = sessionStorage.getItem(COMPARISON_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function Comparison() {
  const [selectedIds, setSelectedIds] = useState(readSelectedIds());
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const comparisonRef = useRef(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!selectedIds.length) {
          setPlayers([]);
          return;
        }

        const responses = await Promise.all(
          selectedIds.slice(0, 4).map((id) => api.get(`/players/${id}`).catch(() => null))
        );

        const loaded = responses
          .filter(Boolean)
          .map((res) => res.data)
          .filter(Boolean);

        setPlayers(loaded);
      } catch (err) {
        setError(err.response?.data?.message || 'No se pudieron cargar los jugadores a comparar');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [selectedIds]);

  const radarData = useMemo(() => {
    return ATTRS.map((attr) => ({
      attr,
      ...players.reduce((acc, player) => {
        acc[player.name] = Number(player.attributes?.[attr] || 0);
        return acc;
      }, {})
    }));
  }, [players]);

  const rows = useMemo(() => {
    return [
      { label: 'Posicion', key: (p) => p.position || '-' },
      { label: 'Equipo', key: (p) => p.team || '-' },
      { label: 'Edad', key: (p) => p.age ?? '-' },
      { label: 'Goles', key: (p) => p.stats?.goals ?? 0 },
      { label: 'Asistencias', key: (p) => p.stats?.assists ?? 0 },
      { label: 'Partidos', key: (p) => p.stats?.appearances ?? 0 },
      { label: 'Minutos', key: (p) => p.stats?.minutesPlayed ?? 0 },
      {
        label: 'Valor mercado',
        key: (p) => p.marketValue ?? p.detailedProfile?.marketData?.currentMarketValue ?? 'N/A'
      },
      { label: 'Form rating', key: (p) => p.detailedProfile?.formAnalysis?.currentForm?.formRating ?? 'N/A' },
      {
        label: 'Disponibilidad %',
        key: (p) => p.detailedProfile?.injuryHistory?.availabilityPercentage ?? 'N/A'
      },
      { label: 'Marketability', key: (p) => p.detailedProfile?.socialMedia?.marketability ?? 'N/A' },
      { label: 'Readiness', key: (p) => p.detailedProfile?.scoutingNotes?.readiness ?? 'N/A' }
    ];
  }, []);

  const performanceSeries = useMemo(() => buildPerformanceSeries(players), [players]);
  const marketValueSeries = useMemo(() => buildMarketValueSeries(players), [players]);

  const removePlayer = (id) => {
    const next = selectedIds.filter((item) => item !== id);
    sessionStorage.setItem(COMPARISON_KEY, JSON.stringify(next));
    setSelectedIds(next);
  };

  const clearAll = () => {
    sessionStorage.setItem(COMPARISON_KEY, JSON.stringify([]));
    setSelectedIds([]);
  };

  const handleShareComparisonPdf = async () => {
    if (!comparisonRef.current || players.length < 2) return;

    try {
      setExportingPdf(true);

      const canvas = await html2canvas(comparisonRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imageData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let renderedHeight = imgHeight;
      let yOffset = 0;

      pdf.addImage(imageData, 'PNG', 0, yOffset, imgWidth, imgHeight);
      renderedHeight -= pageHeight;

      while (renderedHeight > 0) {
        yOffset -= pageHeight;
        pdf.addPage();
        pdf.addImage(imageData, 'PNG', 0, yOffset, imgWidth, imgHeight);
        renderedHeight -= pageHeight;
      }

      const fileName = `comparacion-jugadores-${new Date().toISOString().slice(0, 10)}.pdf`;
      const pdfBlob = pdf.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: 'Comparación de jugadores',
          text: 'Comparación exportada en PDF',
          files: [pdfFile]
        });
      } else {
        pdf.save(fileName);
      }
    } catch {
      setError('No se pudo generar o compartir el PDF de comparación');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Comparacion de Jugadores</h1>
          <p className="text-gray-600">Selecciona 2-4 jugadores para compararlos lado a lado.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleShareComparisonPdf}
            disabled={players.length < 2 || exportingPdf || loading}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-50"
          >
            {exportingPdf ? 'Generando PDF...' : 'Compartir PDF'}
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
          >
            Limpiar
          </button>
          <Link
            to="/players"
            className="px-3 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm"
          >
            Elegir jugadores
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading && <p className="text-gray-600">Cargando comparacion...</p>}

      {!loading && players.length < 2 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">
            Debes seleccionar al menos 2 jugadores desde la pagina de jugadores para comparar.
          </p>
        </div>
      )}

      {!loading && players.length >= 2 && (
        <div ref={comparisonRef} className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {players.map((player) => (
                <button
                  key={player._id}
                  type="button"
                  onClick={() => removePlayer(player._id)}
                  className="text-xs px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  {player.name} x
                </button>
              ))}
            </div>

            <div className="md:hidden space-y-3">
              {players.map((player) => (
                <div key={`card-${player._id}`} className="rounded-lg border border-gray-200 p-3 space-y-2">
                  <p className="font-bold text-secondary-900">{player.name}</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                    {rows.map((row) => (
                      <p key={`${row.label}-mobile-${player._id}`} className="text-gray-700">
                        <span className="text-gray-500">{row.label}:</span> {row.key(player)}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2 pr-3">Metricas</th>
                    {players.map((player) => (
                      <th key={player._id} className="text-left py-2 pr-3">{player.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => (
                    <tr key={row.label}>
                      <td className="py-2 pr-3 font-semibold text-secondary-900">{row.label}</td>
                      {players.map((player) => (
                        <td key={`${row.label}-${player._id}`} className="py-2 pr-3 text-gray-700">
                          {row.key(player)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-secondary-900 mb-4">Radar de atributos</h2>
              <div className="h-72 md:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="attr" />
                    <Tooltip />
                    {players.map((player, index) => (
                      <Radar
                        key={player._id}
                        name={player.name}
                        dataKey={player.name}
                        stroke={COLORS[index % COLORS.length]}
                        fill={COLORS[index % COLORS.length]}
                        fillOpacity={0.18}
                      />
                    ))}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-secondary-900 mb-4">Tendencia de goles</h2>
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="period" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    {players.map((player, index) => (
                      <Bar
                        key={`${player._id}-goals`}
                        dataKey={`${player.name}__goals`}
                        name={`${player.name} · Goles`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-secondary-900 mb-4">Tendencia de asistencias</h2>
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="period" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    {players.map((player, index) => (
                      <Bar
                        key={`${player._id}-assists`}
                        dataKey={`${player.name}__assists`}
                        name={`${player.name} · Asist.`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-secondary-900 mb-4">Comparación histórica de valor de mercado</h2>
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={marketValueSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="period" />
                    <YAxis tickFormatter={(value) => `€${(Number(value) / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(value) => `€${Number(value).toLocaleString('es-ES')}`} />
                    <Legend />
                    {players.map((player, index) => (
                      <Line
                        key={`${player._id}-market`}
                        type="monotone"
                        dataKey={player.name}
                        name={player.name}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
