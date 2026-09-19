import { db } from "./db";
import type { Priority, Todo } from "./types";

interface TodoRow {
  id: number;
  title: string;
  completed: number;
  created_at: string;
  priority: string;
}

function mapRow(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed === 1,
    createdAt: row.created_at,
    priority: row.priority as Priority,
  };
}

const TODO_COLUMNS = "id, title, completed, created_at, priority";

export function listTodos(): Todo[] {
  const rows = db
    .prepare(`SELECT ${TODO_COLUMNS} FROM todos ORDER BY created_at ASC, id ASC`)
    .all() as unknown as TodoRow[];
  return rows.map(mapRow);
}

export class EmptyTitleError extends Error {}

export function createTodo(title: string, priority: Priority): Todo {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    throw new EmptyTitleError("Title is required.");
  }

  const result = db
    .prepare("INSERT INTO todos (title, completed, priority) VALUES (?, 0, ?)")
    .run(trimmed, priority);

  const row = db
    .prepare(`SELECT ${TODO_COLUMNS} FROM todos WHERE id = ?`)
    .get(result.lastInsertRowid) as unknown as TodoRow;

  return mapRow(row);
}

export function toggleTodo(id: number): Todo | null {
  const existing = db
    .prepare(`SELECT ${TODO_COLUMNS} FROM todos WHERE id = ?`)
    .get(id) as unknown as TodoRow | undefined;

  if (!existing) {
    return null;
  }

  const nextCompleted = existing.completed === 1 ? 0 : 1;
  db.prepare("UPDATE todos SET completed = ? WHERE id = ?").run(nextCompleted, id);

  return mapRow({ ...existing, completed: nextCompleted });
}

export function deleteTodo(id: number): boolean {
  const result = db.prepare("DELETE FROM todos WHERE id = ?").run(id);
  return result.changes > 0;
}
