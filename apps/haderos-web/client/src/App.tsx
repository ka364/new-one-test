import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/NotFound';
import { Route, Switch } from 'wouter';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import { CartProvider } from './contexts/CartContext';
import Home from './pages/Home';
import Showcase from './pages/Showcase';
import LaunchKPIs from './pages/LaunchKPIs';
import RevenueCalculator from './pages/RevenueCalculator';
import ShippingManagement from './pages/ShippingManagement';
import CollectionsTracking from './pages/CollectionsTracking';
import Dashboard from './pages/Dashboard';
import AIChat from './pages/AIChat';
import Orders from './pages/Orders';
import Transactions from './pages/Transactions';
import Campaigns from './pages/Campaigns';
// import AdaptiveChat from "./pages/AdaptiveChat"; // Disabled - adaptive router removed
import NowShoesDashboard from './pages/NowShoesDashboard';
import EmployeeLogin from './pages/EmployeeLogin';
import EmployeeForgotPassword from './pages/EmployeeForgotPassword';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeRegisterEmail from './pages/EmployeeRegisterEmail';
import EmployeeDashboard from './pages/EmployeeDashboard';
import GenerateEmployeeAccounts from './pages/GenerateEmployeeAccounts';
import ShipmentTracking from './pages/ShipmentTracking';
import CreateSupervisor from './pages/CreateSupervisor';
import RegisterEmployee from './pages/RegisterEmployee';
import EmployeeProfile from './pages/EmployeeProfile';
import VisualSearch from './pages/VisualSearch';
import CODTracking from './pages/CODTracking';
import CODOrderDetails from './pages/CODOrderDetails';
import ShippingPerformance from './pages/ShippingPerformance';
import ShippingOverview from './pages/shipping/Overview';
import ShipmentsPage from './pages/shipping/Shipments';
import CreateShipmentPage from './pages/shipping/CreateShipment';
import TrackShipmentPage from './pages/shipping/TrackShipment';
import CallCenterPage from './pages/cod/CallCenter';
import ConfirmationPage from './pages/cod/Confirmation';
import PreparationPage from './pages/cod/Preparation';
import SupplierCoordinationPage from './pages/cod/SupplierCoordination';
import ShippingAllocationPage from './pages/cod/ShippingAllocation';
import DeliveryTrackingPage from './pages/cod/DeliveryTracking';
import CollectionPage from './pages/cod/Collection';
import SettlementPage from './pages/cod/Settlement';
import ProductImport from './pages/ProductImport';
import Shipments from './pages/Shipments';
import FinancialDashboard from './pages/FinancialDashboard';
import WebhookMonitoring from './pages/WebhookMonitoring';
import Chat from './pages/Chat';
import InvestorPortal from './pages/InvestorPortal';
import KAIADemo from './pages/KAIADemo';
import InvestmentPitch from './pages/InvestmentPitch';
import InvestorLogin from './pages/InvestorLogin';
import InvestorDashboard from './pages/InvestorDashboard';
import InvestorManagement from './pages/InvestorManagement';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import FinancialOverview from './pages/FinancialOverview';
import RevenueAnalytics from './pages/RevenueAnalytics';
import ExpensesTracking from './pages/ExpensesTracking';
import FinancialPlanning from './pages/financial/FinancialPlanning';
import BudgetManagement from './pages/financial/BudgetManagement';
import CashFlowForecast from './pages/financial/CashFlowForecast';
import DashboardLayout from './components/DashboardLayout';
import VitalSignsInfographic from './pages/VitalSignsInfographic';

