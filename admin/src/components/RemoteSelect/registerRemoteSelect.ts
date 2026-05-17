import type { StrapiApp } from '@strapi/strapi/admin';
import { registerRemoteSelectField } from '../../utils/registerRemoteSelectField';
import RemoteSelectInputIcon from '../RemoteSelectInputIcon';

export function registerRemoteSelect(app: StrapiApp): void {
  registerRemoteSelectField({
    app,
    name: 'remote-select',
    type: 'text',
    selectType: 'base',
    labelId: 'remote-select.label',
    labelDefaultMessage: 'Remote select',
    descriptionDefaultMessage: 'Select with remote options fetching',
    icon: RemoteSelectInputIcon,
    input: async () => import(/* webpackChunkName: "RemoteSelect" */ './RemoteSelect'),
  });
}
