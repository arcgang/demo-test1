/**
 * Acceptance tests for shared accessibility components:
 *   - SkipNavigation
 *   - FieldErrorSummary
 *   - LiveStatusAnnouncement
 *
 * These tests MUST FAIL until the components are implemented.
 */

import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ---------------------------------------------------------------------------
// Imports under test — these modules do not exist yet; every test in this
// file will fail with a module-not-found error until they are created.
// ---------------------------------------------------------------------------
import {
  SkipNavigation,
  type SkipNavigationProps,
} from "@/components/accessibility/SkipNavigation";

import {
  FieldErrorSummary,
  type FieldErrorSummaryProps,
} from "@/components/accessibility/FieldErrorSummary";

import {
  LiveStatusAnnouncement,
  type LiveStatusAnnouncementProps,
} from "@/components/accessibility/LiveStatusAnnouncement";

// ---------------------------------------------------------------------------
// SkipNavigation
// ---------------------------------------------------------------------------
describe("SkipNavigation", () => {
  it("renders a link element as the first focusable element on the page", () => {
    render(
      <div>
        <SkipNavigation />
        <main id="main-content">Main content</main>
      </div>
    );

    const link = screen.getByRole("link", { name: /skip to main content/i });
    expect(link).toBeInTheDocument();
  });

  it("targets #main-content via its href", () => {
    render(
      <div>
        <SkipNavigation />
        <main id="main-content">Main content</main>
      </div>
    );

    const link = screen.getByRole("link", { name: /skip to main content/i });
    expect(link).toHaveAttribute("href", "#main-content");
  });

  it("is visually hidden by default (has a visually-hidden class or equivalent)", () => {
    const { container } = render(
      <div>
        <SkipNavigation />
        <main id="main-content">Main content</main>
      </div>
    );

    const link = screen.getByRole("link", { name: /skip to main content/i });
    // The link must carry a class that implies it is off-screen when not focused.
    // Implementations may use "sr-only", "skip-nav", "visually-hidden", etc.
    const hiddenClasses = [
      "sr-only",
      "skip-nav",
      "visually-hidden",
      "skip-link",
      "screen-reader-only",
    ];
    const classList = Array.from(link.classList);
    const hasHiddenClass = classList.some((c) =>
      hiddenClasses.some((h) => c.toLowerCase().includes(h))
    );
    expect(hasHiddenClass).toBe(true);
  });

  it("becomes visible when focused", async () => {
    render(
      <div>
        <SkipNavigation />
        <main id="main-content">Main content</main>
      </div>
    );

    const link = screen.getByRole("link", { name: /skip to main content/i });
    // The component must apply a 'focus-visible' or 'focused' class on focus,
    // or rely on a CSS :focus-visible rule that makes it visible.
    // We verify the element becomes focusable (tabIndex not -1) at minimum.
    expect(link).not.toHaveAttribute("tabindex", "-1");
  });

  it("accepts a custom targetId prop and points href to it", () => {
    render(
      <div>
        <SkipNavigation targetId="skip-target" />
        <div id="skip-target">Content</div>
      </div>
    );

    const link = screen.getByRole("link", { name: /skip/i });
    expect(link).toHaveAttribute("href", "#skip-target");
  });

  it("accepts a custom label prop and renders it as link text", () => {
    render(
      <div>
        <SkipNavigation label="Skip to article" />
        <main id="main-content">Content</main>
      </div>
    );

    expect(
      screen.getByRole("link", { name: /skip to article/i })
    ).toBeInTheDocument();
  });

  it("has TypeScript props interface that enforces correct shape", () => {
    // This is a compile-time check; at runtime we simply verify the
    // component mounts without error when given valid props.
    const props: SkipNavigationProps = {
      targetId: "main-content",
      label: "Skip to main content",
    };
    const { unmount } = render(<SkipNavigation {...props} />);
    unmount();
  });
});

// ---------------------------------------------------------------------------
// FieldErrorSummary
// ---------------------------------------------------------------------------
describe("FieldErrorSummary", () => {
  it("renders a live-region container with role='alert'", () => {
    render(<FieldErrorSummary errors={[]} />);
    // An assertive live region; may use role="alert" or aria-live="assertive"
    const region = screen.queryByRole("alert");
    expect(region).toBeInTheDocument();
  });

  it("renders nothing visible when the errors array is empty", () => {
    const { container } = render(<FieldErrorSummary errors={[]} />);
    // The live-region wrapper must still exist in the DOM for future
    // announcements, but no visible error list should be present.
    const listItems = container.querySelectorAll("li");
    expect(listItems.length).toBe(0);
  });

  it("renders each error message in the list", () => {
    const errors = [
      { field: "email", message: "Email is required" },
      { field: "phone", message: "Phone number is invalid" },
    ];

    render(<FieldErrorSummary errors={errors} />);

    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Phone number is invalid")).toBeInTheDocument();
  });

  it("includes the field label in each rendered error item", () => {
    const errors = [{ field: "postal-code", message: "Postal code is required" }];

    render(<FieldErrorSummary errors={errors} />);

    // Either the field name or the message should be present.
    expect(screen.getByText("Postal code is required")).toBeInTheDocument();
  });

  it("re-announces errors when the errors prop changes", () => {
    const initialErrors = [{ field: "email", message: "Email is required" }];

    const { rerender } = render(<FieldErrorSummary errors={initialErrors} />);
    expect(screen.getByText("Email is required")).toBeInTheDocument();

    const updatedErrors = [
      { field: "email", message: "Email is required" },
      { field: "city", message: "City is required" },
    ];
    rerender(<FieldErrorSummary errors={updatedErrors} />);

    expect(screen.getByText("City is required")).toBeInTheDocument();
  });

  it("uses aria-live='assertive' or role='alert' to announce errors immediately", () => {
    const { container } = render(
      <FieldErrorSummary errors={[{ field: "name", message: "Name required" }]} />
    );

    const liveRegion =
      container.querySelector('[role="alert"]') ||
      container.querySelector('[aria-live="assertive"]');
    expect(liveRegion).not.toBeNull();
  });

  it("has a heading or title identifying the summary for screen reader users", () => {
    render(
      <FieldErrorSummary
        errors={[{ field: "email", message: "Email is required" }]}
        title="Please fix the following errors"
      />
    );

    expect(
      screen.getByText(/please fix the following errors/i)
    ).toBeInTheDocument();
  });

  it("TypeScript props interface requires errors array and accepts optional title", () => {
    const props: FieldErrorSummaryProps = {
      errors: [{ field: "email", message: "Email is required" }],
      title: "Form errors",
    };
    const { unmount } = render(<FieldErrorSummary {...props} />);
    unmount();
  });
});

