import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { SkeletonWrapper } from "@/components/skeleton";

describe("SkeletonWrapper", () => {
  it("renders skeleton when isLoading is true", () => {
    render(
      <SkeletonWrapper
        isLoading
        skeleton={<div data-testid="skeleton">loading…</div>}
      >
        <div data-testid="content">content</div>
      </SkeletonWrapper>
    );
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("renders children when isLoading is false", () => {
    render(
      <SkeletonWrapper
        isLoading={false}
        skeleton={<div data-testid="skeleton">loading…</div>}
      >
        <div data-testid="content">content</div>
      </SkeletonWrapper>
    );
    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(screen.queryByTestId("skeleton")).toBeNull();
  });
});