function Router() {
  return (
    <Switch>
      <Route path={'/'} component={Home} />
      <Route path={'/showcase'} component={Showcase} />
      {/* Investor Portal Routes */}
      <Route path={'/investor'} component={InvestorPortal} />
      <Route path={'/investor/login'} component={InvestorLogin} />
      <Route path={'/investor/dashboard'} component={InvestorDashboard} />
      <Route path={'/investor/kaia-demo'} component={KAIADemo} />
      <Route path={'/investor/pitch'} component={InvestmentPitch} />
      <Route path={'/investor-management'} component={InvestorManagement} />
      <Route path={'/checkout'} component={Checkout} />
      <Route path={'/order-confirmation/:orderId'} component={OrderConfirmation} />
      <Route path={'/financial'} component={FinancialOverview} />
      <Route path={'/financial/revenue'} component={RevenueAnalytics} />
      <Route path={'/financial/expenses'} component={ExpensesTracking} />
      <Route path={'/financial/planning'}>
        <DashboardLayout>
          <FinancialPlanning />
        </DashboardLayout>
      </Route>
      <Route path={'/financial/budgets'}>
        <DashboardLayout>
          <BudgetManagement />
        </DashboardLayout>
      </Route>
      <Route path={'/financial/forecast'}>
        <DashboardLayout>
          <CashFlowForecast />
        </DashboardLayout>
      </Route>
      <Route path={'/chat'}>
        <DashboardLayout>
          <Chat />
        </DashboardLayout>
      </Route>
      <Route path={'/launch-kpis'}>
        <DashboardLayout>
          <LaunchKPIs />
        </DashboardLayout>
      </Route>
      <Route path={'/vital-signs'}>
        <DashboardLayout>
          <VitalSignsInfographic />
        </DashboardLayout>
      </Route>
      <Route path={'/revenue-calculator'}>
        <DashboardLayout>
          <RevenueCalculator />
        </DashboardLayout>
      </Route>
      <Route path={'/shipping-management'}>
        <DashboardLayout>
          <ShippingManagement />
        </DashboardLayout>
      </Route>
      <Route path={'/collections-tracking'}>
        <DashboardLayout>
          <CollectionsTracking />
        </DashboardLayout>
      </Route>
      <Route path={'/cod-tracking'}>
        <DashboardLayout>
          <CODTracking />
        </DashboardLayout>
      </Route>
      <Route path={'/cod-tracking/:id'}>
        <DashboardLayout>
          <CODOrderDetails />
        </DashboardLayout>
      </Route>
      <Route path={'/shipping-performance'}>
        <DashboardLayout>
          <ShippingPerformance />
        </DashboardLayout>
      </Route>
      <Route path={'/shipping'} component={ShippingOverview} />
      <Route path={'/shipping/shipments'} component={ShipmentsPage} />
      <Route path={'/shipping/track'} component={TrackShipmentPage} />
      {/* COD Workflow Routes */}
      <Route path={'/cod/call-center'} component={CallCenterPage} />
      <Route path={'/cod/confirmation'} component={ConfirmationPage} />
      <Route path={'/cod/preparation'} component={PreparationPage} />
      <Route path={'/cod/supplier-coordination'} component={SupplierCoordinationPage} />
      <Route path={'/cod/shipping-allocation'} component={ShippingAllocationPage} />
      <Route path={'/cod/delivery-tracking'} component={DeliveryTrackingPage} />
      <Route path={'/cod/collection'} component={CollectionPage} />
      <Route path={'/cod/settlement'} component={SettlementPage} />
      <Route path={'/shipping/track/:trackingNumber'} component={TrackShipmentPage} />
      {/* Dashboard Routes */}
      <Route path={'/dashboard'}>
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      <Route path={'/chat'}>
        <DashboardLayout>
          <AIChat />
        </DashboardLayout>
      </Route>
      <Route path={'/orders'}>
        <DashboardLayout>
          <Orders />
        </DashboardLayout>
      </Route>
      <Route path={'/transactions'}>
        <DashboardLayout>
          <Transactions />
        </DashboardLayout>
      </Route>
      <Route path={'/campaigns'}>
        <DashboardLayout>
          <Campaigns />
        </DashboardLayout>
      </Route>
      <Route path={'/webhooks'}>
        <DashboardLayout>
          <WebhookMonitoring />
        </DashboardLayout>
      </Route>
      {/* <Route path={"adaptive"} component={AdaptiveChat} /> */}{' '}
      {/* Disabled - adaptive router removed */}
      <Route path={'/nowshoes'}>
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
      <Route path={'/shipment-tracking'}>
        <DashboardLayout>
          <ShipmentTracking />
        </DashboardLayout>
      </Route>
      {/* NOW SHOES Routes */}
      <Route path={'/visual-search'} component={VisualSearch} />
      <Route path={'/shipments'}>
        <DashboardLayout>
          <Shipments />
        </DashboardLayout>
      </Route>
      <Route path={'/financial'}>
        <DashboardLayout>
          <FinancialDashboard />
        </DashboardLayout>
      </Route>
      <Route path={'/product-import'}>
        <DashboardLayout>
          <ProductImport />
        </DashboardLayout>
      </Route>
      <Route path={'/404'} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <CartProvider>
          <TooltipProvider>
            <div dir="rtl" className="min-h-screen">
              <Toaster />
              <Router />
            </div>
          </TooltipProvider>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
