import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [leadTime, setLeadTime] = useState(7);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/suppliers');
            setSuppliers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const addSupplier = async (e) => {
        e.preventDefault();
        try {
            await api.post('/suppliers', { name, contact_email: email, lead_time_days: leadTime });
            setName('');
            setEmail('');
            setLeadTime(7);
            fetchSuppliers();
        } catch (err) {
            alert('Failed to add supplier');
        }
    };

    const deleteSupplier = async (id) => {
        if (!window.confirm('Delete supplier?')) return;
        try {
            await api.delete(`/suppliers/${id}`);
            fetchSuppliers();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete');
        }
    };

    return (
        <div>
            <h1 className="page-title">Suppliers</h1>
            <p className="page-subtitle">Manage supplier directory</p>

            <div className="panel">
                <div className="panel-title">Add Supplier</div>
                <form className="form-row" onSubmit={addSupplier}>
                    <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                    <input type="number" placeholder="Lead Time (days)" value={leadTime} onChange={e => setLeadTime(e.target.value)} min="1" />
                    <button type="submit" className="btn">Add</button>
                </form>
            </div>

            <div className="panel">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Lead Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.map(s => (
                            <tr key={s.supplier_id}>
                                <td>{s.supplier_id}</td>
                                <td>{s.name}</td>
                                <td>{s.contact_email}</td>
                                <td>{s.lead_time_days} days</td>
                                <td>
                                    <button className="btn secondary" onClick={() => deleteSupplier(s.supplier_id)} style={{ padding: '4px 8px', fontSize: '11px' }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
