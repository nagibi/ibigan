import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { MaskedInput } from '@/components/ui/masked-input';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormFieldGridItem } from '@/components/grid/form-field-grid';
import { getUserGenderOptions } from '@/lib/user-gender';
import type { UserProfileFormData } from '@/lib/user-profile-fields';

interface UserProfileFieldsProps<T extends FieldValues & UserProfileFormData> {
  control: Control<T>;
  showBio?: boolean;
  basicOnly?: boolean;
}

export function UserProfileFields<T extends FieldValues & UserProfileFormData>({
  control,
  showBio = true,
  basicOnly = false,
}: UserProfileFieldsProps<T>) {
  const { t, i18n } = useTranslation();
  const genderOptions = useMemo(() => getUserGenderOptions(), [i18n.language]);

  return (
    <>
      <FormFieldGridItem>
        <FormField control={control} name={'name' as Path<T>} render={({ field }) => (
          <FormItem>
            <FormLabel required>{t('users.form.name')}</FormLabel>
            <FormControl><Input placeholder={t('users.form.name_placeholder')} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </FormFieldGridItem>
      <FormFieldGridItem>
        <FormField control={control} name={'email' as Path<T>} render={({ field }) => (
          <FormItem>
            <FormLabel required>{t('users.form.email')}</FormLabel>
            <FormControl><Input type="email" placeholder={t('users.form.email_placeholder')} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </FormFieldGridItem>
      {!basicOnly && (
        <>
      <FormFieldGridItem>
        <FormField control={control} name={'cpf' as Path<T>} render={({ field }) => (
          <FormItem>
            <FormLabel>{t('users.column.cpf')}</FormLabel>
            <FormControl>
              <MaskedInput mask="cpf" placeholder="000.000.000-00" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </FormFieldGridItem>
      <FormFieldGridItem>
        <FormField control={control} name={'phone' as Path<T>} render={({ field }) => (
          <FormItem>
            <FormLabel>{t('users.column.phone')}</FormLabel>
            <FormControl>
              <MaskedInput mask="phone" placeholder="(11) 99999-9999" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </FormFieldGridItem>
      <FormFieldGridItem>
        <FormField control={control} name={'birth_date' as Path<T>} render={({ field }) => (
          <FormItem>
            <FormLabel>{t('users.form.birth_date')}</FormLabel>
            <FormControl><Input type="date" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </FormFieldGridItem>
      <FormFieldGridItem>
        <FormField control={control} name={'gender' as Path<T>} render={({ field }) => (
          <FormItem>
            <FormLabel>{t('users.column.gender')}</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value === 'none' ? '' : value);
              }}
              value={field.value || 'none'}
            >
              <FormControl><SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="none">{t('users.gender.not_informed')}</SelectItem>
                {genderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
      </FormFieldGridItem>
      {showBio && (
        <FormFieldGridItem span={2}>
          <FormField control={control} name={'bio' as Path<T>} render={({ field }) => (
            <FormItem>
              <FormLabel>{t('users.column.bio')}</FormLabel>
              <FormControl>
                <Input placeholder={t('users.form.bio_placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </FormFieldGridItem>
      )}
        </>
      )}
    </>
  );
}
