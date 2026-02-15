/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 938
(module) {

// Minimal PDF generator using raw PDF format strings
// No external dependencies - constructs valid PDF from plain text
// Uses Helvetica (Type1 font, no embedding needed)

// Escape special PDF string characters
function escapePdf(str) {
    return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

// Pad number to fixed width with leading zeros
function pad(num, width) {
    var s = '' + num;
    while (s.length < width) s = '0' + s;
    return s;
}

// Strip markdown formatting to plain text
function stripMarkdown(text) {
    // Remove title/URL/metadata header from Jina
    text = text.replace(/^Title:.*\n/m, '');
    text = text.replace(/^URL Source:.*\n/m, '');
    text = text.replace(/^Markdown Content:\n/m, '');

    // Convert headers to uppercase plain text
    text = text.replace(/^#{1,6}\s+(.+)$/gm, function (m, title) {
        return title.toUpperCase();
    });

    // Remove bold/italic markers
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, '$1');
    text = text.replace(/\*\*(.+?)\*\*/g, '$1');
    text = text.replace(/\*(.+?)\*/g, '$1');
    text = text.replace(/_(.+?)_/g, '$1');

    // Convert bullet points
    text = text.replace(/^\*\s+/gm, '  - ');

    // Remove image references
    text = text.replace(/!\[.*?\]\(.*?\)/g, '[image]');

    // Remove links but keep text
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Remove horizontal rules
    text = text.replace(/^[-=]{3,}$/gm, '────────────────────────────────────────');

    // Remove non-Latin1 characters (PDF Type1 fonts only support Latin1)
    text = text.replace(/[^\x00-\xFF]/g, '?');

    return text.trim();
}

// Word-wrap text to fit within a given character width
function wordWrap(text, maxChars) {
    var lines = text.split('\n');
    var wrapped = [];

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.length <= maxChars) {
            wrapped.push(line);
        } else {
            while (line.length > maxChars) {
                var breakPos = line.lastIndexOf(' ', maxChars);
                if (breakPos <= 0) breakPos = maxChars;
                wrapped.push(line.substring(0, breakPos));
                line = line.substring(breakPos).replace(/^\s/, '');
            }
            if (line.length > 0) wrapped.push(line);
        }
    }

    return wrapped;
}

// Generate a valid PDF file as a string from plain text
function generatePdf(text) {
    var fontSize = 10;
    var lineHeight = 14;
    var pageWidth = 612;   // Letter width in points
    var pageHeight = 792;  // Letter height in points
    var margin = 72;       // 1 inch margins
    var usableWidth = pageWidth - 2 * margin;
    var charsPerLine = Math.floor(usableWidth / (fontSize * 0.52));
    var startY = pageHeight - margin;
    var linesPerPage = Math.floor((startY - margin) / lineHeight);

    // Prepare text
    var plainText = stripMarkdown(text);
    var allLines = wordWrap(plainText, charsPerLine);

    // Split into pages
    var pages = [];
    for (var i = 0; i < allLines.length; i += linesPerPage) {
        pages.push(allLines.slice(i, i + linesPerPage));
    }
    if (pages.length === 0) pages.push(['(empty conversation)']);

    // Build PDF objects
    // Object 1: Catalog
    // Object 2: Pages
    // Object 3: Font
    // Then pairs of (Page, Content) for each page

    var totalObjects = 3 + pages.length * 2;
    var fontObjNum = 3;
    var pdfBody = '';
    var offsets = [];

    // Helper to add an object
    function addObj(num, content) {
        offsets[num] = pdfBody.length + 10; // +10 for '%PDF-1.4\n'
        pdfBody += num + ' 0 obj\n' + content + '\nendobj\n';
    }

    // Object 1: Catalog
    addObj(1, '<< /Type /Catalog /Pages 2 0 R >>');

    // Collect page object references
    var pageObjNums = [];
    for (var p = 0; p < pages.length; p++) {
        pageObjNums.push((4 + p * 2) + ' 0 R');
    }

    // Object 2: Pages
    addObj(2, '<< /Type /Pages /Kids [' + pageObjNums.join(' ') + '] /Count ' + pages.length + ' >>');

    // Object 3: Font
    addObj(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

    // Generate page + content object pairs
    for (var p = 0; p < pages.length; p++) {
        var pageObjNum = 4 + p * 2;
        var contentObjNum = 5 + p * 2;

        // Build content stream
        var stream = 'BT\n/F1 ' + fontSize + ' Tf\n';
        stream += margin + ' ' + startY + ' Td\n';

        for (var l = 0; l < pages[p].length; l++) {
            var escaped = escapePdf(pages[p][l]);
            if (l === 0) {
                stream += '(' + escaped + ') Tj\n';
            } else {
                stream += '0 -' + lineHeight + ' Td\n(' + escaped + ') Tj\n';
            }
        }
        stream += 'ET';

        // Content object (must come before page so offset is known)
        addObj(contentObjNum, '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream');

        // Page object
        addObj(pageObjNum, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pageWidth + ' ' + pageHeight + '] /Contents ' + contentObjNum + ' 0 R /Resources << /Font << /F1 ' + fontObjNum + ' 0 R >> >> >>');
    }

    // Build complete PDF
    var pdf = '%PDF-1.4\n';
    var headerLen = pdf.length;

    // Adjust offsets
    for (var i = 1; i <= totalObjects; i++) {
        offsets[i] = offsets[i] || 0;
    }

    pdf += pdfBody;

    // Cross-reference table
    var xrefOffset = pdf.length;
    pdf += 'xref\n';
    pdf += '0 ' + (totalObjects + 1) + '\n';
    pdf += '0000000000 65535 f \n';

    // We need offsets in object-number order
    for (var i = 1; i <= totalObjects; i++) {
        var off = offsets[i] || 0;
        pdf += pad(off, 10) + ' 00000 n \n';
    }

    pdf += 'trailer\n';
    pdf += '<< /Size ' + (totalObjects + 1) + ' /Root 1 0 R >>\n';
    pdf += 'startxref\n';
    pdf += xrefOffset + '\n';
    pdf += '%%EOF';

    return pdf;
}

module.exports = { generatePdf: generatePdf };


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
// ChatGPT Conversation Downloader for Gopeed
// 
// Uses Jina Reader (r.jina.ai) to extract conversation content from ChatGPT share pages.
// Supports three output formats via extension settings:
//   - Text: Formatted markdown text file (default)
//   - PDF: Generated PDF document (via Jina fetch + manual PDF + paste.rs)
//   - Screenshot: Full-page PNG screenshot of the conversation

var pdfGen = __webpack_require__(938);

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

/******/ })()
;