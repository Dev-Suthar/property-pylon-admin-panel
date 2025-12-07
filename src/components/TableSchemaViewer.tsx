import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, Key, Link2 } from 'lucide-react';
import { databaseService } from '@/services/databaseService';

interface TableSchemaViewerProps {
  tableName: string;
  schema?: string;
}

export function TableSchemaViewer({ tableName, schema = 'public' }: TableSchemaViewerProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['table-schema', tableName, schema],
    queryFn: () => databaseService.getTableSchema(tableName, schema),
    enabled: !!tableName,
  });

  if (!tableName) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-slate-500">Select a table to view its schema</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Error loading schema: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const table = data?.table;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Table Schema: {tableName}
          </CardTitle>
          <CardDescription>Schema: {schema}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Columns */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Columns</h3>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Nullable</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead>Constraints</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table?.columns.map((col) => (
                        <TableRow key={col.name}>
                          <TableCell className="font-medium">{col.name}</TableCell>
                          <TableCell>
                            <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                              {col.type}
                              {col.maxLength && `(${col.maxLength})`}
                            </code>
                          </TableCell>
                          <TableCell>
                            {col.nullable ? (
                              <Badge variant="outline">Yes</Badge>
                            ) : (
                              <Badge variant="destructive">No</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {col.defaultValue || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {col.isPrimaryKey && (
                                <Badge variant="default" className="gap-1">
                                  <Key className="h-3 w-3" />
                                  PK
                                </Badge>
                              )}
                              {col.isUnique && (
                                <Badge variant="secondary">Unique</Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Foreign Keys */}
              {table?.foreignKeys && table.foreignKeys.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    Foreign Keys
                  </h3>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Column</TableHead>
                          <TableHead>References Table</TableHead>
                          <TableHead>References Column</TableHead>
                          <TableHead>Constraint</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {table.foreignKeys.map((fk, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{fk.column}</TableCell>
                            <TableCell>
                              <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                                {fk.referencedSchema}.{fk.referencedTable}
                              </code>
                            </TableCell>
                            <TableCell>{fk.referencedColumn}</TableCell>
                            <TableCell className="text-sm text-slate-500">
                              {fk.constraintName}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Indexes */}
              {table?.indexes && table.indexes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Indexes</h3>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Index Name</TableHead>
                          <TableHead>Definition</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {table.indexes.map((idx) => (
                          <TableRow key={idx.name}>
                            <TableCell className="font-medium">{idx.name}</TableCell>
                            <TableCell>
                              <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                                {idx.definition}
                              </code>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

