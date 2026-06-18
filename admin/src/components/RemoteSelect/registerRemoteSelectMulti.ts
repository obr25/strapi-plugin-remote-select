import type { StrapiApp } from '@strapi/strapi/admin';
import { registerRemoteSelectField } from '../../utils/registerRemoteSelectField';
import RemoteSelectInputIcon from '../RemoteSelectInputIcon';

export function registerRemoteSelectMulti(app: StrapiApp): void {
  registerRemoteSelectField({
    app,
    name: 'remote-select-multi',
    type: 'json',
    selectType: 'base',
    isMulti: true,
    labelId: 'remote-select-multi.label',
    labelDefaultMessage: 'Remote select (Multi)',
    descriptionDefaultMessage: 'Select multiple options from the remote source',
    icon: RemoteSelectInputIcon,
    input: async () => import(/* webpackChunkName: "RemoteSelect" */ './RemoteSelect'),
  });
}
