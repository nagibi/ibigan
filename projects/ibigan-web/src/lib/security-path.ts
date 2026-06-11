export const SECURITY_PATH = '/security';

export function isSecurityPath(path?: string): boolean {
  return path === SECURITY_PATH;
}
