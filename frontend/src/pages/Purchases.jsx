import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Purchases() {
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);

    const [supplierId, setSupplierId] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [productId, setProductId] = useState('');
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        fetchPurchases();
        fetchDropdowns();
    }, []);

    const fetchPurchases = async () => {
        try {
            const res = await api.get('/purchases');
            setPurchases(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchDropdowns = async () => {
        try {
            const [s, w, p] = await Promise.all([
                api.get('/suppliers'),
                api.get('/warehouses'),
                api.get('/products')
            ]);
            setSuppliers(s.data);
            setWarehouses(w.data);
            setProducts(p.data);
        } catch (err) {
            console.error('Failed to load form data');
        }
    };

    const placeOrder = async (e) => {
        e.preventDefault();
        try {
            await api.post('/purchases', {
                supplier_id: supplierId,
                warehouse_id: warehouseId,
                product_id: productId,
                quantity: parseInt(quantity)
            });
            fetchPurchases();
        } catch (err) {
            alert('Failed to place order');
        }
    };

    const receiveOrder = async (id) => {
        try {
            await api.post(`/purchases/${id}/receive`);
            fetchPurchases();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to receive');
        }
    };

    return (
        <div>
            <h1 className="page-title">Purchase Orders</h1>
            <p className="page-subtitle">Restock inventory from suppliers</p>

            <div className="panel">
                <div className="panel-title">Place Purchase Order</div>
                <form className="form-row" onSubmit={placeOrder}>
                    <select value={supplierId} onChange={e => setSupplierId(e.target.value)} required>
                        <option value="">Select Supplier</option>
                        {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>)}
                    </select>
                    <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} required>
                        <option value="">Select Warehouse</option>
                        {warehouses.map(w => <option key={w.warehouse_id} value={w.warehouse_id}>{w.name}</option>)}
                    </select>
                    <select value={productId} onChange={e => setProductId(e.target.value)} required>
                        <option value="">Select Product</option>
                        {products.map(p => <option key={p.product_id} value={p.product_id}>{p.name} ({p.sku})</option>)}
                    </select>
                    <input type="number" placeholder="Qty" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" required />
                    <button type="submit" className="btn">Place Order</button>
                </form>
            </div>

            <div className="panel">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Date</th>
                            <th>Supplier</th>
                            <th>Product</th>
                            <th>Warehouse</th>
                            <th>Qty</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchases.map(po => (
                            <tr key={po.po_id}>
                                <td>PO-{po.po_id}</td>
                                <td>{new Date(po.placed_at).toLocaleDateString()}</td>
                                <td>{po.supplier_name}</td>
                                <td>{po.product_name}</td>
                                <td>{po.warehouse_name}</td>
                                <td>{po.quantity}</td>
                                <td><span className={`badge ${po.status === 'placed' ? 'pending' : po.status}`}>{po.status}</span></td>
                                <td>
                                    {po.status === 'placed' && (
                                        <button className="btn" onClick={() => receiveOrder(po.po_id)} style={{ padding: '4px 8px', fontSize: '11px' }}>Mark Received</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
