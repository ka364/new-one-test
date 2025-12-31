import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Package,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  category: string;
  status: 'active' | 'low_stock' | 'out_of_stock';
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: 'prod-001',
      name: 'Laptop Dell XPS 15',
      sku: 'DELL-XPS-15',
      price: 20000,
      cost: 15000,
      stock: 8,
      minStock: 5,
      category: 'Electronics',
      status: 'active',
    },
    {
      id: 'prod-002',
      name: 'Wireless Mouse',
      sku: 'MOUSE-001',
      price: 200,
      cost: 100,
      stock: 3,
      minStock: 10,
      category: 'Accessories',
      status: 'low_stock',
    },
    {
      id: 'prod-003',
      name: 'USB Cable',
      sku: 'USB-C-001',
      price: 50,
      cost: 20,
      stock: 0,
      minStock: 20,
      category: 'Accessories',
      status: 'out_of_stock',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Product['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            متوفر
          </Badge>
        );
      case 'low_stock':
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
            <AlertTriangle className="w-3 h-3 mr-1" />
            منخفض
          </Badge>
        );
      case 'out_of_stock':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertTriangle className="w-3 h-3 mr-1" />
            نفذ
          </Badge>
        );
    }
  };

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    lowStock: products.filter(p => p.status === 'low_stock').length,
    outOfStock: products.filter(p => p.status === 'out_of_stock').length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة المنتجات</h1>
            <p className="text-gray-600 mt-1">إضافة وتعديل المنتجات والمخزون</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            منتج جديد
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Package className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-gray-600">إجمالي المنتجات</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <div className="text-sm text-gray-600">متوفر</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                <div className="text-2xl font-bold text-orange-600">{stats.lowStock}</div>
                <div className="text-sm text-gray-600">منخفض</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="w-8 h-8 mx-auto text-red-600 mb-2" />
                <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
                <div className="text-sm text-gray-600">نفذ</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.totalValue.toLocaleString('ar-EG')}
                </div>
                <div className="text-sm text-gray-600">قيمة المخزون (ج.م)</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input 
                  placeholder="ابحث عن منتج (الاسم أو SKU)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">تصفية</Button>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة المنتجات</CardTitle>
            <CardDescription>
              {filteredProducts.length} منتج
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <div 
                  key={product.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      {getStatusBadge(product.status)}
                    </div>
                    <p className="text-sm text-gray-600">SKU: {product.sku} | الفئة: {product.category}</p>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {product.price.toLocaleString('ar-EG')} ج.م
                    </div>
                    <div className="text-sm text-gray-600">
                      التكلفة: {product.cost.toLocaleString('ar-EG')} ج.م
                    </div>
                  </div>

                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      product.stock === 0 ? 'text-red-600' :
                      product.stock < product.minStock ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {product.stock}
                    </div>
                    <div className="text-sm text-gray-600">
                      الحد الأدنى: {product.minStock}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="icon">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add Product Modal (Simple version) */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle>إضافة منتج جديد</CardTitle>
                <CardDescription>أدخل بيانات المنتج</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>اسم المنتج</Label>
                    <Input placeholder="مثال: Laptop Dell XPS 15" />
                  </div>
                  <div>
                    <Label>SKU</Label>
                    <Input placeholder="مثال: DELL-XPS-15" />
                  </div>
                  <div>
                    <Label>السعر</Label>
                    <Input type="number" placeholder="0.00" />
                  </div>
                  <div>
                    <Label>التكلفة</Label>
                    <Input type="number" placeholder="0.00" />
                  </div>
                  <div>
                    <Label>الكمية</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div>
                    <Label>الحد الأدنى</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button className="flex-1">حفظ</Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowAddModal(false)}
                  >
                    إلغاء
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
