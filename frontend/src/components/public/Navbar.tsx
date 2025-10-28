import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Privacy & Policy", href: "/privacy-policy" },
  { label: "Contact", href: "/contact" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobileMenu = () => setMobileOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-semibold text-primary"
          onClick={closeMobileMenu}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
            SP
          </span>
          <span className="hidden sm:inline-block">Student Portal</span>
          <span className="sm:hidden">Student Portal</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "transition-colors hover:text-primary",
                  isActive
                    ? "text-primary font-semibold underline decoration-2 decoration-primary underline-offset-8"
                    : "text-muted-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to="/login"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
          >
            Login
          </Link>
          <ThemeToggle className="ml-2" />
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-border p-2 text-primary md:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={toggleMobileMenu}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="border-t border-border bg-card shadow-lg md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-base font-medium text-muted-foreground">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 transition-colors hover:bg-primary/20 hover:text-primary",
                    isActive
                      ? "bg-accent/20 text-primary font-semibold"
                      : "text-muted-foreground"
                  )
                }
                onClick={closeMobileMenu}
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/login"
              className="rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
              onClick={closeMobileMenu}
            >
              Login
            </Link>
            <div className="pt-2">
              <ThemeToggle withLabel className="w-full justify-center" />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
