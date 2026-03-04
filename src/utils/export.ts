import * as Sharing from 'expo-sharing';
import { SQLiteDatabase } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';

/**
 * Escapes a value for use in a CSV field
 * Handles quotes, commas, and newlines according to CSV RFC 4180
 */
export function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If the value contains quotes, commas, or newlines, wrap in quotes and escape quotes
  if (
    stringValue.includes('"') ||
    stringValue.includes(',') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Generates CSV content for the runs table
 */
async function generateRunsCSV(db: SQLiteDatabase): Promise<string> {
  // Get column names
  const columnsResult = await db.getAllAsync<{ name: string }>('PRAGMA table_info(runs)');
  const columns = columnsResult.map((col) => col.name);

  // Get all rows
  const rows = await db.getAllAsync<any>('SELECT * FROM runs ORDER BY id');

  // Build CSV
  const csvLines: string[] = [];

  // Add header
  csvLines.push(columns.map(escapeCSVValue).join(','));

  // Add data rows
  for (const row of rows) {
    const values = columns.map((col) => escapeCSVValue(row[col]));
    csvLines.push(values.join(','));
  }

  return csvLines.join('\n');
}

/**
 * Generates CSV content for the weather table
 */
async function generateWeatherCSV(db: SQLiteDatabase): Promise<string> {
  // Get column names
  const columnsResult = await db.getAllAsync<{ name: string }>('PRAGMA table_info(weather)');
  const columns = columnsResult.map((col) => col.name);

  // Get all rows
  const rows = await db.getAllAsync<any>('SELECT * FROM weather ORDER BY id');

  // Build CSV
  const csvLines: string[] = [];

  // Add header
  csvLines.push(columns.map(escapeCSVValue).join(','));

  // Add data rows
  for (const row of rows) {
    const values = columns.map((col) => escapeCSVValue(row[col]));
    csvLines.push(values.join(','));
  }

  return csvLines.join('\n');
}

/**
 * Generates CSV content for the locationData table
 * Note: The location_data column contains JSON which will be stored as an escaped string
 */
async function generateLocationDataCSV(db: SQLiteDatabase): Promise<string> {
  // Get column names
  const columnsResult = await db.getAllAsync<{ name: string }>('PRAGMA table_info(locationData)');
  const columns = columnsResult.map((col) => col.name);

  // Get all rows
  const rows = await db.getAllAsync<any>('SELECT * FROM locationData ORDER BY id');

  // Build CSV
  const csvLines: string[] = [];

  // Add header
  csvLines.push(columns.map(escapeCSVValue).join(','));

  // Add data rows
  for (const row of rows) {
    const values = columns.map((col) => escapeCSVValue(row[col]));
    csvLines.push(values.join(','));
  }

  return csvLines.join('\n');
}

/**
 * Generates CSV content for the settings table
 */
async function generateSettingsCSV(db: SQLiteDatabase): Promise<string> {
  // Get column names
  const columnsResult = await db.getAllAsync<{ name: string }>('PRAGMA table_info(settings)');
  const columns = columnsResult.map((col) => col.name);

  // Get all rows
  const rows = await db.getAllAsync<any>('SELECT * FROM settings ORDER BY id');

  // Build CSV
  const csvLines: string[] = [];

  // Add header
  csvLines.push(columns.map(escapeCSVValue).join(','));

  // Add data rows
  for (const row of rows) {
    const values = columns.map((col) => escapeCSVValue(row[col]));
    csvLines.push(values.join(','));
  }

  return csvLines.join('\n');
}

/**
 * Generates CSV for a specific table
 */
async function generateCSVForTable(db: SQLiteDatabase, tableName: string): Promise<string> {
  switch (tableName) {
    case 'runs':
      return generateRunsCSV(db);
    case 'weather':
      return generateWeatherCSV(db);
    case 'locationData':
      return generateLocationDataCSV(db);
    case 'settings':
      return generateSettingsCSV(db);
    default:
      throw new Error(`Unknown table: ${tableName}`);
  }
}

/**
 * Exports all tables as CSV files
 * Each CSV is shared individually via the native share dialog
 */
export async function exportCSVFiles(db: SQLiteDatabase): Promise<void> {
  const timestamp = new Date().toISOString().split('T')[0];
  const tables = ['runs', 'weather', 'locationData', 'settings'];

  for (const table of tables) {
    const csv = await generateCSVForTable(db, table);
    const filename = `runner-${table}-${timestamp}.csv`;
    const path = `${FileSystem.cacheDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(path, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    await Sharing.shareAsync(path, {
      mimeType: 'text/csv',
      dialogTitle: `Export ${table}`,
    });
  }
}

/**
 * Exports the SQLite database file
 * Copies the database to cache and shares it via the native share dialog
 */
export async function exportDatabaseFile(): Promise<void> {
  const dbPath = `${FileSystem.documentDirectory}SQLite/runner.db`;
  const timestamp = new Date().toISOString().split('T')[0];
  const exportPath = `${FileSystem.cacheDirectory}runner-export-${timestamp}.db`;

  // Check if database file exists
  const fileInfo = await FileSystem.getInfoAsync(dbPath);
  if (!fileInfo.exists) {
    throw new Error('Database file not found');
  }

  // Copy database to cache
  await FileSystem.copyAsync({ from: dbPath, to: exportPath });

  // Share via native dialog
  await Sharing.shareAsync(exportPath, {
    mimeType: 'application/vnd.sqlite3',
    dialogTitle: 'Export Database',
  });
}

/**
 * Drops all tables from the database
 * IMPORTANT: This is destructive and will delete all data
 */
async function dropAllTables(db: SQLiteDatabase): Promise<void> {
  // Get list of all tables (excluding sqlite internal tables)
  const tables = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );

  // Drop each table
  for (const table of tables) {
    await db.execAsync(`DROP TABLE IF EXISTS ${table.name}`);
  }

  // Reset user_version to 0
  await db.execAsync('PRAGMA user_version = 0');
}

/**
 * Imports a SQLite database file
 * Replaces the current database with the imported one
 * IMPORTANT: This will drop all existing tables and data
 */
export async function importDatabaseFile(db: SQLiteDatabase): Promise<void> {
  // Let user pick a .db file
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/vnd.sqlite3',
    copyToCacheDirectory: true,
  });

  if (result.canceled) {
    throw new Error('Import cancelled');
  }

  const selectedFile = result.assets[0];
  if (!selectedFile) {
    throw new Error('No file selected');
  }

  const dbPath = `${FileSystem.documentDirectory}SQLite/runner.db`;

  // Drop all existing tables
  await dropAllTables(db);

  // Close the database connection is handled by the caller
  // Copy the imported file to replace the current database
  await FileSystem.copyAsync({
    from: selectedFile.uri,
    to: dbPath,
  });
}
