import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductImageManager() {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} ليس ملف صورة`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} أكبر من 5 ميجابايت`);
        return false;
      }
      return true;
    });
    
    setSelectedFiles(validFiles);
    toast.success(`تم اختيار ${validFiles.length} صورة`);
  };

  const handleUpload = async () => {
    if (!selectedProduct) {
      toast.error('يرجى إدخال كود المنتج');
      return;
    }
    
    if (selectedFiles.length === 0) {
      toast.error('يرجى اختيار صور للرفع');
      return;
    }

    setIsUploading(true);
    setUploadProgress([]);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress(prev => [...prev, `جاري رفع ${file.name}...`]);

        // Convert file to base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });

        // TODO: Call API to upload image
        // For now, simulate upload
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setUploadProgress(prev => [...prev, `✅ تم رفع ${file.name}`]);
      }

      toast.success(`تم رفع ${selectedFiles.length} صورة بنجاح!`);
      setSelectedFiles([]);
      setSelectedProduct('');
      
    } catch (error) {
      toast.error('حدث خطأ أثناء رفع الصور');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8" dir="rtl">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">إدارة صور المنتجات 📸</h1>
        <p className="text-muted-foreground">
          رفع وإدارة صور المنتجات لتفعيل البحث البصري
        </p>
      </div>

      {/* Instructions Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          كيفية الاستخدام
        </h3>
        <ol className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">1.</span>
            <span>أدخل كود المنتج (مثال: AMA8, PR20, MK-02)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">2.</span>
            <span>اختر صورة أو عدة صور للمنتج (حتى 5 ميجابايت لكل صورة)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">3.</span>
            <span>اضغط "رفع الصور" - سيتم توليد embeddings تلقائياً</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">4.</span>
            <span>بعد رفع الصور، يمكن البحث عن المنتج باستخدام البحث البصري</span>
          </li>
        </ol>
      </Card>

      {/* Upload Form */}
      <Card className="p-8">
        <div className="space-y-6">
          {/* Product Code Input */}
          <div className="space-y-2">
            <Label htmlFor="productCode">كود المنتج *</Label>
            <Input
              id="productCode"
              placeholder="مثال: AMA8"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value.toUpperCase())}
              disabled={isUploading}
              className="text-lg"
            />
            <p className="text-sm text-muted-foreground">
              أدخل الكود الموجود في ملف المنتجات
            </p>
          </div>

          {/* File Upload Area */}
          <div className="space-y-2">
            <Label>صور المنتج *</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-4">
              {selectedFiles.length === 0 ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <ImageIcon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">اختر صور المنتج</h3>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG, WEBP حتى 5MB لكل صورة
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={isUploading}
                    size="lg"
                  >
                    <Upload className="ml-2 h-4 w-4" />
                    اختر الصور
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-semibold">
                      تم اختيار {selectedFiles.length} صورة
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate">
                          {file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => setSelectedFiles([])}
                    variant="outline"
                    disabled={isUploading}
                  >
                    إلغاء الاختيار
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={isUploading || !selectedProduct || selectedFiles.length === 0}
            size="lg"
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الرفع...
              </>
            ) : (
              <>
                <Upload className="ml-2 h-4 w-4" />
                رفع الصور وتوليد Embeddings
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">سجل الرفع</h3>
          <div className="space-y-2">
            {uploadProgress.map((message, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {message.startsWith('✅') ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : message.startsWith('❌') ? (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                )}
                <span>{message}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tips Card */}
      <Card className="p-6 bg-amber-50 border-amber-200">
        <h3 className="font-semibold mb-3 text-lg">💡 نصائح لأفضل النتائج</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>استخدم صور واضحة وعالية الجودة</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>تأكد من ظهور المنتج بالكامل في الصورة</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>يفضل خلفية بيضاء أو محايدة</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>ارفع عدة صور من زوايا مختلفة لنفس المنتج</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>تجنب الصور المظلمة أو المشوشة</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
