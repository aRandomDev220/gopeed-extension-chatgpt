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
