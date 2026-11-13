import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, Empty, PageHead, Stat } from "./PageHead";

describe("PageHead helpers", () => {
  it("renders title, subtitle and optional note", () => {
    const { rerender } = render(<PageHead title="Gates" sub="Live" />);
    expect(screen.getByRole("heading", { name: "Gates" })).toBeInTheDocument(); expect(screen.getByText("Live")).toBeInTheDocument();
    rerender(<PageHead title="Gates" sub="Live" note="Assumption X" />); expect(screen.getByText("Assumption X")).toBeInTheDocument();
  });
  it("Stat, Card and Empty show their content", () => {
    render(<><Stat label="Flights" value={12} sub="today" /><Card>inside</Card><Empty>nothing</Empty></>);
    expect(screen.getByText("12")).toBeInTheDocument(); expect(screen.getByText("Flights")).toBeInTheDocument();
    expect(screen.getByText("inside")).toBeInTheDocument(); expect(screen.getByText("nothing")).toBeInTheDocument();
  });
});
