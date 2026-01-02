import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.css';
import { registerAllModules } from 'handsontable/registry';
import { trpc } from '~/lib/trpc';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Alert, AlertDescription } from '~/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  Loader2,
  Save,
  Upload,
  Download,
  RefreshCw,
  MessageSquare,
  Clock,
  Share2,
  BarChart3,
  Plus,
  Undo,
  Redo,
  FileText,
  Users,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

// تسجيل جميع Modules في Handsontable
registerAllModules();

interface ExpenseRow {
  id: string;
  title: string;
  amount: number;
  currency: string;
  expenseDate: string;
  category: string;
  expenseType: string;
  status: string;
  description?: string;
  vendorName?: string;
  invoiceNumber?: string;
  dueDate?: string;
  paidDate?: string;
  hierarchyPath: string;
}

interface CellComment {
  id: string;
  cellAddress: string;
  rowIndex: number;
  columnKey: string;
  comment: string;
  commentType: 'note' | 'question' | 'warning' | 'error';
  isResolved: boolean;
  createdBy: string;
  createdAt: Date;
  replies?: CellComment[];
}

interface SpreadsheetVersion {
  id: string;
  versionNumber: number;
  changeType: string;
  changesSummary: string;
  createdBy: string;
  createdAt: Date;
}

interface SharedUser {
  id: string;
  userId: string;
  userName: string;
  permission: 'view' | 'comment' | 'edit' | 'admin';
  lastAccessedAt?: Date;
}

interface ChartConfig {
  id: string;
  chartType: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  dataRange: string;
  config: any;
}

