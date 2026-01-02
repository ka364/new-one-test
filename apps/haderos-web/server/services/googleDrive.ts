/**
 * @fileoverview Google Drive Service using rclone
 * خدمة Google Drive باستخدام rclone
 *
 * @description
 * Provides Google Drive integration for file storage, sharing, and document management.
 * Uses rclone for reliable file operations including upload, download, and folder management.
 * Supports creating invoices and daily reports as Google Sheets (CSV format).
 *
 * توفر تكامل Google Drive لتخزين الملفات والمشاركة وإدارة المستندات.
 * تستخدم rclone لعمليات الملفات الموثوقة بما في ذلك الرفع والتنزيل وإدارة المجلدات.
 * تدعم إنشاء الفواتير والتقارير اليومية كـ Google Sheets (صيغة CSV).
 *
 * @module services/googleDrive
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @requires child_process
 * @requires util
 * @requires fs/promises
 *
 * @example
 * ```typescript
 * import { uploadFile, createInvoice, getShareableLink } from './googleDrive';
 *
 * // Upload a file
 * const path = await uploadFile('/local/file.pdf', 'documents/file.pdf');
 *
 * // Create an invoice
 * const invoice = await createInvoice('username', {
 *   invoiceNumber: 'INV-001',
 *   customerName: 'أحمد محمد',
 *   items: [{ name: 'Product', quantity: 2, price: 100 }],
 *   total: 200
 * });
 *
 * console.log(`Invoice link: ${invoice.link}`);
 * ```
 *
 * @see https://rclone.org/ for rclone documentation
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/** rclone configuration file path */
const RCLONE_CONFIG = '/home/ubuntu/.gdrive-rclone.ini';

/** Remote name configured in rclone for Google Drive */
const REMOTE_NAME = 'manus_google_drive';

/**
 * Google Drive file information
 * معلومات ملف Google Drive
 *
 * @interface GoogleDriveFile
 * @property {string} name - File name
 * @property {string} path - Full path in Google Drive
 * @property {number} size - File size in bytes
 * @property {string} modTime - Last modification time (ISO format)
 * @property {boolean} isDir - Whether the item is a directory
 */
interface GoogleDriveFile {
  name: string;
  path: string;
  size: number;
  modTime: string;
  isDir: boolean;
}

/**
 * Create a folder in Google Drive
 * إنشاء مجلد في Google Drive
 *
 * @async
 * @param {string} folderPath - Path for the new folder
 * @returns {Promise<void>}
 *
 * @throws {Error} Failed to create folder
 *
 * @example
 * ```typescript
 * await createFolder('reports/2024/january');
 * ```
 */
export async function createFolder(folderPath: string): Promise<void> {
  const remotePath = `${REMOTE_NAME}:${folderPath}`;
  const command = `rclone mkdir "${remotePath}" --config ${RCLONE_CONFIG}`;

  try {
    await execAsync(command);
  } catch (error) {
    throw new Error(`Failed to create folder: ${error}`);
  }
}

/**
 * Upload a file to Google Drive
 * رفع ملف إلى Google Drive
 *
 * @async
 * @param {string} localFilePath - Local file path to upload
 * @param {string} remotePath - Destination path in Google Drive
 * @returns {Promise<string>} Remote path where file was uploaded
 *
 * @throws {Error} Failed to upload file
 *
 * @example
 * ```typescript
 * const remotePath = await uploadFile('/tmp/report.pdf', 'reports/report.pdf');
 * console.log(`Uploaded to: ${remotePath}`);
 * ```
 */
export async function uploadFile(localFilePath: string, remotePath: string): Promise<string> {
  const remoteFullPath = `${REMOTE_NAME}:${remotePath}`;
  const command = `rclone copy "${localFilePath}" "${remoteFullPath}" --config ${RCLONE_CONFIG}`;

  try {
    await execAsync(command);
    return remotePath;
  } catch (error) {
    throw new Error(`Failed to upload file: ${error}`);
  }
}

