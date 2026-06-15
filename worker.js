export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === "/auth") {
            const redirect = `https://github.com/login/oauth/authorize?client_id=${env.CLIENT_ID}&scope=repo`;
            return Response.redirect(redirect, 302);
        }

        if (url.pathname === "/callback") {
            const code = url.searchParams.get("code");
            const response = await fetch("https://github.com/login/oauth/access_token", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({ client_id: env.CLIENT_ID, client_secret: env.CLIENT_SECRET, code }),
            });
            const data = await response.json();
            const token = data.access_token;
            const script = `<script>window.opener.postMessage('authorization:github:success:{"token":"${token}"}','*');window.close();</script>`;
            return new Response(script, { headers: { "Content-Type": "text/html" } });
        }

        return new Response("OK");
    }
};