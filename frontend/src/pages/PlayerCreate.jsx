import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlayerForm from '../components/PlayerForm';
import api from '../services/api';

export default function PlayerCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async (payload) => {
    try {
      setSaving(true);
      setError(null);
      const { data } = await api.post('/players', payload);
      navigate(`/players/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear el jugador');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">Nuevo Jugador</h1>
        <p className="text-gray-600 mt-1">Completa los campos para crear un nuevo perfil</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        <PlayerForm
          loading={saving}
          submitLabel="Crear jugador"
          onSubmit={handleCreate}
        />
      </div>
    </div>
  );
}
