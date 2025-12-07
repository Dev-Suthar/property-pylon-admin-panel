import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatabaseTableList } from '@/components/DatabaseTableList';
import { SqlQueryEditor } from '@/components/SqlQueryEditor';
import { TableSchemaViewer } from '@/components/TableSchemaViewer';
import { TableDataViewer } from '@/components/TableDataViewer';
import { Database, Code, Table2, Eye } from 'lucide-react';

export function Database() {
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedSchema, setSelectedSchema] = useState<string>('public');

  const handleTableSelect = (tableName: string, schema: string) => {
    setSelectedTable(tableName);
    setSelectedSchema(schema);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Database Viewer
        </h1>
        <p className="text-slate-600 mt-2 text-lg">
          Browse tables, execute queries, and view database schemas
        </p>
      </div>

      <Tabs defaultValue="tables" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tables" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Tables
          </TabsTrigger>
          <TabsTrigger value="query" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Query
          </TabsTrigger>
          <TabsTrigger value="schema" className="flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            Schema
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-4">
          <DatabaseTableList
            onTableSelect={handleTableSelect}
            selectedTable={selectedTable}
          />
        </TabsContent>

        <TabsContent value="query" className="space-y-4">
          <SqlQueryEditor />
        </TabsContent>

        <TabsContent value="schema" className="space-y-4">
          <TableSchemaViewer tableName={selectedTable} schema={selectedSchema} />
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <TableDataViewer tableName={selectedTable} schema={selectedSchema} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

