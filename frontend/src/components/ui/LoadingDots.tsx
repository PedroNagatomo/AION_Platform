export function LoadingDots() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-terminal-accent">❯</span>
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-terminal-accent rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-terminal-accent rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-terminal-accent rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-terminal-dim text-xs">processando...</span>
    </div>
  );
}