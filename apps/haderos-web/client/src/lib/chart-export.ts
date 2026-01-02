/**
 * Chart Export Utilities
 * Export charts to PNG, PDF, and Excel
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportOptions {
  filename?: string;
  title?: string;
  format?: 'png' | 'pdf' | 'jpeg';
  quality?: number; // 0.0 to 1.0
  scale?: number; // 1, 2, 3 for higher resolution
}

export class ChartExporter {
  /**
   * Export chart element to PNG
   */
  async exportToPNG(elementId: string, options: ExportOptions = {}): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    const { filename = 'chart.png', quality = 0.95, scale = 2 } = options;

    try {
      const canvas = await html2canvas(element, {
        scale,
        logging: false,
        backgroundColor: '#ffffff',
        removeContainer: true,
      });

      // Convert to blob and download
      canvas.toBlob(
        (blob) => {
          if (blob) {
            this.downloadBlob(blob, filename);
          }
        },
        'image/png',
        quality
      );
    } catch (error) {
      console.error('Error exporting to PNG:', error);
      throw error;
    }
  }

  /**
   * Export chart element to JPEG
   */
  async exportToJPEG(elementId: string, options: ExportOptions = {}): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    const { filename = 'chart.jpg', quality = 0.95, scale = 2 } = options;

    try {
      const canvas = await html2canvas(element, {
        scale,
        logging: false,
        backgroundColor: '#ffffff',
        removeContainer: true,
      });

      // Convert to blob and download
      canvas.toBlob(
        (blob) => {
          if (blob) {
            this.downloadBlob(blob, filename);
          }
        },
        'image/jpeg',
        quality
      );
    } catch (error) {
      console.error('Error exporting to JPEG:', error);
      throw error;
    }
  }

  /**
   * Export chart element to PDF
   */
  async exportToPDF(elementId: string, options: ExportOptions = {}): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    const { filename = 'chart.pdf', title = 'تحليل البيانات - HADEROS', scale = 2 } = options;

    try {
      const canvas = await html2canvas(element, {
        scale,
        logging: false,
        backgroundColor: '#ffffff',
        removeContainer: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calculate PDF dimensions (A4 = 210mm x 297mm)
      const pdfWidth = 210;
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

      // Create PDF
      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Add title
      pdf.setFontSize(16);
      pdf.text(title, 10, 10);

      // Add image
      const maxHeight = pdf.internal.pageSize.getHeight() - 20;
      const finalHeight = pdfHeight > maxHeight ? maxHeight : pdfHeight;
      const finalWidth = (imgWidth * finalHeight) / imgHeight;

      pdf.addImage(imgData, 'PNG', 10, 20, finalWidth, finalHeight);

      // Add metadata
      pdf.setProperties({
        title: title,
        subject: 'Data Analytics Report',
        author: 'HADEROS AI CLOUD',
        keywords: 'analytics, charts, data visualization',
        creator: 'HADEROS Chart Exporter',
      });

      // Save PDF
      pdf.save(filename);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
    }
  }

  /**
   * Export multiple charts to single PDF
   */
  async exportMultipleChartsToPDF(
    elementIds: string[],
    options: ExportOptions = {}
  ): Promise<void> {
    const {
      filename = 'charts-report.pdf',
      title = 'تقرير التحليلات - HADEROS',
      scale = 2,
    } = options;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    try {
      // Add title page
      pdf.setFontSize(20);
      pdf.text(title, 105, 50, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-EG')}`, 105, 60, {
        align: 'center',
      });

      // Add each chart to a new page
      for (let i = 0; i < elementIds.length; i++) {
        const elementId = elementIds[i];
        const element = document.getElementById(elementId);

        if (!element) {
          console.warn(`Element with id "${elementId}" not found, skipping...`);
          continue;
        }

        pdf.addPage();

        const canvas = await html2canvas(element, {
          scale,
          logging: false,
          backgroundColor: '#ffffff',
          removeContainer: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
        const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

        pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
      }

      // Save PDF
      pdf.save(filename);
    } catch (error) {
      console.error('Error exporting multiple charts to PDF:', error);
      throw error;
    }
  }

  /**
   * Copy chart as image to clipboard
   */
  async copyToClipboard(elementId: string, scale: number = 2): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    try {
      const canvas = await html2canvas(element, {
        scale,
        logging: false,
        backgroundColor: '#ffffff',
        removeContainer: true,
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            console.log('Chart copied to clipboard');
          } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            throw err;
          }
        }
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      throw error;
    }
  }

  /**
   * Download blob as file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Get chart data as base64
   */
  async getChartAsBase64(
    elementId: string,
    format: 'png' | 'jpeg' = 'png',
    scale: number = 2
  ): Promise<string> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    try {
      const canvas = await html2canvas(element, {
        scale,
        logging: false,
        backgroundColor: '#ffffff',
        removeContainer: true,
      });

      return canvas.toDataURL(`image/${format}`);
    } catch (error) {
      console.error('Error getting chart as base64:', error);
      throw error;
    }
  }
}

// Singleton instance
export const chartExporter = new ChartExporter();

// Export helper functions
export const exportChartToPNG = (elementId: string, options?: ExportOptions) =>
  chartExporter.exportToPNG(elementId, options);

export const exportChartToJPEG = (elementId: string, options?: ExportOptions) =>
  chartExporter.exportToJPEG(elementId, options);

export const exportChartToPDF = (elementId: string, options?: ExportOptions) =>
  chartExporter.exportToPDF(elementId, options);

export const exportMultipleChartsToPDF = (elementIds: string[], options?: ExportOptions) =>
  chartExporter.exportMultipleChartsToPDF(elementIds, options);

export const copyChartToClipboard = (elementId: string, scale?: number) =>
  chartExporter.copyToClipboard(elementId, scale);

export const getChartAsBase64 = (elementId: string, format?: 'png' | 'jpeg', scale?: number) =>
  chartExporter.getChartAsBase64(elementId, format, scale);
