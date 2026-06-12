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
}): string {
  if (saveMode === 'new') return newPath;
  if (saveMode === 'edit' && !isEditing && createdId != null) {
    return getEditPath(createdId);
  }
  return listPath;
}
