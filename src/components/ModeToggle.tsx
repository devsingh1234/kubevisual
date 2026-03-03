import { Moon, Sun } from "lucide-react"

import { useTheme } from "./ThemeProvider"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="rounded-full p-2.5 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-300"
            title="Toggle theme"
        >
            {theme === "light" ? (
                <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
            ) : (
                <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
            )}
            <span className="sr-only">Toggle theme</span>
        </button>
    )
}
