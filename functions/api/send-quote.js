// Cloudflare Pages Function — POST /api/send-quote
// Receives the Book Now form payload and emails it via Resend.

const REQUIRED_FIELDS = [
  'fname', 'phone', 'email', 'service',
  'date', 'time', 'pickup', 'dropoff', 'passengers', 'vehicle',
];

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

  const rows = [
    ['Name', data.fname],
    ['Phone', data.phone],
    ['Email', data.email],
    ['Service', data.service],
    ['Date', data.date],
    ['Time', data.time],
    ['Pickup', data.pickup],
    ['Drop-off', data.dropoff],
    ['Passengers', data.passengers],
    ['Vehicle', data.vehicle],
    ['Notes', data.notes || '—'],
  ];

  const text = rows.map(([label, value]) => `${label}: ${value}`).join('\n');
  const html = `<h2>New Quote Request</h2><table>${rows
    .map(([label, value]) => `<tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`)
    .join('')}</table>`;

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Kojak Limousine Quotes <quotes@kojaklimousine.uluxe.site>',
      to: ['kojaklimousine@icloud.com'],
      reply_to: data.email,
      subject: `New Quote Request — ${data.service}`,
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
