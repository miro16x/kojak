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
  const html = `<p><strong>From:</strong> ${escapeHtml(data.cname)} &lt;${escapeHtml(data.cemail)}&gt;</p><p>${escapeHtml(data.cmessage).replace(/\n/g, '<br>')}</p>`;

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
