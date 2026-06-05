import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — SessionPro',
  description: 'Read the SessionPro Terms of Service.',
};

const SECTIONS = [
  { id: 'about',           label: 'About SessionPro' },
  { id: 'eligibility',     label: 'Eligibility' },
  { id: 'contractor',      label: 'Independent Contractor Relationship' },
  { id: 'services',        label: 'Platform Services' },
  { id: 'accounts',        label: 'Account Registration & Security' },
  { id: 'profiles',        label: 'Profiles and Content' },
  { id: 'reviews',         label: 'Client Reviews' },
  { id: 'payments',        label: 'Fees, Payments, and Payouts' },
  { id: 'cancellations',   label: 'Refunds and Cancellations' },
  { id: 'chargebacks',     label: 'Chargebacks and Payment Disputes' },
  { id: 'packages',        label: 'Session Packages' },
  { id: 'taxes',           label: 'Taxes' },
  { id: 'conduct',         label: 'Acceptable Use' },
  { id: 'disclaimer',      label: 'Professional Services Disclaimer' },
  { id: 'privacy',         label: 'Data and Privacy' },
  { id: 'ip',              label: 'Intellectual Property' },
  { id: 'warranty',        label: 'Warranty Disclaimer' },
  { id: 'liability',       label: 'Limitation of Liability' },
  { id: 'indemnification', label: 'Indemnification' },
  { id: 'termination',     label: 'Suspension and Termination' },
  { id: 'disputes',        label: 'Dispute Resolution' },
  { id: 'governing-law',   label: 'Governing Law and Venue' },
  { id: 'changes',         label: 'Changes to These Terms' },
  { id: 'miscellaneous',   label: 'Miscellaneous' },
  { id: 'contact',         label: 'Contact' },
];

