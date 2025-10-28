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
        "rounded-2xl border border-border bg-card p-6 shadow-lg",
        className
      )}
    >
      <div className="space-y-3">
        <div>
          <h3 className="text-xl font-semibold text-card-foreground">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {content && (
          <p className="text-base leading-relaxed text-muted-foreground">
            {content}
          </p>
        )}
        {children}
        {href && linkLabel && (
          <Link
            to={href}
            className="inline-flex text-sm font-medium text-primary hover:underline"
          >
            {linkLabel}
          </Link>
        )}
      </div>
    </div>
  );
};

export default InfoCard;
