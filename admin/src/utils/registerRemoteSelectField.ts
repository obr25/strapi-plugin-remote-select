import type { StrapiApp } from '@strapi/strapi/admin';
import type { ComponentType } from 'react';
import pluginId from '../pluginId';
import { getRemoteSelectRegisterOptions } from './getRemoteSelectRegisterOptions';
import getTrad from './getTrad';

type SelectType = 'base' | 'searchable';

interface RegisterRemoteSelectFieldOptions {
  app: StrapiApp;
  name: string;
  type: 'text' | 'json';
  selectType: SelectType;
  labelId: string;
  labelDefaultMessage: string;
  descriptionDefaultMessage: string;
  icon: ComponentType;
  input: () => Promise<any>;
}

export function registerRemoteSelectField({
  app,
  name,
  type,
  selectType,
  labelId,
  labelDefaultMessage,
  descriptionDefaultMessage,
  icon,
  input,
}: RegisterRemoteSelectFieldOptions): void {
  app.customFields.register({
    name,
    pluginId,
    type,
    intlLabel: {
      id: getTrad(labelId),
      defaultMessage: labelDefaultMessage,
    },
    intlDescription: {
      id: getTrad('remote-select.description'),
      defaultMessage: descriptionDefaultMessage,
    },
    icon,
    components: {
      Input: input,
    },
    options: getRemoteSelectRegisterOptions(selectType),
  });
}
