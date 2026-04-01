export async function onRequestPost(context) {
  try {
    const { email } = await context.request.json();

    if (!email || !email.includes('@') || !email.includes('.')) {
      return Response.json(
        { error: 'Please enter a valid email address.' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const normalized = email.trim().toLowerCase();

    // Check for duplicate
    const existing = await context.env.DB.prepare(
      'SELECT id FROM subscribers WHERE email = ?'
    ).bind(normalized).first();

    if (existing) {
      return Response.json(
        { success: true, message: "You're already on the list!" },
        { headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    await context.env.DB.prepare(
      'INSERT INTO subscribers (email, subscribed_at) VALUES (?, ?)'
    ).bind(normalized, new Date().toISOString()).run();

    return Response.json(
      { success: true, message: "You're in! We'll keep you posted." },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error) {
    return Response.json(
      { error: 'Something went wrong. Try again.' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
