import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";
import { useState } from "react";

interface DataTableProps<TData, TValue> {
  className?: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  pagination?: {
    pageSize: number;
    currentPage: number;
    total: number;
    onChange?: (page: number, pageSize: number) => void;
  };
  onRowClick?: (row: TData) => void;
  emptyMessage?: string;
  rowClassName?: string | ((data: TData) => string);
  sticky?: boolean;
  rowKey?: string | ((record: TData) => string);
  scroll?: {
    x?: number | string | `calc(${string})`;
    y?: number | string | `calc(${string})`;
  };
}

export function DataTable<TData, TValue>({
  className,
  columns,
  data,
  loading,
  pagination,
  onRowClick,
  emptyMessage = "No results.",
  rowClassName,
  sticky,
  rowKey = "id",
  scroll,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState({});

  const getRowKey = (record: TData): string => {
    if (typeof rowKey === "function") {
      return rowKey(record);
    }
    return (record as unknown as Record<string, string>)[rowKey];
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  // Helper function to generate unique key
  const generateUniqueKey = (
    base: string,
    ...parts: (string | number)[]
  ): string => {
    return `${base}_${parts.join("_")}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;
  };

  return (
    <div className={cn("rounded-md border", className)}>
      <div
        style={{
          overflow: "auto",
          maxWidth: typeof scroll?.x === "number" ? `${scroll.x}px` : scroll?.x,
          maxHeight:
            typeof scroll?.y === "number" ? `${scroll.y}px` : scroll?.y,
        }}
      >
        <Table className={cn({ "sticky top-0": sticky })}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={generateUniqueKey("header", headerGroup.id)}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={generateUniqueKey("head", headerGroup.id, header.id)}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24">
                  <div className="flex justify-center items-center">
                    <Spinner />
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, rowIndex) => {
                const rowKey = getRowKey(row.original);
                return (
                  <TableRow
                    key={generateUniqueKey("row", rowKey, rowIndex)}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      typeof rowClassName === "function"
                        ? rowClassName(row.original)
                        : rowClassName
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell, cellIndex) => (
                      <TableCell
                        key={generateUniqueKey(
                          "cell",
                          rowKey,
                          cell.column.id,
                          cellIndex
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="flex items-center justify-end px-2 py-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
