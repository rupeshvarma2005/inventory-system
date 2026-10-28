import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext.jsx';
import RoleRoute from './components/RoleRoute.jsx';

// Layouts
import CustomerLayout from './components/layout/CustomerLayout.jsx';
import SellerLayout from './components/layout/SellerLayout.jsx';
import AppLayout from './components/layout/AppLayout.jsx';

// Pages
import Home from './pages/Home.jsx';
import Products from './pages/Products.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import Cart from './pages/Cart.jsx';
import Orders from './pages/Orders.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Inventory from './pages/Inventory.jsx';
import Warehouses from './pages/Warehouses.jsx';
import Suppliers from './pages/Suppliers.jsx';
import Purchases from './pages/Purchases.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

/**
 * Intelligent HomeDispatcher:
 * Routes users and visitors to the correct NexStock workspace:
 * - Unauthenticated -> Login page with 1-click role demo profiles & direct storefront link
 * - Admin -> NexStock Enterprise IMS Executive Dashboard (AppLayout + Dashboard)
 * - Seller -> Merchant Workspace (SellerLayout + Dashboard)
 * - Customer -> Live Customer Storefront Demo (CustomerLayout + Home)
 */
function HomeDispatcher() {
  const { user, token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-dim)', fontSize: '0.95rem' }}>
        Authenticating NexStock Console...
      </div>
    );
  }

  if (!token || !user) {
    return <Login />;
  }

  if (user.role === 'admin') {
    return (
      <AppLayout>
        <Dashboard />
      </AppLayout>
    );
  }

  if (user.role === 'seller') {
    return (
      <SellerLayout>
        <Dashboard />
      </SellerLayout>
    );
  }

  return (
    <CustomerLayout>
      <Home />
    </CustomerLayout>
  );
}

/**
 * Intelligent Products Dispatcher:
 * - Admin/Seller: SKU Master Catalog within the Inventory Console
 * - Customer/Public: Redirects to Storefront collection
 */
function ProductsDispatcher() {
  const { user } = useContext(AuthContext);
  if (user?.role === 'admin' || user?.role === 'seller') {
    return (
      <AppLayout>
        <Products />
      </AppLayout>
    );
  }
  return <Navigate to="/storefront" replace />;
}

/**
 * Intelligent Orders Dispatcher:
 * - Admin: Outbound Dispatch Management (AppLayout)
 * - Seller: Incoming Orders Workspace (SellerLayout)
 * - Customer: Order History & Tracking (CustomerLayout)
 */
function OrdersDispatcher() {
  const { user } = useContext(AuthContext);
  if (user?.role === 'admin') {
    return (
      <AppLayout>
        <Orders />
      </AppLayout>
    );
  }
  if (user?.role === 'seller') {
    return (
      <SellerLayout>
        <Orders />
      </SellerLayout>
    );
  }
  return (
    <CustomerLayout>
      <Orders />
    </CustomerLayout>
  );
}

