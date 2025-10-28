import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-100 py-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 text-sm text-gray-600 sm:px-6 md:grid-cols-3 lg:px-8">
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-gray-900">
            Smart Education Portal
          </h3>
          <p className="text-sm leading-relaxed">
            Empowering schools with centralized student, teacher, and class
            management.
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-900">Quick Links</h4>
          <nav className="flex flex-col gap-2">
            <Link to="/" className="transition-colors hover:text-[#0059ff]">
              Home
            </Link>
            <Link
              to="/about"
              className="transition-colors hover:text-[#0059ff]"
            >
              About
            </Link>
            <Link
              to="/privacy-policy"
              className="transition-colors hover:text-[#0059ff]"
            >
              Privacy & Policy
            </Link>
            <Link
              to="/contact"
              className="transition-colors hover:text-[#0059ff]"
            >
              Contact
            </Link>
          </nav>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-900">Contact</h4>
          <p>
            Email:{" "}
            <a
              href="mailto:contact@schoolportal.com"
              className="hover:text-[#0059ff]"
            >
              contact@schoolportal.com
            </a>
          </p>
          <p>Phone: +251 XXX XXX XXX</p>
          <p>Address: Addis Ababa, Ethiopia</p>
        </div>
      </div>
      <div className="mt-6 border-t border-gray-200">
        <p className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-gray-500 sm:px-6 lg:px-8">
          © 2025 Smart Education Portal — All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
