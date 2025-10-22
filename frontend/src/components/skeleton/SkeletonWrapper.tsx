import React from "react";

interface SkeletonWrapperProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  ariaLabel?: string;
}

export const SkeletonWrapper: React.FC<SkeletonWrapperProps> = ({
  isLoading,
  skeleton,
  children,
  ariaLabel,
}) => {
  if (isLoading) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label={ariaLabel ?? "Loading content"}
      >
        {skeleton}
      </div>
    );
  }
  return <>{children}</>;
};
