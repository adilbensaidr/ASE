import * as yup from 'yup';

export const playerSchema = yup.object({
  name: yup.string().required('Nombre requerido'),
  imageUrl: yup
    .string()
    .trim()
    .transform((value) => (value === '' ? undefined : value))
    .test(
      'valid-image-source',
      'Imagen invalida',
      (value) => !value || /^https?:\/\//i.test(value) || /^data:image\/[a-zA-Z+]+;base64,/.test(value)
    )
    .notRequired(),
  position: yup
    .string()
    .oneOf(['Goalkeeper', 'Defender', 'Midfielder', 'Forward'])
    .required('Posicion requerida'),
  age: yup
    .number()
    .typeError('Edad invalida')
    .min(15, 'Minimo 15')
    .max(45, 'Maximo 45')
    .required('Edad requerida'),
  team: yup.string().required('Equipo requerido'),
  nationality: yup.string().required('Nacionalidad requerida'),
  stats: yup.object({
    goals: yup.number().typeError('Debe ser numero').min(0).default(0),
    assists: yup.number().typeError('Debe ser numero').min(0).default(0),
    appearances: yup.number().typeError('Debe ser numero').min(0).default(0),
    minutesPlayed: yup.number().typeError('Debe ser numero').min(0).default(0)
  }),
  attributes: yup.object({
    pace: yup.number().typeError('Debe ser numero').min(1).max(100).nullable(),
    shooting: yup.number().typeError('Debe ser numero').min(1).max(100).nullable(),
    passing: yup.number().typeError('Debe ser numero').min(1).max(100).nullable(),
    dribbling: yup.number().typeError('Debe ser numero').min(1).max(100).nullable(),
    defending: yup.number().typeError('Debe ser numero').min(1).max(100).nullable(),
    physical: yup.number().typeError('Debe ser numero').min(1).max(100).nullable()
  })
});
