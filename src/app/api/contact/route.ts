import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Simple in-memory rate limiting (Note: This resets on Vercel cold starts, but it's enough for a simple safeguard)
const rateLimitCache = new Map<string, { count: number, resetTime: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5; // 5 requests per 15 mins per IP

  const record = rateLimitCache.get(ip);
  if (!record) {
    rateLimitCache.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (now > record.resetTime) {
    rateLimitCache.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (record.count >= maxRequests) {
    return true;
  }

  record.count++;
  return false;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  try {
    // Basic Rate Limiting
    const forwardedFor = req.headers.get('x-forwarded-for') || 'unknown';
    const ip = forwardedFor.split(',')[0].trim();

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Çok fazla mesaj gönderdiniz. Lütfen 15 dakika sonra tekrar deneyin.' },
        { status: 429 }
      );
    }

    // Parse the body
    const { name, email, subject, message } = await req.json();

    // Validate inputs
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Lütfen tüm alanları doldurun.' },
        { status: 400 }
      );
    }

    // Enforce field length caps
    if (
      typeof name !== 'string' || name.length > 200 ||
      typeof subject !== 'string' || subject.length > 200 ||
      typeof message !== 'string' || message.length > 5000
    ) {
      return NextResponse.json(
        { error: 'Alanlardan biri çok uzun. Lütfen içeriği kısaltın.' },
        { status: 400 }
      );
    }

    // Validate email before it is used as the reply-to address
    if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { error: 'Lütfen geçerli bir e-posta adresi girin.' },
        { status: 400 }
      );
    }

    // Email delivery must be configured; never send with a placeholder key.
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('Contact Form API Error: RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: 'İletişim servisi şu anda yapılandırılmamış.' },
        { status: 503 }
      );
    }

    // Generate Ticket ID
    const generatedTicket = `SND-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8)}`;

    // Send email using Resend
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: 'İzledin Sistem <info@izledin.com>', // Must be verified domain
      to: 'destek@izledin.com', // Sent to the club support (which forwards to Gmail)
      replyTo: email, // This allows the admin to hit "Reply" in Gmail and reply directly to the user
      subject: `[${generatedTicket}] ${subject.toUpperCase()} - Yeni İletişim Formu Mesajı`,
      text: `
İzledin.com İletişim Formu üzerinden yeni bir mesaj aldınız.

Takip Kodu: ${generatedTicket}
Gönderen: ${name}
E-posta: ${email}
Konu: ${subject}

Mesaj:
--------------------------------------------------
${message}
--------------------------------------------------
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Mesaj gönderilirken bir sunucu hatası oluştu. Lütfen tekrar deneyin.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, ticketId: generatedTicket });

  } catch (err) {
    console.error('Contact Form API Error:', err);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu.' },
      { status: 500 }
    );
  }
}
