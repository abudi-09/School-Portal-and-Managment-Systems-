import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-muted/40 py-8 text-muted-foreground">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 text-sm sm:px-6 md:grid-cols-3 lg:px-8">
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-foreground">
            Student Portal &amp; School Management System
          </h3>
          <p className="text-sm leading-relaxed">
            Empowering schools with centralized student, teacher, and class
            management.
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Quick Links</h4>
          <nav className="flex flex-col gap-2">
            <Link to="/" className="transition-colors hover:text-primary">
              Home
            </Link>
            <Link to="/about" className="transition-colors hover:text-primary">
              About
            </Link>
            <Link
              to="/privacy-policy"
              className="transition-colors hover:text-primary"
            >
              Privacy Policy
            </Link>
            <Link
              to="/contact"
              className="transition-colors hover:text-primary"
            >
              Help
            </Link>
          </nav>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Contact</h4>
          <p>
            Email:{" "}
            <a
              href="mailto:support@schoolportal.edu"
              className="hover:text-primary"
            >
              support@schoolportal.edu
            </a>
          </p>
          <p>Phone: +251-xxx-xxx-xxx</p>
          <p>Address: Gondar, Ethiopia</p>
        </div>
      </div>
      <div className="mt-6 border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-1 px-4 py-4 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
          <p>
            © 2025 Student Portal &amp; School Management System — All Rights
            Reserved.
          </p>
          <p>System version v1.0.0</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
