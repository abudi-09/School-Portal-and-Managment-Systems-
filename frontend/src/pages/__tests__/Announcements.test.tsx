import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import Announcements from "@/pages/Announcements";

vi.mock("@/lib/api/announcementsApi", async () => {
  return {
    getAnnouncements: vi.fn(
      async ({ type }: { type: "school" | "teacher" }) => {
        if (type === "school") {
          return {
            items: [
              {
                _id: "a1",
                title: "Test Announcement",
                postedBy: { user: "u1", name: "Head", role: "head" },
                date: new Date().toISOString(),
                type: "school",
                message:
                  "A long message that should be truncated because it exceeds 150 characters. ".repeat(
                    4
                  ),
                attachments: [],
                isRead: false,
              },
            ],
            total: 1,
            unreadCount: 1,
          };
        }
        return { items: [], total: 0, unreadCount: 0 };
      }
    ),
    getUnreadCount: vi.fn(async () => 1),
    markRead: vi.fn(async () => {}),
  };
});

describe("Announcements page", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("renders skeleton while loading and then shows announcements", async () => {
    render(<Announcements />);
    // skeleton should be visible initially (by role)
    expect(await screen.findByRole("status")).toBeInTheDocument();
    // Eventually, card title appears
    expect(await screen.findByText("Test Announcement")).toBeInTheDocument();
  });

  it("marks an announcement as read when clicking Read more", async () => {
    const api = await import("@/lib/api/announcementsApi");
    const markReadSpy = vi.spyOn(api, "markRead");

    render(<Announcements />);

    const btn = await screen.findByRole("button", { name: /read more/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(markReadSpy).toHaveBeenCalledTimes(1);
      expect(markReadSpy).toHaveBeenCalledWith("a1");
    });
  });
});
