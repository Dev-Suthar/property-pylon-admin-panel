import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { databaseService, QueryResult } from '@/services/databaseService';
import { useToast } from '@/hooks/use-toast';

export function SqlQueryEditor() {
  const [sql, setSql] = useState('SELECT * FROM companies LIMIT 10;');
  const [readOnly, setReadOnly] = useState(true);
  const { toast } = useToast();

  const {
    mutate: executeQuery,
    data: queryResult,
    isLoading,
    error,
  } = useMutation<QueryResult, Error, { sql: string; readOnly: boolean }>({
    mutationFn: ({ sql, readOnly }) => databaseService.executeQuery(sql, readOnly),
    onError: (error) => {
      toast({
        title: 'Query Error',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Query Executed',
        description: `Returned ${data.rowCount || 0} rows`,
      });
    },
  });

  const handleExecute = () => {
    if (!sql.trim()) {
      toast({
        title: 'Empty Query',
        description: 'Please enter a SQL query',
        variant: 'destructive',
      });
      return;
    }
    executeQuery({ sql, readOnly });
  };

  const resultData = queryResult?.results || [];
  const columns = resultData.length > 0 ? Object.keys(resultData[0]) : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>SQL Query Editor</CardTitle>
          <CardDescription>Execute SQL queries against the database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sql-query">SQL Query</Label>
            <Textarea
              id="sql-query"
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              placeholder="Enter your SQL query here..."
              className="font-mono text-sm min-h-[200px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="read-only"
                checked={readOnly}
                onCheckedChange={setReadOnly}
              />
              <Label htmlFor="read-only" className="cursor-pointer">
                Read-only mode (blocks dangerous operations)
              </Label>
            </div>
            <Button onClick={handleExecute} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Execute Query
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error instanceof Error ? error.message : 'An error occurred'}
              </AlertDescription>
            </Alert>
          )}

          {queryResult && !error && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Query executed successfully. Returned {queryResult.rowCount} row(s).
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {resultData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Query Results</CardTitle>
            <CardDescription>{queryResult?.rowCount || 0} row(s) returned</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col} className="font-semibold">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultData.slice(0, 100).map((row, idx) => (
                    <TableRow key={idx}>
                      {columns.map((col) => (
                        <TableCell key={col} className="max-w-[300px] truncate">
                          {row[col] !== null && row[col] !== undefined
                            ? String(row[col])
                            : 'NULL'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {resultData.length > 100 && (
                <div className="p-4 text-center text-sm text-slate-500">
                  Showing first 100 rows of {resultData.length} total rows
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

