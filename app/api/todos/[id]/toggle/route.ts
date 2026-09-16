import { fail, ok } from "@/lib/api-response";
import { toggleTodo } from "@/lib/todos";

export async function PATCH(
  _request: Request,
  ctx: RouteContext<"/api/todos/[id]/toggle">
) {
  const { id: idParam } = await ctx.params;
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    return fail("Invalid id.", 400);
  }

  const todo = toggleTodo(id);

  if (!todo) {
    return fail("Todo not found.", 404);
  }

  return ok(todo);
}
