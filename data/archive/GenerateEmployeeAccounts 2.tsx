import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserPlus, Download, CheckCircle2, Calendar, Users } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function GenerateEmployeeAccounts() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [employeeNames, setEmployeeNames] = useState("");
  const [success, setSuccess] = useState(false);
  const [excelData, setExcelData] = useState<{ data: string; filename: string } | null>(null);

  const generateMutation = trpc.employees.generateAccounts.useMutation({
    onSuccess: (data) => {
      setSuccess(true);
      setExcelData({ data: data.excelFile, filename: data.fileName });
      setEmployeeNames("");
      setTimeout(() => setSuccess(false), 5000);
    },
  });

  const activeAccountsQuery = trpc.employees.getActiveAccounts.useQuery(
    { month },
    { enabled: !!month }
  );

  const logsQuery = trpc.employees.getGenerationLogs.useQuery({ limit: 10 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const names = employeeNames
      .split("\n")
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (names.length === 0) {
      alert("الرجاء إدخال أسماء الموظفين");
      return;
    }

    generateMutation.mutate({
      employeeNames: names,