const { jsPDF } = require('jspdf');

/**
 * Generate a PDF from conversation messages.
 * @param {string} title - The conversation title
 * @param {Array<{role: string, text: string}>} messages - Array of messages
 * @returns {string} Data URI of the generated PDF
 */
function generatePDF(title, messages) {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(title, maxWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 8 + 5;

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Messages
    doc.setFontSize(10);

    for (const msg of messages) {
        // Role label
        const roleLabel = msg.role === 'user' ? 'You' : 'ChatGPT';
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);

        // Check if we need a new page for the role label
        if (y + 10 > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
        doc.text(roleLabel, margin, y);
        y += 6;

        // Message text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        // Split the text into lines that fit the page width
        const lines = doc.splitTextToSize(msg.text, maxWidth);

        for (let i = 0; i < lines.length; i++) {
            if (y + 5 > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
            doc.text(lines[i], margin, y);
            y += 4.5;
        }

        // Add spacing between messages
        y += 6;

        // Light separator between messages
        if (y + 2 < pageHeight - margin) {
            doc.setDrawColor(230, 230, 230);
            doc.setLineWidth(0.2);
            doc.line(margin, y - 3, pageWidth - margin, y - 3);
        }
    }

    // Return as data URI
    return doc.output('datauristring');
}

module.exports = { generatePDF };
