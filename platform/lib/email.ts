import { Resend } from 'resend';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = process.env.EMAIL_FROM ?? 'SessionPro <onboarding@resend.dev>';

function formatDateTime(utcIso: string, timezone: string) {
  const date = new Date(utcIso);
  const dateStr = date.toLocaleDateString('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return { dateStr, timeStr };
}

function centsToDollars(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);
}

type ClientConfirmationParams = {
  clientEmail: string;
  clientName: string;
  proName: string;
  serviceName: string;
  startsAt: string;
  timezone: string;
  location: string | null;
  priceCents: number;
  sessionContext?: string;
  bookingId?: string;
};

export async function sendClientConfirmation(params: ClientConfirmationParams) {
  const resend = getResend();
  if (!resend) return;

  const { dateStr, timeStr } = formatDateTime(params.startsAt, params.timezone);

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr>
          <td style="background:#059669;padding:28px 32px;">
            <p style="margin:0;color:#d1fae5;font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">SessionPro</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:800;">You&rsquo;re booked!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
              Hi ${params.clientName.split(' ')[0]}, your session with <strong>${params.proName}</strong> is confirmed.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                ${params.sessionContext ? row('Package', params.sessionContext) : ''}
                ${row('Session', params.serviceName)}
                ${row('Date', dateStr)}
                ${row('Time', timeStr)}
                ${params.location ? row('Location', params.location) : ''}
                ${row('Total paid', centsToDollars(params.priceCents))}
              </td></tr>
            </table>

            ${params.bookingId ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
              <tr><td align="center">
                <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://sessionpro.io'}/booking/reschedule-request?booking_id=${params.bookingId}"
                   style="color:#6b7280;font-size:13px;text-decoration:underline;margin-right:16px;">
                  Reschedule this booking
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://sessionpro.io'}/booking/cancel?booking_id=${params.bookingId}"
                   style="color:#6b7280;font-size:13px;text-decoration:underline;">
                  Cancel this booking
                </a>
              </td></tr>
            </table>` : ''}
            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
              Cancellation and reschedule policies vary by session — see the links above for details. Reply to this email if you have any questions.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">SessionPro &mdash; Powered by Stripe</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.clientEmail,
    subject: `Booking confirmed — ${params.serviceName} with ${params.proName}`,
    html,
  });
  if (error) console.error('[email] client confirmation failed:', error);
}

type ProNotificationParams = {
  proEmail: string;
  proName: string;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  startsAt: string;
  timezone: string;
  payoutCents: number;
};

export async function sendProNotification(params: ProNotificationParams) {
  const resend = getResend();
  if (!resend) return;

  const { dateStr, timeStr } = formatDateTime(params.startsAt, params.timezone);

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr>
          <td style="background:#059669;padding:28px 32px;">
            <p style="margin:0;color:#d1fae5;font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">SessionPro</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:800;">New booking received</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
              Hi ${params.proName.split(' ')[0]}, <strong>${params.clientName}</strong> just booked a session with you.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                ${row('Client', params.clientName)}
                ${row('Client email', params.clientEmail)}
                ${row('Session', params.serviceName)}
                ${row('Date', dateStr)}
                ${row('Time', timeStr)}
                ${row('Your payout', centsToDollars(params.payoutCents))}
              </td></tr>
            </table>

            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
              Your payout will be transferred to your connected bank account automatically after the session.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">SessionPro &mdash; Powered by Stripe</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.proEmail,
    subject: `New booking — ${params.clientName} on ${dateStr}`,
    html,
  });
  if (error) console.error('[email] pro notification failed:', error);
}

type CancellationEmailParams = {
  clientEmail: string;
  clientName: string;
  proName: string;
  serviceName: string;
  startsAt: string;
  timezone: string;
  reason?: string;
  refundPercent?: number;
  refundAmountCents?: number;
};

export async function sendCancellationEmail(params: CancellationEmailParams) {
  const resend = getResend();
  if (!resend) return;

  const { dateStr, timeStr } = formatDateTime(params.startsAt, params.timezone);

  const refundPercent = params.refundPercent ?? 100;
  const refundLine = refundPercent <= 0
    ? 'No refund issued'
    : refundPercent >= 100
      ? 'Full refund issued'
      : `${refundPercent}% refund issued ($${((params.refundAmountCents ?? 0) / 100).toFixed(2)})`;
  const refundSentence = refundPercent <= 0
    ? 'Based on the cancellation policy for this session, no refund was issued.'
    : refundPercent >= 100
      ? 'A full refund has been issued and should appear within 5–10 business days.'
      : `A ${refundPercent}% refund has been issued and should appear within 5–10 business days.`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr>
          <td style="background:#374151;padding:28px 32px;">
            <p style="margin:0;color:#d1d5db;font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">SessionPro</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:800;">Booking cancelled</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
              Hi ${params.clientName.split(' ')[0]}, your session with <strong>${params.proName}</strong> has been cancelled.
              ${refundSentence}
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                ${row('Session', params.serviceName)}
                ${row('Date', dateStr)}
                ${row('Time', timeStr)}
                ${row('Refund', refundLine)}
                ${params.reason ? row('Reason', params.reason) : ''}
              </td></tr>
            </table>

            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
              If you have any questions, reply to this email and we&rsquo;ll help you out.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">SessionPro &mdash; Powered by Stripe</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.clientEmail,
    subject: `Booking cancelled — ${params.serviceName} with ${params.proName}`,
    html,
  });
  if (error) console.error('[email] cancellation failed:', error);
}

type NoShowNotificationParams = {
  clientEmail: string;
  clientName: string;
  proName: string;
  serviceName: string;
  startsAt: string;
  timezone: string;
  refunded: boolean;
  creditIssued?: boolean;
};

export async function sendNoShowNotification(params: NoShowNotificationParams) {
  const resend = getResend();
  if (!resend) return;

  const { dateStr, timeStr } = formatDateTime(params.startsAt, params.timezone);

  const outcomeSentence = params.refunded
    ? 'A full refund has been issued and should appear within 5–10 business days.'
    : params.creditIssued
      ? "You've been issued a make-up session credit — check your inbox for a separate email with a link to book your next session."
      : 'Reach out to your instructor if you&rsquo;d like to reschedule.';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr>
          <td style="background:#374151;padding:28px 32px;">
            <p style="margin:0;color:#d1d5db;font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">SessionPro</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:800;">We missed you today</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
              Hi ${params.clientName.split(' ')[0]}, we noticed you weren&rsquo;t able to make your session with <strong>${params.proName}</strong> today.
              ${outcomeSentence}
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                ${row('Session', params.serviceName)}
                ${row('Date', dateStr)}
                ${row('Time', timeStr)}
                ${params.refunded ? row('Refund', 'Full refund issued') : ''}
                ${params.creditIssued ? row('Outcome', 'Make-up credit issued') : ''}
              </td></tr>
            </table>

            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
              Reply to this email if you have any questions.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">SessionPro &mdash; Powered by Stripe</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.clientEmail,
    subject: `We missed you — ${params.serviceName} with ${params.proName}`,
    html,
  });
  if (error) console.error('[email] no-show notification failed:', error);
}

type ReviewRequestParams = {
  clientEmail: string;
  clientName: string;
  proName: string;
  serviceName: string;
  bookingId: string;
  scheduledAt?: string;
};

export async function sendReviewRequest(params: ReviewRequestParams) {
  const resend = getResend();
  if (!resend) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sessionpro.io';
  const reviewUrl = `${appUrl}/review/${params.bookingId}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr>
          <td style="background:#059669;padding:28px 32px;">
            <p style="margin:0;color:#d1fae5;font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">SessionPro</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:800;">How was your session?</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
              Hi ${params.clientName.split(' ')[0]}, we hope your ${params.serviceName} with <strong>${params.proName}</strong> went well! Your feedback helps other clients find great instructors.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td align="center">
                <a href="${reviewUrl}" style="display:inline-block;background:#059669;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;">
                  Leave a review
                </a>
              </td></tr>
            </table>
            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
              Takes less than a minute. Your review will be visible on ${params.proName}&rsquo;s profile once approved.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">SessionPro &mdash; Powered by Stripe</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const sendParams: Parameters<typeof resend.emails.send>[0] = {
    from: FROM,
    to: params.clientEmail,
    subject: `How was your session with ${params.proName}?`,
    html,
  };
  if (params.scheduledAt) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sendParams as any).scheduledAt = params.scheduledAt;
  }

  const { error } = await resend.emails.send(sendParams);
  if (error) console.error('[email] review request failed:', error);
}

