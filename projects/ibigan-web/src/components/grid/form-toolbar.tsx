import { type VariantProps } from 'class-variance-authority';
import { type ElementType, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useIsMobile } from '@/hooks/use-mobile';
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
import { ToolbarTooltip } from './toolbar-tooltip';

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
  onNew?: () => void;
  backImmediatelyAfterPrimary?: boolean;

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
  primarySaveLabel?: string;
  primarySaveTooltip?: string;
  primarySaveIcon?: ElementType;
  primarySaveDisabled?: boolean;
  primarySaveVariant?: VariantProps<typeof buttonVariants>['variant'];
}

function FormButton({
  label,
  tooltip,
  icon: Icon,
  onClick,
  disabled,
  loading,
  className,
  showLabelOnMobile = false,
}: {
  label: string;
  tooltip?: string;
  icon: ElementType;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  showLabelOnMobile?: boolean;
}) {
  const isMobile = useIsMobile();
  const showLabel = !isMobile || showLabelOnMobile;

  return (
    <ToolbarTooltip content={tooltip ?? label}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        mode={showLabel ? 'default' : 'icon'}
        disabled={disabled || loading}
        onClick={onClick}
        aria-label={label}
        className={cn(
          'h-8 shrink-0 text-xs font-medium',
          showLabel ? 'gap-1.5 px-2' : 'size-8',
          className,
        )}
      >
        {loading
          ? <LoaderCircle className="size-3.5 shrink-0 animate-spin" />
          : <Icon className="size-3.5 shrink-0" />
        }
        {showLabel && label}
      </Button>
    </ToolbarTooltip>
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
  onNew,
  backImmediatelyAfterPrimary = false,
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
  primarySaveLabel: primarySaveLabelProp,
  primarySaveTooltip: primarySaveTooltipProp,
  primarySaveIcon: PrimarySaveIconProp,
  primarySaveDisabled = false,
  primarySaveVariant = 'primary',
}: FormToolbarProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [activityLogOpen, setActivityLogOpen] = useState(false);

  const hasSave = Boolean(onSaveAndList || onSaveAndNew || onSaveAndEdit);
  const primarySaveAction = onSaveAndList ?? onSaveAndNew ?? onSaveAndEdit;
  const primarySaveLabel = primarySaveLabelProp ?? t('form.save');
  const PrimarySaveIcon = PrimarySaveIconProp ?? Save;
  const saveDisabled = isSubmitting || !primarySaveAction || primarySaveDisabled || (isEditing && !isDirty);
  const hasSaveDropdown = Boolean(
    (onSaveAndNew && primarySaveAction !== onSaveAndNew)
    || (onSaveAndEdit && primarySaveAction !== onSaveAndEdit)
    || (onSaveAndList && primarySaveAction !== onSaveAndList),
  );
  const hasLifecycle = isEditing && (onToggleActive || onDelete || onDuplicate);
  const hasAudit = isEditing && (createdBy || updatedBy || createdAt || updatedAt);
  const hasActivityLog = isEditing && Boolean(activityLog);
  const primarySaveTooltip = primarySaveTooltipProp ?? t('form.tooltip.save_and_list');

  return (
    <>
      <GridToolbarRoot>
        {hasSave && (
          <>
            <GridToolbarGroup>
              <ToolbarTooltip content={primarySaveTooltip}>
                <Button
                  type="button"
                  variant={primarySaveVariant}
                  size="sm"
                  disabled={saveDisabled}
                  onClick={primarySaveAction}
                  className={cn('h-8 shrink-0 gap-1.5', hasSaveDropdown && 'rounded-r-none')}
                >
                  {isSubmitting
                    ? <LoaderCircle className="size-3.5 animate-spin" />
                    : <PrimarySaveIcon className="size-3.5" />
                  }
                  {primarySaveLabel}
                </Button>
              </ToolbarTooltip>

              {hasSaveDropdown && (
                <DropdownMenu>
                  <ToolbarTooltip content={t('form.tooltip.save_options')}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant={primarySaveVariant}
                        size="sm"
                        mode="icon"
                        disabled={saveDisabled}
                        aria-label={t('form.tooltip.save_options')}
                        className={cn(
                          'h-8 shrink-0 rounded-l-none border-l',
                          isMobile ? 'size-8' : 'px-1.5',
                          primarySaveVariant === 'destructive'
                            ? 'border-destructive-foreground/20'
                            : 'border-primary-foreground/20',
                        )}
                      >
                        <ChevronDown className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                  </ToolbarTooltip>
                  <DropdownMenuContent align="start">
                    {onSaveAndNew && primarySaveAction !== onSaveAndNew && (
                      <DropdownMenuItem
                        disabled={saveDisabled}
                        onClick={onSaveAndNew}
                      >
                        <Plus className="size-4 mr-2" /> {t('form.save_and_new')}
                      </DropdownMenuItem>
                    )}
                    {onSaveAndEdit && primarySaveAction !== onSaveAndEdit && (
                      <DropdownMenuItem
                        disabled={saveDisabled}
                        onClick={onSaveAndEdit}
                      >
                        <Pencil className="size-4 mr-2" /> {t('form.save_and_edit')}
                      </DropdownMenuItem>
                    )}
                    {onSaveAndList && primarySaveAction !== onSaveAndList && (
                      <DropdownMenuItem
                        disabled={saveDisabled}
                        onClick={onSaveAndList}
                      >
                        <Save className="size-4 mr-2" /> {t('form.save_and_list')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {backImmediatelyAfterPrimary && onBack && (
                <FormButton
                  label={t('common.back')}
                  tooltip={t('form.tooltip.back')}
                  icon={ArrowLeft}
                  onClick={onBack}
                />
              )}
            </GridToolbarGroup>

            {isEditing && onNew && (
              <FormButton
                label={t('common.new')}
                tooltip={t('form.tooltip.new')}
                icon={Plus}
                onClick={onNew}
                showLabelOnMobile
              />
            )}

            {!backImmediatelyAfterPrimary && onBack && (
              <FormButton
                label={t('common.back')}
                tooltip={t('form.tooltip.back')}
                icon={ArrowLeft}
                onClick={onBack}
              />
            )}

            {onClear && (
              <FormButton
                label={t('common.clear')}
                tooltip={t('form.tooltip.clear')}
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
                  label={isActive ? t('common.deactivate') : t('common.activate')}
                  tooltip={isActive ? t('form.tooltip.deactivate') : t('form.tooltip.activate')}
                  icon={isActive ? UserX : UserCheck}
                  onClick={onToggleActive}
                  loading={isTogglingActive}
                />
              )}
              {onDuplicate && (
                <FormButton
                  label={t('common.duplicate')}
                  tooltip={t('form.tooltip.duplicate')}
                  icon={Copy}
                  onClick={onDuplicate}
                />
              )}
              {onDelete && (
                <FormButton
                  label={t('common.delete')}
                  tooltip={t('form.tooltip.delete')}
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
                label={t('form.activity_log')}
                tooltip={t('form.tooltip.activity_log')}
                icon={Activity}
                onClick={() => setActivityLogOpen(true)}
              />
            )}
            {!hasActivityLog && onHistory && (
              <FormButton
                label={t('form.activity_log')}
                tooltip={t('form.tooltip.activity_log')}
                icon={Activity}
                onClick={onHistory}
              />
            )}
            {hasAudit && (
              <FormButton
                label={t('form.audit')}
                tooltip={t('form.tooltip.audit')}
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
            <AlertDialogTitle>{t('form.delete_title', { entity: entityLabel })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.confirm_delete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => { setDeleteOpen(false); onDelete?.(); }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
