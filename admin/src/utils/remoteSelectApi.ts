import { useFetchClient } from '@strapi/strapi/admin';
import { FlexibleSelectConfig } from '../../../types/FlexibleSelectConfig';
import { SearchableRemoteSelectValue } from '../../../types/SearchableRemoteSelectValue';

function replaceTemplateStrings(value: unknown, searchValue: string): unknown {
  if (typeof value === 'string') {
    return value.replace(/\{q\}/g, searchValue);
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceTemplateStrings(item, searchValue));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce<Record<string, unknown>>((result, [key, item]) => {
      result[key] = replaceTemplateStrings(item, searchValue);
      return result;
    }, {});
  }

  return value;
}

function replaceSearchPlaceholderInBody(
  body: string | undefined,
  searchValue: string
): string | undefined {
  if (!body) {
    return body;
  }

  try {
    return JSON.stringify(replaceTemplateStrings(JSON.parse(body), searchValue));
  } catch {
    return body.replace(/\{q\}/g, JSON.stringify(searchValue).slice(1, -1));
  }
}

export function createSearchableFetchConfig(
  config: FlexibleSelectConfig['fetch'],
  searchValue: string
): FlexibleSelectConfig['fetch'] {
  return {
    ...config,
    url: config.url.replace(/\{q\}/g, encodeURIComponent(searchValue)),
    body: replaceSearchPlaceholderInBody(config.body, searchValue),
  };
}

export function useRemoteSelectApi() {
  const { post } = useFetchClient();

  return {
    async loadOptions(
      selectConfiguration: FlexibleSelectConfig,
      fetchConfig: FlexibleSelectConfig['fetch'] = selectConfiguration.fetch
    ): Promise<SearchableRemoteSelectValue[]> {
      const response = await post('/remote-select/options-proxy', {
        fetch: fetchConfig,
        mapping: selectConfiguration.mapping,
      });

      return response.data as SearchableRemoteSelectValue[];
    },
  };
}
