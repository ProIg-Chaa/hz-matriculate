const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

function getCorsHeaders(request, env) {
  const origin = request.headers.get("origin") || "";
  const allowedOrigin = env.ALLOWED_ORIGIN || "*";
  const allowOrigin = allowedOrigin === "*" || allowedOrigin === origin ? origin || "*" : allowedOrigin;

  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400"
  };
}

function json(data, status, request, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...JSON_HEADERS,
      ...getCorsHeaders(request, env)
    }
  });
}

function getSlug(pathname) {
  const match = pathname.match(/^\/likes\/([^/]+)\/?$/);
  if (!match) return null;

  const slug = decodeURIComponent(match[1]);
  return /^[a-z0-9][a-z0-9-_]{0,120}$/i.test(slug) ? slug : null;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request, env)
      });
    }

    if (!env.LIKES) {
      return json({ error: "Missing LIKES KV binding" }, 500, request, env);
    }

    const url = new URL(request.url);
    const slug = getSlug(url.pathname);

    if (!slug) {
      return json({ error: "Not found" }, 404, request, env);
    }

    const key = `article:${slug}`;

    if (request.method === "GET") {
      const value = await env.LIKES.get(key);
      return json({ slug, likes: Number(value || 0) }, 200, request, env);
    }

    if (request.method === "POST") {
      const current = Number((await env.LIKES.get(key)) || 0);
      const likes = current + 1;
      await env.LIKES.put(key, String(likes));
      return json({ slug, likes }, 200, request, env);
    }

    return json({ error: "Method not allowed" }, 405, request, env);
  }
};
