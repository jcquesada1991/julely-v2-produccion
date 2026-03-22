import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';
import SaleForm from '@/components/SaleForm';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/DashboardV2.module.css';
import { Plus, MapPin, Trash2, Map, FileText, Pencil, Search } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmModal';

export default function Sales() {
    const router = useRouter();
    const { sales, destinations, addSale, deleteSale, loadMoreSales, hasMoreSales } = useApp();
    const { currentUser, can } = useAuth();
    const confirm = useConfirm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingItinerary, setViewingItinerary] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleAddSale = async (formData) => {
        // Attach the creator's user ID to the sale
        const success = await addSale({
            ...formData,
            created_by: currentUser?.id || null
        });
        if (success) {
            setIsModalOpen(false);
        }
    };

    const getDestinationName = (sale) => {
        const d = destinations.find(x => String(x.id) === String(sale.destination_id));
        if (d) return d.title;
        // Si no se encuentra by ID pero la venta tiene un nombre guardado:
        return sale.destination_name ? `${sale.destination_name} (Eliminado)` : 'Desconocido';
    };

    // Filter sales based on role permissions
    let displayedSales = sales;
    if (!can('canViewAllSales') && currentUser) {
        // Asesor de Ventas: only see their own sales
        displayedSales = sales.filter(s => s.created_by === currentUser.id);
    }

    // Search filter
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        displayedSales = displayedSales.filter(s =>
            (s.client_name || '').toLowerCase().includes(term) ||
            (s.voucher_code || '').toLowerCase().includes(term) ||
            getDestinationName(s).toLowerCase().includes(term)
        );
    }

    return (
        <DashboardLayout title="Registro de Ventas">
            <Head>
                <title>Ventas | Julely</title>
            </Head>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 className={styles.pageTitle} style={{ fontSize: '2rem' }}>Ventas</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {can('canViewAllSales')
                            ? 'Gestiona todos los registros de venta'
                            : 'Tus registros de venta'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Buscar venta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                fontSize: '0.85rem',
                                outline: 'none',
                                width: '220px'
                            }}
                        />
                    </div>
                    <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={20} /> Nueva Venta
                    </button>
                </div>
            </div>

            <div className={styles.paramountCard}>
                <div className={styles.tableResponsiveWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.tableHeader}>Fecha</th>
                                <th className={styles.tableHeader}>Cliente</th>
                                <th className={styles.tableHeader}>Destino</th>
                                <th className={styles.tableHeader}>Días</th>
                                {can('canViewFinancials') && (
                                    <th className={styles.tableHeader}>Total</th>
                                )}
                                <th className={styles.tableHeader}>Estado</th>
                                <th className={styles.tableHeader} style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedSales.map((sale) => (
                                <tr key={sale.id}>
                                    <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        {new Date(sale.date || Date.now()).toLocaleDateString('es-ES', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td><div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{sale.client_name}</div></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                            <MapPin size={16} />
                                            {getDestinationName(sale) === 'Desconocido' ? (
                                                <span>Desconocido</span>
                                            ) : getDestinationName(sale).includes('(Eliminado)') ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>
                                                        {getDestinationName(sale).replace(' (Eliminado)', '')}
                                                    </span>
                                                    <span style={{ fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>Eliminado</span>
                                                </div>
                                            ) : (
                                                <span>{getDestinationName(sale)}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            fontWeight: 700,
                                            color: 'white',
                                            background: 'var(--primary-dark)',
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem'
                                        }}>
                                            {sale.custom_itinerary?.length > 0 ? Math.max(...sale.custom_itinerary.map(i => i.day)) : 0} Días
                                        </span>
                                    </td>
                                    {can('canViewFinancials') && (
                                        <td>
                                            <span style={{
                                                fontWeight: 800,
                                                color: 'var(--accent-color)',
                                                background: 'rgba(153, 221, 181, 0.1)',
                                                padding: '0.25rem 0.6rem',
                                                borderRadius: '6px',
                                                fontSize: '0.8rem',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '2px',
                                                border: '1px solid rgba(153, 221, 181, 0.2)'
                                            }}>
                                                $ {sale.total_amount ? sale.total_amount.toLocaleString() : '0'} USD
                                            </span>
                                        </td>
                                    )}
                                    <td>
                                        <span style={{
                                            padding: '0.3rem 0.8rem',
                                            borderRadius: '99px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            background: sale.status === 'Confirmada' ? 'rgba(153, 221, 181, 0.15)' : 'rgba(244, 166, 182, 0.15)',
                                            color: sale.status === 'Confirmada' ? 'var(--accent-color)' : 'var(--secondary-color)',
                                            border: `1px solid ${sale.status === 'Confirmada' ? 'rgba(153, 221, 181, 0.3)' : 'rgba(244, 166, 182, 0.3)'}`
                                        }}>
                                            {sale.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <button
                                                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                                                data-tooltip="Ver Itinerario"
                                                onClick={() => setViewingItinerary(sale)}
                                            >
                                                <Map size={16} />
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                                                data-tooltip="Ver Voucher"
                                                onClick={() => router.push(`/voucher/${sale.id}`)}
                                            >
                                                <FileText size={16} />
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                                                data-tooltip="Editar Voucher"
                                                onClick={() => router.push(`/voucher/${sale.id}?edit=true`)}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                                data-tooltip="Eliminar"
                                                onClick={async () => {
                                                    const ok = await confirm(
                                                        'Eliminar Venta',
                                                        `¿Estás seguro de eliminar esta venta? Esta acción no se puede deshacer.`
                                                    );
                                                    if (ok) {
                                                        await deleteSale(sale.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {displayedSales.length > 0 && hasMoreSales && !searchTerm && (
                                <tr>
                                    <td colSpan={can('canViewFinancials') ? 7 : 6} style={{ textAlign: 'center', padding: '1.5rem' }}>
                                        <button
                                            style={{
                                                padding: '0.6rem 1.2rem',
                                                background: 'transparent',
                                                color: 'var(--primary-color)',
                                                border: '1px solid var(--primary-color)',
                                                borderRadius: '6px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onClick={loadMoreSales}
                                            onMouseOver={e => { e.target.style.background = 'rgba(157, 116, 200, 0.1)'; }}
                                            onMouseOut={e => { e.target.style.background = 'transparent'; }}
                                        >
                                            Cargar Más Ventas Antiguas...
                                        </button>
                                    </td>
                                </tr>
                            )}
                            {displayedSales.length === 0 && (
                                <tr>
                                    <td colSpan={can('canViewFinancials') ? 7 : 6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                        {searchTerm ? 'No se encontraron ventas con ese criterio.' : 'No hay ventas registradas.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nueva Venta"
            >
                <SaleForm
                    onSubmit={handleAddSale}
                    onCancel={() => setIsModalOpen(false)}
                />

            </Modal>

            {/* Itinerary Visualization Modal */}
            <Modal
                isOpen={!!viewingItinerary}
                onClose={() => setViewingItinerary(null)}
                title="Itinerario Detallado"
            >
                {viewingItinerary && (
                    <div style={{ padding: '0 1rem' }}>
                        <div style={{ marginBottom: '2rem', textAlign: 'center', paddingBottom: '1.5rem', borderBottom: '1px dashed var(--border-color)' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
                                {getDestinationName(viewingItinerary.destination_id)}
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                Viajero: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{viewingItinerary.client_name}</span>
                            </p>
                        </div>

                        <div style={{ position: 'relative', paddingLeft: '1.5rem', marginBottom: '2rem' }}>
                            {/* Line */}
                            <div style={{
                                position: 'absolute',
                                left: '7px',
                                top: '0',
                                bottom: '0',
                                width: '2px',
                                background: 'var(--border-color)'
                            }}></div>

                            {viewingItinerary.custom_itinerary && viewingItinerary.custom_itinerary.length > 0 ? (
                                viewingItinerary.custom_itinerary.map((item, index) => (
                                    <div key={index} style={{ marginBottom: '2rem', position: 'relative' }}>
                                        {/* Dot */}
                                        <div style={{
                                            position: 'absolute',
                                            left: '-1.45rem',
                                            top: '0',
                                            width: '14px',
                                            height: '14px',
                                            borderRadius: '50%',
                                            background: 'var(--primary-color)',
                                            border: '3px solid var(--bg-card)',
                                            boxShadow: '0 0 0 2px rgba(157, 116, 200, 0.3)',
                                            zIndex: 2
                                        }}></div>

                                        <div style={{
                                            background: 'var(--bg-card)',
                                            borderRadius: '16px',
                                            padding: '1.25rem',
                                            border: '1px solid var(--border-color)',
                                            boxShadow: 'var(--shadow-card)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: 800,
                                                    color: 'var(--primary-color)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    background: 'rgba(157, 116, 200, 0.15)',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '50px'
                                                }}>
                                                    DÍA {item.day}
                                                </span>
                                                {can('canViewFinancials') && (
                                                    <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>
                                                        $ {item.price ? Number(item.price).toLocaleString() : '0'} USD
                                                    </span>
                                                )}
                                            </div>
                                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'white' }}>{item.name}</h4>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Sin itinerario personalizado.</div>
                            )}
                        </div>

                        {/* Total Footer */}
                        {can('canViewFinancials') && (
                            <div style={{
                                background: 'var(--gradient-purple)',
                                margin: '0 -2rem -2rem -2rem',
                                padding: '1.5rem 2rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderRadius: '0 0 20px 20px',
                                color: 'white'
                            }}>
                                <span style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.9 }}>Total Venta</span>
                                <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                                    {`$ ${viewingItinerary.total_amount ? viewingItinerary.total_amount.toLocaleString() : '0'} USD`}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </DashboardLayout >
    );
}
