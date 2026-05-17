import type { StrapiApp } from '@strapi/strapi/admin';
import { registerRemoteSelectField } from '../../utils/registerRemoteSelectField';
import SearchableRemoteSelectInputIcon from '../SearchableRemoteSelectInputIcon';

export function registerSearchableRemoteSelect(app: StrapiApp): void {
  registerRemoteSelectField({
    app,
    name: 'searchable-remote-select',
    type: 'text',
    selectType: 'searchable',
    labelId: 'searchable-remote-select.label',
    labelDefaultMessage: 'Searchable remote select',
    descriptionDefaultMessage: 'Select options from the remote source with search support',
    icon: SearchableRemoteSelectInputIcon,
    input: async () =>
      import(/* webpackChunkName: "SearchableRemoteSelect" */ './SearchableRemoteSelect'),
  });
}
