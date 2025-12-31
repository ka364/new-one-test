/**
 * Chart Export Utilities
 * 
 * Provides functions to export charts as PNG or PDF files.
 * Uses html2canvas for rendering and jsPDF for PDF generation.
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportOptions {
  filename?: string;
  format?: 'png' | 'pdf';
  quality?: number; // 0-1 for PNG quality
  scale?: number; // Scale factor for higher resolution
  backgroundColor?: string;
}

/**
 * Export a chart element as PNG
 */
export async function exportChartAsPNG(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> {
  const {
    filename = 'chart',
    quality = 0.95,
    scale = 2,
    backgroundColor = '#ffffff'
  } = options;

  try {
    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale,
      backgroundColor,
      logging: false,
      useCORS: true,
      allowTaint: true
    });

    // Convert to blob and download
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      },
      'image/png',
      quality
    );
  } catch (error) {
    console.error('Error exporting chart as PNG:', error);
    throw new Error('فشل تصدير الرسم البياني كصورة PNG');
  }
}

/**
 * Export a chart element as PDF
 */
export async function exportChartAsPDF(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> {
  const {
    filename = 'chart',
    scale = 2,
    backgroundColor = '#ffffff'
  } = options;

  try {
    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale,
      backgroundColor,
      logging: false,
      useCORS: true,
      allowTaint: true
    });

    // Get canvas dimensions
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Calculate PDF dimensions (A4 size with margins)
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm
    const margin = 10; // Margin in mm
    const maxWidth = pdfWidth - 2 * margin;
    const maxHeight = pdfHeight - 2 * margin;

    // Calculate scaling to fit in PDF
    const ratio = Math.min(maxWidth / (imgWidth / 3.779527559), maxHeight / (imgHeight / 3.779527559));
    const scaledWidth = (imgWidth / 3.779527559) * ratio;
    const scaledHeight = (imgHeight / 3.779527559) * ratio;

    // Center the image
    const x = (pdfWidth - scaledWidth) / 2;
    const y = (pdfHeight - scaledHeight) / 2;

    // Create PDF
    const pdf = new jsPDF({
      orientation: scaledWidth > scaledHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add image to PDF
    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);

    // Add metadata
    pdf.setProperties({
      title: filename,
      subject: 'Chart Export from HADEROS',
      author: 'HADEROS Platform',
      keywords: 'chart, analytics, data visualization',
      creator: 'HADEROS AI Cloud'
    });

    // Save PDF
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting chart as PDF:', error);
    throw new Error('فشل تصدير الرسم البياني كملف PDF');
  }
}

/**
 * Export multiple charts as a single PDF
 */
export async function exportMultipleChartsAsPDF(
  elements: HTMLElement[],
  options: ExportOptions = {}
): Promise<void> {
  const {
    filename = 'charts-report',
    scale = 2,
    backgroundColor = '#ffffff'
  } = options;

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 10;
    const maxWidth = pdfWidth - 2 * margin;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];

      // Capture the element
      const canvas = await html2canvas(element, {
        scale,
        backgroundColor,
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calculate scaling
      const ratio = maxWidth / (imgWidth / 3.779527559);
      const scaledWidth = (imgWidth / 3.779527559) * ratio;
      const scaledHeight = (imgHeight / 3.779527559) * ratio;

      // Add new page if not first chart
      if (i > 0) {
        pdf.addPage();
      }

      // Center horizontally, start from top with margin
      const x = (pdfWidth - scaledWidth) / 2;
      const y = margin;

      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);

      // Add page number
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `صفحة ${i + 1} من ${elements.length}`,
        pdfWidth / 2,
        pdfHeight - 5,
        { align: 'center' }
      );
    }

    // Add metadata
    pdf.setProperties({
      title: filename,
      subject: 'Multi-Chart Report from HADEROS',
      author: 'HADEROS Platform',
      keywords: 'charts, analytics, data visualization, report',
      creator: 'HADEROS AI Cloud'
    });

    // Save PDF
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting multiple charts as PDF:', error);
    throw new Error('فشل تصدير الرسوم البيانية كملف PDF');
  }
}

/**
 * Copy chart as image to clipboard
 */
export async function copyChartToClipboard(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> {
  const {
    scale = 2,
    backgroundColor = '#ffffff'
  } = options;

  try {
    // Capture the element
    const canvas = await html2canvas(element, {
      scale,
      backgroundColor,
      logging: false,
      useCORS: true,
      allowTaint: true
    });

    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          // Success notification can be handled by the calling component
        } catch (err) {
          console.error('Error copying to clipboard:', err);
          throw new Error('فشل نسخ الرسم البياني إلى الحافظة');
        }
      }
    }, 'image/png');
  } catch (error) {
    console.error('Error copying chart to clipboard:', error);
    throw new Error('فشل نسخ الرسم البياني إلى الحافظة');
  }
}

/**
 * Print chart
 */
export async function printChart(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> {
  const {
    scale = 2,
    backgroundColor = '#ffffff'
  } = options;

  try {
    // Capture the element
    const canvas = await html2canvas(element, {
      scale,
      backgroundColor,
      logging: false,
      useCORS: true,
      allowTaint: true
    });

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('فشل فتح نافذة الطباعة');
    }

    const imgData = canvas.toDataURL('image/png');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>طباعة الرسم البياني</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <img src="${imgData}" alt="Chart" onload="window.print(); window.close();" />
        </body>
      </html>
    `);

    printWindow.document.close();
  } catch (error) {
    console.error('Error printing chart:', error);
    throw new Error('فشل طباعة الرسم البياني');
  }
}
