// Cloudflare Pages Function — POST /api/send-message
// Receives the Contact Us form payload and emails it via Resend.

const REQUIRED_FIELDS = ['cname', 'cemail', 'csubject', 'cmessage'];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  for (const field of REQUIRED_FIELDS) {
    if (!data[field] || String(data[field]).trim() === '') {
      return Response.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }

  if (!env.RESEND_API_KEY) {
    return Response.json({ error: 'Email service is not configured' }, { status: 500 });
  }

  const text = `From: ${data.cname} <${data.cemail}>\n\n${data.cmessage}`;
  const rows = [
    ['Name', escapeHtml(data.cname)],
    ['Email', escapeHtml(data.cemail)],
    ['Subject', escapeHtml(data.csubject)],
    ['Message', escapeHtml(data.cmessage).replace(/\n/g, '<br>')],
  ];

  // gold-on-transparent logo, so it sits on a black band that matches the brand
  // and reads the same in light- and dark-mode mail clients
  const logoUrl = `${new URL(request.url).origin}/assets/img/logo-kojak.png`;
  const html = `<div style="background:#0a0a0c;padding:24px;text-align:center;border-radius:8px;"><img src="${logoUrl}" alt="Kojak Limousine LLC" width="220" style="display:inline-block;width:220px;height:auto;border:0;"></div><h2>New Contact Message</h2><table>${rows
    .map(([label, value]) => `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top;">${label}</td><td>${value}</td></tr>`)
    .join('')}</table>`;

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Kojak Limousine Website <hello@kojaklimousine.uluxe.site>',
      to: ['kojaklimousine@icloud.com'],
      reply_to: data.cemail,
      subject: `Contact Form: ${data.csubject}`,
      text,
      html,
    }),
  });

  if (!resendRes.ok) {
    const details = await resendRes.text();
    return Response.json({ error: 'Failed to send email', details }, { status: 502 });
  }

  return Response.json({ success: true });
}
