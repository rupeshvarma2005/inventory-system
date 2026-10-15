import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from './context/AuthContext.jsx';

// Layouts
import CustomerLayout from './components/layout/CustomerLayout.jsx';
import SellerLayout from './components/layout/SellerLayout.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';

// Pages
import Home from './pages/Home.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import Inventory from './pages/Inventory.jsx';
import Orders from './pages/Orders.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Suppliers from './pages/Suppliers.jsx';
import Purchases from './pages/Purchases.jsx';
import Cart from './pages/Cart.jsx';

const PrivateRoute = ({ children, allowedRoles }) => {
    const { token, loading, user } = useContext(AuthContext);
    
    if (import.meta.env.VITE_AUTH_BYPASS === 'true') {
        return children;
    }

    if (loading) return <div>Loading...</div>;
    if (!token) return <Navigate to="/login" />;
    
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" />;
    }

    return children;
};

export default function App() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Basic redirect logic if user lands on / based on role
  if (location.pathname === '/' && user) {
      if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
      if (user.role === 'seller') return <Navigate to="/seller/dashboard" replace />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* CUSTOMER STOREFRONT */}
      <Route path="/" element={<CustomerLayout><Home /></CustomerLayout>} />
      <Route path="/products" element={<CustomerLayout><Products /></CustomerLayout>} />
      <Route path="/products/:id" element={<CustomerLayout><ProductDetails /></CustomerLayout>} />
      <Route path="/cart" element={<CustomerLayout><PrivateRoute allowedRoles={['customer']}><Cart /></PrivateRoute></CustomerLayout>} />
      <Route path="/orders" element={<CustomerLayout><PrivateRoute allowedRoles={['customer']}><Orders /></PrivateRoute></CustomerLayout>} />
      
      {/* SELLER DASHBOARD */}
      <Route path="/seller/dashboard" element={<PrivateRoute allowedRoles={['seller']}><SellerLayout><Dashboard /></SellerLayout></PrivateRoute>} />
      <Route path="/seller/products" element={<PrivateRoute allowedRoles={['seller']}><SellerLayout><Products /></SellerLayout></PrivateRoute>} />
      <Route path="/seller/inventory" element={<PrivateRoute allowedRoles={['seller']}><SellerLayout><Inventory /></SellerLayout></PrivateRoute>} />
      <Route path="/seller/orders" element={<PrivateRoute allowedRoles={['seller']}><SellerLayout><Orders /></SellerLayout></PrivateRoute>} />

      {/* ADMIN DASHBOARD */}
      <Route path="/admin/dashboard" element={<PrivateRoute allowedRoles={['admin']}><AdminLayout><Dashboard /></AdminLayout></PrivateRoute>} />
      <Route path="/admin/products" element={<PrivateRoute allowedRoles={['admin']}><AdminLayout><Products /></AdminLayout></PrivateRoute>} />
      <Route path="/admin/inventory" element={<PrivateRoute allowedRoles={['admin']}><AdminLayout><Inventory /></AdminLayout></PrivateRoute>} />
      <Route path="/admin/orders" element={<PrivateRoute allowedRoles={['admin']}><AdminLayout><Orders /></AdminLayout></PrivateRoute>} />
      <Route path="/admin/suppliers" element={<PrivateRoute allowedRoles={['admin']}><AdminLayout><Suppliers /></AdminLayout></PrivateRoute>} />
      <Route path="/admin/purchases" element={<PrivateRoute allowedRoles={['admin']}><AdminLayout><Purchases /></AdminLayout></PrivateRoute>} />
    </Routes>
  );
}
