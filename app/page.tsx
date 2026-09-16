import TodoList from "@/components/TodoList";

export default function Home() {
  return (
    <div className="flex flex-1 justify-center bg-background px-4 py-16 sm:py-24">
      <main className="flex w-full max-w-xl flex-col gap-9">
        <div className="flex flex-col gap-2 px-1 pt-2 sm:pt-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            My To-dos
          </h1>
          <p className="text-sm text-muted">
            Keep track of what you need to get done.
          </p>
        </div>
        <TodoList />
      </main>
    </div>
  );
}
