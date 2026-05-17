import { StrapiApp } from '@strapi/strapi/admin';

type ExtractSingleType<T> = T extends (infer U)[] ? U : T;

export type CustomField = ExtractSingleType<Parameters<StrapiApp['customFields']['register']>[0]>;

export type CustomFieldOptions = (CustomField & { options?: unknown })['options'];

export type CustomFieldOption = ExtractSingleType<
  NonNullable<CustomFieldOptions & { base?: unknown[] }>['base']
>;
