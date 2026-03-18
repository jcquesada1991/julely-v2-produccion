
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';
import DestinationForm from '@/components/DestinationForm';
import DestinationDetailModal from '@/components/DestinationDetailModal';
import { useConfirm } from '@/components/ConfirmModal'; // Added this import
import { useApp } from '@/context/AppContext';
import styles from '@/styles/DashboardV2.module.css';
import { Plus, Edit2, Trash2, Medal, Heart, CameraOff, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Destinations() {
    const { destinations, addDestination, updateDestination, deleteDestination, refetch } = useApp();
    const confirm = useConfirm(); // Added this line
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDest, setEditingDest] = useState(null);
    const [detailDest, setDetailDest] = useState(null); // for detail modal
    const [searchQuery, setSearchQuery] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    const handleCloseModal = async () => {
        if (isDirty) {
            const ok = await confirm(
                'Descartar cambios',
                '¿Estás seguro que deseas salir sin guardar? Los cambios se perderán.',
                { confirmText: 'Salir sin guardar', icon: 'alert' }
            );
            if (!ok) return;
        }
        setIsModalOpen(false);
        setEditingDest(null);
        setIsDirty(false);
    };

    // Filter destinations by search query
    const filteredDestinations = destinations.filter(dest => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (dest.title || '').toLowerCase().includes(q) ||
            (dest.subtitle || '').toLowerCase().includes(q) ||
            (dest.description_long || '').toLowerCase().includes(q) ||
            (dest.category || '').toLowerCase().includes(q)
        );
    });

    const handleOpenCreate = () => {
        setEditingDest(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (dest) => {
        setEditingDest(dest);
        setIsModalOpen(true);
    };

    const handleSubmit = async (formData) => {
        let success = true;
        if (editingDest) {
            // Editing an existing destination
            success = await updateDestination(editingDest.id, formData);
        } else if (formData._savedId) {
            // DestinationForm already inserted the row directly (needed ID for excursions/images)
            // Just refresh state from DB
            await refetch();
        } else {
            // Fallback: use context function
            success = await addDestination(formData);
        }
        
        if (success !== false) {
            setIsModalOpen(false);
            setIsDirty(false);
            setEditingDest(null);
        }
    };

    const handleDelete = async (id) => {
        const dest = destinations.find(d => d.id === id);
        const name = dest ? dest.title : '';
        const ok = await confirm(
            'Eliminar Destino',
            `¿Estás seguro de eliminar "${name}" ? Esta acción no se puede deshacer.`
        );
        if (!ok) return;
        await deleteDestination(id);
        setDetailDest(null);
    };

    return (
        <DashboardLayout title="Gestión de Destinos">
            <Head>
                <title>Destinos | Julely</title>
            </Head>

            {/* Top Bar: Search + New button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar destino..."
                        style={{
                            width: '100%', padding: '0.7rem 2.5rem 0.7rem 2.5rem',
                            borderRadius: '12px', border: '1px solid var(--border-color)',
                            background: 'var(--bg-card)', color: 'var(--text-primary)',
                            fontSize: '0.9rem', boxSizing: 'border-box',
                        }}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} style={{
                            position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
                            padding: 0, display: 'flex',
                        }}>
                            <X size={16} />
                        </button>
                    )}
                </div>

                <button className="btn-primary" onClick={handleOpenCreate}>
                    <Plus size={20} /> Nuevo Destino
                </button>
            </div>

            {/* Results count when searching */}
            {searchQuery && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    {filteredDestinations.length} resultado{filteredDestinations.length !== 1 ? 's' : ''} para &ldquo;{searchQuery}&rdquo;
                </div>
            )}

            {/* Destinations grid */}
            <div className={styles.gridContainer}>
                {filteredDestinations.map((dest) => (
                    <DestinationCard
                        key={dest.id}
                        dest={dest}
                        onEdit={handleOpenEdit}
                        onDelete={(id) => handleDelete(id)}
                        onClick={() => setDetailDest(dest)}
                    />
                ))}
                {filteredDestinations.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                        {searchQuery ? `No se encontraron destinos para "${searchQuery}"` : 'No hay destinos registrados.'}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingDest ? 'Editar Destino' : 'Crear Nuevo Destino'}
            >
                <DestinationForm
                    initialData={editingDest}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseModal}
                    onDirty={setIsDirty}
                />
            </Modal>

            {/* Detail Modal */}
            {detailDest && (
                <DestinationDetailModal
                    dest={detailDest}
                    onClose={() => setDetailDest(null)}
                    onEdit={(dest) => { setDetailDest(null); handleOpenEdit(dest); }}
                    onDelete={async (id) => { await deleteDestination(id); setDetailDest(null); }}
                />
            )}
        </DashboardLayout>
    );
}

