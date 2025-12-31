/**
 * Product Import Page
 * Import products from Google Sheets to database
 */

import { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface ImportPreview {
  totalRows: number;
  validProducts: number;
  invalidProducts: number;
  parseErrors: number;
  preview: {
    valid: any[];
    invalid: any[];
    parseErrors: any[];
  };
}

interface ImportResult {
  totalRows: number;
  imported: number;
  skipped: number;
  failed: number;
  errors: any[];
}

export default function ProductImport() {
  const [sheetUrl, setSheetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [migrateImages, setMigrateImages] = useState(true);
  const [skipExisting, setSkipExisting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract sheet ID from URL
  const extractSheetId = (url: string): { sheetId: string; gid: string } | null => {
    try {
      const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      const gidMatch = url.match(/[#&]gid=([0-9]+)/);
      
      if (match) {
        return {
          sheetId: match[1],
          gid: gidMatch ? gidMatch[1] : '0'
        };
      }
      return null;
    } catch {
      return null;
    }
  };

  // Preview import
  const handlePreview = async () => {
    const ids = extractSheetId(sheetUrl);
    if (!ids) {
      setError('رابط Google Sheet غير صحيح');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPreview(null);

    try {
      // TODO: Call preview API
      // const result = await trpc.productImport.previewFromSheet.mutate(ids);
      
      // Mock preview for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockPreview: ImportPreview = {
        totalRows: 1019,
        validProducts: 985,
        invalidProducts: 34,
        parseErrors: 0,
        preview: {
          valid: [
            { modelCode: 'HK02', nameAr: 'حذاء رياضي', costPrice: 195, retailPrice: 450 },
            { modelCode: 'MKF02', nameAr: 'حذاء كاجوال', costPrice: 180, retailPrice: 380 }
          ],
          invalid: [
            { modelCode: 'INVALID', error: 'سعر التكلفة أكبر من سعر البيع' }
          ],
          parseErrors: []
        }
      };
      
      setPreview(mockPreview);
    } catch (err) {
      setError('فشل تحميل البيانات. تأكد من أن الملف عام (Public)');
      console.error('Preview error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute import
  const handleImport = async () => {
    const ids = extractSheetId(sheetUrl);
    if (!ids) return;

    setIsLoading(true);
    setError(null);
    setImportResult(null);

    try {
      // TODO: Call import API
      // const result = await trpc.productImport.importFromSheet.mutate({
      //   ...ids,
      //   migrateImages,
      //   skipExisting
      // });
      
      // Mock import for now
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const mockResult: ImportResult = {
        totalRows: 1019,
        imported: 950,
        skipped: 35,
        failed: 0,
        errors: []
      };
      
      setImportResult(mockResult);
      setPreview(null);
    } catch (err) {
      setError('فشل الاستيراد. حاول مرة أخرى.');
      console.error('Import error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            استيراد المنتجات
          </h1>
          <p className="text-gray-600">
            استيراد المنتجات من Google Sheets إلى قاعدة البيانات
          </p>
        </div>

        {/* Input Form */}
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="sheetUrl" className="text-lg font-semibold">
                رابط Google Sheet
              </Label>
              <Input
                id="sheetUrl"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                className="mt-2"
                dir="ltr"
              />
              <p className="text-sm text-gray-500 mt-2">
                تأكد من أن الملف عام (Public) أو مشارك مع "أي شخص لديه الرابط"
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="migrateImages"
                  checked={migrateImages}
                  onCheckedChange={(checked) => setMigrateImages(checked as boolean)}
                />
                <Label htmlFor="migrateImages" className="cursor-pointer">
                  تحويل الصور من Google Drive إلى S3
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="skipExisting"
                  checked={skipExisting}
                  onCheckedChange={(checked) => setSkipExisting(checked as boolean)}
                />
                <Label htmlFor="skipExisting" className="cursor-pointer">
                  تخطي المنتجات الموجودة
                </Label>
              </div>
            </div>

            <Button
              onClick={handlePreview}
              disabled={!sheetUrl || isLoading}
              size="lg"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 animate-spin" />
                  جاري التحميل...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="ml-2" />
                  معاينة البيانات
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle />
              <p>{error}</p>
            </div>
          </Card>
        )}

        {/* Preview Results */}
        {preview && (
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">نتائج المعاينة</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600">{preview.totalRows}</div>
                <div className="text-sm text-gray-600">إجمالي الصفوف</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600">{preview.validProducts}</div>
                <div className="text-sm text-gray-600">منتجات صحيحة</div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-yellow-600">{preview.invalidProducts}</div>
                <div className="text-sm text-gray-600">منتجات خاطئة</div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-red-600">{preview.parseErrors}</div>
                <div className="text-sm text-gray-600">أخطاء قراءة</div>
              </div>
            </div>

            {preview.preview.valid.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="text-green-600" />
                  عينة من المنتجات الصحيحة
                </h3>
                <div className="space-y-2">
                  {preview.preview.valid.map((product, index) => (
                    <div key={index} className="bg-green-50 p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <span className="font-semibold">{product.modelCode}</span>
                        <span className="text-gray-600 mr-2">{product.nameAr}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        تكلفة: {product.costPrice} | بيع: {product.retailPrice}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {preview.preview.invalid.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="text-yellow-600" />
                  عينة من المنتجات الخاطئة
                </h3>
                <div className="space-y-2">
                  {preview.preview.invalid.map((product, index) => (
                    <div key={index} className="bg-yellow-50 p-3 rounded-lg">
                      <div className="font-semibold">{product.modelCode || 'غير محدد'}</div>
                      <div className="text-sm text-red-600">{product.error}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={isLoading || preview.validProducts === 0}
              size="lg"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 animate-spin" />
                  جاري الاستيراد...
                </>
              ) : (
                <>
                  <Upload className="ml-2" />
                  استيراد {preview.validProducts} منتج
                </>
              )}
            </Button>
          </Card>
        )}

        {/* Import Results */}
        {importResult && (
          <Card className="p-6 border-green-200 bg-green-50">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="text-green-600 w-8 h-8" />
              <h2 className="text-2xl font-bold text-green-900">تم الاستيراد بنجاح!</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-gray-900">{importResult.totalRows}</div>
                <div className="text-sm text-gray-600">إجمالي</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600">{importResult.imported}</div>
                <div className="text-sm text-gray-600">تم الاستيراد</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-yellow-600">{importResult.skipped}</div>
                <div className="text-sm text-gray-600">تم التخطي</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-red-600">{importResult.failed}</div>
                <div className="text-sm text-gray-600">فشل</div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => {
                setImportResult(null);
                setSheetUrl('');
              }}>
                استيراد جديد
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/products'}>
                عرض المنتجات
              </Button>
            </div>
          </Card>
        )}

        {/* Instructions */}
        {!preview && !importResult && (
          <Card className="p-6 bg-purple-50 border-purple-200">
            <h3 className="font-semibold mb-3 text-lg">تعليمات الاستيراد:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">1.</span>
                <span>تأكد من أن Google Sheet يحتوي على الأعمدة المطلوبة (كود الموديل، الأسعار، المقاسات، الألوان)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">2.</span>
                <span>اجعل الملف عاماً (Public) أو مشاركاً مع "أي شخص لديه الرابط"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">3.</span>
                <span>انسخ رابط الملف والصقه في الحقل أعلاه</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">4.</span>
                <span>اضغط "معاينة البيانات" للتحقق من صحة البيانات</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">5.</span>
                <span>إذا كانت البيانات صحيحة، اضغط "استيراد" لإضافتها للنظام</span>
              </li>
            </ul>

            <div className="mt-4 p-4 bg-white rounded-lg">
              <p className="font-semibold mb-2">مثال على رابط صحيح:</p>
              <code className="text-sm bg-gray-100 p-2 rounded block" dir="ltr">
                https://docs.google.com/spreadsheets/d/1kSNhYJ52ib-sX2V_TK_KT_1TIaJVw9Qt-AJrIdKXA2c/edit
              </code>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