type BookingRequestToProParams = {
  proEmail: string;
  proName: string;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  requestedStartsAt: string;
  timezone: string;
  requestId: string;
  notes?: string | null;
};

export async function sendBookingRequestToPro(params: BookingRequestToProParams) {
  const resend = getResend();
  if (!resend) return;
  const { dateStr, timeStr } = formatDateTime(params.requestedStartsAt, params.timezone);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sessionpro.io';
  const reviewUrl = `${appUrl}/dashboard/bookings#request-${params.requestId}`;
  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr><td style="background:#059669;padding:28px 32px;">
          <p style="margin:0;color:#d1fae5;font-size:13px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;">SessionPro</p>
          <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:800;">New booking request</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
            Hi ${params.proName.split(' ')[0]}, <strong>${params.clientName}</strong> has requested a session with you.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              ${row('Client', params.clientName)}
              ${row('Email', params.clientEmail)}
              ${row('Session', params.serviceName)}
              ${row('Date', dateStr)}
              ${row('Time', timeStr)}
              ${params.notes ? row('Notes', params.notes) : ''}
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
            <tr><td align="center">
              <a href="${reviewUrl}" style="display:inline-block;background:#059669;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;">
                Review request
              </a>
            </td></tr>
          </table>
          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">Accept or decline from your dashboard. The client will be notified.</p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">SessionPro</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  const { error } = await resend.emails.send({ from: FROM, to: params.proEmail, subject: `New booking request — ${params.clientName}`, html });
  if (error) console.error('[email] booking request to pro failed:', error);
}

