export function AppErrorFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-lg font-semibold">Algo deu errado</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Recarregue a página ou tente novamente.
        </p>
      </div>
    </div>
  );
}
