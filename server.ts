Bun.build({
    entrypoints: ['src/index.ts'],
    outdir: './build',
})
  

Bun.serve({
    fetch(req: Request): Response | Promise<Response> {
        Bun.build({
            entrypoints: ['src/index.ts'],
            outdir: './build',
        })

        console.log(req.url)

        const url = new URL(req.url);

        console.log(url.pathname)

        if (url.pathname === '/') {
            return new Response(Bun.file("src/index.html"));
        }

        const file = Bun.file(`.${url.pathname}`);
        return new Response(file);
    },
  
    port: 3000,
});

console.log('server is running on http://localhost:3000/');
