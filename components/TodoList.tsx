"use client";

import { useEffect, useState } from "react";
import type { ApiResponse, Priority, Todo } from "@/lib/types";
import TodoForm from "./TodoForm";
import TodoItem from "./TodoItem";

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/todos")
      .then((res) => res.json() as Promise<ApiResponse<Todo[]>>)
      .then((body) => {
        if ("data" in body) {
          setTodos(body.data);
        }
        setLoaded(true);
      });
  }, []);

  async function handleAdd(title: string, priority: Priority) {
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, priority }),
    });
    const body = (await res.json()) as ApiResponse<Todo>;
    if ("data" in body) {
      setTodos((prev) => [...prev, body.data]);
    }
  }

  async function handleToggle(id: number) {
    const res = await fetch(`/api/todos/${id}/toggle`, { method: "PATCH" });
    const body = (await res.json()) as ApiResponse<Todo>;
    if ("data" in body) {
      const updated = body.data;
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
    if (res.status === 200 || res.status === 404) {
      setTodos((prev) => prev.filter((t) => t.id !== id));
    }
  }

  const remaining = todos.filter((t) => !t.completed).length;

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="rounded-3xl bg-surface p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-8px_rgba(15,23,42,0.08)] ring-1 ring-border-subtle sm:p-6">
        <TodoForm onAdd={handleAdd} />
      </div>

      <div className="overflow-hidden rounded-3xl bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-8px_rgba(15,23,42,0.08)] ring-1 ring-border-subtle">
        {!loaded ? (
          <div className="px-6 py-14 text-center text-sm text-muted">
            Loading…
          </div>
        ) : todos.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <ul className="divide-y divide-border-subtle">
              {todos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
            <div className="border-t border-border-subtle px-5 py-2.5 text-[11px] tracking-wide text-muted/70 sm:px-6">
              {remaining} left · {todos.length} total
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M9 12l2 2 4-4" />
          <rect x="3" y="4" width="18" height="16" rx="3" />
        </svg>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">No to-dos yet</p>
        <p className="text-sm text-muted">Add your first task to get started.</p>
      </div>
    </div>
  );
}
