import { yup } from '@strapi/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const RemoteSelectFetchOptionsSchema: any = yup.object().shape({
  fetch: yup.object().shape({
    url: yup.string().required(),
    method: yup.string().optional(),
    headers: yup.string().optional(),
    body: yup.string().optional(),
  }).required(),
  mapping: yup.object().optional().shape({
    sourceJsonPath: yup.string().optional(),
    valueJsonPath: yup.string().optional(),
    labelJsonPath: yup.string().optional(),
  }).nullable(),
});
