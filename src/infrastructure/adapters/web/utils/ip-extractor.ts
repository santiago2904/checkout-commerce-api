/**
 * Extract real IP address from request
 * Handles proxy/load balancer scenarios using X-Forwarded-For header
 *
 * Priority:
 * 1. X-Forwarded-For header (first IP in chain)
 * 2. X-Real-IP header
 * 3. req.ip
 * 4. req.connection.remoteAddress
 * 5. 'unknown'
 *
 * Security Note:
 * Always capture IP on backend. If using proxy/load balancer,
 * ensure X-Forwarded-For header is properly configured.
 *
 * @param req Express request object (or any request with similar interface)
 * @returns Client's real IP address
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractRealIp(req: any): string {
  // X-Forwarded-For: May contain multiple IPs (client, proxy1, proxy2, ...)
  // The first IP is the original client IP
  const headers = req.headers as
    | Record<string, string | string[] | undefined>
    | undefined;
  const forwardedFor = headers?.['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor.split(',')[0];
    return ips.trim();
  }

  // X-Real-IP: Single IP from reverse proxy
  const realIp = headers?.['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fallback to req.ip (Express default)
  if (req.ip) {
    return req.ip;
  }

  // Last resort: connection remote address
  const remoteAddress =
    req.connection?.remoteAddress || req.socket?.remoteAddress;
  if (remoteAddress) {
    return remoteAddress;
  }

  return 'unknown';
}
