/******/ (() => { // webpackBootstrap
// ChatGPT Conversation Downloader for Gopeed
// 
// Uses Jina Reader (r.jina.ai) to extract conversation text from ChatGPT share pages.
// Jina renders the page with a real browser, so Cloudflare doesn't block it.
// Gopeed then downloads the text directly from Jina's servers.

gopeed.events.onResolve(function (ctx) {
    var url = ctx.req.url;

    // Extract the share ID from the URL
    var shareMatch = url.match(/\/share\/(?:e\/)?([a-f0-9-]+)/i);
    if (!shareMatch) {
        return;
    }
    var shareId = shareMatch[1];

    // Use Jina Reader to get the conversation as text
    // Jina renders pages with a real browser and returns markdown content
    var jinaUrl = 'https://r.jina.ai/' + url;

    // Use share ID for filename since we can't fetch the title synchronously
    var fileName = 'ChatGPT_' + shareId.substring(0, 8) + '.txt';

    ctx.res = {
        name: fileName,
        files: [
            {
                name: fileName,
                req: {
                    url: jinaUrl
                }
            }
        ]
    };
});

/******/ })()
;