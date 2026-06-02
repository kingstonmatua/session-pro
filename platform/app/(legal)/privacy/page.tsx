import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — SessionPro',
  description: 'Read the SessionPro Privacy Policy.',
};

const SECTIONS = [
  { id: 'intro',       label: 'Introduction' },
  { id: 'collect',     label: 'Information We Collect' },
  { id: 'use',         label: 'How We Use It' },
  { id: 'sharing',     label: 'Sharing Your Information' },
  { id: 'payments',    label: 'Payment Information' },
  { id: 'cookies',     label: 'Cookies & Tracking' },
  { id: 'retention',   label: 'Data Retention' },
  { id: 'rights',      label: 'Your Rights' },
  { id: 'children',    label: "Children's Privacy" },
  { id: 'security',    label: 'Security' },
  { id: 'changes',     label: 'Policy Changes' },
  { id: 'contact',     label: 'Contact' },
];

export default function PrivacyPage() {
  return (
    <>
      <section className="legal-hero">
        <div className="container">
          <p className="legal-eyebrow">Legal</p>
          <h1 className="legal-title">Privacy Policy</h1>
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

              <h2 id="intro">Introduction</h2>
              <p className="legal-placeholder">
                {`[Counsel to insert: opening statement identifying SessionPro as the data controller, scope of this policy (who it applies to — Pros and clients), and a brief summary of the company's commitment to privacy.]`}
              </p>

              <h2 id="collect">Information We Collect</h2>
              <p className="legal-placeholder">
                [Counsel to insert: categories of data collected — account information (name, email, password), profile information (bio, photo, discipline, location), booking data (session times, client names), payment data (handled via Stripe — see Section 5), usage data (log files, device info), and any data collected from third-party integrations.]
              </p>

              <h2 id="use">How We Use Your Information</h2>
              <p className="legal-placeholder">
                [Counsel to insert: purposes for processing — operating the platform, processing bookings and payments, sending booking confirmations and reminders, displaying public Pro profiles, improving the service, fraud prevention, and legal compliance. Include legal basis for processing under applicable law (e.g., CCPA, if applicable).]
              </p>

              <h2 id="sharing">Sharing Your Information</h2>
              <p className="legal-placeholder">
                [Counsel to insert: who data is shared with — Stripe (payments), Supabase (database hosting), Vercel (hosting), email service providers (reminders/confirmations), and when data may be disclosed to law enforcement or in connection with a business transfer. Confirm no sale of personal data.]
              </p>

              <h2 id="payments">Payment Information</h2>
              <p className="legal-placeholder">
                {`[Counsel to insert: clarification that SessionPro does not store full card details — payments are processed by Stripe, Inc. and subject to Stripe's privacy policy. Include link to Stripe's privacy policy.]`}
              </p>

              <h2 id="cookies">Cookies & Tracking Technologies</h2>
              <p className="legal-placeholder">
                [Counsel to insert: types of cookies used (session, authentication), any analytics tools, and how users can control cookie preferences. Note if any third-party tracking is used.]
              </p>

              <h2 id="retention">Data Retention</h2>
              <p className="legal-placeholder">
                [Counsel to insert: how long different categories of data are kept — active account data, closed account data, booking records (for tax/legal purposes), and deletion timelines.]
              </p>

              <h2 id="rights">Your Rights & Choices</h2>
              <p className="legal-placeholder">
                [Counsel to insert: applicable user rights — access, correction, deletion, portability, objection to processing. Include how to exercise rights (email request process), response timelines, and any applicable state-specific rights (e.g., CCPA for California residents).]
              </p>

              <h2 id="children">Children&rsquo;s Privacy</h2>
              <p className="legal-placeholder">
                [Counsel to insert: statement that the platform is not directed at children under 13 (or applicable age), and what steps are taken if underage data is discovered.]
              </p>

              <h2 id="security">Security</h2>
              <p className="legal-placeholder">
                [Counsel to insert: description of security measures in place (encryption in transit and at rest, access controls), and the standard disclaimer that no method of transmission is 100% secure.]
              </p>

              <h2 id="changes">Changes to This Policy</h2>
              <p className="legal-placeholder">
                [Counsel to insert: how and when users are notified of material changes to this policy, and what continued use of the platform constitutes.]
              </p>

              <h2 id="contact">Contact</h2>
              <p>If you have questions or requests regarding your personal data, please contact us at <a href="mailto:hello@sessionpro.io">hello@sessionpro.io</a>.</p>

            </div>
          </div>
        </div>
      </section>
    </>
  );
}
