const build = () => {
    Bun.build({
        entrypoints: ['src/index.ts', 'src/gameMapGeneratorWorker.ts'],
        outdir: './build',
    })
}

build();

Bun.serve({
    fetch(req: Request): Response | Promise<Response> {
        build();

        console.log(req.url)

        const url = new URL(req.url);

        console.log(url.pathname)

        if (url.pathname === '/') {
            return new Response(Bun.file("index.html"));
        }

        const file = Bun.file(`.${url.pathname}`);
        return new Response(file);
    },
  
    port: 3000,
});

console.log('server is running on http://localhost:3000/');
