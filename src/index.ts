export default {
  async fetch(request: Request, env: { DB: D1Database }) {
    const url = new URL(request.url);

    // 处理 CORS 预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (url.pathname === "/api/login" && request.method === "POST") {
      try {
        const body = await request.json();
        const username = body.username;
        const password = body.password;

        if (!username || !password) {
          return new Response(
            JSON.stringify({ success: false, error: "用户名和密码不能为空" }),
            {
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }

        // 不安全的 SQL 查询 - 演示 SQL 注入
        const sql = `SELECT * FROM users WHERE username = '${username}' AND password_hash = '${password}'`;
        
        console.log("执行的SQL:", sql); // 用于调试

        const { results } = await env.DB.prepare(sql).all();

        if (results.length > 0) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              user: results[0],
              message: "登录成功！" 
            }),
            {
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        } else {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "用户名或密码错误" 
            }),
            {
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }
      } catch (error) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "服务器错误: " + error.message 
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
    }

    // 获取所有用户（仅用于演示）
    if (url.pathname === "/api/users" && request.method === "GET") {
      try {
        const { results } = await env.DB.prepare("SELECT id, username FROM users").all();
        return new Response(JSON.stringify(results), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: "获取用户列表失败" }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
    }

    // 默认返回欢迎信息
    return new Response(
      JSON.stringify({ 
        message: "SQL注入演示API", 
        endpoints: {
          login: "POST /api/login",
          users: "GET /api/users"
        }
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  },
};
