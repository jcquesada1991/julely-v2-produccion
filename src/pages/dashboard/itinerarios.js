import Head from 'next/head';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';
import { useApp } from '@/context/AppContext';
import styles from '@/styles/DashboardV2.module.css';
import { Plus, MapPin, Edit, Trash2, CameraOff } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmModal';
import SearchableSelect from '@/components/SearchableSelect';
import ImageUploader from '@/components/ImageUploader';

export default function Itineraries() {
    const { itineraries, destinations, addItinerary, updateItinerary, deleteItinerary } = useApp();
    const confirm = useConfirm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItinerary, setCurrentItinerary] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    const renderDestName = (item) => {
        const d = destinations.find(x => String(x.id) === String(item.destination_id));
        if (d) return d.title;

        const name = item.destination_name || 'Desconocido';
        return (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{name}</span>
                <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: '#EF4444',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                }}>Eliminado</span>
            </span>
        );
    };


    const handleEdit = (item) => {
        setCurrentItinerary(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const item = itineraries.find(i => i.id === id);
        const name = item ? item.name : '';
        const ok = await confirm(
            'Eliminar Excursión',
            `¿Estás seguro de eliminar "${name}"? Esta acción no se puede deshacer.`
        );
        if (ok) {
            deleteItinerary(id);
        }
    };

    const handleClose = async () => {
        if (isDirty) {
            const ok = await confirm(
                'Descartar cambios',
                '¿Estás seguro que deseas salir sin guardar? Los cambios se perderán.',
                { confirmText: 'Salir sin guardar', icon: 'alert' }
            );
            if (!ok) return;
        }
        setIsModalOpen(false);
        setCurrentItinerary(null);
        setIsDirty(false);
    };

    return (
        <DashboardLayout title="Gestión de Itinerarios">
            <Head>
                <title>Excursiones | Julely</title>
            </Head>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 className={styles.pageTitle} style={{ fontSize: '2rem' }}>Excursiones</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Gestiona las excursiones para los itinerarios</p>
                </div>
                <button className="btn-primary" onClick={() => { setCurrentItinerary(null); setIsDirty(false); setIsModalOpen(true); }}>
                    <Plus size={20} /> Nueva Excursión
                </button>
            </div>

            <div className={styles.paramountCard}>
                <div className={styles.tableResponsiveWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.tableHeader}>Imagen</th>
                                <th className={styles.tableHeader}>Nombre</th>
                                <th className={styles.tableHeader}>Descripción</th>
                                <th className={styles.tableHeader}>Destino</th>
                                <th className={styles.tableHeader} style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itineraries.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <div style={{ position: 'relative', width: '50px', height: '50px' }}>
                                            <div className={styles.imgThumbnail} style={{ width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-card-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-camera-off"><line x1="1" x2="23" y1="1" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-2h7l2 2"/><path d="M7 13a4 4 0 0 1 4-4"/><path d="M15 13a4 4 0 0 0-4 4"/></svg>';
                                                        }}
                                                    />
                                                ) : (
                                                    <CameraOff size={20} color="var(--text-secondary)" />
                                                )}
                                            </div>
                                            {item.images?.length > 1 && (
                                                <span style={{ position: 'absolute', bottom: 2, right: 2, background: 'rgba(0,0,0,0.65)', color: 'white', fontSize: '0.6rem', fontWeight: 700, borderRadius: '4px', padding: '1px 4px', lineHeight: 1.4 }}>
                                                    +{item.images.length - 1}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.description}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                            <MapPin size={16} />
                                            {renderDestName(item)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.actions} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <button
                                                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                                                data-tooltip="Editar"
                                                onClick={() => handleEdit(item)}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                                data-tooltip="Eliminar"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {itineraries.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                        No hay excursiones registradas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleClose}
                title={currentItinerary ? "Editar Excursión" : "Nueva Excursión"}
            >
                <ItineraryForm
                    initialData={currentItinerary}
                    destinations={destinations}
                    onSubmit={(data) => {
                        if (currentItinerary) {
                            updateItinerary(currentItinerary.id, data);
                        } else {
                            addItinerary(data);
                        }
                        setIsModalOpen(false);
                        setCurrentItinerary(null);
                        setIsDirty(false);
                    }}
                    onCancel={handleClose}
                    onDirty={setIsDirty}
                />
            </Modal>
        </DashboardLayout>
    );
}

function ItineraryForm({ initialData, destinations, onSubmit, onCancel, onDirty }) {
    const initImages = initialData?.images?.length > 0
        ? initialData.images.map(i => i.url)
        : (initialData?.image ? [initialData.image] : []);

    const [formData, setFormData] = useState({
        destination_id: initialData?.destination_id || '',
        name: initialData?.name || '',
        description: initialData?.description || '',
        price_adult: initialData?.price_adult || '',
        price_child: initialData?.price_child || '',
        images: initImages,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        marginTop: '0.25rem',
        fontSize: '0.9rem',
        background: 'var(--bg-main)',
        color: 'var(--text-primary)'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.85rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginTop: '1rem'
    };

    return (
        <form onSubmit={handleSubmit}>
            <SearchableSelect
                label="Destino Asociado"
                required
                options={destinations}
                value={formData.destination_id}
                onChange={(e) => { setFormData({ ...formData, destination_id: e.target.value }); if (onDirty) onDirty(true); }}
                name="destination_id"
                placeholder="Seleccione un destino"
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label style={labelStyle}>Nombre</label>
                    <input
                        required
                        style={inputStyle}
                        value={formData.name}
                        onChange={e => { setFormData({ ...formData, name: e.target.value }); if (onDirty) onDirty(true); }}
                        placeholder="Ej: Museo del Louvre"
                    />
                </div>
            </div>

            <ImageUploader
                label="Imágenes de la Excursión"
                value={formData.images}
                onChange={(urls) => {
                    setFormData({ ...formData, images: Array.isArray(urls) ? urls : [urls].filter(Boolean) });
                    if (onDirty) onDirty(true);
                }}
                folder="excursiones"
                disableUrl={true}
                multiple={true}
                maxFiles={5}
            />

            <label style={labelStyle}>Descripción</label>
            <textarea
                required
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
                value={formData.description}
                onChange={e => { setFormData({ ...formData, description: e.target.value }); if (onDirty) onDirty(true); }}
                placeholder="Breve descripción del lugar..."
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={onCancel} style={{ padding: '0.75rem 1.5rem', border: '1px solid var(--border-color)', background: 'transparent', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-secondary)' }}>Cancelar</button>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    {initialData ? 'Actualizar' : 'Crear'}
                </button>
            </div>
        </form>
    );
}
