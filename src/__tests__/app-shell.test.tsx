/**
 * Acceptance tests for the App Shell:
 *   - CartContext  (default count, shared updates)
 *   - Header       (logo, nav links, Account button, cart badge)
 *   - Footer       (four columns and copyright)
 *   - RootLayout   (integrates Header, Footer, CartProvider)
 *
 * All module imports below reference files that do not yet exist.
 * Every test MUST FAIL (red) until the feature is fully implemented.
 */

import React from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// These modules do not exist yet — the entire file fails to import until
// the feature is implemented, keeping every test red.
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider, useCart } from "@/context/CartContext";
import RootLayout from "@/app/layout";

// ---------------------------------------------------------------------------
// CartContext
// ---------------------------------------------------------------------------

describe("CartContext", () => {
  it("provides itemCount with a default value of 0", () => {
    function Consumer() {
      const { itemCount } = useCart();
      return <output data-testid="count">{itemCount}</output>;
    }
    render(
      <CartProvider>
        <Consumer />
      </CartProvider>
    );
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("allows consumers to update itemCount via setItemCount", async () => {
    const user = userEvent.setup();
    function Consumer() {
      const { itemCount, setItemCount } = useCart();
      return (
        <>
          <output data-testid="count">{itemCount}</output>
          <button onClick={() => setItemCount(7)}>set-7</button>
        </>
      );
    }
    render(
      <CartProvider>
        <Consumer />
      </CartProvider>
    );
    expect(screen.getByTestId("count")).toHaveTextContent("0");
    await user.click(screen.getByRole("button", { name: "set-7" }));
    expect(screen.getByTestId("count")).toHaveTextContent("7");
  });

  it("shares state changes across all consumers in the same provider", async () => {
    const user = userEvent.setup();
    function Updater() {
      const { setItemCount } = useCart();
      return <button onClick={() => setItemCount(4)}>set-4</button>;
    }
    function Reader() {
      const { itemCount } = useCart();
      return <output data-testid="reader">{itemCount}</output>;
    }
    render(
      <CartProvider>
        <Updater />
        <Reader />
      </CartProvider>
    );
    await user.click(screen.getByRole("button", { name: "set-4" }));
    expect(screen.getByTestId("reader")).toHaveTextContent("4");
  });
});

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

describe("Header", () => {
  function renderHeader() {
    return render(
      <CartProvider>
        <Header />
      </CartProvider>
    );
  }

  it("renders a landmark with role banner", () => {
    renderHeader();
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders the Vodacom logo as a link to /", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: /vodacom/i })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("renders a Devices nav link pointing to /catalog", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: /^devices$/i })).toHaveAttribute(
      "href",
      "/catalog"
    );
  });

  it("renders a Plans nav link pointing to /plans", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: /^plans$/i })).toHaveAttribute(
      "href",
      "/plans"
    );
  });

  it("renders an Accessories nav link pointing to /accessories", () => {
    renderHeader();
    expect(
      screen.getByRole("link", { name: /^accessories$/i })
    ).toHaveAttribute("href", "/accessories");
  });

  it("renders a Support nav link pointing to /support", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: /^support$/i })).toHaveAttribute(
      "href",
      "/support"
    );
  });

  it("renders an Account button", () => {
    renderHeader();
    expect(
      screen.getByRole("button", { name: /account/i })
    ).toBeInTheDocument();
  });

  it("renders a cart button with item count showing 0 by default", () => {
    renderHeader();
    const cartButton = screen.getByRole("button", { name: /cart/i });
    expect(cartButton).toBeInTheDocument();
    expect(cartButton).toHaveTextContent("0");
  });

  it("cart badge updates when CartContext itemCount changes", async () => {
    const user = userEvent.setup();

    function Wrapper() {
      const { setItemCount } = useCart();
      return (
        <>
          <Header />
          <button onClick={() => setItemCount(3)}>set-3</button>
        </>
      );
    }

    render(
      <CartProvider>
        <Wrapper />
      </CartProvider>
    );

    // Badge starts at 0
    expect(screen.getByRole("button", { name: /cart/i })).toHaveTextContent(
      "0"
    );

    await user.click(screen.getByRole("button", { name: "set-3" }));

    // Badge now reflects updated count
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /cart/i })
      ).toHaveTextContent("3")
    );
  });
});

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

