"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

function ThemeToggle({ className }: { className?: string }) {
  const { setTheme } = useTheme()

  // Which icon shows is decided by CSS from the `dark` class that next-themes
  // puts on <html>, so there is no mounted flag and no hydration mismatch. The
  // current theme is read from the DOM at click time for the same reason.
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
      className={className}
      onClick={() =>
        setTheme(
          document.documentElement.classList.contains("dark") ? "light" : "dark"
        )
      }
    >
      <Moon className="dark:hidden" />
      <Sun className="hidden dark:block" />
    </Button>
  )
}

export { ThemeToggle }
