import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useDebounce } from '../hooks/useDebounce';

const COMPARISON_KEY = 'comparisonPlayers';
const PAGE_SIZE = 20;
const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];
const MIN_AGE = 15;
const MAX_AGE = 45;
const MAX_MARKET_VALUE = 200000000;
const MAX_PERFORMANCE_STAT = 80;

const sortOptions = {
  name: { label: 'Nombre', query: 'name' },
  position: { label: 'Posicion', query: 'position' },
  team: { label: 'Equipo', query: 'team' },
  age: { label: 'Edad', query: 'age' },
  marketValue: { label: 'Valor de mercado', query: 'marketValue' },
  goals: { label: 'Goles', query: 'stats.goals' },
  assists: { label: 'Asistencias', query: 'stats.assists' }
};

function getStoredComparison() {
  try {
    const raw = sessionStorage.getItem(COMPARISON_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function PlayerList() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [selectedNationalities, setSelectedNationalities] = useState([]);
  const [ageRange, setAgeRange] = useState({ min: MIN_AGE, max: MAX_AGE });
  const [marketValueRange, setMarketValueRange] = useState({ min: '', max: '' });
  const [goalsRange, setGoalsRange] = useState({ min: '', max: '' });
  const [assistsRange, setAssistsRange] = useState({ min: '', max: '' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [page, setPage] = useState(1);

  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [brokenImageIds, setBrokenImageIds] = useState([]);
  const [teams, setTeams] = useState([]);
  const [nationalities, setNationalities] = useState([]);

  const [comparisonIds, setComparisonIds] = useState(getStoredComparison());

  useEffect(() => {
    const fetchGlobalFilters = async () => {
      try {
        const { data } = await api.get('/players/filters');
        setTeams(Array.isArray(data?.teams) ? data.teams : []);
        setNationalities(Array.isArray(data?.nationalities) ? data.nationalities : []);
      } catch {
        setTeams([]);
        setNationalities([]);
      }
    };

    fetchGlobalFilters();
  }, []);

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      setError(null);

      const sortQuery = sortDirection === 'desc'
        ? `-${sortOptions[sortField].query}`
        : sortOptions[sortField].query;

      try {
        const { data } = await api.get('/players', {
          params: {
            q: debouncedQuery || undefined,
            positions: selectedPositions.length > 0 ? selectedPositions.join(',') : undefined,
            teams: selectedTeams.length > 0 ? selectedTeams.join(',') : undefined,
            nationalities: selectedNationalities.length > 0 ? selectedNationalities.join(',') : undefined,
            minAge: ageRange.min > MIN_AGE ? ageRange.min : undefined,
            maxAge: ageRange.max < MAX_AGE ? ageRange.max : undefined,
            minMarketValue: marketValueRange.min !== '' ? Number(marketValueRange.min) : undefined,
            maxMarketValue: marketValueRange.max !== '' ? Number(marketValueRange.max) : undefined,
            minGoals: goalsRange.min !== '' ? Number(goalsRange.min) : undefined,
            maxGoals: goalsRange.max !== '' ? Number(goalsRange.max) : undefined,
            minAssists: assistsRange.min !== '' ? Number(assistsRange.min) : undefined,
            maxAssists: assistsRange.max !== '' ? Number(assistsRange.max) : undefined,
            page,
            limit: PAGE_SIZE,
            sort: sortQuery
          }
        });

        setPlayers(data.players || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      } catch (err) {
        setError(err.response?.data?.message || 'No se pudieron cargar los jugadores');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [
    debouncedQuery,
    selectedPositions,
    selectedTeams,
    selectedNationalities,
    ageRange,
    marketValueRange,
    goalsRange,
    assistsRange,
    page,
    sortField,
    sortDirection
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedQuery,
    selectedPositions,
    selectedTeams,
    selectedNationalities,
    ageRange,
    marketValueRange,
    goalsRange,
    assistsRange
  ]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDirection('asc');
  };

  const toggleCompare = (playerId) => {
    setComparisonIds((prev) => {
      const alreadyAdded = prev.includes(playerId);
      let next = prev;

      if (alreadyAdded) {
        next = prev.filter((id) => id !== playerId);
      } else {
        if (prev.length >= 4) {
          setError('Solo puedes comparar hasta 4 jugadores');
          return prev;
        }
        next = [...prev, playerId];
      }

      sessionStorage.setItem(COMPARISON_KEY, JSON.stringify(next));
      return next;
    });
  };

  const formatMarketValue = (value) => {
    if (value == null) return '-';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getInitials = (name) => {
    const text = String(name || '').trim();
    if (!text) return '??';
    const parts = text.split(/\s+/).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() || '').join('');
  };

  const handleMultiSelectChange = (event, setter) => {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value);
    setter(values);
  };

  const resetAdvancedFilters = () => {
    setSelectedPositions([]);
    setSelectedTeams([]);
    setSelectedNationalities([]);
    setAgeRange({ min: MIN_AGE, max: MAX_AGE });
    setMarketValueRange({ min: '', max: '' });
    setGoalsRange({ min: '', max: '' });
    setAssistsRange({ min: '', max: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Gestion de Jugadores</h1>
          <p className="text-gray-600 text-sm mt-1">{total} jugadores encontrados</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/comparison')}
            className="bg-secondary-800 hover:bg-secondary-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            Ver comparacion ({comparisonIds.length})
          </button>
          <button
            type="button"
            onClick={() => navigate('/players/new')}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            Nuevo Jugador
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, equipo o nacionalidad"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
        />

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm font-medium"
          >
            {showAdvancedFilters ? 'Ocultar filtros avanzados' : 'Filtros avanzados'}
          </button>

          {showAdvancedFilters && (
            <button
              type="button"
              onClick={resetAdvancedFilters}
              className="text-sm text-gray-600 hover:text-secondary-900"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {showAdvancedFilters && (
          <div className="space-y-5 rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Posición (multi)</label>
                <select
                  multiple
                  value={selectedPositions}
                  onChange={(e) => handleMultiSelectChange(e, setSelectedPositions)}
                  className="w-full min-h-32 px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {POSITIONS.map((positionOption) => (
                    <option key={positionOption} value={positionOption}>{positionOption}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Equipo (multi)</label>
                <select
                  multiple
                  value={selectedTeams}
                  onChange={(e) => handleMultiSelectChange(e, setSelectedTeams)}
                  className="w-full min-h-32 px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {teams.map((teamOption) => (
                    <option key={teamOption} value={teamOption}>{teamOption}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nacionalidad (multi)</label>
                <select
                  multiple
                  value={selectedNationalities}
                  onChange={(e) => handleMultiSelectChange(e, setSelectedNationalities)}
                  className="w-full min-h-32 px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {nationalities.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Rango de edad: {ageRange.min} - {ageRange.max}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="range"
                  min={MIN_AGE}
                  max={MAX_AGE}
                  value={ageRange.min}
                  onChange={(e) => {
                    const nextMin = Number(e.target.value);
                    setAgeRange((prev) => ({ ...prev, min: Math.min(nextMin, prev.max) }));
                  }}
                />
                <input
                  type="range"
                  min={MIN_AGE}
                  max={MAX_AGE}
                  value={ageRange.max}
                  onChange={(e) => {
                    const nextMax = Number(e.target.value);
                    setAgeRange((prev) => ({ ...prev, max: Math.max(nextMax, prev.min) }));
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Rango valor de mercado</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" min="0" max={MAX_MARKET_VALUE} placeholder="Min" value={marketValueRange.min} onChange={(e) => setMarketValueRange((prev) => ({ ...prev, min: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg" />
                  <input type="number" min="0" max={MAX_MARKET_VALUE} placeholder="Max" value={marketValueRange.max} onChange={(e) => setMarketValueRange((prev) => ({ ...prev, max: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Rango de goles</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" min="0" max={MAX_PERFORMANCE_STAT} placeholder="Min" value={goalsRange.min} onChange={(e) => setGoalsRange((prev) => ({ ...prev, min: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg" />
                  <input type="number" min="0" max={MAX_PERFORMANCE_STAT} placeholder="Max" value={goalsRange.max} onChange={(e) => setGoalsRange((prev) => ({ ...prev, max: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Rango de asistencias</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" min="0" max={MAX_PERFORMANCE_STAT} placeholder="Min" value={assistsRange.min} onChange={(e) => setAssistsRange((prev) => ({ ...prev, min: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg" />
                  <input type="number" min="0" max={MAX_PERFORMANCE_STAT} placeholder="Max" value={assistsRange.max} onChange={(e) => setAssistsRange((prev) => ({ ...prev, max: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="md:hidden space-y-3">
          {loading && (
            <div className="py-6 text-center text-gray-500">Cargando jugadores...</div>
          )}

          {!loading && players.length === 0 && (
            <div className="py-6 text-center text-gray-500">No hay resultados para esos filtros</div>
          )}

          {!loading && players.map((player) => {
            const isSelected = comparisonIds.includes(player._id);
            const hasImage = !!player.imageUrl && !brokenImageIds.includes(player._id);

            return (
              <div key={player._id} className="border border-gray-200 rounded-lg p-3 bg-white space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full border border-gray-200 bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                    {hasImage ? (
                      <img
                        src={player.imageUrl}
                        alt={player.name}
                        className="w-full h-full object-cover"
                        onError={() => {
                          setBrokenImageIds((prev) => (prev.includes(player._id) ? prev : [...prev, player._id]));
                        }}
                      />
                    ) : (
                      <span className="text-xs font-semibold text-gray-600">{getInitials(player.name)}</span>
                    )}
                  </div>

                  <div>
                    <Link className="font-semibold text-secondary-900 hover:text-primary-600" to={`/players/${player._id}`}>
                      {player.name}
                    </Link>
                    <p className="text-xs text-gray-500">{player.position || '-'} · {player.team || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><span className="text-gray-500">Edad:</span> {player.age ?? '-'}</p>
                  <p><span className="text-gray-500">Valor:</span> {formatMarketValue(player.marketValue)}</p>
                  <p><span className="text-gray-500">Goles:</span> {player.stats?.goals ?? 0}</p>
                  <p><span className="text-gray-500">Asist.:</span> {player.stats?.assists ?? 0}</p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleCompare(player._id)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold ${
                    isSelected
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isSelected ? 'Quitar' : 'Comparar'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                {Object.entries(sortOptions).map(([key, value]) => (
                  <th key={key} className="pb-3 font-bold pr-4">
                    <button
                      type="button"
                      className="hover:text-primary-600"
                      onClick={() => toggleSort(key)}
                    >
                      {value.label}
                      {sortField === key ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                    </button>
                  </th>
                ))}
                <th className="pb-3 font-bold">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-500">Cargando jugadores...</td>
                </tr>
              )}

              {!loading && players.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-500">No hay resultados para esos filtros</td>
                </tr>
              )}

              {!loading && players.map((player) => {
                const isSelected = comparisonIds.includes(player._id);
                const hasImage = !!player.imageUrl && !brokenImageIds.includes(player._id);
                return (
                  <tr key={player._id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-secondary-900">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full border border-gray-200 bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                          {hasImage ? (
                            <img
                              src={player.imageUrl}
                              alt={player.name}
                              className="w-full h-full object-cover"
                              onError={() => {
                                setBrokenImageIds((prev) => (prev.includes(player._id) ? prev : [...prev, player._id]));
                              }}
                            />
                          ) : (
                            <span className="text-xs font-semibold text-gray-600">
                              {getInitials(player.name)}
                            </span>
                          )}
                        </div>

                        <Link className="hover:text-primary-600" to={`/players/${player._id}`}>
                          {player.name}
                        </Link>
                      </div>
                    </td>
                    <td className="py-3 pr-4">{player.position || '-'}</td>
                    <td className="py-3 pr-4">{player.team || '-'}</td>
                    <td className="py-3 pr-4">{player.age ?? '-'}</td>
                    <td className="py-3 pr-4">{formatMarketValue(player.marketValue)}</td>
                    <td className="py-3 pr-4">{player.stats?.goals ?? 0}</td>
                    <td className="py-3 pr-4">{player.stats?.assists ?? 0}</td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => toggleCompare(player._id)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold ${
                          isSelected
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isSelected ? 'Quitar' : 'Comparar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
          <p className="text-sm text-gray-500">
            Pagina {page} de {Math.max(pages, 1)}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="px-3 py-2 rounded-md border border-gray-300 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(pages || 1, prev + 1))}
              disabled={page >= (pages || 1)}
              className="px-3 py-2 rounded-md border border-gray-300 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