describe("Footer", () => {
  beforeEach(() => {
    render(<Footer />);
  });

  it("renders a landmark with role contentinfo", () => {
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  // About Vodacom column
  it("renders the About Vodacom column heading", () => {
    expect(
      screen.getByRole("heading", { name: /about vodacom/i })
    ).toBeInTheDocument();
  });

  it("renders About Us link → /about", () => {
    expect(
      screen.getByRole("link", { name: /^about us$/i })
    ).toHaveAttribute("href", "/about");
  });

  it("renders Careers link → /careers", () => {
    expect(
      screen.getByRole("link", { name: /^careers$/i })
    ).toHaveAttribute("href", "/careers");
  });

  it("renders Press link → /press", () => {
    expect(
      screen.getByRole("link", { name: /^press$/i })
    ).toHaveAttribute("href", "/press");
  });

  it("renders Investors link → /investors", () => {
    expect(
      screen.getByRole("link", { name: /^investors$/i })
    ).toHaveAttribute("href", "/investors");
  });

  // Support column
  it("renders the Support column heading inside the footer", () => {
    const footer = screen.getByRole("contentinfo");
    expect(
      within(footer).getByRole("heading", { name: /^support$/i })
    ).toBeInTheDocument();
  });

  it("renders Support Centre link → /support", () => {
    expect(
      screen.getByRole("link", { name: /^support centre$/i })
    ).toHaveAttribute("href", "/support");
  });

  it("renders Contact Us link → /contact", () => {
    expect(
      screen.getByRole("link", { name: /^contact us$/i })
    ).toHaveAttribute("href", "/contact");
  });

  it("renders FAQs link → /faq", () => {
    expect(
      screen.getByRole("link", { name: /^faqs$/i })
    ).toHaveAttribute("href", "/faq");
  });

  it("renders Store Locator link → /stores", () => {
    expect(
      screen.getByRole("link", { name: /^store locator$/i })
    ).toHaveAttribute("href", "/stores");
  });

  // Legal column
  it("renders the Legal column heading", () => {
    expect(
      screen.getByRole("heading", { name: /^legal$/i })
    ).toBeInTheDocument();
  });

  it("renders Terms & Conditions link → /terms", () => {
    expect(
      screen.getByRole("link", { name: /^terms & conditions$/i })
    ).toHaveAttribute("href", "/terms");
  });

  it("renders Privacy Policy link → /privacy", () => {
    expect(
      screen.getByRole("link", { name: /^privacy policy$/i })
    ).toHaveAttribute("href", "/privacy");
  });

  it("renders Cookie Policy link → /cookies", () => {
    expect(
      screen.getByRole("link", { name: /^cookie policy$/i })
    ).toHaveAttribute("href", "/cookies");
  });

  it("renders Accessibility link → /accessibility", () => {
    expect(
      screen.getByRole("link", { name: /^accessibility$/i })
    ).toHaveAttribute("href", "/accessibility");
  });

  // Follow Us column
  it("renders the Follow Us column heading", () => {
    expect(
      screen.getByRole("heading", { name: /follow us/i })
    ).toBeInTheDocument();
  });

  it("renders Facebook link → #", () => {
    expect(
      screen.getByRole("link", { name: /^facebook$/i })
    ).toHaveAttribute("href", "#");
  });

  it("renders Twitter link → #", () => {
    expect(
      screen.getByRole("link", { name: /^twitter$/i })
    ).toHaveAttribute("href", "#");
  });

  it("renders Instagram link → #", () => {
    expect(
      screen.getByRole("link", { name: /^instagram$/i })
    ).toHaveAttribute("href", "#");
  });

  it("renders LinkedIn link → #", () => {
    expect(
      screen.getByRole("link", { name: /^linkedin$/i })
    ).toHaveAttribute("href", "#");
  });

  // Copyright
  it("renders the copyright notice", () => {
    expect(
      screen.getByText(/© 2026 Vodacom Group\. All rights reserved\./i)
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// RootLayout integration
// ---------------------------------------------------------------------------

describe("RootLayout", () => {
  it("renders a header landmark (banner) on every page", () => {
    render(<RootLayout>content</RootLayout>);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders a footer landmark (contentinfo) on every page", () => {
    render(<RootLayout>content</RootLayout>);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders children inside the layout body", () => {
    render(<RootLayout>page content</RootLayout>);
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("provides CartContext to child pages so they can read cart state", () => {
    function CartConsumer() {
      const { itemCount } = useCart();
      return <span data-testid="child-count">{itemCount}</span>;
    }
    render(
      <RootLayout>
        <CartConsumer />
      </RootLayout>
    );
    expect(screen.getByTestId("child-count")).toHaveTextContent("0");
  });

  it("cart badge in header shows 0 on initial load (SSR-like initial render)", () => {
    render(<RootLayout>content</RootLayout>);
    const cartButton = screen.getByRole("button", { name: /cart/i });
    expect(cartButton).toHaveTextContent("0");
  });
});