// ─── Destination Card with image carousel ────────────────────────────────────
function DestinationCard({ dest, onEdit, onDelete, onClick }) {
    // All images: hero + gallery
    const allImages = [
        ...(dest.hero_image_url ? [dest.hero_image_url] : []),
        ...(dest.images || []).map(i => i.url),
    ];
    const [currentImg, setCurrentImg] = useState(0);
    const timerRef = useRef(null);

    // Auto-advance carousel every 3 seconds (only if multiple images)
    useEffect(() => {
        if (allImages.length <= 1) return;
        timerRef.current = setInterval(() => {
            setCurrentImg(i => (i + 1) % allImages.length);
        }, 3000);
        return () => clearInterval(timerRef.current);
    }, [allImages.length]);

    const goTo = (idx, e) => {
        e.stopPropagation();
        setCurrentImg(idx);
        clearInterval(timerRef.current);
    };

    return (
        <div
            key={dest.id}
            className={`${styles.card} ${dest.isPremium ? styles.premiumCard : ''} `}
            onClick={onClick}
            style={{ cursor: 'pointer' }}
        >
            {/* Image Container */}
            <div className={styles.cardImgWrap} style={{ position: 'relative' }}>
                {allImages.length > 0 ? (
                    <>
                        <img
                            src={allImages[currentImg]}
                            alt={dest.title}
                            className={styles.cardImg}
                            style={{ transition: 'opacity 0.4s' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        {/* Carousel dots (only if multiple) */}
                        {allImages.length > 1 && (
                            <div style={{
                                position: 'absolute', bottom: '48px', left: '50%', transform: 'translateX(-50%)',
                                display: 'flex', gap: '4px', zIndex: 5,
                            }}>
                                {allImages.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => goTo(idx, e)}
                                        style={{
                                            width: idx === currentImg ? '18px' : '6px', height: '6px',
                                            borderRadius: '3px', border: 'none', cursor: 'pointer', padding: 0,
                                            background: idx === currentImg ? 'white' : 'rgba(255,255,255,0.5)',
                                            transition: 'all 0.3s',
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--bg-card-hover)', color: 'var(--text-light)'
                    }}>
                        <CameraOff size={48} strokeWidth={1.5} />
                    </div>
                )}
                <div className={styles.gradientOverlay}></div>

                <div className={styles.badgeContainer}>
                    {dest.isPremium && (
                        <div className={styles.premiumBadge}><Medal size={14} /> PREMIUM</div>
                    )}
                    {dest.isFavorite && (
                        <div className={styles.favoriteBadge}><Heart size={14} fill="white" /> FAVORITO</div>
                    )}
                    {/* Image count badge */}
                    {allImages.length > 1 && (
                        <div style={{
                            background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.2rem 0.5rem',
                            borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: '3px',
                        }}>
                            🖼 {allImages.length}
                        </div>
                    )}
                </div>

                <div className={styles.cardOverlayContent}>
                    <h3 className={styles.cardOverlayTitle}>{dest.title}</h3>
                    <p className={styles.cardOverlaySubtitle}>{dest.subtitle || dest.category}</p>
                </div>
            </div>

            {/* Card Body */}
            <div className={styles.cardBody}>
                <div>
                    <h3 className={styles.cardTitle}>{dest.title}</h3>
                    <p
                        className={styles.cardSubtitle}
                        style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                        {dest.description_long || dest.subtitle}
                    </p>
                </div>

                <div className={styles.cardFooter}>
                    <button
                        className={`${styles.actionBtn} ${styles.actionBtnPrimary} `}
                        data-tooltip="Editar"
                        onClick={(e) => { e.stopPropagation(); onEdit(dest); }}
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        className={`${styles.actionBtn} ${styles.actionBtnDanger} `}
                        data-tooltip="Eliminar"
                        onClick={(e) => { e.stopPropagation(); onDelete(dest.id); }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
