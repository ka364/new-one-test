import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Showcase from "./pages/Showcase";
import LaunchKPIs from "./pages/LaunchKPIs";
import RevenueCalculator from "./pages/RevenueCalculator";
import ShippingManagement from "./pages/ShippingManagement";
import CollectionsTracking from "./pages/CollectionsTracking";
import Dashboard from "./pages/Dashboard";
import AIChat from "./pages/AIChat";
import Orders from "./pages/Orders";
import Transactions from "./pages/Transactions";
import Campaigns from "./pages/Campaigns";
import AdaptiveChat from "./pages/AdaptiveChat";
import NowShoesDashboard from "./pages/NowShoesDashboard";
import EmployeeLogin from "./pages/EmployeeLogin";
import EmployeeForgotPassword from "./pages/EmployeeForgotPassword";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeRegisterEmail from "./pages/EmployeeRegisterEmail";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import GenerateEmployeeAccounts from "./pages/GenerateEmployeeAccounts";
import ShipmentTracking from "./pages/ShipmentTracking";
import CreateSupervisor from "./pages/CreateSupervisor";
import RegisterEmployee from "./pages/RegisterEmployee";
import EmployeeProfile from "./pages/EmployeeProfile";
import VisualSearch from "./pages/VisualSearch";
import ProductImport from "./pages/ProductImport";
import Shipments from "./pages/Shipments";
import FinancialDashboard from "./pages/FinancialDashboard";
import WebhookMonitoring from "./pages/WebhookMonitoring";
import InvestorPortal from "./pages/InvestorPortal";
import KAIADemo from "./pages/KAIADemo";
import InvestmentPitch from "./pages/InvestmentPitch";
import DashboardLayout from "./components/DashboardLayout";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/showcase"} component={Showcase} />
      
      {/* Investor Portal Routes */}
      <Route path={"/investor"} component={InvestorPortal} />
      <Route path={"/investor/kaia-demo"} component={KAIADemo} />
      <Route path={"/investor/pitch"} component={InvestmentPitch} />
      
      <Route path={"/launch-kpis"}>
        <DashboardLayout>
          <LaunchKPIs />
        </DashboardLayout>
      </Route>
      
      <Route path={"/revenue-calculator"}>
        <DashboardLayout>
          <RevenueCalculator />
        </DashboardLayout>
      </Route>
      
      <Route path={"/shipping-management"}>
        <DashboardLayout>
          <ShippingManagement />
        </DashboardLayout>
      </Route>
      
      <Route path={"/collections-tracking"}>
        <DashboardLayout>
          <CollectionsTracking />
        </DashboardLayout>
      </Route>
      
      {/* Dashboard Routes */}
      <Route path={"/dashboard"}>
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      
      <Route path={"/chat"}>
        <DashboardLayout>
          <AIChat />
        </DashboardLayout>
      </Route>
      
      <Route path={"/orders"}>
        <DashboardLayout>
          <Orders />
        </DashboardLayout>
      </Route>
      
      <Route path={"/transactions"}>
        <DashboardLayout>
          <Transactions />
        </DashboardLayout>
      </Route>
      
      <Route path={"/campaigns"}>
        <DashboardLayout>
          <Campaigns />
        </DashboardLayout>
      </Route>
      
      <Route path={"/webhooks"}>
        <DashboardLayout>
          <WebhookMonitoring />
        </DashboardLayout>
      </Route>
      
      <Route path={"adaptive"} component={AdaptiveChat} />
      
      <Route path={"/nowshoes"}>  
        <DashboardLayout>
          <NowShoesDashboard />
        </DashboardLayout>
      </Route>
      <Route path="/employee/login" component={EmployeeLogin} />
      <Route path="/employee/forgot-password" component={EmployeeForgotPassword} />
      <Route path="/admin/dashboard">
        <DashboardLayout>
          <AdminDashboard />
        </DashboardLayout>
      </Route>
      <Route path="/employee/register-email" component={EmployeeRegisterEmail} />
      <Route path="/employee/dashboard" component={EmployeeDashboard} />
      <Route path="/employee-dashboard" component={EmployeeDashboard} />
      <Route path="/admin/employees">
        <DashboardLayout>
          <GenerateEmployeeAccounts />
        </DashboardLayout>
      </Route>
      
      <Route path="/hr/supervisors" component={CreateSupervisor} />
      <Route path="/hr/register" component={RegisterEmployee} />
      <Route path="/hr/employee/:id" component={EmployeeProfile} />
      
      <Route path={"/shipment-tracking"}>
        <DashboardLayout>
          <ShipmentTracking />
        </DashboardLayout>
      </Route>
      
      {/* NOW SHOES Routes */}
      <Route path={"/visual-search"} component={VisualSearch} />
      
      <Route path={"/shipments"}>
        <DashboardLayout>
          <Shipments />
        </DashboardLayout>
      </Route>
      
      <Route path={"/financial"}>
        <DashboardLayout>
          <FinancialDashboard />
        </DashboardLayout>
      </Route>
      
      <Route path={"/product-import"}>
        <DashboardLayout>
          <ProductImport />
        </DashboardLayout>
      </Route>

      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <div dir="rtl" className="min-h-screen">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
