import Image from 'next/image';
import Link from 'next/link';
import { CalendarCheck, CreditCard, Bell, Star, Package, Link as LinkIcon } from 'lucide-react';


function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="9" fill="#D1FAE5" />
      <path d="M5 9l3 3 5-5.5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="landing-page">

      {/* ============================
           NAVIGATION
           ============================ */}
      <nav className="nav" role="navigation" aria-label="Main navigation">
        <div className="nav__inner">
          <Link href="/for-pros" className="nav__brand" aria-label="SessionPro home">
            <Image src="/images/logo-nav.png" alt="SessionPro" width={911} height={270} className="nav-logo" priority />
          </Link>

          <div className="nav__links" role="list">
            <a href="#how-it-works" role="listitem">How It Works</a>
            <a href="#who-its-for" role="listitem">Who It&rsquo;s For</a>
            <a href="#features" role="listitem">Features</a>
            <a href="#pricing" role="listitem">Pricing</a>
          </div>

          <div className="nav__right">
            <Link href="/marcusreed">View Demo</Link>
            <Link href="/auth/signup" className="btn-primary">Claim Your Page</Link>
            <Link href="/auth/login">Pro Log In</Link>
          </div>
        </div>
      </nav>

      {/* ============================
           HERO SECTION
           ============================ */}
      <section className="hero" aria-label="Hero">
        <div className="container">
          <div className="hero__grid">

            {/* Left: copy */}
            <div className="hero__copy">
              <div className="pill">
                <span className="pulse-dot" aria-hidden="true"></span>
                Now accepting professionals
              </div>

              <h1 className="hero__h1">Your expertise deserves a <span>better front door.</span></h1>

              <p className="hero__sub">Stop losing clients in the back-and-forth. SessionPro gives you a professional booking page &mdash; your own URL, your rates, your availability &mdash; so clients can book and pay in under two minutes.</p>

              <div className="hero__ctas">
                <Link href="/auth/signup" className="btn-primary">Claim your free page &rarr;</Link>
                <Link href="/marcusreed" className="btn-ghost">View live demo</Link>
                <a href="#how-it-works" className="btn-ghost">See how it works</a>
              </div>

              <div className="hero__trust">
                <div className="trust__avatars" aria-hidden="true">
                  <div className="trust__avatar trust__avatar--green">MR</div>
                  <div className="trust__avatar trust__avatar--blue">SC</div>
                  <div className="trust__avatar trust__avatar--amber">JT</div>
                </div>
                <p className="trust__text">Join professionals already on SessionPro &middot; Free to start &middot; No subscription</p>
              </div>
            </div>

            {/* Right: booking card mockup */}
            <div className="hero__card-wrap">
              <div className="booking-notification" role="status" aria-live="polite">
                <span className="pulse-dot" aria-hidden="true"></span>
                <div className="booking-notification__text">
                  <span className="booking-notification__label">New booking confirmed</span>
                  <span className="booking-notification__detail">Sarah booked 10:00 AM &middot; $120</span>
                </div>
              </div>

              <div className="booking-card" aria-label="Booking page preview for Marcus Reed">
                <div className="booking-card__header">
                  <div className="booking-card__avatar" aria-hidden="true">MR</div>
                  <div className="booking-card__name">Marcus Reed</div>
                  <div className="booking-card__sub">Golf Professional &middot; 4.9 &#9733; &middot; Scottsdale, AZ</div>
                </div>

                <div className="booking-card__body">
                  <div className="booking-card__url">sessionpro.io/marcusreed</div>
                  <div className="booking-card__date-label">Select a time &mdash; Mon, Jun 2</div>

                  <div className="booking-card__slots" role="group" aria-label="Available time slots">
                    <div className="booking-slot booking-slot--selected" aria-selected="true">10:00 AM</div>
                    <div className="booking-slot" aria-selected="false">11:00 AM</div>
                    <div className="booking-slot" aria-selected="false">1:00 PM</div>
                    <div className="booking-slot" aria-selected="false">2:00 PM</div>
                    <div className="booking-slot" aria-selected="false">3:30 PM</div>
                    <div className="booking-slot" aria-selected="false">4:30 PM</div>
                  </div>

                  <button className="booking-card__confirm" type="button">CONFIRM BOOKING &mdash; $120</button>
                  <p className="booking-card__fine">Secure payment &middot; Instant confirmation &middot; Free cancellation 24hr</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================
           PROOF BAR
           ============================ */}
      <section className="proof" aria-label="Key statistics">
        <div className="container">
          <div className="proof__grid">
            <div className="proof__stat">
              <span className="proof__value">2 min</span>
              <span className="proof__label">avg. time to book</span>
            </div>
            <div className="proof__stat">
              <span className="proof__value">10%</span>
              <span className="proof__label">take rate &mdash; we earn when you earn</span>
            </div>
            <div className="proof__stat">
              <span className="proof__value">$0</span>
              <span className="proof__label">upfront cost to join</span>
            </div>
            <div className="proof__stat">
              <span className="proof__value">4.9 &#9733;</span>
              <span className="proof__label">avg. pro rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================
           HOW IT WORKS
           ============================ */}
      <section className="hiw" id="how-it-works" aria-labelledby="hiw-heading">
        <div className="container">
          <div className="section-header">
            <div className="pill">How it works</div>
            <h2 id="hiw-heading">Live in under 10 minutes.</h2>
            <p>No technical setup. No monthly fee. Just your expertise, bookable.</p>
          </div>

          <div className="hiw__cards">

            <div className="hiw-card">
              <Image src="/images/hiw-step-1.png" alt="Instructor setting up their profile on a laptop" className="hiw-card__img" width={600} height={338} />
              <div className="hiw-card__body">
                <div className="hiw-card__num" aria-hidden="true">1</div>
                <h3 className="hiw-card__title">Create your profile</h3>
                <p className="hiw-card__text">Your public page is ready in minutes. Add what matters and start taking bookings.</p>
                <ul className="hiw-card__checklist">
                  <li>Bio and credentials</li>
                  <li>Discipline and specialties</li>
                  <li>Session rates</li>
                  <li>Profile photo</li>
                </ul>
              </div>
            </div>

            <div className="hiw-card">
              <Image src="/images/hiw-step-2.png" alt="A weekly planner open with sessions scheduled throughout the week" className="hiw-card__img" width={600} height={338} />
              <div className="hiw-card__body">
                <div className="hiw-card__num" aria-hidden="true">2</div>
                <h3 className="hiw-card__title">Set your availability</h3>
                <p className="hiw-card__text">Tell us when you&rsquo;re open. Clients only see slots that work for both of you.</p>
                <ul className="hiw-card__checklist">
                  <li>Weekly recurring schedule</li>
                  <li>Buffer times between sessions</li>
                  <li>Cancellation policy</li>
                </ul>
              </div>
            </div>

            <div className="hiw-card">
              <Image src="/images/hiw-step-3.png" alt="Golf pro handing a booking card to a client on the course" className="hiw-card__img" width={600} height={338} />
              <div className="hiw-card__body">
                <div className="hiw-card__num" aria-hidden="true">3</div>
                <h3 className="hiw-card__title">Share your link</h3>
                <p className="hiw-card__text">One URL. One QR code. Clients book, pay, and show up. You get paid on completion.</p>
                <ul className="hiw-card__checklist">
                  <li>sessionpro.io/yourname</li>
                  <li>Automated reminders</li>
                  <li>Payout on session completion</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================
           DISCIPLINE GRID
           ============================ */}
      <section className="disciplines" id="who-its-for" aria-labelledby="disc-heading">
        <div className="container">
          <div className="section-header">
            <div className="pill">Who it&rsquo;s for</div>
            <h2 id="disc-heading">Every discipline. One platform.</h2>
            <p>If you teach it one session at a time, SessionPro was built for you.</p>
          </div>

          <div className="disc__grid">

            <div className="disc-card">
              <Image src="/images/golf-pro.png" alt="Golf instructor adjusting a student's grip on the course" className="disc-card__img" width={400} height={300} />
              <div className="disc-card__body">
                <div className="disc-card__name">Golf Pros</div>
                <div className="disc-card__sub">Lessons, fittings, and clinics</div>
              </div>
            </div>

            <div className="disc-card">
              <Image src="/images/swim-instructor.png" alt="Swim instructor coaching a student at the pool edge" className="disc-card__img" width={400} height={300} />
              <div className="disc-card__body">
                <div className="disc-card__name">Swim Instructors</div>
                <div className="disc-card__sub">Private and group swim lessons</div>
              </div>
            </div>

            <div className="disc-card">
              <Image src="/images/music-teacher.png" alt="Guitar instructor giving a lesson to a student" className="disc-card__img" width={400} height={300} />
              <div className="disc-card__body">
                <div className="disc-card__name">Music Teachers</div>
                <div className="disc-card__sub">Instrument, voice, and theory</div>
              </div>
            </div>

            <div className="disc-card">
              <Image src="/images/personal-trainer.png" alt="Personal trainer spotting a client on a bench press" className="disc-card__img" width={400} height={300} />
              <div className="disc-card__body">
                <div className="disc-card__name">Personal Trainers</div>
                <div className="disc-card__sub">Strength, cardio, and wellness</div>
              </div>
            </div>

            <div className="disc-card">
              <Image src="/images/tennis-instructor.png" alt="Tennis instructor demonstrating a stroke to a student on court" className="disc-card__img" width={400} height={300} />
              <div className="disc-card__body">
                <div className="disc-card__name">Tennis Instructors</div>
                <div className="disc-card__sub">Private lessons and clinics</div>
              </div>
            </div>

            <div className="disc-card">
              <Image src="/images/yoga-instructor.png" alt="Yoga instructor assisting a student with a pose" className="disc-card__img" width={400} height={300} />
              <div className="disc-card__body">
                <div className="disc-card__name">Yoga Instructors</div>
                <div className="disc-card__sub">Private and group sessions</div>
              </div>
            </div>

            <div className="disc-card">
              <Image src="/images/martial-arts.png" alt="Martial arts instructor demonstrating technique with a student" className="disc-card__img" width={400} height={300} />
              <div className="disc-card__body">
                <div className="disc-card__name">Martial Arts</div>
                <div className="disc-card__sub">One-on-one and small group</div>
              </div>
            </div>

            <div className="disc-card">
              <Image src="/images/tutor.png" alt="Tutor working through a problem with a student at a desk" className="disc-card__img" width={400} height={300} />
              <div className="disc-card__body">
                <div className="disc-card__name">Tutors</div>
                <div className="disc-card__sub">Academic, test prep, and more</div>
              </div>
            </div>

          </div>

          <div className="disc__note">
            <span>Don&rsquo;t see your discipline? SessionPro works for any professional who teaches one session at a time.</span>
            <Link href="/auth/signup">Create your free page &rarr;</Link>
          </div>

        </div>
      </section>

      {/* ============================
           FEATURES
           ============================ */}
      <section className="features" id="features" aria-labelledby="features-heading">
        <div className="container">
          <div className="section-header">
            <div className="pill">Built for pros</div>
            <h2 id="features-heading">Everything you need. Nothing you don&rsquo;t.</h2>
            <p>A focused set of tools designed around how independent professionals actually work.</p>
          </div>

          <div className="features__grid">

            <div className="feature-card">
              <div className="feature-card__icon" aria-hidden="true">
                <CalendarCheck />
              </div>
              <h3 className="feature-card__title">Smart scheduling</h3>
              <p className="feature-card__text">Set your recurring availability once. Clients book into real open slots &mdash; no double bookings, no manual back-and-forth.</p>
            </div>

            <div className="feature-card">
              <div className="feature-card__icon" aria-hidden="true">
                <CreditCard />
              </div>
              <h3 className="feature-card__title">Built-in payments</h3>
              <p className="feature-card__text">Clients pay at booking. Payouts land in your account after the session completes. No invoicing, no chasing.</p>
            </div>

            <div className="feature-card">
              <div className="feature-card__icon" aria-hidden="true">
                <Bell />
              </div>
              <h3 className="feature-card__title">Automated reminders</h3>
              <p className="feature-card__text">Clients get reminded 24 hours and 1 hour before their session. Fewer no-shows, less admin time for you.</p>
            </div>

            <div className="feature-card">
              <div className="feature-card__icon" aria-hidden="true">
                <Star />
              </div>
              <h3 className="feature-card__title">Reviews and ratings</h3>
              <p className="feature-card__text">After each session, clients can leave a review. Build a verified track record that makes your page convert better.</p>
            </div>

            <div className="feature-card">
              <div className="feature-card__icon" aria-hidden="true">
                <Package />
              </div>
              <h3 className="feature-card__title">Session packages</h3>
              <p className="feature-card__text">Sell 5- and 10-session bundles. Clients commit upfront, you get paid faster and build longer relationships.</p>
            </div>

            <div className="feature-card">
              <div className="feature-card__icon" aria-hidden="true">
                <LinkIcon />
              </div>
              <h3 className="feature-card__title">Your own URL</h3>
              <p className="feature-card__text">sessionpro.io/yourname is yours. Put it in your bio, on your business card, or in a QR code you hand to clients.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ============================
           QR CODE SECTION
           ============================ */}
      <section className="qr-section" aria-labelledby="qr-heading">
        <div className="container">
          <div className="qr__grid">

            {/* Left: copy */}
            <div className="qr__copy">
              <div className="pill">Your QR code</div>
              <h2 id="qr-heading">Hand it out. <span>Let it work.</span></h2>
              <p>Every SessionPro professional gets a custom QR code linked directly to their booking page. Hand it to a client at the driving range, post it at the pool deck, or stick it on your business card. They scan, they book, you get paid.</p>

              <div className="qr__steps">
                <div className="qr__step">
                  <div className="qr__step-num" aria-hidden="true">1</div>
                  <p className="qr__step-text">Claim your page and set your availability</p>
                </div>
                <div className="qr__step">
                  <div className="qr__step-num" aria-hidden="true">2</div>
                  <p className="qr__step-text">Download your personal QR code &mdash; print it, share it, post it anywhere</p>
                </div>
                <div className="qr__step">
                  <div className="qr__step-num" aria-hidden="true">3</div>
                  <p className="qr__step-text">Clients scan and book directly &mdash; no app download, no account needed</p>
                </div>
              </div>
            </div>

            {/* Right: QR card mockup */}
            <div className="qr__card-wrap">
              <div className="qr-card" aria-label="QR code mockup">
                <span className="qr-card__label">Your personal booking QR</span>

                {/* Decorative SVG QR code pattern */}
                <svg className="qr-code-svg" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" aria-label="Decorative QR code">
                  <rect x="10" y="10" width="50" height="50" rx="4" fill="#111827"/>
                  <rect x="18" y="18" width="34" height="34" rx="2" fill="white"/>
                  <rect x="24" y="24" width="22" height="22" rx="1" fill="#111827"/>
                  <rect x="120" y="10" width="50" height="50" rx="4" fill="#111827"/>
                  <rect x="128" y="18" width="34" height="34" rx="2" fill="white"/>
                  <rect x="134" y="24" width="22" height="22" rx="1" fill="#111827"/>
                  <rect x="10" y="120" width="50" height="50" rx="4" fill="#111827"/>
                  <rect x="18" y="128" width="34" height="34" rx="2" fill="white"/>
                  <rect x="24" y="134" width="22" height="22" rx="1" fill="#111827"/>
                  <rect x="70" y="10" width="8" height="8" fill="#111827"/>
                  <rect x="82" y="10" width="8" height="8" fill="#111827"/>
                  <rect x="94" y="10" width="8" height="8" fill="#111827"/>
                  <rect x="106" y="10" width="8" height="8" fill="#111827"/>
                  <rect x="70" y="22" width="8" height="8" fill="#111827"/>
                  <rect x="94" y="22" width="8" height="8" fill="#111827"/>
                  <rect x="70" y="34" width="8" height="8" fill="#111827"/>
                  <rect x="82" y="34" width="8" height="8" fill="#111827"/>
                  <rect x="106" y="34" width="8" height="8" fill="#111827"/>
                  <rect x="70" y="46" width="8" height="8" fill="#111827"/>
                  <rect x="94" y="46" width="8" height="8" fill="#111827"/>
                  <rect x="106" y="46" width="8" height="8" fill="#111827"/>
                  <rect x="70" y="58" width="8" height="8" fill="#059669"/>
                  <rect x="82" y="58" width="8" height="8" fill="#059669"/>
                  <rect x="94" y="58" width="8" height="8" fill="#059669"/>
                  <rect x="106" y="58" width="8" height="8" fill="#059669"/>
                  <rect x="118" y="58" width="8" height="8" fill="#059669"/>
                  <rect x="10" y="70" width="8" height="8" fill="#111827"/>
                  <rect x="22" y="70" width="8" height="8" fill="#111827"/>
                  <rect x="46" y="70" width="8" height="8" fill="#111827"/>
                  <rect x="58" y="70" width="8" height="8" fill="#111827"/>
                  <rect x="70" y="70" width="8" height="8" fill="#111827"/>
                  <rect x="94" y="70" width="8" height="8" fill="#059669"/>
                  <rect x="118" y="70" width="8" height="8" fill="#111827"/>
                  <rect x="130" y="70" width="8" height="8" fill="#111827"/>
                  <rect x="154" y="70" width="8" height="8" fill="#111827"/>
                  <rect x="10" y="82" width="8" height="8" fill="#111827"/>
                  <rect x="34" y="82" width="8" height="8" fill="#111827"/>
                  <rect x="58" y="82" width="8" height="8" fill="#111827"/>
                  <rect x="82" y="82" width="8" height="8" fill="#059669"/>
                  <rect x="106" y="82" width="8" height="8" fill="#111827"/>
                  <rect x="130" y="82" width="8" height="8" fill="#111827"/>
                  <rect x="154" y="82" width="8" height="8" fill="#111827"/>
                  <rect x="162" y="82" width="8" height="8" fill="#111827"/>
                  <rect x="22" y="94" width="8" height="8" fill="#111827"/>
                  <rect x="46" y="94" width="8" height="8" fill="#111827"/>
                  <rect x="70" y="94" width="8" height="8" fill="#059669"/>
                  <rect x="94" y="94" width="8" height="8" fill="#111827"/>
                  <rect x="118" y="94" width="8" height="8" fill="#111827"/>
                  <rect x="142" y="94" width="8" height="8" fill="#111827"/>
                  <rect x="162" y="94" width="8" height="8" fill="#111827"/>
                  <rect x="10" y="106" width="8" height="8" fill="#111827"/>
                  <rect x="34" y="106" width="8" height="8" fill="#059669"/>
                  <rect x="58" y="106" width="8" height="8" fill="#059669"/>
                  <rect x="82" y="106" width="8" height="8" fill="#111827"/>
                  <rect x="106" y="106" width="8" height="8" fill="#111827"/>
                  <rect x="130" y="106" width="8" height="8" fill="#059669"/>
                  <rect x="154" y="106" width="8" height="8" fill="#111827"/>
                  <rect x="70" y="118" width="8" height="8" fill="#111827"/>
                  <rect x="82" y="118" width="8" height="8" fill="#059669"/>
                  <rect x="106" y="118" width="8" height="8" fill="#111827"/>
                  <rect x="118" y="118" width="8" height="8" fill="#111827"/>
                  <rect x="130" y="118" width="8" height="8" fill="#059669"/>
                  <rect x="154" y="118" width="8" height="8" fill="#111827"/>
                  <rect x="162" y="118" width="8" height="8" fill="#111827"/>
                  <rect x="70" y="130" width="8" height="8" fill="#111827"/>
                  <rect x="94" y="130" width="8" height="8" fill="#059669"/>
                  <rect x="118" y="130" width="8" height="8" fill="#111827"/>
                  <rect x="142" y="130" width="8" height="8" fill="#059669"/>
                  <rect x="162" y="130" width="8" height="8" fill="#111827"/>
                  <rect x="70" y="142" width="8" height="8" fill="#059669"/>
                  <rect x="82" y="142" width="8" height="8" fill="#111827"/>
                  <rect x="106" y="142" width="8" height="8" fill="#111827"/>
                  <rect x="130" y="142" width="8" height="8" fill="#059669"/>
                  <rect x="154" y="142" width="8" height="8" fill="#111827"/>
                  <rect x="70" y="154" width="8" height="8" fill="#111827"/>
                  <rect x="94" y="154" width="8" height="8" fill="#111827"/>
                  <rect x="118" y="154" width="8" height="8" fill="#059669"/>
                  <rect x="142" y="154" width="8" height="8" fill="#111827"/>
                  <rect x="162" y="154" width="8" height="8" fill="#059669"/>
                  <rect x="70" y="162" width="8" height="8" fill="#059669"/>
                  <rect x="82" y="162" width="8" height="8" fill="#059669"/>
                  <rect x="106" y="162" width="8" height="8" fill="#111827"/>
                  <rect x="130" y="162" width="8" height="8" fill="#111827"/>
                  <rect x="154" y="162" width="8" height="8" fill="#059669"/>
                </svg>

                <span className="qr-card__url">sessionpro.io/marcusreed</span>
                <span className="qr-card__sub">Scan to book a session with Marcus</span>
                <Link href="/auth/signup" className="btn-dark">Claim your free page</Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================
           TESTIMONIALS
           ============================ */}
      <section className="testimonials" aria-labelledby="test-heading">
        <div className="container">
          <div className="section-header">
            <h2 id="test-heading">Pros who stopped chasing.</h2>
            <p>From the driving range to the pool deck, professionals are filling their calendars.</p>
          </div>

          <div className="test__grid">

            <div className="test-card">
              <p className="test-card__quote">&ldquo;I used to lose at least two new clients a month to back-and-forth scheduling. SessionPro basically closed that gap overnight. My calendar is fuller than it&rsquo;s ever been.&rdquo;</p>
              <div className="test-card__author">
                <div className="test-card__avatar" style={{ background: '#059669' }} aria-hidden="true">MR</div>
                <div className="test-card__info">
                  <span className="test-card__name">Marcus Reed</span>
                  <span className="test-card__role">PGA Golf Professional, Scottsdale AZ</span>
                </div>
                <div className="test-card__stars" aria-label="5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              </div>
            </div>

            <div className="test-card">
              <p className="test-card__quote">&ldquo;As a swim instructor I never had a clean way to take payments. Parents were Venmoing me at the pool deck. Now everything is handled before they even show up.&rdquo;</p>
              <div className="test-card__author">
                <div className="test-card__avatar" style={{ background: '#2563EB' }} aria-hidden="true">SC</div>
                <div className="test-card__info">
                  <span className="test-card__name">Sara Chen</span>
                  <span className="test-card__role">Swim Instructor, Austin TX</span>
                </div>
                <div className="test-card__stars" aria-label="5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              </div>
            </div>

            <div className="test-card">
              <p className="test-card__quote">&ldquo;My sessionpro.io link is in my Instagram bio and I get booking requests while I&rsquo;m in the middle of a lesson. I handed out QR cards at my last clinic and booked four new students.&rdquo;</p>
              <div className="test-card__author">
                <div className="test-card__avatar" style={{ background: '#D97706' }} aria-hidden="true">JT</div>
                <div className="test-card__info">
                  <span className="test-card__name">James Tillman</span>
                  <span className="test-card__role">Guitar Instructor, Nashville TN</span>
                </div>
                <div className="test-card__stars" aria-label="5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================
           PRICING
           ============================ */}
      <section className="pricing" id="pricing" aria-labelledby="pricing-heading">
        <div className="container">
          <div className="section-header">
            <div className="pill">Pricing</div>
            <h2 id="pricing-heading">Simple, honest pricing.</h2>
            <p>Free to get started. We only make money when you do.</p>
          </div>

          <div className="pricing__card">
            <div className="pricing__left">
              <div className="pricing__tagline">Free to sign up.<br />We get paid when you do.</div>
              <p className="pricing__desc">No subscription. No setup fee. We take 10% when a session is booked &mdash; that&rsquo;s it. Create your page and start earning today.</p>
              <Link href="/auth/signup" className="btn-primary">Claim your free page &rarr;</Link>
            </div>
            <div className="pricing__divider" aria-hidden="true"></div>
            <ul className="pricing__features">
              <li><CheckIcon /> Public booking page at sessionpro.io/yourname</li>
              <li><CheckIcon /> Single sessions and multi-session packages</li>
              <li><CheckIcon /> Online payments &mdash; Stripe-powered, secure</li>
              <li><CheckIcon /> Availability and scheduling controls</li>
              <li><CheckIcon /> 10% booking fee &mdash; only when a session is booked</li>
            </ul>
          </div>

          <p className="pricing__note">The 10% fee is deducted automatically at checkout. You receive the rest directly to your bank account via Stripe.</p>
        </div>
      </section>

      {/* ============================
           CTA SECTION
           ============================ */}
      <section className="waitlist" id="get-started" aria-labelledby="cta-heading">
        <div className="container">
          <div className="waitlist__inner">

            <div className="waitlist__header">
              <div className="pill">
                <span className="pulse-dot" aria-hidden="true"></span>
                Now accepting professionals
              </div>
              <h2 id="cta-heading">Ready to fill your <span>calendar?</span></h2>
              <p>Create your SessionPro page in under 10 minutes. Free to join. We only earn when you do.</p>
              <div className="waitlist__url-pill" aria-label="Your SessionPro URL preview">
                sessionpro.io/<span>[yourname]</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Link href="/auth/signup" className="btn-primary" style={{ fontSize: '1rem', padding: '14px 32px' }}>
                Create your free page &rarr;
              </Link>
              <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: 0 }}>
                Already have an account? <Link href="/auth/login" style={{ color: 'var(--green)', fontWeight: 500 }}>Pro Log In</Link>
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ============================
           FOOTER
           ============================ */}
      <footer className="footer" aria-label="Site footer">
        <div className="container">
          <div className="footer__inner">

            <div className="footer__brand">
              <Image src="/images/logo-nav.png" alt="SessionPro" width={911} height={270} className="footer-logo" />
            </div>

            <nav className="footer__links" aria-label="Footer navigation">
              <a href="#how-it-works">How it works</a>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="mailto:hello@sessionpro.io">Contact</a>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </nav>

            <span className="footer__copy">&copy; 2026 SessionPro &middot; sessionpro.io</span>

          </div>
        </div>
      </footer>

    </div>
  );
}
