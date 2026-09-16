"use client";

import { useState } from "react";

interface TodoFormProps {
  onAdd: (title: string) => Promise<void>;
}

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (title.trim().length === 0) {
      setError("Title is required.");
      return;
    }

    setError(null);
    await onAdd(title);
    setTitle("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
      <div className="flex gap-2 w-full">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
        />
        <button
          type="submit"
          className="rounded bg-foreground px-4 py-2 text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Add
        </button>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
