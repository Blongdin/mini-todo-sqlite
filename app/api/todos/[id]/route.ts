import { fail, ok } from "@/lib/api-response";
import { deleteTodo } from "@/lib/todos";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/todos/[id]">
) {
  const { id: idParam } = await ctx.params;
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    return fail("Invalid id.", 400);
  }

  const deleted = deleteTodo(id);

  if (!deleted) {
    return fail("Todo not found.", 404);
  }

  return ok({ id });
}
