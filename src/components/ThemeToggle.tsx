"use client";

import { useTheme } from "next-themes";
import { Sun, SunMedium, Moon, MoonStar } from "lucide-react";
import { useEffect, useState } from "react";

const THEMES = [
  { id: "light", label: "Light", icon: Sun, iconColor: "text-amber-500" },
  { id: "dim", label: "Dim", icon: SunMedium, iconColor: "text-orange-400" },
  { id: "dark", label: "Dark", icon: Moon, iconColor: "text-blue-400" },
  { id: "midnight", label: "Midnight", icon: MoonStar, iconColor: "text-indigo-400" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  if (!mounted) return <div className="w-8 h-8" />;

  const current = THEMES.find(t => t.id === theme) || THEMES[2];
  const Icon = current.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] transition-colors"
        title={`Theme: ${current.label}`}
        aria-label={`Current theme: ${current.label}. Click to change.`}
      >
        <Icon className={`w-4 h-4 ${current.iconColor}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-50 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl py-1 min-w-[140px]">
            {THEMES.map(t => {
              const TIcon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); setOpen(false); }}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 transition-colors ${
                    theme === t.id
                      ? "text-[var(--accent)] bg-[var(--bg-secondary)] font-medium"
                      : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)]"
                  }`}
                >
                  <TIcon className={`w-4 h-4 ${t.iconColor}`} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
