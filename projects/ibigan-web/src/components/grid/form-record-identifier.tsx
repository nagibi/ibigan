import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function FormStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant={isActive ? 'success' : 'destructive'}
      appearance="light"
      size="sm"
    >
      {isActive ? 'Ativo' : 'Inativo'}
    </Badge>
  );
}

export function FormRecordIdField({ id }: { id: string | number }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="record-id">ID</Label>
      <Input
        id="record-id"
        value={String(id)}
        disabled
        readOnly
        className="bg-muted"
      />
    </div>
  );
}
