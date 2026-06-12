export function isHtmlContentEmpty(html: string): boolean {
  const normalized = html.trim();
  if (!normalized) return true;

  const text = normalized
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();

  if (text.length > 0) return false;

  return !/<img\b/i.test(normalized);
}
