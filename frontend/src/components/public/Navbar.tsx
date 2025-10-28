import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <header className="sticky top-0 z-40 w-full bg-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-semibold text-[#0059ff]"
          onClick={closeMobileMenu}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0059ff] text-sm font-bold uppercase tracking-wider text-white shadow-sm">
            SP
          </span>
          <span className="hidden sm:inline-block">Student Portal</span>
          <span className="sm:hidden">Student Portal</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "transition-colors hover:text-[#0059ff]",
                  isActive
                    ? "text-[#0059ff] font-semibold underline decoration-2 decoration-[#0059ff] underline-offset-8"
                    : "text-slate-600"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to="/login"
            className="rounded-lg bg-[#0059ff] px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#0044cc]"
          >
            Login
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-blue-100/70 p-2 text-[#0059ff] md:hidden"
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
          className="border-t border-slate-200 bg-white shadow-lg md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-base font-medium text-slate-700">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 transition-colors hover:bg-blue-50 hover:text-[#0059ff]",
                    isActive
                      ? "bg-blue-50 text-[#0059ff] font-semibold"
                      : "text-slate-600"
                  )
                }
                onClick={closeMobileMenu}
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/login"
              className="rounded-md bg-[#0059ff] px-3 py-2 text-center text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#0044cc]"
              onClick={closeMobileMenu}
            >
              Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
