"use client";

import { useEffect, useState } from "react";
import type { ApiResponse, Todo } from "@/lib/types";
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

  async function handleAdd(title: string) {
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
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

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <TodoForm onAdd={handleAdd} />
      {loaded && todos.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">No to-dos yet.</p>
      ) : (
        <ul className="divide-y divide-black/[.08] dark:divide-white/[.145]">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
