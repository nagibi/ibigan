function apiPublicOrigin(): string {
  const apiUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost/api').replace(/\/$/, '');
  return apiUrl.replace(/\/api$/, '');
}

function emailAssetUrl(path: string): string {
  const origin = apiPublicOrigin();
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

export function resolveEmailPreviewAssets(html: string): string {
  if (!html.trim()) {
    return html;
  }

  const logoUrl = emailAssetUrl('/images/email/metronic-logo.svg');
  const backgroundUrl = emailAssetUrl('/images/email/bg-email.png');

  return html
    .replace(/src="[^"]*(?:default-logo|metronic-logo)\.svg[^"]*"/gi, `src="${logoUrl}"`)
    .replace(/src='[^']*(?:default-logo|metronic-logo)\.svg[^']*'/gi, `src='${logoUrl}'`)
    .replace(
      /background-image:\s*url\((['"]?)[^'")]*bg-email\.png\1\)/gi,
      `background-image:url('${backgroundUrl}')`,
    );
}
