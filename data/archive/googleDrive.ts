 * قراءة محتوى ملف من Google Drive
 */
export async function downloadFile(
  remotePath: string,
  localPath: string
): Promise<void> {
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
export function generateOrganizedPath(
  username: string,
  filename: string
): string {
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
    ...invoiceData.items.map(item => [
      item.name,
      item.quantity.toString(),
      item.price.toString(),
      (item.quantity * item.price).toString(),
    ]),
    [],
    ['Total', '', '', invoiceData.total.toString()],