type PaymentLinkToClientParams = {
  clientEmail: string;
  clientName: string;
  proName: string;
  serviceName: string;
  requestedStartsAt: string;
  timezone: string;
  location: string | null;
  paymentUrl: string;
  paymentExpiresAt: string;
};

export async function sendPaymentLinkToClient(params: PaymentLinkToClientParams) {
  const resend = getResend();
  if (!resend) return;
  const { dateStr, timeStr } = formatDateTime(params.requestedStartsAt, params.timezone);
  const expiryStr = new Date(params.paymentExpiresAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr><td style="background:#059669;padding:28px 32px;">
          <p style="margin:0;color:#d1fae5;font-size:13px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;">SessionPro</p>
          <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:800;">Your request was accepted!</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
            Hi ${params.clientName.split(' ')[0]}, <strong>${params.proName}</strong> has accepted your booking request. Complete your payment to confirm the session.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              ${row('Session', params.serviceName)}
              ${row('Date', dateStr)}
              ${row('Time', timeStr)}
              ${params.location ? row('Location', params.location) : ''}
              ${row('Payment link expires', expiryStr)}
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
            <tr><td align="center">
              <a href="${params.paymentUrl}" style="display:inline-block;background:#059669;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;">
                Complete payment
              </a>
            </td></tr>
          </table>
          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">This link expires on ${expiryStr}. If it expires, contact your instructor to request a new one.</p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">SessionPro &mdash; Powered by Stripe</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  const { error } = await resend.emails.send({ from: FROM, to: params.clientEmail, subject: `Your session with ${params.proName} is confirmed — complete payment`, html });
  if (error) console.error('[email] payment link to client failed:', error);
}

type BookingRequestDeclinedParams = {
  clientEmail: string;
  clientName: string;
  proName: string;
  serviceName: string;
  requestedStartsAt: string;
  timezone: string;
};

export async function sendBookingRequestDeclined(params: BookingRequestDeclinedParams) {
  const resend = getResend();
  if (!resend) return;
  const { dateStr, timeStr } = formatDateTime(params.requestedStartsAt, params.timezone);
  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr><td style="background:#374151;padding:28px 32px;">
          <p style="margin:0;color:#d1d5db;font-size:13px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;">SessionPro</p>
          <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:800;">Request not accepted</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
            Hi ${params.clientName.split(' ')[0]}, unfortunately <strong>${params.proName}</strong> wasn&rsquo;t available for the time you requested.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              ${row('Session', params.serviceName)}
              ${row('Requested date', dateStr)}
              ${row('Requested time', timeStr)}
            </td></tr>
          </table>
          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">You&rsquo;re welcome to request a different time on their profile page.</p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">SessionPro</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  const { error } = await resend.emails.send({ from: FROM, to: params.clientEmail, subject: `Session request update — ${params.proName}`, html });
  if (error) console.error('[email] request declined failed:', error);
}

type BookingRequestPaymentExpiredParams = {
  clientEmail: string;
  clientName: string;
  proName: string;
  serviceName: string;
  requestedStartsAt: string;
  timezone: string;
};

export async function sendBookingRequestPaymentExpired(params: BookingRequestPaymentExpiredParams) {
  const resend = getResend();
  if (!resend) return;
  const { dateStr, timeStr } = formatDateTime(params.requestedStartsAt, params.timezone);
  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr><td style="background:#374151;padding:28px 32px;">
          <p style="margin:0;color:#d1d5db;font-size:13px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;">SessionPro</p>
          <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:800;">Booking request cancelled</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
            Hi ${params.clientName.split(' ')[0]}, we didn&rsquo;t receive payment for your session with <strong>${params.proName}</strong> in time, so the request has been cancelled and the time released.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              ${row('Session', params.serviceName)}
              ${row('Requested date', dateStr)}
              ${row('Requested time', timeStr)}
            </td></tr>
          </table>
          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">No charge was made. You&rsquo;re welcome to submit a new request on their profile page.</p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">SessionPro</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  const { error } = await resend.emails.send({ from: FROM, to: params.clientEmail, subject: `Booking request cancelled — ${params.proName}`, html });
  if (error) console.error('[email] payment expired notice failed:', error);
}

type RescheduleRequestToClientParams = {
  clientEmail: string;
  clientName: string;
  proName: string;
  serviceName: string;
  oldStartsAt: string;
  newStartsAt: string;
  newEndsAt: string;
  timezone: string;
  rescheduleRequestId: string;
};

export async function sendRescheduleRequestToClient(params: RescheduleRequestToClientParams) {
  const resend = getResend();
  if (!resend) return;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sessionpro.io';
  const { dateStr: oldDateStr, timeStr: oldTimeStr } = formatDateTime(params.oldStartsAt, params.timezone);
  const { dateStr: newDateStr, timeStr: newTimeStr } = formatDateTime(params.newStartsAt, params.timezone);
  const acceptUrl = `${appUrl}/booking/reschedule?request_id=${params.rescheduleRequestId}&action=accept`;
  const declineUrl = `${appUrl}/booking/reschedule?request_id=${params.rescheduleRequestId}&action=decline`;
  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr><td style="background:#d97706;padding:28px 32px;">
          <p style="margin:0;color:#fef3c7;font-size:13px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;">SessionPro</p>
          <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:800;">Session reschedule request</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
            Hi ${params.clientName.split(' ')[0]}, <strong>${params.proName}</strong> has proposed a new time for your ${params.serviceName} session.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              ${row('Original date', oldDateStr)}
              ${row('Original time', oldTimeStr)}
              ${row('Proposed date', `<strong>${newDateStr}</strong>`)}
              ${row('Proposed time', `<strong>${newTimeStr}</strong>`)}
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
            <tr>
              <td style="padding-right:8px;">
                <a href="${acceptUrl}" style="display:block;text-align:center;background:#059669;color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 0;border-radius:8px;">Accept</a>
              </td>
              <td style="padding-left:8px;">
                <a href="${declineUrl}" style="display:block;text-align:center;background:#f9fafb;color:#374151;font-size:14px;font-weight:700;text-decoration:none;padding:12px 0;border-radius:8px;border:1px solid #e5e7eb;">Decline</a>
              </td>
            </tr>
          </table>
          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">If you decline, your original session time remains confirmed.</p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">SessionPro</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  const { error } = await resend.emails.send({ from: FROM, to: params.clientEmail, subject: `Reschedule request — ${params.serviceName} with ${params.proName}`, html });
  if (error) console.error('[email] reschedule request to client failed:', error);
}

type RescheduleRequestToProParams = {
  proEmail: string;
  proName: string;
  clientName: string;
  serviceName: string;
  oldStartsAt: string;
  newStartsAt: string;
  newEndsAt: string;
  timezone: string;
  reason?: string;
};

export async function sendRescheduleRequestToPro(params: RescheduleRequestToProParams) {
  const resend = getResend();
  if (!resend) return;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sessionpro.io';
  const { dateStr: oldDateStr, timeStr: oldTimeStr } = formatDateTime(params.oldStartsAt, params.timezone);
  const { dateStr: newDateStr, timeStr: newTimeStr } = formatDateTime(params.newStartsAt, params.timezone);
  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr><td style="background:#d97706;padding:28px 32px;">
          <p style="margin:0;color:#fef3c7;font-size:13px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;">SessionPro</p>
          <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:800;">Client requested a reschedule</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
            Hi ${params.proName.split(' ')[0]}, <strong>${params.clientName}</strong> has requested a new time for their ${params.serviceName} session.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              ${row('Original date', oldDateStr)}
              ${row('Original time', oldTimeStr)}
              ${row('Requested date', `<strong>${newDateStr}</strong>`)}
              ${row('Requested time', `<strong>${newTimeStr}</strong>`)}
              ${params.reason ? row('Reason', params.reason) : ''}
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
            <tr><td align="center">
              <a href="${appUrl}/dashboard/bookings" style="display:block;text-align:center;background:#059669;color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 0;border-radius:8px;">Review request</a>
            </td></tr>
          </table>
          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">If you decline, the client&rsquo;s original session time remains confirmed.</p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">SessionPro</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  const { error } = await resend.emails.send({ from: FROM, to: params.proEmail, subject: `Reschedule request — ${params.clientName}`, html });
  if (error) console.error('[email] reschedule request to pro failed:', error);
}

type RescheduleResultToProParams = {
  proEmail: string;
  proName: string;
  clientName: string;
  serviceName: string;
  newStartsAt: string;
  timezone: string;
  accepted: boolean;
};

export async function sendRescheduleResultToPro(params: RescheduleResultToProParams) {
  const resend = getResend();
  if (!resend) return;
  const { dateStr, timeStr } = formatDateTime(params.newStartsAt, params.timezone);
  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr><td style="background:${params.accepted ? '#059669' : '#374151'};padding:28px 32px;">
          <p style="margin:0;color:${params.accepted ? '#d1fae5' : '#d1d5db'};font-size:13px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;">SessionPro</p>
          <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:800;">${params.accepted ? 'Reschedule accepted' : 'Reschedule declined'}</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
            ${params.accepted
              ? `<strong>${params.clientName}</strong> has accepted the reschedule. The session is now confirmed for the new time.`
              : `<strong>${params.clientName}</strong> has declined the reschedule. The original session time remains.`}
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
            <tr><td style="padding:20px 24px;">
              ${row('Session', params.serviceName)}
              ${row(params.accepted ? 'New date' : 'Proposed date', dateStr)}
              ${row(params.accepted ? 'New time' : 'Proposed time', timeStr)}
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">SessionPro</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  const { error } = await resend.emails.send({ from: FROM, to: params.proEmail, subject: `Reschedule ${params.accepted ? 'accepted' : 'declined'} — ${params.clientName}`, html });
  if (error) console.error('[email] reschedule result to pro failed:', error);
}

type RescheduleResultToClientParams = {
  clientEmail: string;
  clientName: string;
  proName: string;
  serviceName: string;
  requestedStartsAt: string;
  timezone: string;
  accepted: boolean;
};

export async function sendRescheduleResultToClient(params: RescheduleResultToClientParams) {
  const resend = getResend();
  if (!resend) return;
  const { dateStr, timeStr } = formatDateTime(params.requestedStartsAt, params.timezone);
  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr><td style="background:${params.accepted ? '#059669' : '#374151'};padding:28px 32px;">
          <p style="margin:0;color:${params.accepted ? '#d1fae5' : '#d1d5db'};font-size:13px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;">SessionPro</p>
          <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:800;">${params.accepted ? 'Reschedule confirmed' : 'Reschedule request declined'}</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
            ${params.accepted
              ? `Hi ${params.clientName.split(' ')[0]}, <strong>${params.proName}</strong> accepted your reschedule request. Your session is now confirmed for the new time.`
              : `Hi ${params.clientName.split(' ')[0]}, <strong>${params.proName}</strong> wasn&rsquo;t able to accommodate your requested time. Your original session time remains confirmed.`}
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
            <tr><td style="padding:20px 24px;">
              ${row('Session', params.serviceName)}
              ${row(params.accepted ? 'New date' : 'Requested date', dateStr)}
              ${row(params.accepted ? 'New time' : 'Requested time', timeStr)}
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">SessionPro</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  const { error } = await resend.emails.send({ from: FROM, to: params.clientEmail, subject: `Reschedule request ${params.accepted ? 'accepted' : 'declined'} — ${params.proName}`, html });
  if (error) console.error('[email] reschedule result to client failed:', error);
}

type ReminderEmailParams = {
  clientEmail: string;
  clientName: string;
  proName: string;
  serviceName: string;
  startsAt: string;
  timezone: string;
  location: string | null;
  scheduledAt: string;
};

export async function sendReminderEmail(params: ReminderEmailParams) {
  const resend = getResend();
  if (!resend) return;

  const { dateStr, timeStr } = formatDateTime(params.startsAt, params.timezone);

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr>
          <td style="background:#059669;padding:28px 32px;">
            <p style="margin:0;color:#d1fae5;font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">SessionPro</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:800;">Your session is tomorrow</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
              Hi ${params.clientName.split(' ')[0]}, just a reminder that your session with <strong>${params.proName}</strong> is coming up tomorrow.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                ${row('Session', params.serviceName)}
                ${row('Date', dateStr)}
                ${row('Time', timeStr)}
                ${params.location ? row('Location', params.location) : ''}
              </td></tr>
            </table>

            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
              See you there! Reply to this email if you need to get in touch.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">SessionPro &mdash; Powered by Stripe</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const sendParams: Parameters<typeof resend.emails.send>[0] = {
    from: FROM,
    to: params.clientEmail,
    subject: `Reminder: your session with ${params.proName} is tomorrow`,
    html,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (sendParams as any).scheduledAt = params.scheduledAt;

  const { error } = await resend.emails.send(sendParams);
  if (error) console.error('[email] reminder failed:', error);
}

type EnrollmentSessionConfirmationParams = {
  clientEmail: string;
  clientName: string;
  proName: string;
  serviceName: string;
  sessionNumber: number;
  sessionsTotal: number;
  startsAt: string;
  timezone: string;
  location: string | null;
};

export async function sendEnrollmentSessionConfirmation(params: EnrollmentSessionConfirmationParams) {
  const resend = getResend();
  if (!resend) return;

  const { dateStr, timeStr } = formatDateTime(params.startsAt, params.timezone);

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr>
          <td style="background:#059669;padding:28px 32px;">
            <p style="margin:0;color:#d1fae5;font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">SessionPro</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:800;">Session ${params.sessionNumber} confirmed!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
              Hi ${params.clientName.split(' ')[0]}, your session ${params.sessionNumber} of ${params.sessionsTotal} with <strong>${params.proName}</strong> is confirmed.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                ${row('Package', `${params.serviceName} — Session ${params.sessionNumber} of ${params.sessionsTotal}`)}
                ${row('Date', dateStr)}
                ${row('Time', timeStr)}
                ${params.location ? row('Location', params.location) : ''}
                ${row('Payment', 'Included in package')}
              </td></tr>
            </table>

            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
              Reply to this email if you have any questions.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">SessionPro &mdash; Powered by Stripe</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.clientEmail,
    subject: `Session ${params.sessionNumber} confirmed — ${params.serviceName} with ${params.proName}`,
    html,
  });
  if (error) console.error('[email] enrollment session confirmation failed:', error);
}