/**
 * Create a new Google Sheet
 * إنشاء Google Sheet جديد
 *
 * @async
 * @param {string} sheetName - Name for the new sheet
 * @param {string} folderPath - Destination folder in Google Drive
 * @param {string[][]} data - 2D array of data (rows and columns)
 * @returns {Promise<{path: string, link: string}>} Path and shareable link
 *
 * @throws {Error} Failed to create or upload sheet
 *
 * @description
 * Note: rclone doesn't support creating native Google Sheets directly.
 * This function creates a CSV file and uploads it, which Google Drive
 * can then convert to a Google Sheet format.
 *
 * ملاحظة: rclone لا يدعم إنشاء Google Sheets مباشرة.
 * هذه الدالة تنشئ ملف CSV وترفعه، ثم يمكن لـ Google Drive تحويله لصيغة Sheets.
 *
 * @example
 * ```typescript
 * const sheet = await createGoogleSheet('Sales Report', 'reports', [
 *   ['Product', 'Quantity', 'Price'],
 *   ['Widget A', '10', '100'],
 *   ['Widget B', '5', '200']
 * ]);
 * console.log(`Sheet link: ${sheet.link}`);
 * ```
 */
export async function createGoogleSheet(
  sheetName: string,
  folderPath: string,
  data: string[][]
): Promise<{ path: string; link: string }> {
  // تحويل البيانات إلى CSV
  const csvContent = data.map((row) => row.join(',')).join('\n');

  // حفظ مؤقتاً
  const tempFile = `/tmp/${sheetName}-${Date.now()}.csv`;
  const fs = await import('fs/promises');
  await fs.writeFile(tempFile, csvContent);

  // رفع إلى Google Drive
  const remotePath = `${folderPath}/${sheetName}.csv`;
  await uploadFile(tempFile, remotePath);

  // حذف الملف المؤقت
  await fs.unlink(tempFile);

  // الحصول على رابط المشاركة
  const link = await getShareableLink(remotePath);

  return { path: remotePath, link };
}

/**
 * Get a shareable link for a file
 * الحصول على رابط مشاركة للملف
 *
 * @async
 * @param {string} remotePath - Path to the file in Google Drive
 * @returns {Promise<string>} Shareable URL
 *
 * @throws {Error} Failed to get shareable link
 *
 * @example
 * ```typescript
 * const link = await getShareableLink('reports/sales.csv');
 * console.log(`Share this link: ${link}`);
 * ```
 */
export async function getShareableLink(remotePath: string): Promise<string> {
  const remoteFullPath = `${REMOTE_NAME}:${remotePath}`;
  const command = `rclone link "${remoteFullPath}" --config ${RCLONE_CONFIG}`;

  try {
    const { stdout } = await execAsync(command);
    return stdout.trim();
  } catch (error) {
    throw new Error(`Failed to get shareable link: ${error}`);
  }
}

/**
 * Download a file from Google Drive
 * تنزيل ملف من Google Drive
 *
 * @async
 * @param {string} remotePath - Path to the file in Google Drive
 * @param {string} localPath - Local destination directory
 * @returns {Promise<void>}
 *
 * @throws {Error} Failed to download file
 *
 * @example
 * ```typescript
 * await downloadFile('reports/sales.csv', '/tmp/downloads/');
 * ```
 */
export async function downloadFile(remotePath: string, localPath: string): Promise<void> {
  const remoteFullPath = `${REMOTE_NAME}:${remotePath}`;
  const command = `rclone copy "${remoteFullPath}" "${localPath}" --config ${RCLONE_CONFIG}`;

  try {
    await execAsync(command);
  } catch (error) {
    throw new Error(`Failed to download file: ${error}`);
  }
}

/**
 * List files in a folder
 * عرض قائمة الملفات في مجلد
 *
 * @async
 * @param {string} folderPath - Folder path in Google Drive
 * @returns {Promise<GoogleDriveFile[]>} Array of file information objects
 *
 * @throws {Error} Failed to list files
 *
 * @example
 * ```typescript
 * const files = await listFiles('reports/2024');
 * files.forEach(f => console.log(`${f.name} (${f.size} bytes)`));
 * ```
 */
export async function listFiles(folderPath: string): Promise<GoogleDriveFile[]> {
  const remotePath = `${REMOTE_NAME}:${folderPath}`;
  const command = `rclone lsjson "${remotePath}" --config ${RCLONE_CONFIG}`;

  try {
    const { stdout } = await execAsync(command);
    const files = JSON.parse(stdout);
    return files.map((file: any) => ({
      name: file.Name,
      path: `${folderPath}/${file.Name}`,
      size: file.Size,
      modTime: file.ModTime,
      isDir: file.IsDir,
    }));
  } catch (error) {
    throw new Error(`Failed to list files: ${error}`);
  }
}

/**
 * Delete a file or folder
 * حذف ملف أو مجلد
 *
 * @async
 * @param {string} remotePath - Path to the file/folder in Google Drive
 * @returns {Promise<void>}
 *
 * @throws {Error} Failed to delete file
 *
 * @example
 * ```typescript
 * await deleteFile('temp/old-report.csv');
 * ```
 */
