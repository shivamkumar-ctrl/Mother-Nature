import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import CustomerOrders from "@/pages/CustomerOrders";
import CustomerOrderDetail from "@/pages/CustomerOrderDetail";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminProducts from "@/pages/admin/Products";
import AdminOrders from "@/pages/admin/Orders";
import AdminOrderDetail from "@/pages/admin/OrderDetail";
import AdminCustomers from "@/pages/admin/Customers";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      
      {/* Customer Routes */}
      <Route path="/shop" component={Shop} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/orders" component={CustomerOrders} />
      <Route path="/orders/:id" component={CustomerOrderDetail} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/orders/:id" component={AdminOrderDetail} />
      <Route path="/admin/customers" component={AdminCustomers} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
