import { useCallback, useLayoutEffect, useRef } from "react";
import { useUIStore } from "../../stores/uiStore";

const MIN_WIDTH = 180;
const MAX_WIDTH = 600;

export function ResizeHandle() {
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = useUIStore.getState().sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  // Use useLayoutEffect so the CSS variable is set before first paint
  useLayoutEffect(() => {
    const root = document.documentElement;

    // Initialize CSS variable from store
    root.style.setProperty("--sidebar-width", `${useUIStore.getState().sidebarWidth}px`);

    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidthRef.current + delta));
      // Update CSS variable directly — no React re-render
      root.style.setProperty("--sidebar-width", `${newWidth}px`);
    };

    const handleMouseUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      // Read the final value from the CSS variable and sync to Zustand once
      const finalWidth = parseInt(root.style.getPropertyValue("--sidebar-width"), 10) || startWidthRef.current;
      useUIStore.getState().setSidebarWidth(finalWidth);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div
      className="absolute right-0 top-0 bottom-0 w-[5px] cursor-col-resize z-20
                 flex items-center justify-center
                 hover:bg-primary/10 active:bg-primary/15
                 transition-colors duration-150 group"
      onMouseDown={handleMouseDown}
    >
      {/* Subtle grip indicator */}
      <div className="w-[2px] h-8 rounded-full bg-border/60
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-150
                      group-active:bg-primary/40" />
    </div>
  );
}
