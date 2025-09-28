export default {
  async fetch(request: Request, env: { DB: D1Database }) {
    const { results } = await env.DB.prepare("SELECT * FROM users").all();
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