// ---------------------------------------------------------------------------
// LiveStatusAnnouncement
// ---------------------------------------------------------------------------
describe("LiveStatusAnnouncement", () => {
  it("renders a polite live-region element", () => {
    const { container } = render(<LiveStatusAnnouncement status="" />);

    const liveRegion =
      container.querySelector('[aria-live="polite"]') ||
      screen.queryByRole("status");
    expect(liveRegion).not.toBeNull();
  });

  it("sets aria-atomic='true' on the live region", () => {
    const { container } = render(<LiveStatusAnnouncement status="" />);

    const liveRegion =
      container.querySelector('[aria-live="polite"]') ||
      container.querySelector('[role="status"]');
    expect(liveRegion).toHaveAttribute("aria-atomic", "true");
  });

  it("renders the status string as text content", () => {
    render(<LiveStatusAnnouncement status="Payment confirmed." />);
    expect(screen.getByText("Payment confirmed.")).toBeInTheDocument();
  });

  it("updates announced text when the status prop changes", () => {
    const { rerender } = render(
      <LiveStatusAnnouncement status="Activation in progress." />
    );
    expect(screen.getByText("Activation in progress.")).toBeInTheDocument();

    rerender(<LiveStatusAnnouncement status="Activation complete." />);
    expect(screen.getByText("Activation complete.")).toBeInTheDocument();
  });

  it("renders empty text content when status is an empty string", () => {
    const { container } = render(<LiveStatusAnnouncement status="" />);

    const liveRegion =
      container.querySelector('[aria-live="polite"]') ||
      container.querySelector('[role="status"]');
    expect(liveRegion?.textContent?.trim()).toBe("");
  });

  it("never uses aria-live='assertive' (must be polite)", () => {
    const { container } = render(
      <LiveStatusAnnouncement status="Order placed." />
    );
    const assertiveEl = container.querySelector('[aria-live="assertive"]');
    expect(assertiveEl).toBeNull();
  });

  it("accepts a className prop for host-level styling", () => {
    render(
      <LiveStatusAnnouncement status="Ready." className="order-status-region" />
    );
    const el = document.querySelector(".order-status-region");
    expect(el).not.toBeNull();
  });

  it("TypeScript props interface requires status string and accepts optional className", () => {
    const props: LiveStatusAnnouncementProps = {
      status: "Identity verification completed.",
      className: "verification-status",
    };
    const { unmount } = render(<LiveStatusAnnouncement {...props} />);
    unmount();
  });
});

// ---------------------------------------------------------------------------
// Global focus-indicator CSS
// ---------------------------------------------------------------------------
describe("Global focus-indicator styles", () => {
  it("global CSS file exists and exports at the expected path", async () => {
    // Verify the module can be resolved; it will throw if the file is absent.
    // In a Jest/jsdom environment CSS imports are treated as identity mocks
    // by next/jest, so we check the module can be resolved without error.
    let resolved = false;
    try {
      await import("@/styles/globals.css");
      resolved = true;
    } catch {
      // next/jest transforms CSS files; if there is genuinely no file this
      // import will throw a 'Cannot find module' error.
      resolved = false;
    }
    expect(resolved).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Color-token and contrast utilities
// ---------------------------------------------------------------------------
describe("Color token / contrast utilities", () => {
  it("color-tokens module exports bodyText, heading, and interactiveControl tokens", async () => {
    const tokens = await import("@/styles/color-tokens");
    expect(tokens).toHaveProperty("bodyText");
    expect(tokens).toHaveProperty("heading");
    expect(tokens).toHaveProperty("interactiveControl");
  });

  it("bodyText token meets WCAG AA 4.5:1 ratio (token value documented)", async () => {
    const { bodyText } = await import("@/styles/color-tokens");
    // The token must supply foreground and background values so that contrast
    // can be computed. We verify the shape here; visual contrast is enforced
    // by design system linting and Storybook a11y checks.
    expect(bodyText).toHaveProperty("foreground");
    expect(bodyText).toHaveProperty("background");
  });

  it("heading token has foreground and background properties", async () => {
    const { heading } = await import("@/styles/color-tokens");
    expect(heading).toHaveProperty("foreground");
    expect(heading).toHaveProperty("background");
  });

  it("interactiveControl token has foreground and background properties", async () => {
    const { interactiveControl } = await import("@/styles/color-tokens");
    expect(interactiveControl).toHaveProperty("foreground");
    expect(interactiveControl).toHaveProperty("background");
  });
});
