"use client";

import type { Todo } from "@/lib/types";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li className="flex items-center gap-4 px-5 py-5 transition-colors hover:bg-background/60 sm:px-6">
      <label className="relative flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          aria-label={`Mark "${todo.title}" as ${todo.completed ? "not completed" : "completed"}`}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-primary/30 ${
            todo.completed
              ? "border-primary bg-primary shadow-sm shadow-primary/30"
              : "border-slate-300 bg-white peer-hover:border-slate-400"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-3.5 w-3.5 text-white transition-opacity ${
              todo.completed ? "opacity-100" : "opacity-0"
            }`}
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </span>
      </label>

      <span
        className={`min-w-0 flex-1 truncate text-[15px] ${
          todo.completed ? "text-muted line-through" : "text-foreground"
        }`}
      >
        {todo.title}
      </span>

      <button
        type="button"
        onClick={() => onDelete(todo.id)}
        aria-label={`Delete "${todo.title}"`}
        className="shrink-0 px-1.5 py-1 text-xs font-medium text-muted/70 transition-colors hover:text-danger focus-visible:text-danger focus-visible:outline-none"
      >
        Delete
      </button>
    </li>
  );
}
