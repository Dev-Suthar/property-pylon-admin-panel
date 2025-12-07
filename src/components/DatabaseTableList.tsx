import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Database, Loader2 } from 'lucide-react';
import { databaseService, DatabaseTable } from '@/services/databaseService';

interface DatabaseTableListProps {
  onTableSelect?: (tableName: string, schema: string) => void;
  selectedTable?: string;
}

export function DatabaseTableList({ onTableSelect, selectedTable }: DatabaseTableListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tables, isLoading, error } = useQuery({
    queryKey: ['database-tables'],
    queryFn: () => databaseService.getTables(),
  });

  const filteredTables = tables?.filter(
    (table) =>
      table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.schema.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Error loading tables: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Tables
        </CardTitle>
        <CardDescription>Browse all tables in the database</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search tables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table Name</TableHead>
                  <TableHead>Schema</TableHead>
                  <TableHead>Columns</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTables && filteredTables.length > 0 ? (
                  filteredTables.map((table) => (
                    <TableRow
                      key={`${table.schema}.${table.name}`}
                      className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                        selectedTable === table.name ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => onTableSelect?.(table.name, table.schema)}
                    >
                      <TableCell className="font-medium">{table.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{table.schema}</Badge>
                      </TableCell>
                      <TableCell>{table.columnCount}</TableCell>
                      <TableCell className="text-right">
                        {selectedTable === table.name && (
                          <Badge variant="default">Selected</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                      No tables found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

