// ChatGPT Conversation Downloader for Gopeed
// 
// Uses Jina Reader (r.jina.ai) to extract conversation content from ChatGPT share pages.
// Supports two output formats via extension settings:
//   - Text: Formatted markdown text file (default)
//   - Screenshot: Full-page PNG screenshot of the conversation

gopeed.events.onResolve(function (ctx) {
    var url = ctx.req.url;

    // Extract the share ID from the URL
    var shareMatch = url.match(/\/share\/(?:e\/)?([a-f0-9-]+)/i);
    if (!shareMatch) {
        return;
    }
    var shareId = shareMatch[1];

    // Get user's format preference from settings
    var format = gopeed.settings.format || 'text';

    // Build the Jina Reader URL
    var jinaUrl = 'https://r.jina.ai/' + url;

    // Base filename from share ID
    var baseName = 'ChatGPT_' + shareId.substring(0, 8);

    if (format === 'screenshot') {
        // Screenshot mode: Jina returns a 302 redirect to a PNG on Google Cloud Storage
        var fileName = baseName + '.png';
        ctx.res = {
            name: fileName,
            files: [
                {
                    name: fileName,
                    req: {
                        url: jinaUrl,
                        extra: {
                            header: {
                                'X-Return-Format': 'pageshot'
                            }
                        }
                    }
                }
            ]
        };
    } else {
        // Text mode (default): Jina returns formatted markdown text
        var fileName = baseName + '.txt';
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
    }
});
