import type { MessageTemplate } from '@/services/message-templates.service';

export function normalizeTemplateTagName(tag: string): string {
  return tag.replace(/^\{\{\s*/, '').replace(/\s*\}\}$/, '').trim();
}

export function extractTemplateTags(
  template: Pick<MessageTemplate, 'merge_tags' | 'subject' | 'body'>,
): string[] {
  const tags = new Set<string>();

  for (const tag of template.merge_tags ?? []) {
    const normalized = normalizeTemplateTagName(tag);
    if (normalized) tags.add(normalized);
  }

  const content = `${template.subject}\n${template.body}`;
  for (const match of content.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)) {
    const normalized = match[1]?.trim();
    if (normalized) tags.add(normalized);
  }

  return [...tags];
}

const SAMPLE_TAG_VALUES: Record<string, string> = {
  empresa: 'Ibigan',
  company: 'Ibigan',
  company_name: 'Ibigan',
  link: 'https://app.ibigan.com/exemplo',
  url: 'https://app.ibigan.com/exemplo',
  codigo: '123456',
  code: '123456',
  token: 'exemplo-token',
};

export function buildDefaultTemplateTagValues(
  tags: string[],
  user: { name: string; email: string },
): Record<string, string> {
  const values: Record<string, string> = {};

  for (const tag of tags) {
    if (tag === 'nome' || tag === 'name') {
      values[tag] = user.name;
      continue;
    }

    if (tag === 'email') {
      values[tag] = user.email;
      continue;
    }

    values[tag] = SAMPLE_TAG_VALUES[tag] ?? `[${tag}]`;
  }

  return values;
}

export function applyMessageTemplateMergeData(
  content: string,
  mergeData: Record<string, string>,
): string {
  return content.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, tag: string) => {
    const key = tag.trim();
    return mergeData[key] ?? match;
  });
}
