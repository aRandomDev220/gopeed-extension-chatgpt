// ChatGPT Conversation Downloader for Gopeed
// 
// Uses Jina Reader (r.jina.ai) to extract conversation content from ChatGPT share pages.
// Supports three output formats via extension settings:
//   - Text: Formatted markdown text file (default)
//   - PDF: Generated PDF document (via Jina fetch + manual PDF + paste.rs)
//   - Screenshot: Full-page PNG screenshot of the conversation

var pdfGen = require('./pdf-generator');

gopeed.events.onResolve(async function (ctx) {
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

    if (format === 'pdf') {
        // PDF mode: Fetch text from Jina, generate PDF, upload to paste.rs
        var textResp = await fetch(jinaUrl);
        if (!textResp.ok) {
            throw new Error('Jina Reader returned status ' + textResp.status);
        }
        var markdownText = await textResp.text();

        // Generate PDF from the markdown text
        var pdfContent = pdfGen.generatePdf(markdownText);

        // Upload PDF to paste.rs
        var pasteResp = await fetch('https://paste.rs/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/octet-stream' },
            body: pdfContent
        });

        if (!pasteResp.ok) {
            throw new Error('paste.rs returned status ' + pasteResp.status);
        }

        var pasteUrl = await pasteResp.text();
        pasteUrl = pasteUrl.trim();

        // Append .pdf so paste.rs serves with correct content type
        pasteUrl = pasteUrl + '.pdf';

        var fileName = baseName + '.pdf';
        ctx.res = {
            name: fileName,
            files: [
                {
                    name: fileName,
                    req: { url: pasteUrl }
                }
            ]
        };

    } else if (format === 'screenshot') {
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
                            header: { 'X-Return-Format': 'pageshot' }
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
                    req: { url: jinaUrl }
                }
            ]
        };
    }
});
