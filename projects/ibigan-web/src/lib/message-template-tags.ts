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

    values[tag] = '';
  }

  return values;
}
