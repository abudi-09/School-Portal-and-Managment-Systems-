import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface InfoCardProps {
  title: string;
  subtitle?: string;
  content?: string;
  children?: ReactNode;
  linkLabel?: string;
  href?: string;
  className?: string;
}

const InfoCard = ({
  title,
  subtitle,
  content,
  children,
  linkLabel,
  href,
  className,
}: InfoCardProps) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-6 shadow-lg",
        className
      )}
    >
      <div className="space-y-3">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {content && (
          <p className="text-base leading-relaxed text-gray-700">{content}</p>
        )}
        {children}
        {href && linkLabel && (
          <Link
            to={href}
            className="inline-flex text-sm font-medium text-[#0059ff] hover:underline"
          >
            {linkLabel}
          </Link>
        )}
      </div>
    </div>
  );
};

export default InfoCard;