export default function TermsPage() {
  return (
    <>
      <section className="legal-hero">
        <div className="container">
          <p className="legal-eyebrow">Legal</p>
          <h1 className="legal-title">Terms of Service</h1>
          <p className="legal-meta">Effective Date: June 1, 2026</p>
        </div>
      </section>

      <section className="legal-body">
        <div className="container">
          <div className="legal-grid">

            <aside className="legal-toc" aria-label="Table of contents">
              <p className="legal-toc-heading">Contents</p>
              {SECTIONS.map(s => (
                <a key={s.id} href={`#${s.id}`}>{s.label}</a>
              ))}
            </aside>

            <div className="legal-content">

              <p>Welcome to SessionPro. These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the SessionPro platform, website, software, and related services available at sessionpro.io (collectively, the &ldquo;Platform&rdquo;).</p>
              <p>By creating an account, accessing, or using SessionPro, you agree to be bound by these Terms. If you do not agree to these Terms, you may not use the Platform.</p>

              <h2 id="about">About SessionPro</h2>
              <p>SessionPro is an online booking and discovery platform that helps independent coaches, instructors, trainers, and service professionals (collectively, &ldquo;Pros&rdquo;) connect with clients and manage bookings.</p>
              <p>SessionPro provides scheduling, payment processing, profile hosting, communication tools, and related technology services. SessionPro is not a provider of coaching, training, instruction, healthcare, therapy, or professional services.</p>

              <h2 id="eligibility">Eligibility</h2>
              <p>By using the Platform, you represent that you are at least 18 years old and legally authorized to provide the services you offer.</p>

              <h2 id="contractor">Independent Contractor Relationship</h2>
              <p>Pros using SessionPro are independent businesses and independent contractors. SessionPro:</p>
              <ul>
                <li>Does not employ Pros;</li>
                <li>Does not supervise or control how services are performed;</li>
                <li>Does not establish pricing for Pros;</li>
                <li>Does not direct schedules, teaching methods, training methods, or session content;</li>
                <li>Is not a party to the agreement between a Pro and a client beyond facilitating bookings and payments.</li>
              </ul>
              <p>Nothing in these Terms creates any employment, agency, partnership, franchise, or joint venture relationship between SessionPro and any Pro.</p>
              <p>Pros are solely responsible for:</p>
              <ul>
                <li>Their services;</li>
                <li>Their interactions with clients;</li>
                <li>Taxes and reporting obligations;</li>
                <li>Insurance requirements;</li>
                <li>Compliance with laws applicable to their discipline and location.</li>
              </ul>

              <h2 id="services">Platform Services</h2>
              <p>SessionPro provides online scheduling, profile hosting, payment processing integrations, communication tools, and related booking management services. Features may be added, modified, suspended, or discontinued at any time.</p>

              <h2 id="accounts">Account Registration and Security</h2>
              <p>You are responsible for maintaining accurate account information and safeguarding your login credentials. You are responsible for all activity occurring under your account.</p>
              <p>SessionPro may suspend or terminate accounts that contain false, misleading, incomplete, or fraudulent information.</p>

              <h2 id="profiles">Profiles and Content</h2>
              <p>You retain ownership of your content but grant SessionPro a worldwide, non-exclusive, royalty-free license to host, display, reproduce, and use such content to operate, market, and improve the Platform.</p>
              <p>You represent and warrant that:</p>
              <ul>
                <li>You own or have the rights necessary to use all submitted content;</li>
                <li>Your content is truthful and not misleading;</li>
                <li>Your content does not infringe any third-party rights.</li>
              </ul>
              <p>SessionPro reserves the right to remove or modify content that violates these Terms or may expose the Platform to liability.</p>

              <h2 id="reviews">Client Reviews</h2>
              <p>Client reviews reflect the opinions of individual users. SessionPro is not responsible for review content but reserves the right to remove reviews that violate these Terms or applicable law.</p>
              <p>Reviews must reflect genuine, firsthand experiences with a Pro&rsquo;s services. The following are prohibited: submitting reviews for sessions that did not occur, submitting reviews on behalf of another person, coordinating reviews to artificially inflate or damage a Pro&rsquo;s rating, and submitting multiple reviews for the same session. SessionPro reserves the right to remove reviews that appear fraudulent, inauthentic, or in violation of these Terms without notice.</p>

              <h2 id="payments">Fees, Payments, and Payouts</h2>
              <h3>Platform Fee</h3>
              <p>SessionPro currently charges Pros a 10% platform fee on completed bookings. The platform fee is automatically deducted prior to payout. SessionPro reserves the right to modify fees in the future with reasonable notice.</p>
              <h3>Payment Processing</h3>
              <p>Payments are processed through Stripe Connect or other third-party payment providers. By using SessionPro, you agree to comply with all applicable Stripe terms, policies, and onboarding requirements. Pros are solely responsible for maintaining compliant and active Stripe accounts. SessionPro is not responsible for payment delays, processor holds, chargebacks, banking issues, or Stripe-related disputes.</p>
              <h3>Payouts</h3>
              <p>Pros generally receive payouts after session completion, less applicable fees, refunds, chargebacks, taxes, or adjustments. Timing of payouts may depend on Stripe policies and banking systems.</p>

              <h2 id="cancellations">Refunds and Cancellations</h2>
              <p>Clients may cancel sessions for a full refund up to 24 hours before the scheduled session time unless otherwise stated on the booking page.</p>
              <p>If a refund is issued:</p>
              <ul>
                <li>The applicable booking amount may be deducted from the Pro&rsquo;s pending or future payouts;</li>
                <li>Non-refundable payment processing fees charged by Stripe or payment providers may be deducted from the refunded amount or borne by the Pro;</li>
                <li>SessionPro reserves the right to determine the operational handling of refunds, disputes, and processing fees.</li>
              </ul>
              <p>Pros are responsible for honoring their stated cancellation policies.</p>
              <p>If a Pro cancels a confirmed booking, the client will receive a full refund of the booking amount. Non-refundable payment processing fees charged by Stripe or other payment providers may be deducted from the refunded amount or borne by the Pro. Pros are expected to provide reasonable notice of cancellation and are responsible for notifying affected clients promptly. SessionPro reserves the right to suspend or terminate accounts with repeated or pattern cancellations.</p>

              <h2 id="chargebacks">Chargebacks and Payment Disputes</h2>
              <p>Pros are solely responsible for disputes relating to the services they provide. SessionPro may cooperate with payment processors and financial institutions regarding disputes and may withhold payouts during investigations.</p>

              <h2 id="packages">Session Packages</h2>
              <p>Pros may offer session packages (bundles of multiple sessions sold at a single price). For packages, refunds are handled on a pro-rated basis: the client is entitled to a refund for unused sessions at the per-session rate implied by the package price, less any non-refundable payment processing fees. Sessions already used are non-refundable. SessionPro reserves the right to determine the operational handling of package refunds, disputes, and processing fees on a case-by-case basis.</p>

              <h2 id="taxes">Taxes</h2>
              <p>Pros are solely responsible for:</p>
              <ul>
                <li>Reporting and paying taxes;</li>
                <li>Sales taxes, income taxes, self-employment taxes, and other governmental obligations;</li>
                <li>Maintaining any required business registrations or licenses.</li>
              </ul>
              <p>SessionPro does not provide tax advice.</p>

              <h2 id="conduct">Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Misrepresent your qualifications, certifications, or experience;</li>
                <li>Use the Platform unlawfully;</li>
                <li>Harass, abuse, threaten, or discriminate against users;</li>
                <li>Circumvent platform fees;</li>
                <li>Use the Platform to distribute spam or malicious software;</li>
                <li>Attempt unauthorized access to the Platform;</li>
                <li>Scrape or harvest user data;</li>
                <li>Use client data for unrelated marketing or purposes outside legitimate SessionPro bookings;</li>
                <li>Solicit, accept, or process payment directly from a client introduced through the Platform for services that would otherwise be bookable through the Platform, with the intent to circumvent platform fees;</li>
                <li>Interfere with Platform operations.</li>
              </ul>
              <p>SessionPro may investigate violations and take appropriate action, including suspension or termination.</p>

              <h2 id="disclaimer">Professional Services Disclaimer</h2>
              <p>SessionPro is a technology platform that facilitates bookings between clients and independent professionals. SessionPro does not employ, supervise, endorse, certify, or control Pros and is not responsible for the quality, safety, legality, or outcome of any services provided. Pros are solely responsible for their services, conduct, facilities, equipment, insurance, and compliance with applicable laws. Any injury, loss, damage, or dispute arising from a session is solely between the Pro and the client.</p>

              <h2 id="privacy">Data and Privacy</h2>
              <p>SessionPro collects and processes information necessary to operate the Platform, including:</p>
              <ul>
                <li>Names;</li>
                <li>Email addresses;</li>
                <li>Discipline information;</li>
                <li>Location information;</li>
                <li>Scheduling and booking data;</li>
                <li>Payment-related information.</li>
              </ul>
              <p>Payment information is processed by third-party providers such as Stripe.</p>
              <p>Pros may access client information only as necessary to fulfill bookings and communicate regarding sessions. Pros may not:</p>
              <ul>
                <li>Sell client data;</li>
                <li>Export client data for unrelated use;</li>
                <li>Use client information for unauthorized marketing;</li>
                <li>Share client information unlawfully.</li>
              </ul>
              <p>Use of the Platform is also governed by the <Link href="/privacy">SessionPro Privacy Policy</Link>.</p>

              <h2 id="ip">Intellectual Property</h2>
              <p>The Platform, including its software, branding, logos, content, design, and technology, is owned by SessionPro and protected by intellectual property laws. Except for limited access rights granted under these Terms, no rights are transferred to users.</p>
              <p>You may not copy, modify, reverse engineer, redistribute, or create derivative works from the Platform without written permission.</p>

              <h2 id="warranty">Platform Availability and Warranty Disclaimer</h2>
              <p>The Platform is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; SessionPro does not guarantee uninterrupted operation, availability, booking volume, revenue, client demand, or error-free performance and disclaims all warranties to the maximum extent permitted by law.</p>

              <h2 id="liability">Limitation of Liability</h2>
              <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, SESSIONPRO AND ITS FOUNDERS, AFFILIATES, EMPLOYEES, CONTRACTORS, AND SERVICE PROVIDERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, LOST DATA, PERSONAL INJURY, PROPERTY DAMAGE, OR BUSINESS INTERRUPTION.</p>
              <p>SESSIONPRO&rsquo;S TOTAL LIABILITY ARISING OUT OF OR RELATING TO THE PLATFORM SHALL NOT EXCEED THE GREATER OF: (A) THE TOTAL PLATFORM FEES PAID BY THE USER TO SESSIONPRO IN THE SIX (6) MONTHS PRECEDING THE CLAIM; OR (B) ONE HUNDRED U.S. DOLLARS ($100).</p>
              <p>Some jurisdictions do not allow certain liability limitations, so portions of this section may not apply.</p>

              <h2 id="indemnification">Indemnification</h2>
              <p>You agree to defend, indemnify, and hold harmless SessionPro and its affiliates, founders, employees, contractors, and service providers from and against any claims, damages, liabilities, losses, costs, or expenses arising from:</p>
              <ul>
                <li>Your services;</li>
                <li>Your conduct;</li>
                <li>Your content;</li>
                <li>Your violation of these Terms;</li>
                <li>Your violation of applicable laws or regulations;</li>
                <li>Injuries or damages arising from sessions you provide.</li>
              </ul>

              <h2 id="termination">Suspension and Termination</h2>
              <p>SessionPro may suspend, restrict, or terminate accounts at its discretion, including for:</p>
              <ul>
                <li>Misrepresentation;</li>
                <li>Fraud;</li>
                <li>Safety concerns;</li>
                <li>Excessive complaints;</li>
                <li>Violations of these Terms;</li>
                <li>Conduct that creates legal or reputational risk.</li>
              </ul>
              <p>Upon termination:</p>
              <ul>
                <li>Public profiles may be removed;</li>
                <li>Future bookings may be canceled;</li>
                <li>Pending payouts may be withheld temporarily to resolve refunds, disputes, or chargebacks;</li>
                <li>Existing clients may be notified of canceled services.</li>
              </ul>
              <p>SessionPro may preserve records as required by law or operational necessity. Users may stop using the Platform at any time.</p>

              <h2 id="disputes">Dispute Resolution</h2>
              <p>Before initiating formal legal action, the parties agree to first attempt to resolve disputes informally through good-faith negotiations. Any party seeking to raise a dispute must provide written notice describing the issue and allow at least thirty (30) days for informal resolution. If a dispute cannot be resolved informally, either party may pursue legal remedies in accordance with these Terms.</p>

              <h2 id="governing-law">Governing Law and Venue</h2>
              <p>These Terms are governed by the laws of the State of Utah, without regard to conflict of law principles. Any legal action arising out of or relating to these Terms or the Platform shall be brought exclusively in the state or federal courts located in Utah, and the parties consent to personal jurisdiction in those courts.</p>

              <h2 id="changes">Changes to These Terms</h2>
              <p>SessionPro may update these Terms from time to time. Updated Terms become effective upon posting unless otherwise stated. Continued use of the Platform after updated Terms are posted constitutes acceptance of the revised Terms.</p>

              <h2 id="miscellaneous">Miscellaneous</h2>
              <p>If any provision of these Terms is found unenforceable, the remaining provisions shall remain in full force and effect. SessionPro&rsquo;s failure to enforce any provision shall not constitute a waiver. Users may not assign their rights or obligations under these Terms without SessionPro&rsquo;s written consent. SessionPro may assign these Terms in connection with a merger, acquisition, financing, or sale of assets. These Terms constitute the complete agreement between the parties regarding the Platform.</p>

              <h2 id="contact">Contact Information</h2>
              <p>SessionPro<br />Website: <a href="https://sessionpro.io">sessionpro.io</a><br />Email: <a href="mailto:legal@sessionpro.io">legal@sessionpro.io</a><br />Location: Utah, United States</p>

            </div>
          </div>
        </div>
      </section>
    </>
  );
}
