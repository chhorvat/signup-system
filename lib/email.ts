import nodemailer from 'nodemailer';
import { format, parseISO } from 'date-fns';

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy');
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string): string {
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return timeStr;
  }
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    // Use Ethereal (test) transport in development
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER || '',
        pass: process.env.ETHEREAL_PASS || '',
      },
    });
  }

  return nodemailer.createTransport({ host, port, auth: { user, pass } });
}

const FROM = process.env.EMAIL_FROM || 'Basketball League <noreply@example.com>';

export async function sendConfirmationEmail(
  to: string,
  name: string,
  date: string,
  time: string,
  location: string,
  cancelUrl: string
): Promise<void> {
  const transporter = createTransporter();
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `You're in for ${formattedDate}!`,
    text: `Hi ${name},\n\nYou're confirmed for basketball on ${formattedDate} at ${formattedTime} — ${location}.\n\nNeed to cancel? Use this link:\n${cancelUrl}\n\nSee you on the court!`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #1d4ed8;">You're in! 🏀</h2>
        <p>Hi ${name},</p>
        <p>You're <strong>confirmed</strong> for basketball:</p>
        <ul>
          <li><strong>Date:</strong> ${formattedDate}</li>
          <li><strong>Time:</strong> ${formattedTime}</li>
          <li><strong>Location:</strong> ${location}</li>
        </ul>
        <p>Need to cancel? <a href="${cancelUrl}" style="color: #dc2626;">Click here to cancel your spot</a></p>
        <p>See you on the court!</p>
      </div>
    `,
  });
}

export async function sendWaitlistEmail(
  to: string,
  name: string,
  date: string,
  time: string,
  location: string,
  position: number,
  cancelUrl: string
): Promise<void> {
  const transporter = createTransporter();
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `You're #${position} on the waitlist for ${formattedDate}`,
    text: `Hi ${name},\n\nYou're #${position} on the waitlist for basketball on ${formattedDate} at ${formattedTime} — ${location}.\n\nWe'll email you right away if a spot opens up.\n\nWant to remove yourself from the waitlist?\n${cancelUrl}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #d97706;">You're on the waitlist 🏀</h2>
        <p>Hi ${name},</p>
        <p>You're <strong>#${position} on the waitlist</strong> for basketball:</p>
        <ul>
          <li><strong>Date:</strong> ${formattedDate}</li>
          <li><strong>Time:</strong> ${formattedTime}</li>
          <li><strong>Location:</strong> ${location}</li>
        </ul>
        <p>We'll email you right away if a spot opens up.</p>
        <p>Want off the waitlist? <a href="${cancelUrl}" style="color: #dc2626;">Click here to remove yourself</a></p>
      </div>
    `,
  });
}

export async function sendPromotionEmail(
  to: string,
  name: string,
  date: string,
  time: string,
  location: string,
  cancelUrl: string
): Promise<void> {
  const transporter = createTransporter();
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Good news — you're in for ${formattedDate}!`,
    text: `Hi ${name},\n\nA spot opened up! You've been moved from the waitlist to confirmed for basketball on ${formattedDate} at ${formattedTime} — ${location}.\n\nNeed to cancel? Use this link:\n${cancelUrl}\n\nSee you on the court!`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #16a34a;">A spot opened up! 🏀</h2>
        <p>Hi ${name},</p>
        <p>You've been moved from the waitlist to <strong>confirmed</strong> for basketball:</p>
        <ul>
          <li><strong>Date:</strong> ${formattedDate}</li>
          <li><strong>Time:</strong> ${formattedTime}</li>
          <li><strong>Location:</strong> ${location}</li>
        </ul>
        <p>Need to cancel? <a href="${cancelUrl}" style="color: #dc2626;">Click here to cancel your spot</a></p>
        <p>See you on the court!</p>
      </div>
    `,
  });
}
