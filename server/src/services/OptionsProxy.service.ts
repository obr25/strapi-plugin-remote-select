import { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import type { FlexibleSelectMappingConfig } from '../../../types/FlexibleSelectConfig';
import type { RemoteSelectFetchOptions } from '../../../types/RemoteSelectFetchOptions';
import { RemoteSelectPluginOptions } from '../../../types/RemoteSelectPluginOptions';
import { SearchableRemoteSelectValue } from '../../../types/SearchableRemoteSelectValue';

const { ApplicationError, ForbiddenError, ValidationError } = errors;

const DEFAULT_OPTIONS: Required<
  Omit<RemoteSelectPluginOptions, 'variables' | 'allowedVariableNames'>
> & {
  allowedVariableNames: string[];
} = {
  allowedHosts: [],
  allowedIpRanges: [],
  allowedProtocols: ['https:'],
  allowedVariableNames: [],
  timeoutMs: 10000,
  maxResponseBytes: 1048576,
  allowedContentTypes: ['application/json'],
};

type PathSegment = string | number | '*';

export const OptionsProxyService = ({ strapi }: { strapi: Core.Strapi }) => ({
  async getOptionsByConfig(config: RemoteSelectFetchOptions) {
    const url = this.replaceVariables(config.fetch.url);
    await this.assertAllowedUrl(url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.getPluginConfig().timeoutMs);

    try {
      const method = config.fetch.method || 'GET';
      const fetchOptions: RequestInit = {
        method,
        headers: this.parseStringHeaders(config.fetch.headers),
        signal: controller.signal,
      };

      if (!['GET', 'HEAD'].includes(method.toUpperCase()) && config.fetch.body) {
        fetchOptions.body = this.replaceVariables(config.fetch.body);
      }

      const res = await fetch(url, fetchOptions);
      const response = await this.parseJsonResponse(res);

      return this.parseOptions(response, config.mapping ?? null);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new ApplicationError('Remote options request timed out');
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  },

  getPluginConfig() {
    const config = strapi.config.get<RemoteSelectPluginOptions>('plugin::remote-select') ?? {
      variables: {},
    };

    return {
      ...DEFAULT_OPTIONS,
      ...config,
      variables: config.variables ?? {},
      allowedHosts: config.allowedHosts ?? DEFAULT_OPTIONS.allowedHosts,
      allowedIpRanges: config.allowedIpRanges ?? DEFAULT_OPTIONS.allowedIpRanges,
      allowedProtocols: config.allowedProtocols ?? DEFAULT_OPTIONS.allowedProtocols,
      allowedVariableNames: config.allowedVariableNames ?? DEFAULT_OPTIONS.allowedVariableNames,
      allowedContentTypes: config.allowedContentTypes ?? DEFAULT_OPTIONS.allowedContentTypes,
      timeoutMs: config.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs,
      maxResponseBytes: config.maxResponseBytes ?? DEFAULT_OPTIONS.maxResponseBytes,
    };
  },

  async assertAllowedUrl(rawUrl: string): Promise<void> {
    let url: URL;

    try {
      url = new URL(rawUrl);
    } catch {
      throw new ValidationError('Fetch options url must be an absolute URL');
    }

    const config = this.getPluginConfig();
    const hostname = url.hostname.toLowerCase();

    if (!config.allowedProtocols.includes(url.protocol as 'http:' | 'https:')) {
      throw new ForbiddenError(`Protocol "${url.protocol}" is not allowed`);
    }

    if (!this.isHostAllowed(hostname, config.allowedHosts)) {
      throw new ForbiddenError(`Host "${hostname}" is not allowed`);
    }

    const addresses = await this.resolveHost(hostname);

    if (
      addresses.some(
        (address) =>
          this.isPrivateAddress(address) && !this.isAddressAllowed(address, config.allowedIpRanges)
      )
    ) {
      throw new ForbiddenError(`Host "${hostname}" resolves to a disallowed private address`);
    }
  },

  isHostAllowed(hostname: string, allowedHosts: string[]): boolean {
    return allowedHosts.some((allowedHost) => {
      const normalized = allowedHost.toLowerCase();

      if (normalized.startsWith('*.')) {
        const suffix = normalized.slice(1);
        return hostname.endsWith(suffix) && hostname !== normalized.slice(2);
      }

      return hostname === normalized;
    });
  },

  async resolveHost(hostname: string): Promise<string[]> {
    if (isIP(hostname)) {
      return [hostname];
    }

    const records = await lookup(hostname, { all: true, verbatim: true });

    return records.map((record) => record.address);
  },

  isPrivateAddress(address: string): boolean {
    if (isIP(address) === 4) {
      const parts = address.split('.').map(Number);
      const [first, second] = parts;

      return (
        first === 0 ||
        first === 10 ||
        first === 127 ||
        (first === 169 && second === 254) ||
        (first === 172 && second >= 16 && second <= 31) ||
        (first === 192 && second === 168) ||
        first >= 224
      );
    }

    const normalized = address.toLowerCase();

    return (
      normalized === '::1' ||
      normalized === '::' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:')
    );
  },

  isAddressAllowed(address: string, ranges: string[]): boolean {
    return ranges.some((range) => {
      if (!range.includes('/')) {
        return address === range;
      }

      return this.isIpv4InCidr(address, range);
    });
  },

  isIpv4InCidr(address: string, cidr: string): boolean {
    if (isIP(address) !== 4) {
      return false;
    }

    const [rangeAddress, bitsRaw] = cidr.split('/');
    const bits = Number(bitsRaw);

    if (isIP(rangeAddress) !== 4 || !Number.isInteger(bits) || bits < 0 || bits > 32) {
      return false;
    }

    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;

    return (this.ipv4ToNumber(address) & mask) === (this.ipv4ToNumber(rangeAddress) & mask);
  },

  ipv4ToNumber(address: string): number {
    return address
      .split('.')
      .map(Number)
      .reduce((result, value) => ((result << 8) + value) >>> 0, 0);
  },

  async parseJsonResponse(res: Response): Promise<any> {
    if (!res.ok) {
      throw new ApplicationError(`Remote options request failed with status ${res.status}`);
    }

    const contentType = res.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ?? '';

    if (!this.isAllowedContentType(contentType)) {
      throw new ApplicationError(
        `Remote options response content type "${contentType}" is not allowed`
      );
    }

    const rawBody = await this.readResponseBody(res);

    try {
      return JSON.parse(rawBody);
    } catch {
      throw new ApplicationError('Remote options response is not valid JSON');
    }
  },

  isAllowedContentType(contentType: string): boolean {
    const allowedContentTypes = this.getPluginConfig().allowedContentTypes.map((type) =>
      type.toLowerCase()
    );

    return allowedContentTypes.some(
      (allowed) =>
        contentType === allowed || (allowed === 'application/json' && contentType.endsWith('+json'))
    );
  },

  async readResponseBody(res: Response): Promise<string> {
    const maxResponseBytes = this.getPluginConfig().maxResponseBytes;
    const reader = res.body?.getReader();

    if (!reader) {
      return '';
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.byteLength;

      if (totalBytes > maxResponseBytes) {
        await reader.cancel();
        throw new ApplicationError('Remote options response exceeds the configured size limit');
      }

      chunks.push(value);
    }

    const body = new Uint8Array(totalBytes);
    let offset = 0;

    chunks.forEach((chunk) => {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    });

    return new TextDecoder().decode(body);
  },

  parseStringHeaders(headers?: string): Record<string, string> {
    if (!headers) return {};

    const result: Record<string, string> = {};
    const headersArr = this.trim(this.replaceVariables(headers)).split('\n');

    for (let i = 0; i < headersArr.length; i++) {
      const row = headersArr[i];
      const index = row.indexOf(':');

      if (index <= 0) {
        throw new ValidationError('Fetch headers must use "Name: value" lines');
      }

      const key = this.trim(row.slice(0, index)).toLowerCase();
      const value = this.trim(row.slice(index + 1));

      if (typeof result[key] === 'undefined') {
        result[key] = value;
      } else {
        result[key] = `${result[key]}, ${value}`;
      }
    }

    return result;
  },

  trim(val: string): string {
    return val.replace(/^\s+|\s+$/g, '');
  },

  parseOptions(
    response: any,
    mappingConfig: FlexibleSelectMappingConfig | null | undefined
  ): SearchableRemoteSelectValue[] {
    const selectedOptions = this.selectValues(response, mappingConfig?.sourceJsonPath || '$');
    const options =
      selectedOptions.length === 1 && Array.isArray(selectedOptions[0])
        ? selectedOptions[0]
        : selectedOptions;

    const preparedOptionsArray = options
      .filter((item: any) => item !== undefined && item !== null)
      .map((option: any) => {
        if (typeof option !== 'object') {
          return {
            value: String(option),
            label: String(option),
          };
        }

        const value = this.getOptionItem(option, mappingConfig?.valueJsonPath);
        const label = this.getOptionItem(
          option,
          mappingConfig?.labelJsonPath || mappingConfig?.valueJsonPath
        );

        return {
          value,
          label,
        };
      });

    const uniqueValuesOptionsMap: Map<string, SearchableRemoteSelectValue> =
      preparedOptionsArray.reduce(
        (store: Map<string, SearchableRemoteSelectValue>, option: SearchableRemoteSelectValue) => {
          if (!store.has(option.value)) {
            store.set(option.value, option);
          }
          return store;
        },
        new Map<string, SearchableRemoteSelectValue>()
      );

    return Array.from(uniqueValuesOptionsMap.values());
  },

  getOptionItem(rawOption: any, path?: string): string {
    const value = this.selectValues(rawOption, path || '$')[0];

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value.toString();
    }

    return JSON.stringify(value);
  },

  selectValues(source: any, path: string): any[] {
    const segments = this.parseSafePath(path);

    return segments.reduce(
      (values: any[], segment) =>
        values.flatMap((value) => {
          if (segment === '*') {
            return Array.isArray(value) ? value : [];
          }

          if (value === undefined || value === null) {
            return [];
          }

          return value[segment] === undefined ? [] : [value[segment]];
        }),
      [source]
    );
  },

  parseSafePath(path: string): PathSegment[] {
    if (!path || path === '$') {
      return [];
    }

    if (!path.startsWith('$')) {
      return [];
    }

    const segments: PathSegment[] = [];
    let rest = path.slice(1);

    while (rest.length > 0) {
      if (rest.startsWith('.*')) {
        segments.push('*');
        rest = rest.slice(2);
        continue;
      }

      if (rest.startsWith('.')) {
        const match = rest.match(/^\.([A-Za-z_$][A-Za-z0-9_$-]*)/);

        if (!match) {
          return segments;
        }

        segments.push(match[1]);
        rest = rest.slice(match[0].length);
        continue;
      }

      const indexMatch = rest.match(/^\[(\d+|\*)\]/);

      if (indexMatch) {
        segments.push(indexMatch[1] === '*' ? '*' : Number(indexMatch[1]));
        rest = rest.slice(indexMatch[0].length);
        continue;
      }

      return segments;
    }

    return segments;
  },

  replaceVariables(str: string): string {
    const { variables, allowedVariableNames } = this.getPluginConfig();

    if (!str || typeof str !== 'string') {
      return str;
    }

    return str.replace(/\{([^}]+)\}/g, (match, key) => {
      if (!allowedVariableNames.includes(key)) {
        throw new ForbiddenError(`Variable "${key}" is not allowed in remote-select requests`);
      }

      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  },
});

export default OptionsProxyService;
