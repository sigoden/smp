import { useUIStore } from "../../stores/uiStore";

export function LoadingBar() {
  const isLoading = useUIStore((s) => s.isLoading);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 inset-x-0 h-[3px] z-[9999] overflow-hidden pointer-events-none">
      <div className="h-full w-1/4 animate-[loading-bar_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-primary to-transparent" />
    </div>
  );
}
