import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — SessionPro',
  description: 'Read the SessionPro Terms of Service.',
};

const SECTIONS = [
  { id: 'agreement',     label: 'Agreement to Terms' },
  { id: 'services',      label: 'Our Services' },
  { id: 'accounts',      label: 'User Accounts' },
  { id: 'payments',      label: 'Payments & Fees' },
  { id: 'cancellations', label: 'Cancellations & Refunds' },
  { id: 'conduct',       label: 'Prohibited Conduct' },
  { id: 'ip',            label: 'Intellectual Property' },
  { id: 'disclaimers',   label: 'Disclaimers' },
  { id: 'liability',     label: 'Limitation of Liability' },
  { id: 'indemnification', label: 'Indemnification' },
  { id: 'governing-law', label: 'Governing Law' },
  { id: 'changes',       label: 'Changes to Terms' },
  { id: 'contact',       label: 'Contact' },
];

export default function TermsPage() {
  return (
    <>
      <section className="legal-hero">
        <div className="container">
          <p className="legal-eyebrow">Legal</p>
          <h1 className="legal-title">Terms of Service</h1>
          <p className="legal-meta">Last updated: [Date — to be confirmed by counsel]</p>
        </div>
      </section>

      <section className="legal-body">
        <div className="container">
          <div className="legal-grid">

            {/* Table of contents */}
            <aside className="legal-toc" aria-label="Table of contents">
              <p className="legal-toc-heading">Contents</p>
              {SECTIONS.map(s => (
                <a key={s.id} href={`#${s.id}`}>{s.label}</a>
              ))}
            </aside>

            {/* Body */}
            <div className="legal-content">

              <h2 id="agreement">1. Agreement to Terms</h2>
              <p className="legal-placeholder">
                [Counsel to insert: introduction paragraph confirming that use of SessionPro constitutes acceptance of these Terms, effective date, and any age or eligibility requirements.]
              </p>

              <h2 id="services">2. Our Services</h2>
              <p className="legal-placeholder">
                [Counsel to insert: description of SessionPro as a marketplace platform connecting independent professionals ("Pros") with clients, clarifying that SessionPro is not a party to the underlying service transaction and does not employ Pros.]
              </p>

              <h2 id="accounts">3. User Accounts</h2>
              <p className="legal-placeholder">
                [Counsel to insert: account creation requirements, responsibility for account security and credentials, prohibition on sharing accounts, and rights to suspend or terminate accounts.]
              </p>

              <h2 id="payments">4. Payments & Fees</h2>
              <p className="legal-placeholder">
                [Counsel to insert: description of the 10% platform fee deducted at checkout, how payouts are processed via Stripe Connect, timing of payouts, currency, and any applicable taxes or withholding obligations.]
              </p>

              <h2 id="cancellations">5. Cancellations & Refunds</h2>
              <p className="legal-placeholder">
                [Counsel to insert: cancellation policy (currently free cancellation within 24 hours), refund process, what happens to the platform fee on cancellation, and any exceptions.]
              </p>

              <h2 id="conduct">6. Prohibited Conduct</h2>
              <p className="legal-placeholder">
                [Counsel to insert: list of prohibited uses — including fraud, impersonation, circumventing platform payments, harassment, and any other prohibited activities.]
              </p>

              <h2 id="ip">7. Intellectual Property</h2>
              <p className="legal-placeholder">
                [Counsel to insert: ownership of SessionPro platform IP, license granted to users for platform use, ownership of user-submitted content (photos, bio, reviews), and any DMCA/takedown provisions.]
              </p>

              <h2 id="disclaimers">8. Disclaimer of Warranties</h2>
              <p className="legal-placeholder">
                [Counsel to insert: standard disclaimer that the platform is provided "as is," no warranty of uptime or accuracy, and that SessionPro does not verify Pro credentials or guarantee quality of sessions.]
              </p>

              <h2 id="liability">9. Limitation of Liability</h2>
              <p className="legal-placeholder">
                [Counsel to insert: cap on SessionPro's liability, exclusion of consequential/indirect damages, and any jurisdictional carve-outs.]
              </p>

              <h2 id="indemnification">10. Indemnification</h2>
              <p className="legal-placeholder">
                [Counsel to insert: user indemnification obligations for third-party claims arising from their use of the platform or their conduct as a Pro or client.]
              </p>

              <h2 id="governing-law">11. Governing Law & Dispute Resolution</h2>
              <p className="legal-placeholder">
                [Counsel to insert: choice of law, jurisdiction, arbitration clause (if applicable), and class action waiver.]
              </p>

              <h2 id="changes">12. Changes to These Terms</h2>
              <p className="legal-placeholder">
                [Counsel to insert: process for notifying users of material changes, effective date of changes, and what continued use constitutes.]
              </p>

              <h2 id="contact">13. Contact</h2>
              <p>If you have questions about these Terms, please contact us at <a href="mailto:hello@sessionpro.io">hello@sessionpro.io</a>.</p>

            </div>
          </div>
        </div>
      </section>
    </>
  );
}
