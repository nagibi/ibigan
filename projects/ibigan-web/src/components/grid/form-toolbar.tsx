import { type VariantProps } from 'class-variance-authority';
import { type ElementType, type ReactNode, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ChevronDown,
  ClipboardList,
  Copy,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';
import { ActivityLogsSheet } from '@/components/activity-logs/activity-logs-sheet';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
  GridToolbarRoot,
  GridToolbarGroup,
} from './grid-toolbar';
import { FormAuditSheet } from './form-audit-sheet';

export interface FormToolbarProps {
  isEditing: boolean;
  isActive?: boolean;
  isDirty?: boolean;
  isSubmitting?: boolean;
  isTogglingActive?: boolean;
  isDeleting?: boolean;

  onSaveAndList?: () => void;
  onSaveAndNew?: () => void;
  onSaveAndEdit?: () => void;
  onBack?: () => void;
  onClear?: () => void;

  onToggleActive?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;

  onHistory?: () => void;
  activityLog?: {
    subjectType: string;
    subjectId: number;
  };
  createdBy?: string | null;
  createdAt?: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;

  entityLabel?: string;
  recordLabel?: string;
  extra?: ReactNode;
  primarySaveVariant?: VariantProps<typeof buttonVariants>['variant'];
}

function FormButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  loading,
  className,
}: {
  label: string;
  icon: ElementType;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled || loading}
      onClick={onClick}
      className={cn('h-8 gap-1.5 px-2 text-xs font-medium', className)}
    >
      {loading
        ? <LoaderCircle className="size-3.5 shrink-0 animate-spin" />
        : <Icon className="size-3.5 shrink-0" />
      }
      {label}
    </Button>
  );
}

export function FormToolbar({
  isEditing,
  isActive,
  isDirty = false,
  isSubmitting = false,
  isTogglingActive = false,
  isDeleting = false,
  onSaveAndList,
  onSaveAndNew,
  onSaveAndEdit,
  onBack,
  onClear,
  onToggleActive,
  onDelete,
  onDuplicate,
  onHistory,
  activityLog,
  createdBy,
  createdAt,
  updatedBy,
  updatedAt,
  entityLabel = 'registro',
  recordLabel,
  extra,
  primarySaveVariant = 'primary',
}: FormToolbarProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [activityLogOpen, setActivityLogOpen] = useState(false);

  const hasSave = Boolean(onSaveAndList || onSaveAndNew);
  const useSaveAndNewAsPrimary = !isEditing && Boolean(onSaveAndNew);
  const primarySaveAction = useSaveAndNewAsPrimary ? onSaveAndNew : onSaveAndList;
  const primarySaveLabel = 'Salvar';
  const PrimarySaveIcon = Save;
  const hasSaveDropdown = isEditing
    ? Boolean(onSaveAndNew)
    : Boolean(onSaveAndList || onSaveAndEdit);
  const hasLifecycle = isEditing && (onToggleActive || onDelete || onDuplicate);
  const hasAudit = isEditing && (createdBy || updatedBy || createdAt || updatedAt);
  const hasActivityLog = isEditing && Boolean(activityLog);

  return (
    <>
      <GridToolbarRoot>
        {hasSave && (
          <>
            <GridToolbarGroup>
              <Button
                type="button"
                variant={primarySaveVariant}
                size="sm"
                disabled={isSubmitting || !primarySaveAction}
                onClick={primarySaveAction}
                className={cn('h-8 gap-1.5', hasSaveDropdown && 'rounded-r-none')}
              >
                {isSubmitting
                  ? <LoaderCircle className="size-3.5 animate-spin" />
                  : <PrimarySaveIcon className="size-3.5" />
                }
                {primarySaveLabel}
              </Button>

              {hasSaveDropdown && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant={primarySaveVariant}
                      size="sm"
                      disabled={isSubmitting}
                      className={cn(
                        'h-8 px-1.5 rounded-l-none border-l',
                        primarySaveVariant === 'destructive'
                          ? 'border-destructive-foreground/20'
                          : 'border-primary-foreground/20',
                      )}
                    >
                      <ChevronDown className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {isEditing && onSaveAndNew && (
                      <DropdownMenuItem onClick={onSaveAndNew}>
                        <Plus className="size-4 mr-2" /> Salvar e novo
                      </DropdownMenuItem>
                    )}
                    {!isEditing && onSaveAndList && (
                      <DropdownMenuItem onClick={onSaveAndList}>
                        <Save className="size-4 mr-2" /> Salvar e listar
                      </DropdownMenuItem>
                    )}
                    {!isEditing && onSaveAndEdit && (
                      <DropdownMenuItem onClick={onSaveAndEdit}>
                        <Pencil className="size-4 mr-2" /> Salvar e editar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </GridToolbarGroup>

            {onBack && (
              <FormButton label="Voltar" icon={ArrowLeft} onClick={onBack} />
            )}

            {onClear && (
              <FormButton
                label="Limpar"
                icon={RotateCcw}
                onClick={onClear}
                disabled={!isDirty}
              />
            )}
          </>
        )}

        {hasLifecycle && (
          <>
            <GridToolbarGroup>
              {onToggleActive && (
                <FormButton
                  label={isActive ? 'Inativar' : 'Ativar'}
                  icon={isActive ? UserX : UserCheck}
                  onClick={onToggleActive}
                  loading={isTogglingActive}
                />
              )}
              {onDuplicate && (
                <FormButton label="Duplicar" icon={Copy} onClick={onDuplicate} />
              )}
              {onDelete && (
                <FormButton
                  label="Excluir"
                  icon={Trash2}
                  onClick={() => setDeleteOpen(true)}
                  loading={isDeleting}
                />
              )}
            </GridToolbarGroup>
          </>
        )}

        {(hasActivityLog || onHistory || hasAudit) && (
          <GridToolbarGroup>
            {hasActivityLog && (
              <FormButton
                label="Activity Log"
                icon={Activity}
                onClick={() => setActivityLogOpen(true)}
              />
            )}
            {!hasActivityLog && onHistory && (
              <FormButton label="Activity Log" icon={Activity} onClick={onHistory} />
            )}
            {hasAudit && (
              <FormButton
                label="Auditoria"
                icon={ClipboardList}
                onClick={() => setAuditOpen(true)}
              />
            )}
          </GridToolbarGroup>
        )}

        {extra}
      </GridToolbarRoot>

      <FormAuditSheet
        open={auditOpen}
        onOpenChange={setAuditOpen}
        entityLabel={recordLabel ?? entityLabel}
        createdBy={createdBy}
        createdAt={createdAt}
        updatedBy={updatedBy}
        updatedAt={updatedAt}
      />

      {activityLog && (
        <ActivityLogsSheet
          open={activityLogOpen}
          onOpenChange={setActivityLogOpen}
          subjectType={activityLog.subjectType}
          subjectId={activityLog.subjectId}
          subjectLabel={recordLabel ?? entityLabel}
        />
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {entityLabel}</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => { setDeleteOpen(false); onDelete?.(); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
