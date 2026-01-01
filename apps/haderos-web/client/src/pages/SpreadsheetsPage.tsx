/**
 * 📊 Spreadsheets Collaboration Page
 * صفحة جداول البيانات التعاونية
 *
 * Real-time collaborative spreadsheet editing
 * with version history and comments
 */

import { useState } from "react";
import {
  Table2,
  Plus,
  Download,
  Upload,
  Share2,
  History,
  MessageSquare,
  Filter,
  SortAsc,
  Search,
  MoreHorizontal,
  FileSpreadsheet,
  Users,
  Clock,
  ChevronDown,
  Undo,
  Redo,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  FunctionSquare,
  Grid3X3,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Mock spreadsheet data
const MOCK_SHEETS = [
  {
    id: "1",
    name: "ميزانية 2026",
    type: "budgets",
    lastModified: "منذ 5 دقائق",
    collaborators: [
      { id: 1, name: "أحمد محمد", isOnline: true },
      { id: 2, name: "سارة خالد", isOnline: true },
    ],
    versionsCount: 15,
  },
  {
    id: "2",
    name: "مصروفات يناير",
    type: "expenses",
    lastModified: "منذ ساعة",
    collaborators: [
      { id: 1, name: "أحمد محمد", isOnline: true },
    ],
    versionsCount: 8,
  },
  {
    id: "3",
    name: "اشتراكات الخدمات",
    type: "subscriptions",
    lastModified: "منذ يومين",
    collaborators: [
      { id: 3, name: "محمود علي", isOnline: false },
    ],
    versionsCount: 3,
  },
];

// Mock spreadsheet cells
const COLUMNS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const ROWS = 20;

const MOCK_CELL_DATA: Record<string, { value: string; style?: any }> = {
  "A1": { value: "البند" },
  "B1": { value: "يناير" },
  "C1": { value: "فبراير" },
  "D1": { value: "مارس" },
  "E1": { value: "الإجمالي" },
  "A2": { value: "المبيعات" },
  "B2": { value: "50,000" },
  "C2": { value: "55,000" },
  "D2": { value: "60,000" },
  "E2": { value: "=SUM(B2:D2)" },
  "A3": { value: "المصروفات" },
  "B3": { value: "30,000" },
  "C3": { value: "32,000" },
  "D3": { value: "35,000" },
  "E3": { value: "=SUM(B3:D3)" },
  "A4": { value: "صافي الربح" },
  "B4": { value: "=B2-B3" },
  "C4": { value: "=C2-C3" },
  "D4": { value: "=D2-D3" },
  "E4": { value: "=SUM(B4:D4)" },
};

export default function SpreadsheetsPage() {
  const [activeSheet, setActiveSheet] = useState<string | null>("1");
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [cellInput, setCellInput] = useState("");
  const [showVersions, setShowVersions] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleCellClick = (cellId: string) => {
    setSelectedCell(cellId);
    setCellInput(MOCK_CELL_DATA[cellId]?.value || "");
  };

  const handleCellChange = (value: string) => {
    setCellInput(value);
    // In production, update via tRPC
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col" dir="rtl">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b bg-white dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            <Select value={activeSheet || ""} onValueChange={setActiveSheet}>
              <SelectTrigger className="w-48 border-0 font-semibold">
                <SelectValue placeholder="اختر جدول" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_SHEETS.map((sheet) => (
                  <SelectItem key={sheet.id} value={sheet.id}>
                    {sheet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Online Collaborators */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">متصلون:</span>
            <div className="flex -space-x-2">
              {MOCK_SHEETS.find(s => s.id === activeSheet)?.collaborators.filter(c => c.isOnline).map((collab) => (
                <Avatar key={collab.id} className="w-7 h-7 border-2 border-white">
                  <AvatarFallback className="bg-blue-500 text-white text-xs">
                    {collab.name[0]}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
            <MessageSquare className="w-4 h-4 ml-1" />
            التعليقات
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowVersions(!showVersions)}>
            <History className="w-4 h-4 ml-1" />
            المحفوظات
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="w-4 h-4 ml-1" />
            مشاركة
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 ml-1" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="h-10 px-4 flex items-center gap-2 border-b bg-gray-50 dark:bg-gray-800">
        {/* Undo/Redo */}
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <Undo className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <Redo className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-5" />

        {/* Font Formatting */}
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <Bold className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <Italic className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-5" />

        {/* Alignment */}
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <AlignRight className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <AlignLeft className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-5" />

        {/* Colors */}
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <Palette className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-5" />

        {/* Functions */}
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <FunctionSquare className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-5" />

        {/* Charts */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <BarChart3 className="w-4 h-4" />
              مخطط
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <BarChart3 className="w-4 h-4 ml-2" />
              مخطط أعمدة
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LineChart className="w-4 h-4 ml-2" />
              مخطط خطي
            </DropdownMenuItem>
            <DropdownMenuItem>
              <PieChart className="w-4 h-4 ml-2" />
              مخطط دائري
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />

        {/* Cell Reference */}
        {selectedCell && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">{selectedCell}</Badge>
            <Input
              value={cellInput}
              onChange={(e) => handleCellChange(e.target.value)}
              className="w-64 h-7 text-sm font-mono"
              placeholder="أدخل قيمة أو صيغة"
            />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Spreadsheet */}
        <div className="flex-1 overflow-auto">
          <table className="border-collapse w-full">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="w-10 h-8 bg-gray-100 dark:bg-gray-800 border text-center text-xs font-medium text-gray-500">
                  #
                </th>
                {COLUMNS.map((col) => (
                  <th
                    key={col}
                    className="w-24 h-8 bg-gray-100 dark:bg-gray-800 border text-center text-xs font-medium text-gray-500"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROWS }, (_, rowIndex) => (
                <tr key={rowIndex + 1}>
                  <td className="w-10 h-8 bg-gray-100 dark:bg-gray-800 border text-center text-xs font-medium text-gray-500">
                    {rowIndex + 1}
                  </td>
                  {COLUMNS.map((col) => {
                    const cellId = `${col}${rowIndex + 1}`;
                    const cellData = MOCK_CELL_DATA[cellId];
                    const isSelected = selectedCell === cellId;
                    const isHeader = rowIndex === 0;

                    return (
                      <td
                        key={cellId}
                        onClick={() => handleCellClick(cellId)}
                        className={cn(
                          "w-24 h-8 border text-sm px-2 cursor-cell",
                          isHeader && "bg-gray-50 dark:bg-gray-800 font-semibold",
                          isSelected && "ring-2 ring-blue-500 ring-inset bg-blue-50 dark:bg-blue-900/30",
                          cellData?.value?.startsWith("=") && "text-green-600 font-mono text-xs"
                        )}
                      >
                        {cellData?.value || ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Side Panel - Versions */}
        {showVersions && (
          <div className="w-72 border-r bg-white dark:bg-gray-900 flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <History className="w-4 h-4" />
                سجل الإصدارات
              </h3>
            </div>
            <div className="flex-1 overflow-auto p-2 space-y-2">
              {[
                { version: 15, user: "أحمد محمد", time: "منذ 5 دقائق", changes: "تحديث أرقام المبيعات" },
                { version: 14, user: "سارة خالد", time: "منذ ساعة", changes: "إضافة عمود مارس" },
                { version: 13, user: "أحمد محمد", time: "منذ ساعتين", changes: "تصحيح الصيغ" },
              ].map((v, i) => (
                <Card key={i} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">v{v.version}</Badge>
                      <span className="text-xs text-gray-500">{v.time}</span>
                    </div>
                    <p className="text-sm font-medium">{v.changes}</p>
                    <p className="text-xs text-gray-500 mt-1">{v.user}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Side Panel - Comments */}
        {showComments && (
          <div className="w-72 border-r bg-white dark:bg-gray-900 flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                التعليقات
              </h3>
            </div>
            <div className="flex-1 overflow-auto p-2 space-y-2">
              {[
                { cell: "B2", user: "سارة خالد", comment: "هل هذا الرقم صحيح؟", time: "منذ 10 دقائق", resolved: false },
                { cell: "E4", user: "محمود علي", comment: "تم التأكد من الصيغة", time: "منذ ساعة", resolved: true },
              ].map((c, i) => (
                <Card key={i} className={cn(
                  "cursor-pointer",
                  c.resolved && "opacity-60"
                )}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="font-mono text-xs">{c.cell}</Badge>
                      {c.resolved && <Badge variant="secondary" className="text-xs">تم الحل</Badge>}
                    </div>
                    <p className="text-sm">{c.comment}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{c.user}</span>
                      <span className="text-xs text-gray-500">{c.time}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="p-3 border-t">
              <Input placeholder="أضف تعليق..." />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tabs */}
      <div className="h-8 px-2 flex items-center gap-1 border-t bg-gray-50 dark:bg-gray-800">
        <Button variant="ghost" size="sm" className="h-6 px-3 text-xs bg-white dark:bg-gray-700">
          Sheet 1
        </Button>
        <Button variant="ghost" size="sm" className="h-6 px-3 text-xs">
          Sheet 2
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
