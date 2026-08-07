import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import Inventory from './pages/Inventory.jsx';
import Orders from './pages/Orders.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">DOCK<span>//OPS</span></div>
        <NavLink to="/" end className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
        <NavLink to="/products" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Products</NavLink>
        <NavLink to="/inventory" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Inventory</NavLink>
        <NavLink to="/orders" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Orders</NavLink>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </main>
    </div>
  );
}
