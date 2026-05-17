import * as yup from 'yup';

export const RemoteSelectFetchOptionsSchema = yup.object().shape({
  fetch: yup.object().shape({
    url: yup.string().required(),
    method: yup.string().oneOf(['GET', 'POST', 'PUT']).required(),
    headers: yup.string().optional(),
    body: yup.string().optional(),
  }).required(),
  mapping: yup.object().optional().shape({
    sourceJsonPath: yup.string().optional(),
    valueJsonPath: yup.string().optional(),
    labelJsonPath: yup.string().optional(),
  }).nullable(),
});
