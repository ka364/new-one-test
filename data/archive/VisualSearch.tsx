/**
 * Visual Search Page
 * Camera-based product search for NOW SHOES
 */

import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Camera, Upload, Search, X, Loader2, CheckCircle2, AlertCircle, Scan } from 'lucide-react';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SearchResult {
  productId: number;
  modelCode: string;
  similarity: number;
  imageUrl: string;
  category?: string;
  price?: number;
  inStock?: boolean;
}

export default function VisualSearch() {
  const [searchMode, setSearchMode] = useState<'camera' | 'upload' | 'barcode' | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      
      setSearchMode('camera');
      setError(null);
    } catch (err) {
      setError('لا يمكن الوصول للكاميرا. تأكد من السماح بالوصول.');
      console.error('Camera error:', err);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setSearchMode(null);
    setCapturedImage(null);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
        setSearchMode('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  // Perform visual search
  const searchMutation = trpc.visualSearch.searchByImage.useMutation();
  
  const performSearch = async () => {
    if (!capturedImage) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      // Call visual search API
      const result = await searchMutation.mutateAsync({
        imageData: capturedImage,
        topK: 10,
        minSimilarity: 0.5,
        includeFeatures: true,
      });
      
      // Transform backend results to UI format
      const transformedResults: SearchResult[] = result.results.map((item: any) => ({
        productId: item.productId,
        modelCode: item.product?.modelCode || 'N/A',
        similarity: item.similarity,
        imageUrl: item.matchedImageUrl || '/placeholder-shoe.jpg',
        category: item.product?.category,
        price: item.product?.price,
        inStock: item.product?.stock > 0,
      }));
      
      setSearchResults(transformedResults);
    } catch (err) {
      setError('حدث خطأ أثناء البحث. حاول مرة أخرى.');
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Reset search
  const resetSearch = () => {
    setCapturedImage(null);
    setSearchResults([]);
    setError(null);
    setSearchMode(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            البحث بالصورة
          </h1>
          <p className="text-gray-600">
            صور أي حذاء للحصول على معلوماته فوراً
          </p>
        </div>

        {/* Main Content */}
        {!searchMode && !capturedImage && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {/* Camera Button */}
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer" onClick={startCamera}>
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">التقاط صورة</h3>
                <p className="text-gray-600">استخدم الكاميرا لتصوير المنتج</p>
              </div>
            </Card>

            {/* Upload Button */}
            <Card 
              className="p-8 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">رفع صورة</h3>
                <p className="text-gray-600">اختر صورة من جهازك</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </Card>

            {/* Barcode Scanner Button */}
            <Card 
              className="p-8 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSearchMode('barcode')}
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scan className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">مسح باركود</h3>
                <p className="text-gray-600">مسح رمز QR أو باركود</p>
              </div>
            </Card>
          </div>
        )}

        {/* Barcode Scanner */}
        {searchMode === 'barcode' && (
          <BarcodeScanner
            onScan={(code) => {
              alert(`تم مسح الرمز: ${code}`);
              // TODO: Search by barcode
              setSearchMode(null);
            }}
            onClose={() => setSearchMode(null)}
          />
        )}

        {/* Camera View */}
        {searchMode === 'camera' && !capturedImage && (
          <Card className="p-4 mb-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="flex justify-center gap-4 mt-4">
                <Button onClick={capturePhoto} size="lg">
                  <Camera className="ml-2" />
                  التقاط
                </Button>
                <Button onClick={stopCamera} variant="outline" size="lg">
                  <X className="ml-2" />
                  إلغاء
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Captured Image Preview */}
        {capturedImage && !searchResults.length && (
          <Card className="p-4 mb-4">
            <div className="relative">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full rounded-lg max-h-96 object-contain"
              />
              
              <div className="flex justify-center gap-4 mt-4">
                <Button 
                  onClick={performSearch} 
                  size="lg"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="ml-2 animate-spin" />
                      جاري البحث...
                    </>
                  ) : (
                    <>
                      <Search className="ml-2" />
                      بحث
                    </>
                  )}
                </Button>
                <Button onClick={resetSearch} variant="outline" size="lg">
                  <X className="ml-2" />
                  إلغاء
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-4 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle />
              <p>{error}</p>
            </div>
          </Card>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">النتائج ({searchResults.length})</h2>
              <Button onClick={resetSearch} variant="outline">
                بحث جديد
              </Button>
            </div>

            <div className="grid gap-4">
              {searchResults.map((result) => (
                <Card key={result.productId} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex-shrink-0">
                      <img
                        src={result.imageUrl}
                        alt={result.modelCode}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold">{result.modelCode}</h3>
                          {result.category && (
                            <p className="text-gray-600">{result.category}</p>
                          )}
                        </div>
                        
                        {/* Similarity Score */}
                        <Badge 
                          variant={result.similarity >= 0.9 ? "default" : "secondary"}
                          className="text-lg px-3 py-1"
                        >
                          {Math.round(result.similarity * 100)}% تطابق
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 mt-4">
                        {result.price && (
                          <div className="text-lg font-semibold text-blue-600">
                            {result.price} جنيه
                          </div>
                        )}
                        
                        {result.inStock !== undefined && (
                          <Badge variant={result.inStock ? "default" : "destructive"}>
                            {result.inStock ? (
                              <>
                                <CheckCircle2 className="ml-1 w-4 h-4" />
                                متوفر
                              </>
                            ) : (
                              <>
                                <X className="ml-1 w-4 h-4" />
                                غير متوفر
                              </>
                            )}
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button size="sm">عرض التفاصيل</Button>
                        <Button size="sm" variant="outline">إضافة لطلب</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!capturedImage && !searchMode && (
          <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
            <h3 className="font-semibold mb-3 text-lg">كيفية الاستخدام:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>اختر "التقاط صورة" لاستخدام الكاميرا أو "رفع صورة" لاختيار صورة موجودة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>تأكد من وضوح الصورة وظهور المنتج بالكامل</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>اضغط "بحث" للحصول على المنتجات المطابقة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">4.</span>
                <span>ستظهر النتائج مرتبة حسب نسبة التطابق</span>
              </li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
