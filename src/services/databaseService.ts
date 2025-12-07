import { apiClient, handleApiError } from '@/lib/api';

export interface DatabaseTable {
  name: string;
  schema: string;
  columnCount: number;
}

export interface DatabaseColumn {
  name: string;
  type: string;
  maxLength: number | null;
  nullable: boolean;
  defaultValue: string | null;
  position: number;
  isPrimaryKey: boolean;
  isUnique: boolean;
}

export interface ForeignKey {
  column: string;
  referencedTable: string;
  referencedSchema: string;
  referencedColumn: string;
  constraintName: string;
}

export interface DatabaseIndex {
  name: string;
  definition: string;
}

export interface TableSchema {
  table: {
    name: string;
    schema: string;
    columns: DatabaseColumn[];
    foreignKeys: ForeignKey[];
    indexes: DatabaseIndex[];
  };
}

export interface TableDataResponse {
  data: Record<string, any>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QueryResult {
  results: Record<string, any>[];
  rowCount: number;
  executionTime: number;
}

export interface TableRelationship {
  outgoing: ForeignKey[];
  incoming: Array<{
    table: string;
    schema: string;
    column: string;
    referencedColumn: string;
    constraintName: string;
  }>;
}

export const databaseService = {
  async getTables(): Promise<DatabaseTable[]> {
    try {
      const response = await apiClient.get<{ tables: DatabaseTable[] }>('/admin/database/tables');
      return response.data.tables;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async getTableSchema(tableName: string, schema: string = 'public'): Promise<TableSchema> {
    try {
      const response = await apiClient.get<TableSchema>(
        `/admin/database/tables/${tableName}/schema`,
        { params: { schema } }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async getTableData(
    tableName: string,
    page: number = 1,
    limit: number = 50,
    schema: string = 'public'
  ): Promise<TableDataResponse> {
    try {
      const response = await apiClient.get<TableDataResponse>(
        `/admin/database/tables/${tableName}/data`,
        { params: { page, limit, schema } }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async executeQuery(sql: string, readOnly: boolean = true): Promise<QueryResult> {
    try {
      const response = await apiClient.post<QueryResult>('/admin/database/query', {
        sql,
        readOnly,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async getTableRelationships(
    tableName: string,
    schema: string = 'public'
  ): Promise<TableRelationship> {
    try {
      const response = await apiClient.get<TableRelationship>(
        `/admin/database/tables/${tableName}/relationships`,
        { params: { schema } }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async exportTableData(
    tableName: string,
    format: 'json' | 'csv' = 'json',
    schema: string = 'public'
  ): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `/admin/database/tables/${tableName}/export`,
        {
          params: { format, schema },
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

