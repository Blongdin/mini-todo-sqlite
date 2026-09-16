"use client";

import type { Todo } from "@/lib/types";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li className="flex items-center gap-3 py-2">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        aria-label={`Mark "${todo.title}" as ${todo.completed ? "not completed" : "completed"}`}
      />
      <span
        className={
          todo.completed
            ? "flex-1 text-zinc-400 line-through dark:text-zinc-600"
            : "flex-1"
        }
      >
        {todo.title}
      </span>
      <button
        type="button"
        onClick={() => onDelete(todo.id)}
        aria-label={`Delete "${todo.title}"`}
        className="text-sm text-red-600 hover:underline dark:text-red-400"
      >
        Delete
      </button>
    </li>
  );
}
