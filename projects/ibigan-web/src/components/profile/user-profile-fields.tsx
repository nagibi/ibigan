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
import { USER_GENDER_OPTIONS } from '@/lib/user-gender';
import type { UserProfileFormData } from '@/lib/user-profile-fields';

interface UserProfileFieldsProps<T extends FieldValues & UserProfileFormData> {
  control: Control<T>;
  showBio?: boolean;
}

export function UserProfileFields<T extends FieldValues & UserProfileFormData>({
  control,
  showBio = true,
}: UserProfileFieldsProps<T>) {
  return (
    <>
      <FormFieldGridItem>
        <FormField control={control} name={'name' as Path<T>} render={({ field }) => (
          <FormItem>
            <FormLabel required>Nome</FormLabel>
            <FormControl><Input placeholder="Seu nome completo" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </FormFieldGridItem>
      <FormFieldGridItem>
        <FormField control={control} name={'email' as Path<T>} render={({ field }) => (
          <FormItem>
            <FormLabel required>E-mail</FormLabel>
            <FormControl><Input type="email" placeholder="seu@email.com" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </FormFieldGridItem>
      <FormFieldGridItem>
        <FormField control={control} name={'cpf' as Path<T>} render={({ field }) => (
          <FormItem>
            <FormLabel>CPF</FormLabel>
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
            <FormLabel>Telefone</FormLabel>
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
            <FormLabel>Data de nascimento</FormLabel>
            <FormControl><Input type="date" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </FormFieldGridItem>
      <FormFieldGridItem>
        <FormField control={control} name={'gender' as Path<T>} render={({ field }) => (
          <FormItem>
            <FormLabel>Gênero</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value === 'none' ? '' : value);
              }}
              value={field.value || 'none'}
            >
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="none">Não informado</SelectItem>
                {USER_GENDER_OPTIONS.map((option) => (
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
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Input placeholder="Breve descrição..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </FormFieldGridItem>
      )}
    </>
  );
}
