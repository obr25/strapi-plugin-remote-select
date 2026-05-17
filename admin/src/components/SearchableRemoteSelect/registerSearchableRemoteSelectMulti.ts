import type { StrapiApp } from '@strapi/strapi/admin';
import { registerRemoteSelectField } from '../../utils/registerRemoteSelectField';
import SearchableRemoteSelectInputIcon from '../SearchableRemoteSelectInputIcon';

export function registerSearchableRemoteSelectMulti(app: StrapiApp): void {
  registerRemoteSelectField({
    app,
    name: 'searchable-remote-select-multi',
    type: 'json',
    selectType: 'searchable',
    labelId: 'searchable-remote-select-multi.label',
    labelDefaultMessage: 'Searchable remote select (Multi)',
    descriptionDefaultMessage: 'Select multiple options from the remote source with search support',
    icon: SearchableRemoteSelectInputIcon,
    input: async () =>
      import(/* webpackChunkName: "SearchableRemoteSelect" */ './SearchableRemoteSelect'),
  });
}
