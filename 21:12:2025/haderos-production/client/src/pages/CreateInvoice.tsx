import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle,
  AlertCircle,
  Search
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Customer {
  id: string;
  name: string;
  creditLimit: number;
  currentBalance: number;
}

export default function CreateInvoice() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [kaiaStatus, setKaiaStatus] = useState<'checking' | 'passed' | 'failed' | null>(null);
  const [kaiaMessage, setKaiaMessage] = useState('');

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.14; // 14% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const checkKAIA = () => {
    setKaiaStatus('checking');
    
    // Simulate KAIA validation
    setTimeout(() => {
      const total = calculateTotal();
      const hasRiba = false; // Check for interest
      const hasGharar = false; // Check for uncertainty
      const isHalal = true; // Check product compliance
      
      if (!hasRiba && !hasGharar && isHalal) {
        setKaiaStatus('passed');
        setKaiaMessage('الفاتورة متوافقة مع جميع قواعد KAIA');
      } else {
        setKaiaStatus('failed');
        setKaiaMessage('تحذير: الفاتورة تحتوي على مخالفات شرعية');
      }
    }, 1000);
  };

  const saveInvoice = () => {
    if (kaiaStatus !== 'passed') {
      alert('يجب التحقق من KAIA أولاً');
      return;
    }
    
    // Save invoice logic
    alert('تم حفظ الفاتورة بنجاح');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إنشاء فاتورة مبيعات</h1>
          <p className="text-gray-600 mt-1">فاتورة جديدة مع التحقق من KAIA</p>
        </div>

        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle>بيانات العميل</CardTitle>
            <CardDescription>اختر العميل أو أضف عميل جديد</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>اسم العميل</Label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    placeholder="ابحث عن عميل..." 
                    value={customer?.name || ''}
                  />
                  <Button variant="outline" size="icon">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {customer && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">الحد الائتماني</p>
                  <p className="text-lg font-semibold">{customer.creditLimit.toLocaleString('ar-EG')} ج.م</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">الرصيد الحالي</p>
                  <p className="text-lg font-semibold">{customer.currentBalance.toLocaleString('ar-EG')} ج.م</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>بنود الفاتورة</CardTitle>
                <CardDescription>أضف المنتجات والكميات</CardDescription>
              </div>
              <Button onClick={addItem} className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة بند
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  لا توجد بنود. اضغط "إضافة بند" للبدء
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id} className="flex gap-3 items-end p-4 bg-gray-50 rounded-lg">
                      <div className="w-12">
                        <Label>رقم</Label>
                        <div className="text-center font-semibold mt-2">{index + 1}</div>
                      </div>
                      <div className="flex-1">
                        <Label>المنتج</Label>
                        <Input 
                          placeholder="اسم المنتج"
                          value={item.productName}
                          onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                        />
                      </div>
                      <div className="w-24">
                        <Label>الكمية</Label>
                        <Input 
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="w-32">
                        <Label>السعر</Label>
                        <Input 
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="w-32">
                        <Label>الإجمالي</Label>
                        <div className="text-lg font-semibold mt-2">
                          {item.total.toLocaleString('ar-EG')}
                        </div>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardHeader>
            <CardTitle>الإجماليات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-lg">
                <span className="text-gray-600">المجموع الفرعي:</span>
                <span className="font-semibold">{calculateSubtotal().toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-gray-600">الضريبة (14%):</span>
                <span className="font-semibold">{calculateTax().toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex justify-between text-2xl font-bold border-t pt-3">
                <span>الإجمالي:</span>
                <span className="text-green-600">{calculateTotal().toLocaleString('ar-EG')} ج.م</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KAIA Validation */}
        <Card className={
          kaiaStatus === 'passed' ? 'border-green-200 bg-green-50' :
          kaiaStatus === 'failed' ? 'border-red-200 bg-red-50' :
          ''
        }>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {kaiaStatus === 'passed' && <CheckCircle className="w-6 h-6 text-green-600" />}
              {kaiaStatus === 'failed' && <AlertCircle className="w-6 h-6 text-red-600" />}
              التحقق من KAIA
            </CardTitle>
            <CardDescription>
              التحقق من الامتثال الشرعي والأخلاقي
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {kaiaStatus && kaiaStatus !== 'checking' && (
              <div className={`p-4 rounded-lg ${
                kaiaStatus === 'passed' ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'
              }`}>
                {kaiaMessage}
              </div>
            )}
            
            <div className="flex gap-3">
              <Button 
                onClick={checkKAIA}
                disabled={items.length === 0 || kaiaStatus === 'checking'}
                className="flex-1"
                variant="outline"
              >
                {kaiaStatus === 'checking' ? 'جاري التحقق...' : 'التحقق من KAIA'}
              </Button>
              <Button 
                onClick={saveInvoice}
                disabled={kaiaStatus !== 'passed'}
                className="flex-1 gap-2"
              >
                <Save className="w-4 h-4" />
                حفظ الفاتورة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
