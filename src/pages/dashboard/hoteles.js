import Head from 'next/head';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/DashboardV2.module.css';
import { Plus, Edit, Trash2, Building, MapPin, Phone, Star } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmModal';

const EMPTY_HOTEL = { name: '', address: '', phone: '', category: '', is_active: true };
const CATEGORIES = ['1 estrella', '2 estrellas', '3 estrellas', '4 estrellas', '5 estrellas', 'Boutique', 'Hostal', 'Apartamento', 'Resort', 'Otro'];

export default function Hoteles() {
    const { hotels, addHotel, updateHotel, deleteHotel } = useApp();
    const { can } = useAuth();
    const confirm = useConfirm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [current, setCurrent] = useState(null);
    const [form, setForm] = useState(EMPTY_HOTEL);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const canManage = can('canManageDestinations');

    const filtered = hotels.filter(h =>
        h.name?.toLowerCase().includes(search.toLowerCase()) ||
        h.address?.toLowerCase().includes(search.toLowerCase()) ||
        h.category?.toLowerCase().includes(search.toLowerCase())
    );

    const handleNew = () => {
        setCurrent(null);
        setForm(EMPTY_HOTEL);
        setIsModalOpen(true);
    };

    const handleEdit = (hotel) => {
        setCurrent(hotel);
        setForm({ name: hotel.name || '', address: hotel.address || '', phone: hotel.phone || '', category: hotel.category || '', is_active: hotel.is_active ?? true });
        setIsModalOpen(true);
    };

    const handleDelete = async (hotel) => {
        const ok = await confirm('Eliminar Hotel', `¿Eliminar "${hotel.name}"? Esta acción no se puede deshacer.`);
        if (ok) await deleteHotel(hotel.id);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            if (current) {
                await updateHotel(current.id, form);
            } else {
                await addHotel(form);
            }
            setIsModalOpen(false);
        } finally {
            setSaving(false);
        }
    };

    const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' };
    const inputStyle = { width: '100%', padding: '0.65rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' };

    return (
        <DashboardLayout title="Banco de Hoteles | Julely">
            <Head><title>Banco de Hoteles | Julely</title></Head>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 className={styles.pageTitle} style={{ fontSize: '2rem' }}>Banco de Hoteles</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{hotels.length} hotel{hotels.length !== 1 ? 'es' : ''} registrado{hotels.length !== 1 ? 's' : ''}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, dirección o categoría..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ ...inputStyle, maxWidth: '300px', background: 'var(--bg-card)' }}
                    />
                    {canManage && (
                        <button className="btn-primary" onClick={handleNew}>
                            <Plus size={16} /> Nuevo Hotel
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className={styles.paramountCard}>
                <div className={styles.tableResponsiveWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Dirección</th>
                            <th>Teléfono</th>
                            <th>Categoría</th>
                            <th>Estado</th>
                            {canManage && <th style={{ textAlign: 'right' }}>Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={canManage ? 6 : 5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                                    {search ? 'No se encontraron hoteles con ese criterio.' : 'No hay hoteles en el catálogo. ¡Agrega el primero!'}
                                </td>
                            </tr>
                        ) : filtered.map(hotel => (
                            <tr key={hotel.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Building size={14} color="var(--primary-color)" />
                                        <strong>{hotel.name}</strong>
                                    </div>
                                </td>
                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    {hotel.address || <span style={{ opacity: 0.5 }}>—</span>}
                                </td>
                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    {hotel.phone || <span style={{ opacity: 0.5 }}>—</span>}
                                </td>
                                <td style={{ fontSize: '0.875rem' }}>
                                    {hotel.category ? (
                                        <span style={{ background: 'var(--bg-card)', padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.8rem' }}>
                                            {hotel.category}
                                        </span>
                                    ) : <span style={{ opacity: 0.5 }}>—</span>}
                                </td>
                                <td>
                                    <span style={{
                                        padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600,
                                        background: hotel.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                        color: hotel.is_active ? '#10B981' : '#EF4444'
                                    }}>
                                        {hotel.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                {canManage && (
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => handleEdit(hotel)} title="Editar"><Edit size={14} /></button>
                                            <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => handleDelete(hotel)} title="Eliminar"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={current ? 'Editar Hotel' : 'Nuevo Hotel'}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Nombre del Hotel *</label>
                        <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Hotel Marriott Cusco" required autoFocus />
                    </div>
                    <div>
                        <label style={labelStyle}>Dirección</label>
                        <input style={inputStyle} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Av. Principal 123, Ciudad" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Teléfono</label>
                            <input style={inputStyle} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 8900" />
                        </div>
                        <div>
                            <label style={labelStyle}>Categoría</label>
                            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                <option value="">Sin categoría</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" id="isActive" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }} />
                        <label htmlFor="isActive" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>Hotel activo (visible en el selector)</label>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.65rem 1.25rem', border: '1px solid var(--border-color)', background: 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, color: 'var(--text-secondary)' }}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'Guardando...' : current ? 'Actualizar' : 'Crear Hotel'}
                        </button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
