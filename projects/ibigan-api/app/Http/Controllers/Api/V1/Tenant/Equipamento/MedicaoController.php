<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant\Equipamento;

use App\Http\Controllers\Controller;
use App\Services\MedicaoService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response as ResponseFacade;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

final class MedicaoController extends Controller
{
    public function __construct(
        private readonly MedicaoService $service,
    ) {}

    public function calcular(Request $request): JsonResponse
    {
        $data = $request->validate([
            'data_inicio' => ['required', 'date'],
            'data_fim' => ['required', 'date', 'after_or_equal:data_inicio'],
            'fornecedor_id' => ['nullable', 'integer', 'exists:fornecedores,id'],
            'obra_id' => ['nullable', 'integer', 'exists:obras,id'],
            'tipo_id' => ['nullable', 'integer', 'exists:tipos_equipamento,id'],
            'incluir_baixados' => ['sometimes', 'boolean'],
            'agrupar_fornecedor' => ['sometimes', 'boolean'],
        ]);

        $resultado = $this->service->calcular(
            Carbon::parse($data['data_inicio']),
            Carbon::parse($data['data_fim']),
            $this->filtros($data),
        );

        if (! empty($data['agrupar_fornecedor'])) {
            $resultado = $this->service->agruparPorFornecedor($resultado);
        }

        return response()->json($resultado);
    }

    public function exportar(Request $request): BinaryFileResponse
    {
        $data = $request->validate([
            'data_inicio' => ['required', 'date'],
            'data_fim' => ['required', 'date', 'after_or_equal:data_inicio'],
            'fornecedor_id' => ['nullable', 'integer', 'exists:fornecedores,id'],
            'obra_id' => ['nullable', 'integer', 'exists:obras,id'],
            'incluir_baixados' => ['sometimes', 'boolean'],
        ]);

        $resultado = $this->service->calcular(
            Carbon::parse($data['data_inicio']),
            Carbon::parse($data['data_fim']),
            $this->filtros($data),
        );

        $spreadsheet = $this->gerarSpreadsheet($resultado, $data);
        $writer = new Xlsx($spreadsheet);

        $filename = 'medicao_'.$data['data_inicio'].'_'.$data['data_fim'].'.xlsx';
        $tempPath = sys_get_temp_dir().'/'.$filename;
        $writer->save($tempPath);

        return ResponseFacade::download($tempPath, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function filtros(array $data): array
    {
        return collect($data)->only([
            'fornecedor_id',
            'obra_id',
            'tipo_id',
            'incluir_baixados',
        ])->all();
    }

    /**
     * @param  array<string, mixed>  $resultado
     * @param  array<string, mixed>  $filtros
     */
    private function gerarSpreadsheet(array $resultado, array $filtros): Spreadsheet
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Medição');

        $sheet->setCellValue('A1', 'RELATÓRIO DE MEDIÇÃO');
        $sheet->setCellValue('A2', 'Período: '.$resultado['periodo']['inicio'].' a '.$resultado['periodo']['fim']);
        $sheet->setCellValue('A3', 'Total de equipamentos: '.$resultado['totais']['quantidade_equipamentos']);
        $sheet->setCellValue('A4', 'Valor total: R$ '.number_format((float) $resultado['totais']['valor_total'], 2, ',', '.'));

        $headers = [
            'Patrimônio', 'Tipo', 'Grupo', 'Fornecedor', 'Obra',
            'Valor Mensal', 'Valor Diário',
            'Dias no Período', 'Dias Desconto (Falha)', 'Dias Faturáveis',
            'Valor Proporcional', 'Status',
        ];

        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col.'6', $header);
            $col++;
        }

        $sheet->getStyle('A6:L6')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1E3A5F']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $row = 7;
        foreach ($resultado['itens'] as $item) {
            $sheet->fromArray([
                $item['patrimonio'],
                $item['tipo'],
                $item['grupo'],
                $item['fornecedor'],
                $item['obra'],
                'R$ '.number_format((float) $item['valor_mensal'], 2, ',', '.'),
                'R$ '.number_format((float) $item['valor_diario'], 4, ',', '.'),
                $item['dias_periodo'],
                $item['dias_desconto'],
                $item['dias_faturáveis'],
                'R$ '.number_format((float) $item['valor_proporcional'], 2, ',', '.'),
                $item['status'],
            ], null, 'A'.$row);
            $row++;
        }

        $sheet->setCellValue('A'.$row, 'TOTAL');
        $sheet->setCellValue('K'.$row, 'R$ '.number_format((float) $resultado['totais']['valor_total'], 2, ',', '.'));
        $sheet->getStyle("A{$row}:L{$row}")->getFont()->setBold(true);

        foreach (range('A', 'L') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        return $spreadsheet;
    }
}
