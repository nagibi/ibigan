export function formatFormPageTitle({
  isEditing,
  id,
  label,
  loading = false,
}: {
  isEditing: boolean;
  id?: string | number | null;
  label?: string | null;
  loading?: boolean;
}): string {
  if (!isEditing) {
    return 'Novo';
  }

  const idText = id != null && String(id).length > 0 ? String(id) : null;

  if (loading) {
    return idText ?? '...';
  }

  const labelText = label?.trim();
  if (idText && labelText) {
    return `${idText}-${labelText}`;
  }

  if (labelText) {
    return labelText;
  }

  return idText ?? 'Editar';
}
