import { fail, ok } from "@/lib/api-response";
import { createTodo, listTodos, EmptyTitleError } from "@/lib/todos";

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

  try {
    const todo = createTodo((body as { title: string }).title);
    return ok(todo, 201);
  } catch (error) {
    if (error instanceof EmptyTitleError) {
      return fail("Title is required.", 400);
    }
    throw error;
  }
}
