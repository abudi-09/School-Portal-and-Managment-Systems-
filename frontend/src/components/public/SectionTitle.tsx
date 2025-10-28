import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
}

const SectionTitle = ({
  eyebrow,
  title,
  description,
  align = "center",
  className,
  children,
}: SectionTitleProps) => {
  return (
    <div
      className={cn(
        "mx-auto max-w-3xl space-y-4",
        align === "center" ? "text-center" : "text-left",
        className
      )}
    >
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="text-base text-muted-foreground sm:text-lg">
          {description}
        </p>
      )}
      {children}
    </div>
  );
};

export default SectionTitle;
