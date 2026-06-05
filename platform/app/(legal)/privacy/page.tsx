import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — SessionPro',
  description: 'Read the SessionPro Privacy Policy.',
};

const SECTIONS = [
  { id: 'collect',       label: 'Information We Collect' },
  { id: 'use',           label: 'How We Use Information' },
  { id: 'sharing',       label: 'How Information Is Shared' },
  { id: 'profiles',      label: 'Professional Profile Information' },
  { id: 'communications', label: 'Communications' },
  { id: 'cookies',       label: 'Cookies and Analytics' },
  { id: 'retention',     label: 'Data Retention' },
  { id: 'security',      label: 'Security' },
  { id: 'children',      label: "Children's Privacy" },
  { id: 'rights',        label: 'Your Rights and Choices' },
  { id: 'third-party',   label: 'Third-Party Services' },
  { id: 'international', label: 'International Users' },
  { id: 'changes',       label: 'Changes to This Policy' },
  { id: 'tos',           label: 'Relationship to Terms of Service' },
  { id: 'contact',       label: 'Contact Us' },
];

export default function PrivacyPage() {
  return (
    <>
      <section className="legal-hero">
        <div className="container">
          <p className="legal-eyebrow">Legal</p>
          <h1 className="legal-title">Privacy Policy</h1>
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

              <p>SessionPro (&ldquo;SessionPro,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) respects your privacy and is committed to protecting your information. This Privacy Policy explains how we collect, use, disclose, and protect information when you use SessionPro&rsquo;s website, platform, and services available at sessionpro.io (the &ldquo;Platform&rdquo;).</p>
              <p>By using the Platform, you agree to the practices described in this Privacy Policy.</p>

              <h2 id="collect">Information We Collect</h2>
              <p>We collect information that you provide directly, information generated through your use of the Platform, and information received from third-party service providers.</p>

              <h3>Information You Provide</h3>
              <h4>Professional Accounts</h4>
              <p>When a professional (&ldquo;Pro&rdquo;) creates an account, we may collect:</p>
              <ul>
                <li>Name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Profile photo</li>
                <li>Biography</li>
                <li>Credentials and certifications</li>
                <li>Business information</li>
                <li>Location information</li>
                <li>Availability and scheduling preferences</li>
                <li>Payment and payout information</li>
              </ul>

              <h4>Client Accounts and Bookings</h4>
              <p>When a client books a session, we may collect:</p>
              <ul>
                <li>Name</li>
                <li>Email address</li>
                <li>Phone number (where provided)</li>
                <li>Booking details</li>
                <li>Session preferences</li>
                <li>Communications related to bookings</li>
              </ul>

              <h4>Payment Information</h4>
              <p>Payments are processed through Stripe and other payment service providers. SessionPro does not store complete payment card information. Payment information is collected and processed directly by our payment providers in accordance with their privacy policies and terms.</p>

              <h3>Information Collected Automatically</h3>
              <p>When you use the Platform, we may automatically collect:</p>
              <ul>
                <li>IP address</li>
                <li>Browser type</li>
                <li>Device information</li>
                <li>Operating system</li>
                <li>Platform usage activity</li>
                <li>Pages viewed</li>
                <li>Referral sources</li>
                <li>Date and time of visits</li>
              </ul>
              <p>We may use cookies and similar technologies to collect this information.</p>

              <h2 id="use">How We Use Information</h2>
              <p>We use information to:</p>
              <ul>
                <li>Operate the Platform</li>
                <li>Create and manage accounts</li>
                <li>Facilitate bookings</li>
                <li>Process payments and payouts</li>
                <li>Send confirmations and reminders</li>
                <li>Provide customer support</li>
                <li>Display professional profiles</li>
                <li>Improve Platform functionality</li>
                <li>Monitor security and prevent fraud</li>
                <li>Enforce our Terms of Service</li>
                <li>Comply with legal obligations</li>
                <li>Communicate updates regarding the Platform</li>
              </ul>
              <p>We may also use information in aggregated or anonymized form for analytics, reporting, and business development purposes.</p>

              <h2 id="sharing">How Information Is Shared</h2>
              <p>SessionPro does not sell personal information.</p>
              <p>We may share information in the following circumstances:</p>

              <h3>Between Clients and Professionals</h3>
              <p>To facilitate bookings, information may be shared between Pros and clients, including:</p>
              <ul>
                <li>Names</li>
                <li>Contact information</li>
                <li>Booking details</li>
                <li>Session information</li>
              </ul>

              <h3>Service Providers</h3>
              <p>We may share information with third-party providers that assist with operating the Platform, including:</p>
              <ul>
                <li>Stripe (payment processing)</li>
                <li>Hosting providers</li>
                <li>Cloud storage providers</li>
                <li>Analytics providers</li>
                <li>Communication providers (email and SMS)</li>
              </ul>
              <p>These providers may access information only as necessary to perform services on our behalf.</p>

              <h3>Legal Requirements</h3>
              <p>We may disclose information when required to:</p>
              <ul>
                <li>Comply with applicable law</li>
                <li>Respond to legal requests</li>
                <li>Protect users</li>
                <li>Protect SessionPro&rsquo;s rights and property</li>
                <li>Investigate fraud or security concerns</li>
              </ul>

              <h3>Business Transfers</h3>
              <p>If SessionPro is involved in a merger, acquisition, financing, asset sale, or other business transaction, information may be transferred as part of that transaction.</p>

              <h2 id="profiles">Professional Profile Information</h2>
              <p>Information included in a Pro&rsquo;s public profile may be publicly visible, including:</p>
              <ul>
                <li>Name</li>
                <li>Biography</li>
                <li>Services offered</li>
                <li>Pricing</li>
                <li>Availability information</li>
                <li>Reviews and ratings</li>
                <li>Profile photographs</li>
              </ul>
              <p>Pros are responsible for determining what information they choose to make publicly available.</p>

              <h2 id="communications">Communications</h2>
              <p>SessionPro may send:</p>
              <ul>
                <li>Booking confirmations</li>
                <li>Appointment reminders</li>
                <li>Payment notifications</li>
                <li>Review requests</li>
                <li>Service announcements</li>
                <li>Customer support communications</li>
              </ul>
              <p>Users may opt out of certain marketing communications. Transactional communications, including booking confirmations and session reminders, may still be sent when necessary to operate the Platform. Standard messaging rates from your carrier may apply to SMS communications.</p>

              <h2 id="cookies">Cookies and Analytics</h2>
              <p>We may use cookies and similar technologies to:</p>
              <ul>
                <li>Remember user preferences</li>
                <li>Maintain account sessions</li>
                <li>Analyze Platform performance</li>
                <li>Improve user experience</li>
                <li>Measure marketing effectiveness</li>
              </ul>
              <p>Users may control cookies through browser settings, although certain Platform features may not function properly if cookies are disabled.</p>

              <h2 id="retention">Data Retention</h2>
              <p>We retain information for as long as reasonably necessary to:</p>
              <ul>
                <li>Provide services</li>
                <li>Maintain business records</li>
                <li>Resolve disputes</li>
                <li>Enforce agreements</li>
                <li>Comply with legal obligations</li>
              </ul>
              <p>We may retain certain information after account closure where required by law or for legitimate business purposes.</p>

              <h2 id="security">Security</h2>
              <p>We use commercially reasonable administrative, technical, and organizational measures to protect information. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.</p>

              <h2 id="children">Children&rsquo;s Privacy</h2>
              <p>The Platform is not directed to children under 13. SessionPro does not knowingly collect personal information directly from children under 13. If we learn that such information has been collected, we will take reasonable steps to delete it.</p>
              <p>Parents, guardians, or authorized adults may provide information on behalf of minor participants in connection with booking or participating in sessions through the Platform. By providing such information, the parent or guardian represents that they have the authority to do so and consent to the collection, use, and sharing of the minor&rsquo;s information as described in this Privacy Policy.</p>
              <p>Parents and guardians are responsible for supervising minors who participate in sessions booked through the Platform.</p>

              <h2 id="rights">Your Rights and Choices</h2>
              <p>Depending on your location and applicable law, you may have rights regarding your personal information, including the ability to:</p>
              <ul>
                <li>Access information we hold about you</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of information</li>
                <li>Object to certain processing activities</li>
                <li>Request a copy of your information</li>
              </ul>
              <p>Requests may be submitted using the contact information below. We may need to verify your identity before responding.</p>

              <h2 id="third-party">Third-Party Services</h2>
              <p>The Platform may contain links to third-party websites or services. SessionPro is not responsible for the privacy practices of third parties, including payment processors, social media platforms, or websites linked from the Platform.</p>

              <h2 id="international">International Users</h2>
              <p>SessionPro operates from the United States. By using the Platform, you understand that your information may be processed and stored in the United States and other jurisdictions where our service providers operate.</p>

              <h2 id="changes">Changes to This Privacy Policy</h2>
              <p>We may update this Privacy Policy from time to time. Updated versions become effective when posted on the Platform unless otherwise stated. Continued use of the Platform after an update constitutes acceptance of the revised Privacy Policy.</p>

              <h2 id="tos">Relationship to Terms of Service</h2>
              <p>Your use of the Platform is also governed by the <Link href="/terms">SessionPro Terms of Service</Link>. If there is a conflict between this Privacy Policy and the Terms of Service regarding privacy-related matters, this Privacy Policy will control.</p>

              <h2 id="contact">Contact Us</h2>
              <p>SessionPro<br />Website: <a href="https://sessionpro.io">sessionpro.io</a><br />Email: <a href="mailto:privacy@sessionpro.io">privacy@sessionpro.io</a><br />Location: Utah, United States</p>

            </div>
          </div>
        </div>
      </section>
    </>
  );
}
