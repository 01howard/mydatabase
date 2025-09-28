interface Env {
  DB: any; // 使用 any 类型避免类型检查问题
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    // CORS 处理
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // 调试信息 - 检查 env 对象
    console.log("Env keys:", Object.keys(env));
    console.log("DB type:", typeof env.DB);
    console.log("DB methods:", env.DB ? Object.getOwnPropertyNames(env.DB) : "DB is undefined");

    // 检查数据库绑定
    if (!env.DB) {
      return new Response(
        JSON.stringify({ 
          error: "数据库未正确配置 - env.DB 是 undefined",
          debug: {
            envKeys: Object.keys(env),
            timestamp: new Date().toISOString()
          }
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // 检查 prepare 方法是否存在
    if (typeof env.DB.prepare !== 'function') {
      return new Response(
        JSON.stringify({ 
          error: "数据库绑定不正确 - prepare 方法不存在",
          debug: {
            dbType: typeof env.DB,
            dbMethods: Object.getOwnPropertyNames(env.DB),
            timestamp: new Date().toISOString()
          }
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // 登录 API
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
        
        console.log("执行的SQL:", sql);

        try {
          // 使用更安全的方式调用 prepare
          const stmt = env.DB.prepare(sql);
          const result = await stmt.all();
          
          if (result.results && result.results.length > 0) {
            return new Response(
              JSON.stringify({ 
                success: true, 
                user: result.results[0],
                message: "登录成功！",
                sql: sql // 返回 SQL 用于演示
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
                error: "用户名或密码错误",
                sql: sql // 返回 SQL 用于演示
              }),
              {
                headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*",
                },
              }
            );
          }
        } catch (dbError: any) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "数据库查询错误",
              sql: sql,
              details: dbError.message
            }),
            {
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }
      } catch (error: any) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "请求解析错误: " + error.message 
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

    // 健康检查端点
    if (url.pathname === "/api/health") {
      try {
        const test = await env.DB.prepare("SELECT 1 as test").first();
        return new Response(
          JSON.stringify({ 
            status: "healthy", 
            database: "connected",
            testResult: test,
            timestamp: new Date().toISOString()
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      } catch (error: any) {
        return new Response(
          JSON.stringify({ 
            status: "unhealthy", 
            database: "disconnected",
            error: error.message
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
    }

    // 默认返回
    return new Response(
      JSON.stringify({ 
        message: "SQL注入演示API", 
        endpoints: {
          login: "POST /api/login",
          health: "GET /api/health"
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
