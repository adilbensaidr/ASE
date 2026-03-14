import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { playerSchema } from '../utils/playerSchema';

const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

function normalizeValue(value, fallback = 0) {
  if (value === '' || value == null) return fallback;
  return Number(value);
}

export default function PlayerForm({
  initialValues,
  loading,
  submitLabel,
  onSubmit,
  formId,
  showSubmitButton = true
}) {
  const [imageError, setImageError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(playerSchema),
    defaultValues: {
      name: '',
      imageUrl: '',
      position: 'Midfielder',
      age: '',
      team: '',
      nationality: '',
      stats: {
        goals: 0,
        assists: 0,
        appearances: 0,
        minutesPlayed: 0
      },
      attributes: {
        pace: null,
        shooting: null,
        passing: null,
        dribbling: null,
        defending: null,
        physical: null
      }
    }
  });

  useEffect(() => {
    if (initialValues) {
      reset({
        name: initialValues.name || '',
        imageUrl: initialValues.imageUrl || '',
        position: initialValues.position || 'Midfielder',
        age: initialValues.age ?? '',
        team: initialValues.team || '',
        nationality: initialValues.nationality || '',
        stats: {
          goals: initialValues.stats?.goals ?? 0,
          assists: initialValues.stats?.assists ?? 0,
          appearances: initialValues.stats?.appearances ?? 0,
          minutesPlayed: initialValues.stats?.minutesPlayed ?? 0
        },
        attributes: {
          pace: initialValues.attributes?.pace ?? null,
          shooting: initialValues.attributes?.shooting ?? null,
          passing: initialValues.attributes?.passing ?? null,
          dribbling: initialValues.attributes?.dribbling ?? null,
          defending: initialValues.attributes?.defending ?? null,
          physical: initialValues.attributes?.physical ?? null
        }
      });
      setImageError('');
    }
  }, [initialValues, reset]);

  const imagePreview = watch('imageUrl');

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      setImageError('Solo se permiten archivos de imagen');
      event.target.value = '';
      return;
    }

    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      setImageError('La imagen no puede superar 2MB');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      setValue('imageUrl', dataUrl, { shouldValidate: true, shouldDirty: true });
      setImageError('');
    };
    reader.onerror = () => {
      setImageError('No se pudo leer la imagen seleccionada');
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setValue('imageUrl', '', { shouldValidate: true, shouldDirty: true });
    setImageError('');
  };

  const submitForm = (values) => {
    const normalizedImage = values.imageUrl?.trim() || null;

    const payload = {
      name: values.name,
      imageUrl: normalizedImage,
      position: values.position,
      age: Number(values.age),
      team: values.team,
      nationality: values.nationality,
      stats: {
        goals: normalizeValue(values.stats?.goals),
        assists: normalizeValue(values.stats?.assists),
        appearances: normalizeValue(values.stats?.appearances),
        minutesPlayed: normalizeValue(values.stats?.minutesPlayed)
      },
      attributes: {
        pace: values.attributes?.pace ? Number(values.attributes.pace) : undefined,
        shooting: values.attributes?.shooting ? Number(values.attributes.shooting) : undefined,
        passing: values.attributes?.passing ? Number(values.attributes.passing) : undefined,
        dribbling: values.attributes?.dribbling ? Number(values.attributes.dribbling) : undefined,
        defending: values.attributes?.defending ? Number(values.attributes.defending) : undefined,
        physical: values.attributes?.physical ? Number(values.attributes.physical) : undefined
      }
    };

    onSubmit(payload);
  };

  return (
    <form id={formId} onSubmit={handleSubmit(submitForm)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            type="text"
            {...register('name')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Posicion</label>
          <select {...register('position')} className="w-full border border-gray-300 rounded-lg px-3 py-2">
            {positions.map((position) => (
              <option key={position} value={position}>{position}</option>
            ))}
          </select>
          {errors.position && <p className="text-red-600 text-sm mt-1">{errors.position.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del jugador (opcional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageFileChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          <input type="hidden" {...register('imageUrl')} />
          {imagePreview && (
            <div className="mt-3 flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={clearImage}
                className="px-3 py-1.5 text-xs rounded-md border border-gray-300 hover:bg-gray-50"
              >
                Quitar imagen
              </button>
            </div>
          )}
          {imageError && <p className="text-red-600 text-sm mt-1">{imageError}</p>}
          {errors.imageUrl && <p className="text-red-600 text-sm mt-1">{errors.imageUrl.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
          <input
            type="number"
            min="15"
            max="45"
            {...register('age')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          {errors.age && <p className="text-red-600 text-sm mt-1">{errors.age.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Equipo</label>
          <input
            type="text"
            {...register('team')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          {errors.team && <p className="text-red-600 text-sm mt-1">{errors.team.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidad</label>
          <input
            type="text"
            {...register('nationality')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          {errors.nationality && <p className="text-red-600 text-sm mt-1">{errors.nationality.message}</p>}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-3">Estadisticas</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goles</label>
            <input type="number" min="0" {...register('stats.goals')} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asistencias</label>
            <input type="number" min="0" {...register('stats.assists')} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Partidos</label>
            <input type="number" min="0" {...register('stats.appearances')} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minutos</label>
            <input type="number" min="0" {...register('stats.minutesPlayed')} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-3">Atributos (1-100)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pace</label>
            <input type="number" min="1" max="100" {...register('attributes.pace')} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shooting</label>
            <input type="number" min="1" max="100" {...register('attributes.shooting')} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passing</label>
            <input type="number" min="1" max="100" {...register('attributes.passing')} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dribbling</label>
            <input type="number" min="1" max="100" {...register('attributes.dribbling')} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Defending</label>
            <input type="number" min="1" max="100" {...register('attributes.defending')} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Physical</label>
            <input type="number" min="1" max="100" {...register('attributes.physical')} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
        </div>
      </div>

      {showSubmitButton && (
        <button
          type="submit"
          disabled={loading}
          className="bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-medium"
        >
          {loading ? 'Guardando...' : submitLabel}
        </button>
      )}
    </form>
  );
}
