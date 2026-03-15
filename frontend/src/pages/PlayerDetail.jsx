import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const attributeKeys = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
const detailCardClass = 'bg-white rounded-lg p-4 border border-gray-200 space-y-3';

function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('es-ES');
}

function formatCurrency(value, currency = 'EUR') {
  if (typeof value !== 'number') return 'N/A';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

function formatCompactNumber(value) {
  if (typeof value !== 'number') return 'N/A';
  return new Intl.NumberFormat('es-ES', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
}

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
          <p className="font-semibold text-gray-900">{formatDate(data.dateOfBirth)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Lugar de nacimiento</p>
          <p className="font-semibold text-gray-900">{data.placeOfBirth || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Edad</p>
          <p className="font-semibold text-gray-900">{data.age ?? 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Nacionalidad</p>
          <p className="font-semibold text-gray-900">{data.nationality || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Altura</p>
          <p className="font-semibold text-gray-900">{data.height ? `${data.height} cm` : 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Peso</p>
          <p className="font-semibold text-gray-900">{data.weight ? `${data.weight} kg` : 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Pie preferido</p>
          <p className="font-semibold text-gray-900">{data.preferredFoot || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">ID origen</p>
          <p className="font-semibold text-gray-900">{data.playerId || 'N/A'}</p>
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

function MetadataCard({ data }) {
  if (!data || typeof data !== 'object') return null;

  const hasMeta = data.sourceKey || data.season || data.dataProvider || data.lastUpdated || data.reliability != null || data.completeness != null;
  if (!hasMeta) return null;

  return (
    <div className={detailCardClass}>
      <h3 className="text-base font-bold text-gray-900">Calidad y origen del dato</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-600 font-medium">Fuente</p>
          <p className="font-semibold text-gray-900">{data.dataProvider || data.dataSource || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Temporada</p>
          <p className="font-semibold text-gray-900">{data.season || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Clave</p>
          <p className="font-semibold text-gray-900">{data.sourceKey || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Última actualización</p>
          <p className="font-semibold text-gray-900">{formatDate(data.lastUpdated)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Fiabilidad</p>
          <p className="font-semibold text-gray-900">{data.reliability != null ? `${data.reliability}` : 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Completitud</p>
          <p className="font-semibold text-gray-900">{data.completeness != null ? `${data.completeness}` : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}

function ClubInfoCard({ data }) {
  if (!data || typeof data !== 'object') return null;

  const secondaryPositions = Array.isArray(data.secondaryPositions) ? data.secondaryPositions : [];

  return (
    <div className={detailCardClass}>
      <h3 className="text-base font-bold text-gray-900">Contexto de club</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-600 font-medium">Equipo</p>
          <p className="font-semibold text-gray-900">{data.currentTeam || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Liga</p>
          <p className="font-semibold text-gray-900">{data.league || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">División</p>
          <p className="font-semibold text-gray-900">{data.division || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">País</p>
          <p className="font-semibold text-gray-900">{data.country || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Posición primaria</p>
          <p className="font-semibold text-gray-900">{data.position || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Dorsal</p>
          <p className="font-semibold text-gray-900">{data.jerseyNumber ?? 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Ingreso</p>
          <p className="font-semibold text-gray-900">{formatDate(data.joinedDate)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Estado</p>
          <p className="font-semibold text-gray-900">{data.playerStatus || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Cesión</p>
          <p className="font-semibold text-gray-900">{data.isLoanPlayer ? 'Sí' : 'No'}</p>
        </div>
      </div>
      {secondaryPositions.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-600 font-medium mb-2">Posiciones secundarias</p>
          <div className="flex flex-wrap gap-2">
            {secondaryPositions.map((position) => (
              <span key={position} className="bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full">
                {position}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ContractInfoCard({ data }) {
  const contract = data || {};
  const annualSalary = contract.salary?.annualSalary ?? contract.salary;
  const weeklyWage = contract.salary?.weeklyWage;
  const salaryCurrency = contract.salary?.currency || 'EUR';
  const bonuses = contract.salary?.bonuses || {};

  return (
    <div className={detailCardClass}>
      <h3 className="text-base font-bold text-gray-900">Contrato</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-600 font-medium">Salario anual</p>
          <p className="font-semibold text-gray-900">{formatCurrency(annualSalary, salaryCurrency)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Fin de contrato</p>
          <p className="font-semibold text-gray-900">{formatDate(contract.contractEnd)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Inicio contrato</p>
          <p className="font-semibold text-gray-900">{formatDate(contract.contractStart)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Duración</p>
          <p className="font-semibold text-gray-900">{contract.contractLength ? `${contract.contractLength} años` : 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Salario semanal</p>
          <p className="font-semibold text-gray-900">{formatCurrency(weeklyWage, salaryCurrency)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">Cláusula</p>
          <p className="font-semibold text-gray-900">{formatCurrency(contract.releaseClause, salaryCurrency)}</p>
        </div>
      </div>

      {(contract.agentInfo?.agentName || contract.agentInfo?.agencyName) && (
        <div className="pt-2 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-600 font-medium">Agente</p>
            <p className="font-semibold text-gray-900">{contract.agentInfo?.agentName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Agencia</p>
            <p className="font-semibold text-gray-900">{contract.agentInfo?.agencyName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Fee agente</p>
            <p className="font-semibold text-gray-900">{contract.agentInfo?.agentFeePercentage != null ? `${contract.agentInfo.agentFeePercentage}%` : 'N/A'}</p>
          </div>
        </div>
      )}

      {Object.keys(bonuses).length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-600 font-medium mb-2">Bonificaciones</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            {Object.entries(bonuses).map(([key, value]) => (
              <div key={key}>
                <p className="text-xs text-gray-600 font-medium">{key}</p>
                <p className="font-semibold text-gray-900">{formatCurrency(value, salaryCurrency)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SeasonStatsCard({ data }) {
  if (!data || typeof data !== 'object') return null;

  const basic = data.basicStats || {};
  const per90 = data.per90Stats || {};
  const expected = data.advancedStats?.expectedStats || {};
  const passing = data.advancedStats?.passingMetrics || {};
  const shooting = data.advancedStats?.shootingMetrics || {};
  const defensive = data.advancedStats?.defensiveMetrics || {};
  const technical = data.advancedStats?.technicalMetrics || {};
  const physical = data.physicalMetrics || {};

  return (
    <div className={detailCardClass}>
      <h3 className="text-base font-bold text-gray-900">Estadísticas avanzadas</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div><p className="text-xs text-gray-600 font-medium">Titularidades</p><p className="text-xl font-bold text-gray-900">{basic.starts ?? 'N/A'}</p></div>
        <div><p className="text-xs text-gray-600 font-medium">xG</p><p className="text-xl font-bold text-gray-900">{expected.xG ?? 'N/A'}</p></div>
        <div><p className="text-xs text-gray-600 font-medium">xA</p><p className="text-xl font-bold text-gray-900">{expected.xA ?? 'N/A'}</p></div>
        <div><p className="text-xs text-gray-600 font-medium">Velocidad punta</p><p className="text-xl font-bold text-gray-900">{physical.topSpeed ? `${physical.topSpeed} km/h` : 'N/A'}</p></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm pt-2 border-t border-gray-100">
        <div><p className="text-xs text-gray-600 font-medium">Precisión pase</p><p className="font-semibold text-gray-900">{passing.passAccuracy != null ? `${passing.passAccuracy}%` : 'N/A'}</p></div>
        <div><p className="text-xs text-gray-600 font-medium">Precisión tiro</p><p className="font-semibold text-gray-900">{shooting.shotAccuracy != null ? `${shooting.shotAccuracy}%` : 'N/A'}</p></div>
        <div><p className="text-xs text-gray-600 font-medium">Conversión</p><p className="font-semibold text-gray-900">{shooting.shotConversion != null ? `${shooting.shotConversion}%` : 'N/A'}</p></div>
        <div><p className="text-xs text-gray-600 font-medium">Regates</p><p className="font-semibold text-gray-900">{technical.dribbles ?? 'N/A'}</p></div>
        <div><p className="text-xs text-gray-600 font-medium">Intercepciones</p><p className="font-semibold text-gray-900">{defensive.interceptions ?? 'N/A'}</p></div>
        <div><p className="text-xs text-gray-600 font-medium">Recuperaciones</p><p className="font-semibold text-gray-900">{defensive.recoveries ?? 'N/A'}</p></div>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-600 font-medium mb-2">Métricas por 90'</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          {[
            ['Goles', per90.goalsP90],
            ['Asist.', per90.assistsP90],
            ['Pases clave', per90.keyPassesP90],
            ['Regates', per90.dribblesP90],
            ['Entradas', per90.tacklesP90],
            ['Intercepc.', per90.interceptionsP90],
            ['Disparos', per90.shotsP90],
            ['Centros', per90.crossesP90]
          ].map(([label, value]) => (
            <div key={label} className="rounded bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-600">{label}</p>
              <p className="font-semibold text-gray-900">{value ?? 'N/A'}</p>
            </div>
          ))}
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
  const lastGames = Array.isArray(data.currentForm?.last5Games) ? data.currentForm.last5Games : [];
  const seasonProgression = Array.isArray(data.seasonProgression) ? data.seasonProgression : [];
  const streaks = data.streaks || {};

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

      {(streaks.currentGoalStreak != null || streaks.longestGoalStreak != null) && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-2 border-t border-gray-100 text-sm">
          {[
            ['Racha gol', streaks.currentGoalStreak],
            ['Mejor racha gol', streaks.longestGoalStreak],
            ['Racha asist.', streaks.currentAssistStreak],
            ['Mejor racha asist.', streaks.longestAssistStreak],
            ['Racha porterías', streaks.currentCleanSheetStreak]
          ].map(([label, value]) => (
            <div key={label} className="rounded bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-600">{label}</p>
              <p className="font-semibold text-gray-900">{value ?? 'N/A'}</p>
            </div>
          ))}
        </div>
      )}

      {seasonProgression.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-600 font-medium mb-2">Progresión mensual</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={seasonProgression} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '11px' }} />
              <YAxis allowDecimals={false} stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Line type="monotone" dataKey="goals" name="Goles" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="assists" name="Asistencias" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="averageRating" name="Rating" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {lastGames.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-600 font-medium mb-2">Últimos 5 partidos</p>
          <div className="space-y-2">
            {lastGames.map((game) => (
              <div key={game.matchId || `${game.date}-${game.opponent}`} className="rounded bg-gray-50 px-3 py-2 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">vs {game.opponent || 'Rival'} · {game.result || 'N/A'}</p>
                  <p className="text-xs text-gray-600">{formatDate(game.date)} · {game.minutesPlayed ?? 'N/A'} min</p>
                </div>
                <div className="flex gap-3 text-xs text-gray-700">
                  <span>G: <strong>{game.goals ?? 0}</strong></span>
                  <span>A: <strong>{game.assists ?? 0}</strong></span>
                  <span>Rating: <strong>{game.rating ?? 'N/A'}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InjuryHistoryCard({ data }) {
  if (!data || typeof data !== 'object') return null;

  const propensity = data.injuryProneness ?? 'N/A';
  const injuryList = Array.isArray(data.injuryHistory) ? data.injuryHistory : [];

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

      {injuryList.length > 0 && (
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <p className="text-xs text-gray-600 font-medium">Historial reciente</p>
          {injuryList.slice(0, 4).map((injury, index) => (
            <div key={`${injury.injuryType}-${index}`} className="rounded bg-red-50 border border-red-100 px-3 py-2 text-sm">
              <p className="font-semibold text-red-900">{injury.injuryType || 'Lesión'}</p>
              <p className="text-red-800 text-xs">
                {formatDate(injury.injuryDate)} → {formatDate(injury.returnDate)} · {injury.daysOut ?? 0} días · {injury.gamessMissed ?? 0} partidos
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoutingNotesCard({ data }) {
  if (!data || typeof data !== 'object') return null;

  const scoutComments = Array.isArray(data.scoutComments) ? data.scoutComments : [];
  const technical = data.attributes?.technical || {};
  const detailed = data.attributes?.detailed || {};

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
        <div>
          <p className="text-xs text-gray-600 font-medium">Techo</p>
          <p className="text-xl font-bold text-gray-900">{data.ceiling || 'N/A'}</p>
        </div>
      </div>

      {(Object.keys(technical).length > 0 || Object.keys(detailed).length > 0) && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-600 font-medium mb-2">Rasgos destacados</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            {[
              ['Pase', technical.passing],
              ['Dribbling', technical.dribbling],
              ['Vision', detailed.vision],
              ['Composure', detailed.composure],
              ['Ball control', detailed.ballControl],
              ['Long passing', detailed.longPassing],
              ['Finishing', detailed.finishing],
              ['Positioning', detailed.positioning]
            ].filter(([, value]) => value != null).map(([label, value]) => (
              <div key={label} className="rounded bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-600">{label}</p>
                <p className="font-semibold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {scoutComments.length > 0 && (
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <p className="text-xs text-gray-600 font-medium">Comentarios de scouts</p>
          {scoutComments.slice(0, 3).map((comment, index) => (
            <div key={`${comment.scout}-${index}`} className="rounded bg-gray-50 px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-gray-900">{comment.scout || 'Scout'}</p>
                <span className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-700">
                  {comment.recommendation || 'N/A'} · {comment.rating ?? 'N/A'}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{formatDate(comment.date)}</p>
              <p className="text-gray-700 mt-2">{comment.comments}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TacticalDataCard({ data }) {
  if (!data || typeof data !== 'object') return null;

  const tactical = data.playingStyle || data;
  const positionData = data.positionData || {};
  const heatmaps = data.heatmaps || {};

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

        {(positionData.primaryPosition || positionData.preferredSide || positionData.positionFlexibility != null) && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-gray-100 text-sm">
            <div>
              <p className="text-xs text-gray-600 font-medium mb-1">Posición principal</p>
              <p className="font-semibold text-gray-900">{positionData.primaryPosition || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium mb-1">Lado preferido</p>
              <p className="font-semibold text-gray-900">{positionData.preferredSide || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium mb-1">Flexibilidad</p>
              <p className="font-semibold text-gray-900">{positionData.positionFlexibility ?? 'N/A'}</p>
            </div>
          </div>
        )}

        {Array.isArray(positionData.positionsPlayed) && positionData.positionsPlayed.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-600 font-medium mb-2">Posiciones jugadas</p>
            <div className="space-y-2 text-sm">
              {positionData.positionsPlayed.map((position) => (
                <div key={`${position.position}-${position.appearances}`} className="flex items-center justify-between rounded bg-gray-50 px-3 py-2">
                  <span className="font-semibold text-gray-900">{position.position}</span>
                  <span className="text-gray-700">{position.appearances} PJ · {position.effectiveness} efectividad</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {heatmaps.zoneOccupancy && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-600 font-medium mb-2">Ocupación de zonas</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {Object.entries(heatmaps.zoneOccupancy).map(([zone, value]) => (
                <div key={zone} className="rounded bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-600">{zone}</p>
                  <p className="font-semibold text-gray-900">{value}%</p>
                </div>
              ))}
            </div>
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

  const followers = data.followersCount || {};

  return (
    <div className={detailCardClass}>
      <h3 className="text-base font-bold text-gray-900 mb-3">Redes sociales</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-600 font-medium mb-1">Comercializabilidad</p>
          <p className="text-3xl font-bold text-gray-900">{data.marketability || 0}/10</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium mb-1">Engagement</p>
          <p className="text-2xl font-bold text-gray-900">{data.engagementRate != null ? `${data.engagementRate}%` : 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium mb-1">Seguidores totales</p>
          <p className="text-2xl font-bold text-gray-900">{formatCompactNumber(Object.values(followers).reduce((sum, value) => sum + (Number(value) || 0), 0))}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-gray-100 text-sm">
        {Object.entries(followers).map(([network, value]) => (
          <div key={network} className="rounded bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-600 capitalize">{network}</p>
            <p className="font-semibold text-gray-900">{formatCompactNumber(value)}</p>
          </div>
        ))}
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
  const languages = Array.isArray(data.languages) ? data.languages : [];
  const personalityTraits = Array.isArray(data.personalityTraits) ? data.personalityTraits : [];
  if (!hasData && !languages.length && !personalityTraits.length && !data.education && !data.family) return null;

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

      {(languages.length > 0 || personalityTraits.length > 0 || data.education || data.family) && (
        <div className="space-y-3 pt-2 border-t border-gray-100 text-sm">
          {data.education && (
            <div>
              <p className="text-xs text-gray-600 font-medium mb-1">Educación</p>
              <p className="text-gray-900">{data.education}</p>
            </div>
          )}
          {languages.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 font-medium mb-1">Idiomas</p>
              <div className="flex flex-wrap gap-2">
                {languages.map((language) => (
                  <span key={language} className="bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full">{language}</span>
                ))}
              </div>
            </div>
          )}
          {personalityTraits.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 font-medium mb-1">Rasgos de personalidad</p>
              <div className="flex flex-wrap gap-2">
                {personalityTraits.map((trait) => (
                  <span key={trait} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">{trait}</span>
                ))}
              </div>
            </div>
          )}
          {data.family && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-gray-600 font-medium">Estado civil</p>
                <p className="font-semibold text-gray-900">{data.family.maritalStatus || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Hijos</p>
                <p className="font-semibold text-gray-900">{data.family.children ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Familia futbolera</p>
                <p className="font-semibold text-gray-900">{data.family.footballingFamily ? 'Sí' : 'No'}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CompetitionBreakdownCard({ data }) {
  if (!data || typeof data !== 'object') return null;

  const competitions = Array.isArray(data.byCompetition) ? data.byCompetition : [];
  const homeVsAway = data.homeVsAway || {};
  const bigGame = data.bigGamePerformance || {};

  return (
    <div className={detailCardClass}>
      <h3 className="text-base font-bold text-gray-900">Rendimiento por competición</h3>

      {competitions.length > 0 && (
        <div className="space-y-2">
          {competitions.map((competition) => (
            <div key={competition.competitionName} className="rounded bg-gray-50 px-3 py-2 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900">{competition.competitionName}</p>
                <p className="text-xs text-gray-600">{competition.competitionType}</p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-700">
                <span>PJ: <strong>{competition.appearances ?? 0}</strong></span>
                <span>G: <strong>{competition.goals ?? 0}</strong></span>
                <span>A: <strong>{competition.assists ?? 0}</strong></span>
                <span>Rating: <strong>{competition.averageRating ?? 'N/A'}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {(homeVsAway.home || homeVsAway.away || bigGame.vsTop6 || bigGame.derbies) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-100 text-sm">
          {[
            ['Casa', homeVsAway.home],
            ['Fuera', homeVsAway.away],
            ['Vs Top 6', bigGame.vsTop6],
            ['Derbis', bigGame.derbies]
          ].filter(([, value]) => value).map(([label, value]) => (
            <div key={label} className="rounded bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-600">{label}</p>
              <p className="font-semibold text-gray-900">{value.appearances ?? 0} PJ · Rating {value.averageRating ?? 'N/A'}</p>
              <p className="text-xs text-gray-700">G {value.goals ?? 0} · A {value.assists ?? 0}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CareerHistoryCard({ data }) {
  if (!data || typeof data !== 'object') return null;

  const previousClubs = Array.isArray(data.previousClubs) ? data.previousClubs : [];
  const youthCareer = Array.isArray(data.youthCareer) ? data.youthCareer : [];
  if (!previousClubs.length && !youthCareer.length) return null;

  return (
    <div className={detailCardClass}>
      <h3 className="text-base font-bold text-gray-900">Trayectoria</h3>

      {previousClubs.length > 0 && (
        <div className="space-y-2">
          {previousClubs.map((club, index) => (
            <div key={`${club.club}-${index}`} className="rounded bg-gray-50 px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-gray-900">{club.club}</p>
                <span className="text-xs text-gray-600">{club.transferType || 'N/A'}</span>
              </div>
              <p className="text-xs text-gray-600">{club.league || 'N/A'} · {formatDate(club.startDate)} → {formatDate(club.endDate)}</p>
              <p className="text-xs text-gray-700 mt-1">
                PJ {club.appearances ?? 0} · G {club.goals ?? 0} · A {club.assists ?? 0} · Fee {typeof club.transferFee === 'number' ? formatCurrency(club.transferFee) : 'N/A'}
              </p>
            </div>
          ))}
        </div>
      )}

      {youthCareer.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-600 font-medium mb-2">Formación</p>
          <div className="flex flex-wrap gap-2">
            {youthCareer.map((club, index) => (
              <span key={`${club.club}-${index}`} className="bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full">
                {club.club} ({club.startYear}-{club.endYear})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InternationalCareerCard({ data }) {
  if (!data || typeof data !== 'object') return null;
  if (!data.nationalTeam && !data.caps && !Array.isArray(data.majorTournaments)) return null;

  return (
    <div className={detailCardClass}>
      <h3 className="text-base font-bold text-gray-900">Carrera internacional</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div><p className="text-xs text-gray-600 font-medium">Selección</p><p className="font-semibold text-gray-900">{data.nationalTeam || 'N/A'}</p></div>
        <div><p className="text-xs text-gray-600 font-medium">Caps</p><p className="font-semibold text-gray-900">{data.caps ?? 'N/A'}</p></div>
        <div><p className="text-xs text-gray-600 font-medium">Goles</p><p className="font-semibold text-gray-900">{data.goals ?? 'N/A'}</p></div>
        <div><p className="text-xs text-gray-600 font-medium">Asistencias</p><p className="font-semibold text-gray-900">{data.assists ?? 'N/A'}</p></div>
        <div><p className="text-xs text-gray-600 font-medium">Debut</p><p className="font-semibold text-gray-900">{formatDate(data.debut)}</p></div>
        <div><p className="text-xs text-gray-600 font-medium">Última convocatoria</p><p className="font-semibold text-gray-900">{formatDate(data.lastCallUp)}</p></div>
      </div>

      {Array.isArray(data.youthTeams) && data.youthTeams.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-600 font-medium mb-2">Categorías inferiores</p>
          <div className="flex flex-wrap gap-2">
            {data.youthTeams.map((team) => (
              <span key={team} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">{team}</span>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(data.majorTournaments) && data.majorTournaments.length > 0 && (
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <p className="text-xs text-gray-600 font-medium">Torneos principales</p>
          {data.majorTournaments.map((tournament, index) => (
            <div key={`${tournament.tournament}-${index}`} className="rounded bg-gray-50 px-3 py-2 text-sm flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900">{tournament.tournament}</p>
                <p className="text-xs text-gray-600">{tournament.year}</p>
              </div>
              <div className="text-xs text-gray-700">PJ {tournament.appearances ?? 0} · G {tournament.goals ?? 0} · A {tournament.assists ?? 0}</div>
            </div>
          ))}
        </div>
      )}
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
            <div className="w-full md:w-[calc(50%-0.375rem)]"><MetadataCard data={detailed} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><ClubInfoCard data={detailed.clubInfo} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><ContactInfoCard data={detailed.contactInfo} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><ContractInfoCard data={detailed.contractInfo || player.contract} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><MarketDataCard data={detailed.marketData} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><SeasonStatsCard data={detailed.seasonStats} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><FormAnalysisCard data={detailed.formAnalysis} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><InjuryHistoryCard data={detailed.injuryHistory} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><ScoutingNotesCard data={detailed.scoutingNotes} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><CompetitionBreakdownCard data={detailed.competitionBreakdown} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><TacticalDataCard data={detailed.tacticalData} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><CareerHistoryCard data={detailed.careerHistory} /></div>
            <div className="w-full md:w-[calc(50%-0.375rem)]"><InternationalCareerCard data={detailed.internationalCareer} /></div>
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