type NextSessionLinkParams = {
  clientEmail: string;
  clientName: string;
  proName: string;
  proSlug: string;
  serviceName: string;
  enrollmentId: string;
  sessionNumber: number;
  sessionsTotal: number;
};

export async function sendNextSessionLink(params: NextSessionLinkParams) {
  const resend = getResend();
  if (!resend) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sessionpro.io';
  const bookingUrl = `${appUrl}/${params.proSlug}?enrollment=${params.enrollmentId}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr>
          <td style="background:#059669;padding:28px 32px;">
            <p style="margin:0;color:#d1fae5;font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">SessionPro</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:800;">Time to book your next session</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
              Hi ${params.clientName.split(' ')[0]}, your <strong>${params.serviceName}</strong> package still has sessions remaining. Book your next one whenever you&rsquo;re ready.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                ${row('Package', params.serviceName)}
                ${row('Next session', `Session ${params.sessionNumber} of ${params.sessionsTotal}`)}
                ${row('With', params.proName)}
                ${row('Payment', 'Already covered — book for free')}
              </td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td align="center">
                <a href="${bookingUrl}" style="display:inline-block;background:#059669;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;">
                  Book session ${params.sessionNumber}
                </a>
              </td></tr>
            </table>

            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
              This link is personal to you. Reply to this email if you have any questions.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">SessionPro &mdash; Powered by Stripe</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.clientEmail,
    subject: `Book your next session with ${params.proName} — Session ${params.sessionNumber} of ${params.sessionsTotal}`,
    html,
  });
  if (error) console.error('[email] next session link failed:', error);
}

type RecurringInviteParams = {
  clientEmail: string;
  clientName: string;
  proName: string;
  serviceName: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  nextStartsAt: string;
  timezone: string;
  recurringBookingId: string;
};

export async function sendRecurringInvite(params: RecurringInviteParams) {
  const resend = getResend();
  if (!resend) return;

  const { dateStr, timeStr } = formatDateTime(params.nextStartsAt, params.timezone);
  const frequencyLabel = { weekly: 'Weekly', biweekly: 'Every two weeks', monthly: 'Monthly' }[params.frequency];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sessionpro.io';
  const acceptUrl = `${appUrl}/booking/recurring?id=${params.recurringBookingId}&action=accept`;
  const declineUrl = `${appUrl}/booking/recurring?id=${params.recurringBookingId}&action=decline`;

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr><td style="background:#059669;padding:28px 32px;">
          <p style="margin:0;color:#d1fae5;font-size:13px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;">SessionPro</p>
          <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:800;">Recurring session invite</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
            Hi ${params.clientName.split(' ')[0]}, <strong>${params.proName}</strong> has invited you to set up recurring ${params.serviceName} sessions. A payment link will be sent 48 hours before each session — just pay and you&rsquo;re confirmed.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              ${row('Session', params.serviceName)}
              ${row('Frequency', frequencyLabel)}
              ${row('First session', dateStr)}
              ${row('Time', timeStr)}
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
            <tr>
              <td style="padding-right:8px;">
                <a href="${acceptUrl}" style="display:block;text-align:center;background:#059669;color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 0;border-radius:8px;">Accept</a>
              </td>
              <td style="padding-left:8px;">
                <a href="${declineUrl}" style="display:block;text-align:center;background:#f9fafb;color:#374151;font-size:14px;font-weight:700;text-decoration:none;padding:12px 0;border-radius:8px;border:1px solid #e5e7eb;">Decline</a>
              </td>
            </tr>
          </table>
          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">You can cancel at any time by clicking the cancel link in any future payment email.</p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">SessionPro &mdash; Powered by Stripe</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.clientEmail,
    subject: `Recurring session invite — ${params.serviceName} with ${params.proName}`,
    html,
  });
  if (error) console.error('[email] recurring invite failed:', error);
}

type RecurringPaymentLinkParams = {
  clientEmail: string;
  clientName: string;
  proName: string;
  serviceName: string;
  startsAt: string;
  timezone: string;
  paymentUrl: string;
  paymentExpiresAt: string;
  recurringBookingId: string;
};

export async function sendRecurringPaymentLink(params: RecurringPaymentLinkParams) {
  const resend = getResend();
  if (!resend) return;

  const { dateStr, timeStr } = formatDateTime(params.startsAt, params.timezone);
  const expiryStr = new Date(params.paymentExpiresAt).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sessionpro.io';
  const cancelUrl = `${appUrl}/booking/recurring?id=${params.recurringBookingId}&action=cancel`;

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr><td style="background:#059669;padding:28px 32px;">
          <p style="margin:0;color:#d1fae5;font-size:13px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;">SessionPro</p>
          <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:800;">Your next session is coming up</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
            Hi ${params.clientName.split(' ')[0]}, your next <strong>${params.serviceName}</strong> session with <strong>${params.proName}</strong> is in 48 hours. Complete your payment to confirm.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              ${row('Session', params.serviceName)}
              ${row('Date', dateStr)}
              ${row('Time', timeStr)}
              ${row('Payment link expires', expiryStr)}
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td align="center">
              <a href="${params.paymentUrl}" style="display:inline-block;background:#059669;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;">
                Complete payment
              </a>
            </td></tr>
          </table>
          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
            If you no longer want recurring sessions, <a href="${cancelUrl}" style="color:#6b7280;">cancel your subscription here</a>.
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">SessionPro &mdash; Powered by Stripe</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.clientEmail,
    subject: `Your ${params.serviceName} session is in 48 hours — complete payment`,
    html,
  });
  if (error) console.error('[email] recurring payment link failed:', error);
}

function row(label: string, value: string) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
      <tr>
        <td style="color:#6b7280;font-size:13px;width:40%;">${label}</td>
        <td style="color:#111827;font-size:13px;font-weight:600;">${value}</td>
      </tr>
    </table>`;
}
