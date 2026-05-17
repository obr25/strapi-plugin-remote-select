export interface RemoteSelectPluginOptions {
  variables: Record<string, string | number>;
  allowedHosts?: string[];
  allowedIpRanges?: string[];
  allowedProtocols?: Array<'http:' | 'https:'>;
  allowedVariableNames?: string[];
  timeoutMs?: number;
  maxResponseBytes?: number;
  allowedContentTypes?: string[];
}
