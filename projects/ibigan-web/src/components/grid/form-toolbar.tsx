import { type VariantProps } from 'class-variance-authority';
import { type ElementType, type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ChevronDown,
  ClipboardList,
  Copy,
  History,
  LoaderCircle,
  Pencil,
  Plus,
  Undo2,
  RefreshCw,
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
import { AlertDialogPanelTitle } from '@/components/common/panel-title';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { shouldIgnoreFormDeleteShortcut } from '@/lib/form-keyboard-shortcuts';
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

  onToggleActive?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;

  onRefresh?: () => void;
  isRefreshing?: boolean;

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
  iconOnly = false,
}: {
  label: string;
  tooltip?: string;
  icon: ElementType;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  showLabelOnMobile?: boolean;
  iconOnly?: boolean;
}) {
  const isMobile = useIsMobile();
  const showLabel = !iconOnly && (!isMobile || showLabelOnMobile);

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
  onToggleActive,
  onDelete,
  onDuplicate,
  onRefresh,
  isRefreshing = false,
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

  useEffect(() => {
    if (!onDelete || isDeleting) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Delete') return;
      if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
      if (shouldIgnoreFormDeleteShortcut(event)) return;

      event.preventDefault();
      setDeleteOpen(true);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDeleting, onDelete]);

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
  const hasNavigation = Boolean(onBack || onRefresh);

  const backButton = onBack ? (
    <FormButton
      label={t('common.back')}
      tooltip={t('form.tooltip.back')}
      icon={ArrowLeft}
      onClick={onBack}
    />
  ) : null;

  const refreshButton = onRefresh && !isMobile ? (
    <FormButton
      label={t('grid.refresh')}
      tooltip={t('grid.tooltip.refresh')}
      icon={RefreshCw}
      onClick={onRefresh}
      loading={isRefreshing}
    />
  ) : null;

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

              {backButton}
            </GridToolbarGroup>

            {isEditing && onNew && (
              <FormButton
                label={t('common.new')}
                tooltip={t('form.tooltip.new')}
                icon={Plus}
                onClick={onNew}
                iconOnly
              />
            )}

            {onClear && (
              <FormButton
                label={t('common.clear')}
                tooltip={t('form.tooltip.clear')}
                icon={Undo2}
                onClick={onClear}
                disabled={!isDirty}
              />
            )}

            {refreshButton}
          </>
        )}

        {!hasSave && hasNavigation && (
          <GridToolbarGroup>
            {backButton}
            {refreshButton}
          </GridToolbarGroup>
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
                icon={History}
                onClick={() => setActivityLogOpen(true)}
              />
            )}
            {!hasActivityLog && onHistory && (
              <FormButton
                label={t('form.activity_log')}
                tooltip={t('form.tooltip.activity_log')}
                icon={History}
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
            <AlertDialogPanelTitle icon={Trash2}>
              {t('form.delete_title', { entity: entityLabel })}
            </AlertDialogPanelTitle>
            <AlertDialogDescription>
              {t('common.confirm_delete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel />
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