export async function deleteFile(remotePath: string): Promise<void> {
  const remoteFullPath = `${REMOTE_NAME}:${remotePath}`;
  const command = `rclone delete "${remoteFullPath}" --config ${RCLONE_CONFIG}`;

  try {
    await execAsync(command);
  } catch (error) {
    throw new Error(`Failed to delete file: ${error}`);
  }
}

/**
 * Generate an organized file path
 * إنشاء مسار منظم للملفات
 *
 * @param {string} username - Username for the path
 * @param {string} filename - Original filename
 * @returns {string} Organized path in format: YYYY-MM-DD/username/HH-MM-SS-filename.ext
 *
 * @example
 * ```typescript
 * const path = generateOrganizedPath('ahmed', 'report.pdf');
 * // Returns: "2024-01-15/ahmed/14-30-00-report.pdf"
 * ```
 */
export function generateOrganizedPath(username: string, filename: string): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS

  return `${date}/${username}/${time}-${filename}`;
}

/**
 * Create an invoice in Google Sheets
 * إنشاء فاتورة في Google Sheets
 *
 * @async
 * @param {string} username - Username for folder organization
 * @param {Object} invoiceData - Invoice information
 * @param {string} invoiceData.invoiceNumber - Unique invoice number
 * @param {string} invoiceData.customerName - Customer's name
 * @param {Array<{name: string, quantity: number, price: number}>} invoiceData.items - Line items
 * @param {number} invoiceData.total - Total invoice amount
 * @returns {Promise<{path: string, link: string}>} Path and shareable link
 *
 * @example
 * ```typescript
 * const invoice = await createInvoice('ahmed', {
 *   invoiceNumber: 'INV-2024-001',
 *   customerName: 'شركة ABC',
 *   items: [
 *     { name: 'منتج أ', quantity: 10, price: 50 },
 *     { name: 'منتج ب', quantity: 5, price: 100 }
 *   ],
 *   total: 1000
 * });
 * ```
 */
export async function createInvoice(
  username: string,
  invoiceData: {
    invoiceNumber: string;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
  }
): Promise<{ path: string; link: string }> {
  const sheetName = `Invoice-${invoiceData.invoiceNumber}`;
  const folderPath = generateOrganizedPath(username, '').split('/').slice(0, 2).join('/');

  // إنشاء المجلد إذا لم يكن موجوداً
  await createFolder(folderPath);

  // بناء بيانات الفاتورة
  const data = [
    ['Invoice Number', invoiceData.invoiceNumber],
    ['Customer Name', invoiceData.customerName],
    ['Date', new Date().toLocaleDateString('ar-EG')],
    [],
    ['Item', 'Quantity', 'Price', 'Total'],
    ...invoiceData.items.map((item) => [
      item.name,
      item.quantity.toString(),
      item.price.toString(),
      (item.quantity * item.price).toString(),
    ]),
    [],
    ['Total', '', '', invoiceData.total.toString()],
  ];

  return await createGoogleSheet(sheetName, folderPath, data);
}

/**
 * Create a daily report in Google Sheets
 * إنشاء تقرير يومي في Google Sheets
 *
 * @async
 * @param {string} username - Username for folder organization
 * @param {Object} reportData - Report information
 * @param {string} reportData.date - Report date
 * @param {Array<{name: string, value: string}>} reportData.metrics - Key metrics
 * @returns {Promise<{path: string, link: string}>} Path and shareable link
 *
 * @example
 * ```typescript
 * const report = await createDailyReport('ahmed', {
 *   date: '2024-01-15',
 *   metrics: [
 *     { name: 'المبيعات', value: '15,000 ج.م' },
 *     { name: 'الطلبات', value: '45' },
 *     { name: 'العملاء الجدد', value: '12' }
 *   ]
 * });
 * ```
 */
export async function createDailyReport(
  username: string,
  reportData: {
    date: string;
    metrics: Array<{ name: string; value: string }>;
  }
): Promise<{ path: string; link: string }> {
  const sheetName = `Daily-Report-${reportData.date}`;
  const folderPath = generateOrganizedPath(username, '').split('/').slice(0, 2).join('/');

  await createFolder(folderPath);

  const data = [
    ['Daily Report', reportData.date],
    [],
    ['Metric', 'Value'],
    ...reportData.metrics.map((metric) => [metric.name, metric.value]),
  ];

  return await createGoogleSheet(sheetName, folderPath, data);
}
