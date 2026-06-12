import {
  LogIn,
  Pencil,
  PlusCircle,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityLog } from '@/services/activity-logs.service';

export const descriptionVariant: Record<string, 'primary' | 'secondary' | 'destructive' | 'outline'> = {
  created: 'primary',
  updated: 'secondary',
  deleted: 'destructive',
};

export const descriptionLabel: Record<string, string> = {
  created: 'Criado',
  updated: 'Atualizado',
  deleted: 'Removido',
};

export function getSubjectLabel(type: string): string {
  const map: Record<string, string> = {
    'App\\Models\\User': 'Usuário',
    'App\\Models\\Menu': 'Menu',
    'App\\Models\\MessageTemplate': 'Template',
    'App\\Models\\Webhook': 'Webhook',
    'App\\Models\\Campaign': 'Campanha',
    'App\\Models\\Invite': 'Convite',
  };

  return map[type] ?? type.split('\\').pop() ?? type;
}

export function getActivityDescriptionLabel(description: string) {
  return descriptionLabel[description] ?? description;
}

export function getActivityIcon(description: string): LucideIcon {
  if (description === 'created') return PlusCircle;
  if (description === 'deleted') return Trash2;
  if (description === 'updated') return Pencil;
  return LogIn;
}

export function countActivityChanges(properties: Record<string, unknown>): number {
  if (!properties?.old || !properties?.attributes) return 0;

  const old = properties.old as Record<string, unknown>;
  const attrs = properties.attributes as Record<string, unknown>;

  return Object.keys(attrs).filter(
    (key) =>
      !['updated_at', 'id', 'created_at', 'deleted_at'].includes(key) &&
      JSON.stringify(old[key]) !== JSON.stringify(attrs[key]),
  ).length;
}

export function getActivityChanges(properties: Record<string, unknown>) {
  if (!properties?.attributes) return [];

  const attrs = properties.attributes as Record<string, unknown>;

  if (properties.old) {
    const old = properties.old as Record<string, unknown>;

    return Object.entries(attrs)
      .filter(
        ([key, value]) =>
          !['updated_at', 'created_at', 'deleted_at', 'id'].includes(key) &&
          JSON.stringify(old[key]) !== JSON.stringify(value),
      )
      .map(([key, value]) => ({
        key,
        oldValue: old[key],
        newValue: value,
      }));
  }

  return Object.entries(attrs)
    .filter(([key]) => !['id', 'created_at', 'updated_at', 'deleted_at'].includes(key))
    .map(([key, value]) => ({
      key,
      oldValue: undefined,
      newValue: value,
    }));
}

export function buildActivitySummary(log: ActivityLog, subjectName?: string) {
  const action = getActivityDescriptionLabel(log.description).toLowerCase();
  const actor = log.causer_name ?? 'Sistema';
  const resource = subjectName ?? `${getSubjectLabel(log.subject_type)} #${log.subject_id}`;

  return `${actor} ${action} ${resource}`;
}
