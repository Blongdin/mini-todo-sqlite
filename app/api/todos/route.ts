import { fail, ok } from "@/lib/api-response";
import { createTodo, listTodos, EmptyTitleError } from "@/lib/todos";
import type { Priority } from "@/lib/types";

const VALID_PRIORITIES: readonly Priority[] = ["high", "medium", "low"];

function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && (VALID_PRIORITIES as readonly string[]).includes(value);
}

export async function GET() {
  return ok(listTodos());
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);

  if (
    typeof body !== "object" ||
    body === null ||
    !("title" in body) ||
    typeof (body as { title: unknown }).title !== "string"
  ) {
    return fail("Title is required.", 400);
  }

  const rawPriority = (body as { priority?: unknown }).priority;

  let priority: Priority;
  if (rawPriority === undefined) {
    priority = "medium";
  } else if (isPriority(rawPriority)) {
    priority = rawPriority;
  } else {
    return fail("Priority must be one of: high, medium, low.", 400);
  }

  try {
    const todo = createTodo((body as { title: string }).title, priority);
    return ok(todo, 201);
  } catch (error) {
    if (error instanceof EmptyTitleError) {
      return fail("Title is required.", 400);
    }
    throw error;
  }
}
