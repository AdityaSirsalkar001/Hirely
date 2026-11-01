import { ProxyAgent } from "proxy-agent";

/** Routes outbound HTTPS requests through the configured environment proxy. */
export const proxyAgent = new ProxyAgent();
