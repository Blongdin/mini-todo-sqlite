"use client";

import { useState } from "react";
import type { Priority } from "@/lib/types";

interface TodoFormProps {
  onAdd: (title: string, priority: Priority) => Promise<void>;
}

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (title.trim().length === 0) {
      setError("Title is required.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onAdd(title, priority);
      setTitle("");
      setPriority("medium");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          disabled={submitting}
          className="h-12 flex-1 rounded-xl border border-border-subtle bg-background px-4 text-sm leading-none text-foreground placeholder:text-muted transition-colors focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          disabled={submitting}
          aria-label="Priority"
          className="h-12 shrink-0 rounded-xl border border-border-subtle bg-background px-3 text-sm leading-none text-foreground transition-colors focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
        >
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={submitting}
          className="flex h-12 shrink-0 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium leading-none text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
