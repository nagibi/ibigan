import { format } from 'date-fns';
import type { RegisterOptions } from 'react-hook-form';
import type { ReportParameter } from '@/services/reports.service';

export function buildReportExecuteDefaults(parameters: ReportParameter[]): Record<string, string> {
  const defaults: Record<string, string> = {};

  parameters.forEach((parameter) => {
    defaults[parameter.name] = '';

    if (parameter.type !== 'date') {
      return;
    }

    if (
      parameter.name.includes('from')
      || parameter.name.includes('inicio')
      || parameter.name.includes('start')
    ) {
      defaults[parameter.name] = format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd');
      return;
    }

    if (
      parameter.name.includes('to')
      || parameter.name.includes('fim')
      || parameter.name.includes('end')
    ) {
      defaults[parameter.name] = format(new Date(), 'yyyy-MM-dd');
    }
  });

  return defaults;
}

export function reportParameterRules(
  parameter: ReportParameter,
): RegisterOptions<Record<string, string>, string> {
  if (!parameter.required) {
    return {};
  }

  return {
    required: `${parameter.label} é obrigatório.`,
    validate: (value) => (String(value ?? '').trim() !== '' ? true : `${parameter.label} é obrigatório.`),
  };
}
