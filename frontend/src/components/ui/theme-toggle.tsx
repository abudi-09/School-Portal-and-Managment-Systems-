import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/useAuth";
import { useTheme } from "@/hooks/useTheme";
import type { ThemeMode } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

const themeOptions: Array<{
  value: ThemeMode;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const getThemeIcon = (mode: ThemeMode) => {
  switch (mode) {
    case "light":
      return Sun;
    case "dark":
      return Moon;
    case "system":
    default:
      return Monitor;
  }
};

interface ThemeToggleProps {
  className?: string;
  withLabel?: boolean;
}

export const ThemeToggle = ({
  className,
  withLabel = false,
}: ThemeToggleProps) => {
  const { user } = useAuth();
  const { mode, setMode, cycleMode, globalDefault, setGlobalDefault } =
    useTheme();
  const Icon = useMemo(() => getThemeIcon(mode), [mode]);

  const canManageGlobal = user?.role === "admin" || user?.role === "head";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={withLabel ? "default" : "icon"}
          className={cn(
            "h-9 text-muted-foreground hover:text-foreground",
            withLabel ? "px-3" : "w-9",
            className
          )}
          aria-label="Toggle theme"
          onClick={(event) => {
            // Allow quick cycling when user holds modifier key
            if (event.metaKey || event.ctrlKey) {
              event.preventDefault();
              cycleMode();
            }
          }}
        >
          <Icon className="h-4 w-4" />
          {withLabel && <span className="ml-2 text-sm font-medium">Theme</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Personal theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={mode}
          onValueChange={(value) => setMode(value as ThemeMode)}
        >
          {themeOptions.map((option) => {
            const OptionIcon = option.icon;
            return (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className="flex items-center gap-2"
              >
                <OptionIcon className="h-4 w-4 text-muted-foreground" />
                {option.label}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
        {canManageGlobal && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Default for new users</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={globalDefault}
              onValueChange={(value) => setGlobalDefault(value as ThemeMode)}
            >
              {themeOptions.map((option) => {
                const OptionIcon = option.icon;
                return (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                    className="flex items-center gap-2"
                  >
                    <OptionIcon className="h-4 w-4 text-muted-foreground" />
                    {option.label}
                  </DropdownMenuRadioItem>
                );
              })}
            </DropdownMenuRadioGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
