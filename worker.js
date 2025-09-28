// 簡單使用者登入範例（僅供示範）
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 處理註冊（可選）
    if (path === "/register" && request.method === "POST") {
      const data = await request.json();
      const { username, password } = data;

      if (!username || !password) {
        return new Response("Missing username or password", { status: 400 });
      }

      // 檢查是否已存在
      const existing = await env.USERS_DB.get(username);
      if (existing) {
        return new Response("User already exists", { status: 409 });
      }

      // 儲存密碼（⚠️ 實際應用應加密！）
      await env.USERS_DB.put(username, password);
      return new Response("User registered", { status: 201 });
    }

    // 處理登入
    if (path === "/login" && request.method === "POST") {
      const data = await request.json();
      const { username, password } = data;

      const storedPassword = await env.USERS_DB.get(username);
      if (storedPassword === password) {
        // 登入成功（這裡可設定 Cookie 或 JWT，但範例只回傳 OK）
        return new Response(JSON.stringify({ success: true, message: "Login successful" }), {
          headers: { "Content-Type": "application/json" }
        });
      } else {
        return new Response(JSON.stringify({ success: false, message: "Invalid credentials" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // 測試用首頁
    if (path === "/") {
      return new Response(`
        <h1>Simple Login Demo</h1>
        <p>POST /register { "username": "user", "password": "pass" }</p>
        <p>POST /login { "username": "user", "password": "pass" }</p>
      `, { headers: { "Content-Type": "text/html" } });
    }

    return new Response("Not found", { status: 404 });
  },
};
