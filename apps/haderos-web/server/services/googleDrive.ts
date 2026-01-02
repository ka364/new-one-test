import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Google Drive Service using rclone
 * يستخدم rclone المُعد مسبقاً للتفاعل مع Google Drive
 */

const RCLONE_CONFIG = '/home/ubuntu/.gdrive-rclone.ini';
const REMOTE_NAME = 'manus_google_drive';

interface GoogleDriveFile {
  name: string;
  path: string;
  size: number;
  modTime: string;
  isDir: boolean;
}

/**
 * إنشاء مجلد في Google Drive
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
 * رفع ملف إلى Google Drive
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
 * إنشاء Google Sheet جديد
 * ملاحظة: rclone لا يدعم إنشاء Google Sheets مباشرة
 * سنستخدم طريقة بديلة: إنشاء ملف CSV ورفعه
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
 * الحصول على رابط مشاركة للملف
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
 * قراءة محتوى ملف من Google Drive
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
 * عرض قائمة الملفات في مجلد
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
 * حذف ملف أو مجلد
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
 * إنشاء مسار منظم للملفات
 * Format: YYYY-MM-DD/username/HH-MM-SS-filename.ext
 */
export function generateOrganizedPath(username: string, filename: string): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS

  return `${date}/${username}/${time}-${filename}`;
}

/**
 * إنشاء فاتورة في Google Sheets
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
 * إنشاء تقرير يومي في Google Sheets
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