export default function App() {
  return (
    <Routes>
      {/* 1. Core Root & Executive Dashboard */}
      <Route path="/" element={<HomeDispatcher />} />
      <Route path="/dashboard" element={<HomeDispatcher />} />

      {/* 2. Authentication & Onboarding */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/seller/register" element={<Register />} />

      {/* 3. Core Enterprise Inventory Management Console (Admin & Seller) */}
      <Route 
        path="/inventory" 
        element={
          <RoleRoute allowedRoles={['admin', 'seller']}>
            <AppLayout><Inventory /></AppLayout>
          </RoleRoute>
        } 
      />
      <Route 
        path="/products" 
        element={<ProductsDispatcher />} 
      />
      <Route 
        path="/warehouses" 
        element={
          <RoleRoute allowedRoles={['admin']}>
            <AppLayout><Warehouses /></AppLayout>
          </RoleRoute>
        } 
      />
      <Route 
        path="/orders" 
        element={
          <RoleRoute allowedRoles={['admin', 'seller', 'customer']}>
            <OrdersDispatcher />
          </RoleRoute>
        } 
      />
      <Route 
        path="/purchases" 
        element={
          <RoleRoute allowedRoles={['admin']}>
            <AppLayout><Purchases /></AppLayout>
          </RoleRoute>
        } 
      />
      <Route 
        path="/suppliers" 
        element={
          <RoleRoute allowedRoles={['admin']}>
            <AppLayout><Suppliers /></AppLayout>
          </RoleRoute>
        } 
      />

      {/* 4. Merchant / Seller Workspace Aliases */}
      <Route path="/seller" element={<Navigate to="/seller/dashboard" replace />} />
      <Route 
        path="/seller/dashboard" 
        element={
          <RoleRoute allowedRoles={['seller', 'admin']}>
            <SellerLayout><Dashboard /></SellerLayout>
          </RoleRoute>
        } 
      />
      <Route 
        path="/seller/products" 
        element={
          <RoleRoute allowedRoles={['seller', 'admin']}>
            <SellerLayout><Products /></SellerLayout>
          </RoleRoute>
        } 
      />
      <Route 
        path="/seller/inventory" 
        element={
          <RoleRoute allowedRoles={['seller', 'admin']}>
            <SellerLayout><Inventory /></SellerLayout>
          </RoleRoute>
        } 
      />
      <Route 
        path="/seller/orders" 
        element={
          <RoleRoute allowedRoles={['seller', 'admin']}>
            <SellerLayout><Orders /></SellerLayout>
          </RoleRoute>
        } 
      />

      {/* 5. Enterprise Admin Aliases (Seamlessly routes to full AppLayout) */}
      <Route path="/admin" element={<Navigate to="/" replace />} />
      <Route 
        path="/admin/dashboard" 
        element={
          <RoleRoute allowedRoles={['admin']}>
            <AppLayout><Dashboard /></AppLayout>
          </RoleRoute>
        } 
      />
      <Route 
        path="/admin/products" 
        element={
          <RoleRoute allowedRoles={['admin']}>
            <AppLayout><Products /></AppLayout>
          </RoleRoute>
        } 
      />
      <Route 
        path="/admin/inventory" 
        element={
          <RoleRoute allowedRoles={['admin']}>
            <AppLayout><Inventory /></AppLayout>
          </RoleRoute>
        } 
      />
      <Route 
        path="/admin/warehouses" 
        element={
          <RoleRoute allowedRoles={['admin']}>
            <AppLayout><Warehouses /></AppLayout>
          </RoleRoute>
        } 
      />
      <Route 
        path="/admin/orders" 
        element={
          <RoleRoute allowedRoles={['admin']}>
            <AppLayout><Orders /></AppLayout>
          </RoleRoute>
        } 
      />
      <Route 
        path="/admin/suppliers" 
        element={
          <RoleRoute allowedRoles={['admin']}>
            <AppLayout><Suppliers /></AppLayout>
          </RoleRoute>
        } 
      />
      <Route 
        path="/admin/purchases" 
        element={
          <RoleRoute allowedRoles={['admin']}>
            <AppLayout><Purchases /></AppLayout>
          </RoleRoute>
        } 
      />

      {/* 6. Customer Shopping Experience (Strictly Requires Authentication) */}
      <Route 
        path="/storefront" 
        element={
          <RoleRoute allowedRoles={['customer', 'seller', 'admin']}>
            <CustomerLayout><Home /></CustomerLayout>
          </RoleRoute>
        } 
      />
      <Route 
        path="/products/:id" 
        element={
          <RoleRoute allowedRoles={['customer', 'seller', 'admin']}>
            <CustomerLayout><ProductDetails /></CustomerLayout>
          </RoleRoute>
        } 
      />
      <Route 
        path="/storefront/products/:id" 
        element={
          <RoleRoute allowedRoles={['customer', 'seller', 'admin']}>
            <CustomerLayout><ProductDetails /></CustomerLayout>
          </RoleRoute>
        } 
      />
      <Route 
        path="/cart" 
        element={
          <RoleRoute allowedRoles={['customer', 'seller', 'admin']}>
            <CustomerLayout><Cart /></CustomerLayout>
          </RoleRoute>
        } 
      />
      <Route 
        path="/storefront/cart" 
        element={
          <RoleRoute allowedRoles={['customer', 'seller', 'admin']}>
            <CustomerLayout><Cart /></CustomerLayout>
          </RoleRoute>
        } 
      />
      <Route 
        path="/storefront/orders" 
        element={
          <RoleRoute allowedRoles={['customer', 'seller', 'admin']}>
            <CustomerLayout><Orders /></CustomerLayout>
          </RoleRoute>
        } 
      />

      {/* Fallback to HomeDispatcher */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
