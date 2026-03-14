import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import api from '../services/api';

const ratingLabels = {
  technical: 'Tecnico',
  physical: 'Fisico',
  mental: 'Mental',
  tactical: 'Tactico',
  finishing: 'Definicion',
  passing: 'Pase',
  dribbling: 'Regate',
  defending: 'Defensa',
  workRate: 'Trabajo'
};

function ValueList({ title, items }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-secondary-900 mb-2">{title}</h3>
      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
        {items.map((item, idx) => (
          <li key={`${title}-${idx}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get(`/reports/${id}`);
        setReport(data);
      } catch (err) {
        setError(err.response?.data?.message || 'No se pudo cargar el reporte');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (loading) {
    return <p className="text-gray-600">Cargando reporte...</p>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => navigate('/reports')}
          className="px-4 py-2 rounded-lg border border-gray-300"
        >
          Volver a reportes
        </button>
      </div>
    );
  }

  if (!report) {
    return <p className="text-gray-600">Reporte no encontrado.</p>;
  }

  const ratings = report.ratings || {};
  const radarData = Object.entries(ratings)
    .map(([key, value]) => ({
      metric: ratingLabels[key] || key,
      value: Number(value) || 0
    }))
    .filter((item) => item.value > 0);

  const handleShareReportPdf = async () => {
    if (!reportRef.current) return;

    try {
      setExportingPdf(true);

      const canvas = await html2canvas(reportRef.current, {
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

      const fileName = `reporte-${report._id || 'scouting'}-${new Date().toISOString().slice(0, 10)}.pdf`;
      const pdfBlob = pdf.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: 'Reporte de scouting',
          text: 'Reporte exportado en PDF',
          files: [pdfFile]
        });
      } else {
        pdf.save(fileName);
      }
    } catch {
      setError('No se pudo generar o compartir el PDF del reporte');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Detalle de reporte</h1>
          <p className="text-gray-600 mt-1">
            {report.player?.name || 'Jugador'} · {report.matchDetails?.competition || 'Partido'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleShareReportPdf}
            disabled={exportingPdf}
            className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50"
          >
            {exportingPdf ? 'Generando PDF...' : 'Compartir PDF'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="px-4 py-2 rounded-lg border border-gray-300"
          >
            Volver
          </button>
          {report.player?._id && (
            <button
              type="button"
              onClick={() => navigate(`/players/${report.player._id}`)}
              className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white"
            >
              Ver jugador
            </button>
          )}
        </div>
      </div>

      <div ref={reportRef} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
          <h2 className="font-semibold text-secondary-900">Resumen</h2>
          <p className="text-sm"><span className="font-medium">Jugador:</span> {report.player?.name || 'N/A'}</p>
          <p className="text-sm"><span className="font-medium">Equipo:</span> {report.player?.team || 'N/A'}</p>
          <p className="text-sm"><span className="font-medium">Posicion:</span> {report.player?.position || 'N/A'}</p>
          <p className="text-sm"><span className="font-medium">Scout:</span> {report.scout?.name || 'N/A'}</p>
          <p className="text-sm"><span className="font-medium">Rating global:</span> {report.overallRating ?? 'N/A'}</p>
          <p className="text-sm"><span className="font-medium">Recomendacion:</span> {report.recommendation || 'N/A'}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
          <h2 className="font-semibold text-secondary-900">Partido</h2>
          <p className="text-sm"><span className="font-medium">Rival:</span> {report.matchDetails?.opponent || 'N/A'}</p>
          <p className="text-sm"><span className="font-medium">Competicion:</span> {report.matchDetails?.competition || 'N/A'}</p>
          <p className="text-sm"><span className="font-medium">Resultado:</span> {report.matchDetails?.result || 'N/A'}</p>
          <p className="text-sm"><span className="font-medium">Fecha:</span> {report.matchDetails?.matchDate ? new Date(report.matchDetails.matchDate).toLocaleDateString('es-ES') : 'N/A'}</p>
          <p className="text-sm"><span className="font-medium">Minutos:</span> {report.matchDetails?.minutesPlayed ?? 'N/A'}</p>
          <p className="text-sm"><span className="font-medium">Posicion:</span> {report.matchDetails?.position || 'N/A'}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="font-semibold text-secondary-900 mb-3">Ratings</h2>
        <div className="h-80">
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#374151', fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                <Tooltip formatter={(value) => Number(value).toFixed(1)} />
                <Radar dataKey="value" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-500">
              Sin datos de ratings para el grafico
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ValueList title="Fortalezas" items={report.strengths} />
        <ValueList title="Debilidades" items={report.weaknesses} />
        <ValueList title="Momentos clave" items={report.keyMoments} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="font-semibold text-secondary-900 mb-2">Notas</h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.notes || 'Sin notas'}</p>
      </div>
      </div>
    </div>
  );
}
