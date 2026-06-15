export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === "/auth") {
            const redirect = `https://github.com/login/oauth/authorize?client_id=${env.CLIENT_ID}&scope=repo,user`;
            return Response.redirect(redirect, 302);
        }

        if (url.pathname === "/callback") {
            const code = url.searchParams.get("code");

            const response = await fetch("https://github.com/login/oauth/access_token", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({
                    client_id: env.CLIENT_ID,
                    client_secret: env.CLIENT_SECRET,
                    code,
                }),
            });

            const data = await response.json();
            const token = data.access_token;
            const error = data.error;

            const html = error
                ? `<script>window.opener.postMessage('authorization:github:error:${error}','*');window.close();</script>`
                : `<html><body><script>
            (function() {
              function receiveMessage(e) {
                window.opener.postMessage(
                  'authorization:github:success:${JSON.stringify({ token: "__TOKEN__" }).replace("__TOKEN__", token)}',
                  e.origin
                );
              }
              window.addEventListener("message", receiveMessage, false);
              window.opener.postMessage("authorizing:github", "*");
            })();
          </script></body></html>`;

            return new Response(html, {
                headers: { "Content-Type": "text/html" },
            });
        }

        return new Response("OK");
    },
};