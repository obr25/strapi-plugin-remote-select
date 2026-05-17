import { RemoteSelectPluginOptions } from '../../../types/RemoteSelectPluginOptions';

export default {
  default: {
    variables: {},
    allowedHosts: [],
    allowedIpRanges: [],
    allowedProtocols: ['https:'],
    allowedVariableNames: [],
    timeoutMs: 10000,
    maxResponseBytes: 1048576,
    allowedContentTypes: ['application/json'],
  } as RemoteSelectPluginOptions,
  validator(config: RemoteSelectPluginOptions) {
    if (!config || typeof config !== 'object') {
      throw new Error('remote-select config must be an object');
    }

    if (
      !config.variables ||
      typeof config.variables !== 'object' ||
      Array.isArray(config.variables)
    ) {
      throw new Error('remote-select variables must be an object');
    }

    const assertStringArray = (value: unknown, name: string) => {
      if (
        value !== undefined &&
        (!Array.isArray(value) || value.some((item) => typeof item !== 'string'))
      ) {
        throw new Error(`remote-select ${name} must be an array of strings`);
      }
    };

    assertStringArray(config.allowedHosts, 'allowedHosts');
    assertStringArray(config.allowedIpRanges, 'allowedIpRanges');
    assertStringArray(config.allowedVariableNames, 'allowedVariableNames');
    assertStringArray(config.allowedProtocols, 'allowedProtocols');

    if (
      config.allowedProtocols?.some((protocol) => protocol !== 'http:' && protocol !== 'https:')
    ) {
      throw new Error('remote-select allowedProtocols only supports "http:" and "https:"');
    }

    if (
      config.timeoutMs !== undefined &&
      (!Number.isInteger(config.timeoutMs) || config.timeoutMs <= 0)
    ) {
      throw new Error('remote-select timeoutMs must be a positive integer');
    }

    if (
      config.maxResponseBytes !== undefined &&
      (!Number.isInteger(config.maxResponseBytes) || config.maxResponseBytes <= 0)
    ) {
      throw new Error('remote-select maxResponseBytes must be a positive integer');
    }
  },
};
