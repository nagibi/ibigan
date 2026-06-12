export type FormSaveMode = 'list' | 'new' | 'edit';

export function resolveFormSavePath({
  saveMode,
  listPath,
  newPath,
  getEditPath,
  isEditing,
  createdId,
}: {
  saveMode: FormSaveMode;
  listPath: string;
  newPath: string;
  getEditPath: (id: number) => string;
  isEditing: boolean;
  createdId?: number;
}): string | null {
  if (saveMode === 'new') return newPath;
  if (saveMode === 'edit') {
    if (!isEditing && createdId != null) {
      return getEditPath(createdId);
    }
    if (isEditing) {
      return null;
    }
  }
  return listPath;
}
