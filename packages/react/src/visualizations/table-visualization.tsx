import { type TableCardData, type TableRow } from "@gridframe/core";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow as UiTableRow,
} from "@gridframe/ui/table";
import { cn } from "@gridframe/ui/utils";

type TableVisualizationProps = {
  data: TableCardData;
};

function TableVisualization({ data }: TableVisualizationProps) {
  // TODO: Allow user-configurable column visibility, order, and labels to override this response-owned metadata.
  const columns = data.columns;

  return (
    <Table>
      <TableHeader>
        <UiTableRow>
          {columns.map((column) => (
            <TableHead
              className={cn(column.align === "right" && "text-right")}
              key={column.key}
            >
              {column.label}
            </TableHead>
          ))}
        </UiTableRow>
      </TableHeader>
      <TableBody>
        {data.rows.map((row, rowIndex) => (
          <UiTableRow key={getRowKey(row, rowIndex)}>
            {columns.map((column) => (
              <TableCell
                className={cn(column.align === "right" && "text-right")}
                key={column.key}
              >
                {formatCellValue(row[column.key])}
              </TableCell>
            ))}
          </UiTableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function getRowKey(row: TableRow, index: number) {
  const stableValue = row.id ?? row.slug ?? row.name ?? row.path;

  if (typeof stableValue === "string" || typeof stableValue === "number") {
    return String(stableValue);
  }

  return `row-${index}`;
}

function formatCellValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "No value";
  }

  return value;
}

export { TableVisualization };
