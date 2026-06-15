export function isComplexEmailHtml(html: string): boolean {
  if (!html.trim()) return false;

  const normalized = html.toLowerCase();

  return normalized.includes('<table') && (
    normalized.includes('cellpadding')
    || normalized.includes('cellspacing')
    || normalized.includes('bgcolor=')
    || normalized.includes('role="presentation"')
  );
}
