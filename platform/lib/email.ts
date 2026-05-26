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
                ${row('Session', params.serviceName)}
                ${row('Date', dateStr)}
                ${row('Time', timeStr)}
                ${params.location ? row('Location', params.location) : ''}
                ${row('Total paid', centsToDollars(params.priceCents))}
              </td></tr>
            </table>

            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
              Free cancellation up to 24 hours before your session. Reply to this email if you have any questions.
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
};

export async function sendCancellationEmail(params: CancellationEmailParams) {
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
          <td style="background:#374151;padding:28px 32px;">
            <p style="margin:0;color:#d1d5db;font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">SessionPro</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:800;">Booking cancelled</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
              Hi ${params.clientName.split(' ')[0]}, your session with <strong>${params.proName}</strong> has been cancelled.
              A full refund has been issued and should appear within 5–10 business days.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                ${row('Session', params.serviceName)}
                ${row('Date', dateStr)}
                ${row('Time', timeStr)}
                ${row('Refund', 'Full refund issued')}
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

function row(label: string, value: string) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
      <tr>
        <td style="color:#6b7280;font-size:13px;width:40%;">${label}</td>
        <td style="color:#111827;font-size:13px;font-weight:600;">${value}</td>
      </tr>
    </table>`;
}