export function AdvancedHandsontableSpreadsheet({
  hierarchyPath,
  stakeholderName,
  sessionId,
  onSaveComplete,
}: {
  hierarchyPath: string;
  stakeholderName: string;
  sessionId?: string;
  onSaveComplete?: () => void;
}) {
  // Refs
  const hotTableRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [data, setData] = useState<ExpenseRow[]>([]);
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('spreadsheet');
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  // Comments
  const [comments, setComments] = useState<CellComment[]>([]);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'note' | 'question' | 'warning' | 'error'>('note');

  // Version History
  const [versions, setVersions] = useState<SpreadsheetVersion[]>([]);
  const [showVersionDialog, setShowVersionDialog] = useState(false);

  // Sharing
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [showSharingDialog, setShowSharingDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'view' | 'comment' | 'edit'>('view');

  // Charts
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'area'>('bar');
  const [chartTitle, setChartTitle] = useState('');
  const [chartDataRange, setChartDataRange] = useState('');

  // Formulas
  const [formulas, setFormulas] = useState<Map<string, string>>(new Map());

  // tRPC Queries & Mutations
  const { data: expensesData, refetch } = trpc.expensesIntegrated.getExpenses.useQuery({
    hierarchyPath,
    limit: 1000,
  });

  const { data: commentsData } = trpc.spreadsheet.getComments.useQuery(
    { sessionId: sessionId || '' },
    {
      enabled: !!sessionId,
    }
  );

  const { data: versionsData } = trpc.spreadsheet.getVersions.useQuery(
    { sessionId: sessionId || '' },
    {
      enabled: !!sessionId,
    }
  );

  const { data: sharingData } = trpc.spreadsheet.getSharing.useQuery(
    { sessionId: sessionId || '' },
    {
      enabled: !!sessionId,
    }
  );

  const bulkUpdateMutation = trpc.expensesIntegrated.bulkUpdateExpenses.useMutation();
  const addCommentMutation = trpc.spreadsheet.addComment.useMutation();
  const createVersionMutation = trpc.spreadsheet.createVersion.useMutation();
  const shareMutation = trpc.spreadsheet.share.useMutation();
  const createChartMutation = trpc.spreadsheet.createChart.useMutation();

  // تحميل البيانات
  useEffect(() => {
    if (expensesData?.expenses) {
      const formattedData = expensesData.expenses.map((expense: any) => ({
        id: expense.id,
        title: expense.title || '',
        amount: Number(expense.amount) || 0,
        currency: expense.currency || 'EGP',
        expenseDate: expense.expenseDate
          ? new Date(expense.expenseDate).toISOString().split('T')[0]
          : '',
        category: expense.category || '',
        expenseType: expense.expenseType || 'operational',
        status: expense.status || 'pending',
        description: expense.description || '',
        vendorName: expense.vendorName || '',
        invoiceNumber: expense.invoiceNumber || '',
        dueDate: expense.dueDate ? new Date(expense.dueDate).toISOString().split('T')[0] : '',
        paidDate: expense.paidDate ? new Date(expense.paidDate).toISOString().split('T')[0] : '',
        hierarchyPath: expense.hierarchyPath,
      }));

      setData(formattedData);
      setIsLoading(false);
    }
  }, [expensesData]);

  useEffect(() => {
    if (commentsData) setComments(commentsData as CellComment[]);
  }, [commentsData]);

  useEffect(() => {
    if (versionsData) setVersions(versionsData as SpreadsheetVersion[]);
  }, [versionsData]);

  useEffect(() => {
    if (sharingData) setSharedUsers(sharingData as SharedUser[]);
  }, [sharingData]);

  // Handlers
  const handleAfterChange = useCallback(
    (changes: any[], source: string) => {
      if (!changes || source === 'loadData') return;

      setPendingChanges((prev) => [...prev, ...changes]);

      // حفظ تلقائي بعد 3 ثواني
      setTimeout(() => {
        if (pendingChanges.length > 0) {
          handleSaveChanges();
        }
      }, 3000);
    },
    [pendingChanges]
  );

  const handleAfterSelection = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col });
  }, []);

  const handleSaveChanges = async () => {
    if (pendingChanges.length === 0) return;

    setIsSaving(true);

    try {
      // تجميع التغييرات
      const changesByRow = new Map<number, any>();

      pendingChanges.forEach(([row, prop, oldValue, newValue]) => {
        if (!changesByRow.has(row)) {
          changesByRow.set(row, { id: data[row].id, changes: {} });
        }
        changesByRow.get(row).changes[prop] = newValue;
      });

      const expenses = Array.from(changesByRow.values()).map(({ id, changes }) => ({
        id,
        ...changes,
      }));

      await bulkUpdateMutation.mutateAsync({
        hierarchyPath,
        expenses,
      });

      // إنشاء نسخة جديدة
      await createVersionMutation.mutateAsync({
        sessionId: sessionId || '',
        changeType: 'bulk_update',
        changesSummary: `تحديث ${expenses.length} مصروف`,
        changesDetail: expenses,
      });

      setPendingChanges([]);
      toast.success('✅ تم الحفظ بنجاح!');
      refetch();
      onSaveComplete?.();
    } catch (error) {
      toast.error('❌ فشل الحفظ');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedCell || !newComment.trim()) return;

    const columnKeys = [
      'title',
      'amount',
      'currency',
      'expenseDate',
      'category',
      'expenseType',
      'status',
    ];
    const columnKey = columnKeys[selectedCell.col];
    const cellAddress = `${String.fromCharCode(65 + selectedCell.col)}${selectedCell.row + 1}`;

    try {
      await addCommentMutation.mutateAsync({
        sessionId: sessionId || '',
        hierarchyPath,
        expenseId: data[selectedCell.row]?.id,
        cellAddress,
        rowIndex: selectedCell.row,
        columnKey,
        comment: newComment,
        commentType,
      });

      toast.success('✅ تم إضافة التعليق');
      setNewComment('');
      setShowCommentDialog(false);
      refetch();
    } catch (error) {
      toast.error('❌ فشل إضافة التعليق');
    }
  };

  const handleShareSpreadsheet = async () => {
    if (!shareEmail.trim()) return;

    try {
      await shareMutation.mutateAsync({
        sessionId: sessionId || '',
        userEmail: shareEmail,
        permission: sharePermission,
      });

      toast.success('✅ تمت المشاركة بنجاح');
      setShareEmail('');
      setShowSharingDialog(false);
      refetch();
    } catch (error) {
      toast.error('❌ فشلت المشاركة');
    }
  };

  const handleCreateChart = async () => {
    if (!chartTitle.trim() || !chartDataRange.trim()) return;

    try {
      await createChartMutation.mutateAsync({
        sessionId: sessionId || '',
        chartType,
        title: chartTitle,
        dataRange: chartDataRange,
        config: {},
      });

      toast.success('✅ تم إنشاء المخطط');
      setChartTitle('');
      setChartDataRange('');
      setShowChartDialog(false);
      refetch();
    } catch (error) {
      toast.error('❌ فشل إنشاء المخطط');
    }
  };

  const handleExportExcel = () => {
    if (hotTableRef.current) {
      const hotInstance = hotTableRef.current.hotInstance;
      const exportPlugin = hotInstance.getPlugin('exportFile');

      exportPlugin.downloadFile('xlsx', {
        filename: `مصروفات_${stakeholderName}_${new Date().toISOString().split('T')[0]}`,
        fileExtension: 'xlsx',
      });
    }
  };

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // استخدام Handsontable import
        // يمكن إضافة منطق معالجة ملف Excel هنا
        toast.success('✅ تم استيراد الملف');
      } catch (error) {
        toast.error('❌ فشل استيراد الملف');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUndo = () => {
    if (hotTableRef.current) {
      const hotInstance = hotTableRef.current.hotInstance;
      hotInstance.undo();
    }
  };

  const handleRedo = () => {
    if (hotTableRef.current) {
      const hotInstance = hotTableRef.current.hotInstance;
      hotInstance.redo();
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    // منطق استعادة نسخة سابقة
    toast.info('🔄 جاري استعادة النسخة...');
  };

  // تعريف الأعمدة
  const columns: Handsontable.ColumnSettings[] = useMemo(
    () => [
      {
        data: 'title',
        title: 'العنوان',
        type: 'text',
        width: 200,
      },
      {
        data: 'amount',
        title: 'المبلغ',
        type: 'numeric',
        width: 120,
        numericFormat: {
          pattern: '0,0.00',
          culture: 'ar-EG',
        },
      },
      {
        data: 'currency',
        title: 'العملة',
        type: 'dropdown',
        source: ['EGP', 'USD', 'EUR', 'SAR', 'AED'],
        width: 80,
      },
      {
        data: 'expenseDate',
        title: 'التاريخ',
        type: 'date',
        dateFormat: 'YYYY-MM-DD',
        width: 120,
      },
      {
        data: 'category',
        title: 'الفئة',
        type: 'dropdown',
        source: ['infrastructure', 'operational', 'marketing', 'development', 'salary', 'other'],
        width: 150,
      },
      {
        data: 'expenseType',
        title: 'النوع',
        type: 'dropdown',
        source: ['subscription', 'one_time', 'recurring'],
        width: 120,
      },
      {
        data: 'status',
        title: 'الحالة',
        type: 'dropdown',
        source: ['pending', 'paid', 'overdue', 'cancelled'],
        width: 100,
      },
      {
        data: 'description',
        title: 'الوصف',
        type: 'text',
        width: 200,
      },
    ],
    []
  );

  // Cell renderer للتعليقات
  const cellRenderer = useCallback(
    (
      instance: any,
      td: HTMLTableCellElement,
      row: number,
      col: number,
      prop: string,
      value: any,
      cellProperties: any
    ) => {
      Handsontable.renderers.TextRenderer.apply(this, arguments as any);

      // إضافة مؤشر للتعليقات
      const cellAddress = `${String.fromCharCode(65 + col)}${row + 1}`;
      const hasComment = comments.some((c) => c.cellAddress === cellAddress);

      if (hasComment) {
        td.style.position = 'relative';
        const indicator = document.createElement('span');
        indicator.innerHTML = '💬';
        indicator.style.position = 'absolute';
        indicator.style.top = '2px';
        indicator.style.right = '2px';
        indicator.style.fontSize = '10px';
        td.appendChild(indicator);
      }

      return td;
    },
    [comments]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4" dir="rtl">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">📊 جدول المصروفات - {stakeholderName}</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleUndo} variant="outline" size="sm">
                <Undo className="w-4 h-4 ml-2" />
                تراجع
              </Button>
              <Button onClick={handleRedo} variant="outline" size="sm">
                <Redo className="w-4 h-4 ml-2" />
                إعادة
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={pendingChanges.length === 0 || isSaving}
                size="sm"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 ml-2" />
                )}
                حفظ ({pendingChanges.length})
              </Button>
              <Button
                onClick={() => setShowCommentDialog(true)}
                disabled={!selectedCell}
                variant="outline"
                size="sm"
              >
                <MessageSquare className="w-4 h-4 ml-2" />
                تعليق
              </Button>
              <Button onClick={() => setShowVersionDialog(true)} variant="outline" size="sm">
                <Clock className="w-4 h-4 ml-2" />
                الإصدارات ({versions.length})
              </Button>
              <Button onClick={() => setShowSharingDialog(true)} variant="outline" size="sm">
                <Share2 className="w-4 h-4 ml-2" />
                مشاركة
              </Button>
              <Button onClick={() => setShowChartDialog(true)} variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 ml-2" />
                مخطط
              </Button>
              <Button onClick={handleExportExcel} variant="outline" size="sm">
                <Download className="w-4 h-4 ml-2" />
                تصدير
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportExcel}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                <Upload className="w-4 h-4 ml-2" />
                استيراد
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pendingChanges.length > 0 && (
            <Alert className="mb-4">
              <AlertDescription>⚠️ لديك {pendingChanges.length} تغيير غير محفوظ</AlertDescription>
            </Alert>
          )}

          <HotTable
            ref={hotTableRef}
            data={data}
            columns={columns}
            colHeaders={true}
            rowHeaders={true}
            width="100%"
            height={600}
            licenseKey="non-commercial-and-evaluation"
            afterChange={handleAfterChange}
            afterSelection={handleAfterSelection}
            contextMenu={true}
            manualColumnResize={true}
            manualRowResize={true}
            filters={true}
            dropdownMenu={true}
            undo={true}
            formulas={true}
            comments={true}
            language="ar-AR"
            layoutDirection="rtl"
          />
        </CardContent>
      </Card>

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>💬 إضافة تعليق</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={commentType} onValueChange={(v: any) => setCommentType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="note">📝 ملاحظة</SelectItem>
                <SelectItem value="question">❓ سؤال</SelectItem>
                <SelectItem value="warning">⚠️ تحذير</SelectItem>
                <SelectItem value="error">❌ خطأ</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="اكتب تعليقك هنا..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleAddComment}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>🕐 تاريخ الإصدارات</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {versions.map((version) => (
              <Card key={version.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">النسخة {version.versionNumber}</p>
                    <p className="text-sm text-gray-600">{version.changesSummary}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(version.createdAt).toLocaleString('ar-EG')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestoreVersion(version.id)}
                  >
                    <RefreshCw className="w-4 h-4 ml-2" />
                    استعادة
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sharing Dialog */}
      <Dialog open={showSharingDialog} onOpenChange={setShowSharingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>👥 مشاركة الجدول</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="البريد الإلكتروني"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
            />
            <Select value={sharePermission} onValueChange={(v: any) => setSharePermission(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">👁️ عرض فقط</SelectItem>
                <SelectItem value="comment">💬 عرض وتعليق</SelectItem>
                <SelectItem value="edit">✏️ تحرير</SelectItem>
              </SelectContent>
            </Select>

            <div className="mt-4">
              <h4 className="font-semibold mb-2">المستخدمون المشاركون:</h4>
              {sharedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 border-b">
                  <span>{user.userName}</span>
                  <span className="text-sm text-gray-600">{user.permission}</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleShareSpreadsheet}>مشاركة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chart Dialog */}
      <Dialog open={showChartDialog} onOpenChange={setShowChartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>📊 إنشاء مخطط</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="عنوان المخطط"
              value={chartTitle}
              onChange={(e) => setChartTitle(e.target.value)}
            />
            <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">📊 أعمدة</SelectItem>
                <SelectItem value="line">📈 خطي</SelectItem>
                <SelectItem value="pie">🥧 دائري</SelectItem>
                <SelectItem value="area">📉 مساحي</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="نطاق البيانات (مثل: A1:D10)"
              value={chartDataRange}
              onChange={(e) => setChartDataRange(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleCreateChart}>إنشاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
