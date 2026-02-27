export async function onRequest(context) {
    const { request, env, params } = context;
    const url = new URL(request.url);
    const path = params.path || [];

    // 处理 OPTIONS 预检
    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }

    // GET /api/videos
    if (path[0] === "videos" && request.method === "GET") {
        const list = await env.VIDEOS.get("list", "json");
        return new Response(JSON.stringify(list || []), {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }

    // POST /api/add
    if (path[0] === "add" && request.method === "POST") {
        const data = await request.json();
        const { key, bv } = data;

        // 验证管理员密钥
        if (key !== env.ADMIN_KEY) {
            return new Response(JSON.stringify({ error: "Invalid key" }), {
                status: 401,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }
        if (!bv || !bv.startsWith("BV")) {
            return new Response(JSON.stringify({ error: "BV号格式错误" }), {
                status: 400,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }

        try {
            // 调用B站API获取视频信息
            const resp = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bv}`);
            const json = await resp.json();
            if (json.code !== 0) {
                return new Response(JSON.stringify({ error: "B站API错误: " + json.message }), {
                    status: 400,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                });
            }

            const { title, pic } = json.data;
            const newVideo = { bv, title, cover: pic, added: Date.now() };

            // 更新KV列表（去重）
            let list = await env.VIDEOS.get("list", "json") || [];
            list = list.filter(v => v.bv !== bv);
            list.push(newVideo);
            await env.VIDEOS.put("list", JSON.stringify(list));

            return new Response(JSON.stringify({ success: true, video: newVideo }), {
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), {
                status: 500,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }
    }

    // 404
    return new Response("Not found", { status: 404, headers: { "Access-Control-Allow-Origin": "*" } });
}