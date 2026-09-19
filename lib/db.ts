import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "todos.db");

mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low'))
  )
`);

interface ColumnInfo {
  name: string;
}

const columns = db.prepare("PRAGMA table_info(todos)").all() as unknown as ColumnInfo[];
const hasPriorityColumn = columns.some((column) => column.name === "priority");

if (!hasPriorityColumn) {
  db.exec(`
    ALTER TABLE todos
      ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low'))
  `);
}
