import Link from "next/link";

export function Footer() {
  return (
    <footer>
      <div>
        <h2>About Vodacom</h2>
        <ul>
          <li><Link href="/about">About Us</Link></li>
          <li><Link href="/careers">Careers</Link></li>
          <li><Link href="/press">Press</Link></li>
          <li><Link href="/investors">Investors</Link></li>
        </ul>
      </div>
      <div>
        <h2>Support</h2>
        <ul>
          <li><Link href="/support">Support Centre</Link></li>
          <li><Link href="/contact">Contact Us</Link></li>
          <li><Link href="/faq">FAQs</Link></li>
          <li><Link href="/stores">Store Locator</Link></li>
        </ul>
      </div>
      <div>
        <h2>Legal</h2>
        <ul>
          <li><Link href="/terms">Terms &amp; Conditions</Link></li>
          <li><Link href="/privacy">Privacy Policy</Link></li>
          <li><Link href="/cookies">Cookie Policy</Link></li>
          <li><Link href="/accessibility">Accessibility</Link></li>
        </ul>
      </div>
      <div>
        <h2>Follow Us</h2>
        <ul>
          <li><Link href="#">Facebook</Link></li>
          <li><Link href="#">Twitter</Link></li>
          <li><Link href="#">Instagram</Link></li>
          <li><Link href="#">LinkedIn</Link></li>
        </ul>
      </div>
      <p>© 2026 Vodacom Group. All rights reserved.</p>
    </footer>
  );
}
