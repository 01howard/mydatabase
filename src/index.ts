export default {
  async fetch(request: Request, env: { DB: D1Database }) {
    const url = new URL(request.url);

    if (url.pathname === "/login" && request.method === "POST") {
      // 解析 body
      const body = await request.json();
      const username = body.username;
      const password = body.password;

      // 演示 SQL 注入（不安全示範！請勿用於生產環境）
      const sql = `SELECT * FROM users WHERE username = '${username}' AND password_hash = '${password}'`;

      // 執行查詢
      const { results } = await env.DB.prepare(sql).all();

      if (results.length > 0) {
        return new Response(JSON.stringify({ success: true, user: results[0] }), {
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({ success: false, error: "Invalid credentials" }), {
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 其他API
    const { results } = await env.DB.prepare("SELECT * FROM users").all();
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
