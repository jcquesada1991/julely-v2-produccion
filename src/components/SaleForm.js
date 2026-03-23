import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import SearchableSelect from './SearchableSelect';
import { Plus, X, ArrowUp, ArrowDown, MapPin, Calendar, CheckCircle, Building, Trash2 } from 'lucide-react';
import styles from '@/styles/DashboardV2.module.css';

const EMPTY_HOTEL_ENTRY = { catalog_id: '', hotel_name: '', hotel_address: '', hotel_phone: '', occupancy: '' };

export default function SaleForm({ onSubmit, onCancel }) {
    const { destinations, clients, users, itineraries, sales, hotels, addHotel } = useApp();
    const { currentUser: profile } = useAuth();
    const [formData, setFormData] = useState({
        client_name: '',
        client_id: '',
        destination_id: '',
        seller_id: '',
        status: 'Confirmada',
        travelers: 1,
        show_price_on_voucher: true,
        travel_date: '',
        return_date: '',
        description: 'Personalizado',
        additional_notes: '',
        confirmation_id: '',
        customItinerary: []
    });

    const [hotelsList, setHotelsList] = useState([]);
    const [showAddHotel, setShowAddHotel] = useState(false);
    const [newHotel, setNewHotel] = useState(EMPTY_HOTEL_ENTRY);

    const [availablePOIs, setAvailablePOIs] = useState([]);
    const [selectedPOIs, setSelectedPOIs] = useState([]);

    // Update Available POIs when Destination Changes
    useEffect(() => {
        if (formData.destination_id) {
            const relevant = itineraries.filter(i => String(i.destination_id) === String(formData.destination_id));
            // Show all, filter visually if added or just allow adding multiples? Assuming unique add for now.
            setAvailablePOIs(relevant);
        } else {
            setAvailablePOIs([]);
            setSelectedPOIs([]);
        }
    }, [formData.destination_id, itineraries]);

    // Auto-assign seller ID based on the logged-in user
    useEffect(() => {
        if (profile?.id && !formData.seller_id) {
            setFormData(prev => ({ ...prev, seller_id: profile.id }));
        }
    }, [profile]);

    // Auto-generate consecutive confirmation number based on existing sales
    useEffect(() => {
        if (!formData.confirmation_id && sales && sales.length > 0) {
            let maxNum = 0;
            sales.forEach(s => {
                const confStr = s.hotel_info?.confirmation_id || '';
                const match = confStr.match(/JULELYCONF-(\d+)/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNum) maxNum = num;
                }
            });
            const nextNum = maxNum + 1;
            const nextConfId = `JULELYCONF-${nextNum.toString().padStart(2, '0')}`;
            setFormData(prev => ({ ...prev, confirmation_id: nextConfId }));
        } else if (!formData.confirmation_id) {
            setFormData(prev => ({ ...prev, confirmation_id: 'JULELYCONF-01' }));
        }
    }, [sales]);

    const handleAddPOI = (poi) => {
        if (!selectedPOIs.find(s => s.id === poi.id)) {
            const nextDay = selectedPOIs.length > 0
                ? Math.max(...selectedPOIs.map(p => p.day)) + 1
                : 1;
            setSelectedPOIs([...selectedPOIs, { ...poi, day: nextDay }]);
        }
    };

    const handleRemovePOI = (poiId) => {
        setSelectedPOIs(selectedPOIs.filter(p => p.id !== poiId));
    };

    const handleDayChange = (poiId, value) => {
        const parsed = parseInt(value, 10);
        const day = isNaN(parsed) || parsed < 1 ? 1 : parsed;
        setSelectedPOIs(selectedPOIs.map(p => p.id === poiId ? { ...p, day } : p));
    };

    const movePoi = (poiId, direction) => {
        const sorted = [...selectedPOIs].sort((a, b) => a.day - b.day);
        const idx = sorted.findIndex(p => p.id === poiId);
        const targetIdx = idx + direction;
        if (targetIdx < 0 || targetIdx >= sorted.length) return;
        const currentDay = sorted[idx].day;
        const targetDay = sorted[targetIdx].day;
        setSelectedPOIs(selectedPOIs.map(p => {
            if (p.id === sorted[idx].id) return { ...p, day: targetDay };
            if (p.id === sorted[targetIdx].id) return { ...p, day: currentDay };
            return p;
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // VALIDATION: Check POIs
        if (availablePOIs.length === 0) {
            alert("No se puede crear una venta para un destino que no tiene excursiones.");
            return;
        }

        if (selectedPOIs.length === 0) {
            alert("Debes seleccionar al menos un punto de interés para crear la venta.");
            return;
        }

        let finalClientName = formData.client_name;
        if (formData.client_id) {
            const c = clients.find(cl => String(cl.id) === String(formData.client_id));
            if (c) finalClientName = `${c.name} ${c.surname}`;
        }

        // Calculate Total
        const totalAmount = selectedPOIs.reduce((acc, curr) => {
            const adultTotal = (Number(curr.price_adult) || 0) * Number(formData.travelers || 0);
            return acc + adultTotal;
        }, 0);

        const submission = {
            ...formData,
            client_name: finalClientName,
            total_amount: totalAmount,
            num_adults: Number(formData.travelers),
            num_children: 0,
            show_price_on_voucher: formData.show_price_on_voucher,
            travel_date: formData.travel_date || null,
            return_date: formData.return_date || null,
            assigned_to: formData.seller_id || null, // Vendedor
            hotel_info: {
                hotels: hotelsList,
                // legacy fallback: first hotel fields for old voucher compat
                hotel_name: hotelsList[0]?.hotel_name || '',
                hotel_address: hotelsList[0]?.hotel_address || '',
                hotel_phone: hotelsList[0]?.hotel_phone || '',
                occupancy: hotelsList[0]?.occupancy || '',
                description: formData.description || '',
                confirmation_id: formData.confirmation_id || '',
                additional_notes: formData.additional_notes || '',
                show_price_on_voucher: formData.show_price_on_voucher
            },
            custom_itinerary: [...selectedPOIs].sort((a, b) => a.day - b.day)
        };

        onSubmit(submission);
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.85rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginTop: '1rem'
    };

    const selectStyle = {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        fontSize: '0.9rem',
        marginTop: '0.25rem',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-primary)',
        outline: 'none',
        transition: 'border-color 0.2s',
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.75rem center',
        backgroundSize: '16px'
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Section 1: Basic Info */}
            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={18} color="var(--primary-color)" /> Información General
                </h3>

                <SearchableSelect
                    label="Cliente"
                    placeholder="Seleccione un cliente..."
                    options={clients}
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    name="client_id"
                    labelKey="name"
                    renderOption={(c) => (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 500 }}>{c.name} {c.surname}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.phone}</span>
                        </div>
                    )}
                    required
                />

                <SearchableSelect
                    label="Destino"
                    placeholder="Seleccione destino..."
                    options={destinations}
                    value={formData.destination_id}
                    onChange={(e) => {
                        setFormData({ ...formData, destination_id: e.target.value });
                        setSelectedPOIs([]);
                    }}
                    name="destination_id"
                    renderOption={(d) => d.title}
                    required
                />

                <div>
                    <label style={{ ...labelStyle, marginTop: '1rem' }}>Vendedor *</label>
                    <div style={{ ...selectStyle, backgroundImage: 'none', background: 'var(--bg-card)', borderColor: 'var(--border-color)', display: 'flex', alignItems: 'center', minHeight: '44px', opacity: 0.8, cursor: 'not-allowed' }}>
                        {profile ? [profile.name, profile.surname].filter(Boolean).join(' ') : 'Cargando vendedor...'}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Estado de la Venta</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            style={selectStyle}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        >
                            <option value="Confirmada">Confirmada</option>
                            <option value="Pendiente">Pendiente</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Descripción</label>
                        <select
                            name="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            style={selectStyle}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        >
                            <option value="Grupal">Grupal</option>
                            <option value="Personalizado">Personalizado</option>
                            <option value="Privado">Privado</option>
                            <option value="Crucero">Crucero</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>
                </div>

                {/* PAX & Pricing Options */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div>
                        <label style={{ ...labelStyle, marginTop: 0 }}>Viajeros</label>
                        <input
                            type="number"
                            min="1"
                            value={formData.travelers}
                            onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
                            style={selectStyle}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                id="showPriceToggle"
                                checked={formData.show_price_on_voucher}
                                onChange={(e) => setFormData({ ...formData, show_price_on_voucher: e.target.checked })}
                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                            />
                            <label htmlFor="showPriceToggle" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer', userSelect: 'none' }}>
                                Mostrar Precio en el Voucher (PDF)
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building size={18} color="var(--primary-color)" /> Datos Adicionales
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Fecha de Salida (Ida)</label>
                        <input
                            type="date"
                            value={formData.travel_date || ''}
                            onChange={(e) => setFormData({ ...formData, travel_date: e.target.value })}
                            style={{ ...selectStyle, backgroundImage: 'none', paddingRight: '0.75rem' }}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Fecha de Regreso (Vuelta)</label>
                        <input
                            type="date"
                            value={formData.return_date || ''}
                            onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                            style={{ ...selectStyle, backgroundImage: 'none', paddingRight: '0.75rem' }}
                        />
                    </div>
                </div>

                {/* Multi-hotel section */}
                <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <label style={{ ...labelStyle, marginTop: 0, marginBottom: 0 }}>Alojamientos del Viaje</label>
                        {!showAddHotel && (
                            <button type="button" onClick={() => { setNewHotel(EMPTY_HOTEL_ENTRY); setShowAddHotel(true); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>
                                <Plus size={14} /> Agregar Hotel
                            </button>
                        )}
                    </div>

                    {/* Existing hotels list */}
                    {hotelsList.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            {hotelsList.map((h, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-main)', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <Building size={14} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.hotel_name}</div>
                                        {h.hotel_address && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{h.hotel_address}</div>}
                                    </div>
                                    {h.occupancy && <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{h.occupancy}</span>}
                                    <button type="button" onClick={() => setHotelsList(prev => prev.filter((_, i) => i !== idx))}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '2px', flexShrink: 0 }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add hotel inline form */}
                    {showAddHotel && (
                        <div style={{ background: 'var(--bg-main)', border: '1px solid var(--primary-color)', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem' }}>
                            <div style={{ marginBottom: '0.75rem' }}>
                                <label style={{ ...labelStyle, marginTop: 0 }}>Buscar en catálogo</label>
                                <SearchableSelect
                                    options={[{ id: '', name: 'Ingresar manualmente' }, ...(hotels || []).filter(h => h.is_active)]}
                                    value={newHotel.catalog_id}
                                    onChange={(e) => {
                                        const selected = hotels?.find(h => String(h.id) === String(e.target.value));
                                        if (selected) {
                                            setNewHotel({ catalog_id: selected.id, hotel_name: selected.name, hotel_address: selected.address || '', hotel_phone: selected.phone || '', occupancy: newHotel.occupancy });
                                        } else {
                                            setNewHotel({ ...EMPTY_HOTEL_ENTRY });
                                        }
                                    }}
                                    placeholder="Buscar hotel..."
                                    valueKey="id"
                                    labelKey="name"
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ ...labelStyle, marginTop: 0 }}>Nombre del Hotel *</label>
                                    <input type="text" placeholder="Nombre" value={newHotel.hotel_name}
                                        onChange={e => setNewHotel({ ...newHotel, hotel_name: e.target.value, catalog_id: '' })}
                                        style={{ ...selectStyle, backgroundImage: 'none', paddingRight: '0.75rem' }} />
                                </div>
                                <div>
                                    <label style={{ ...labelStyle, marginTop: 0 }}>Dirección</label>
                                    <input type="text" placeholder="Dirección" value={newHotel.hotel_address}
                                        onChange={e => setNewHotel({ ...newHotel, hotel_address: e.target.value })}
                                        style={{ ...selectStyle, backgroundImage: 'none', paddingRight: '0.75rem' }} />
                                </div>
                                <div>
                                    <label style={{ ...labelStyle, marginTop: 0 }}>Teléfono</label>
                                    <input type="text" placeholder="+1 234 567 8900" value={newHotel.hotel_phone}
                                        onChange={e => setNewHotel({ ...newHotel, hotel_phone: e.target.value })}
                                        style={{ ...selectStyle, backgroundImage: 'none', paddingRight: '0.75rem' }} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ ...labelStyle, marginTop: 0 }}>Ocupación</label>
                                    <select value={newHotel.occupancy} onChange={e => setNewHotel({ ...newHotel, occupancy: e.target.value })} style={selectStyle}>
                                        <option value="">Seleccionar...</option>
                                        <option value="Sencillo">Sencillo</option>
                                        <option value="Doble">Doble</option>
                                        <option value="Triple">Triple</option>
                                        <option value="Cuádruple">Cuádruple</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                                <button type="button" onClick={() => setShowAddHotel(false)}
                                    style={{ padding: '0.45rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                                    Cancelar
                                </button>
                                <button type="button"
                                    onClick={async () => {
                                        if (!newHotel.hotel_name.trim()) return;
                                        const normalizedName = newHotel.hotel_name.trim().toLowerCase();
                                        let hotelId = null;
                                        const existing = hotels.find(h => h.name?.trim().toLowerCase() === normalizedName);
                                        if (existing) {
                                            hotelId = existing.id;
                                        } else {
                                            try {
                                                const created = await addHotel({
                                                    name: newHotel.hotel_name.trim(),
                                                    address: newHotel.hotel_address || '',
                                                    phone: newHotel.hotel_phone || '',
                                                });
                                                hotelId = created.id;
                                            } catch (err) {
                                                return;
                                            }
                                        }
                                        setHotelsList(prev => [...prev, { id: hotelId, hotel_name: newHotel.hotel_name.trim(), hotel_address: newHotel.hotel_address, hotel_phone: newHotel.hotel_phone, occupancy: newHotel.occupancy }]);
                                        setNewHotel(EMPTY_HOTEL_ENTRY);
                                        setShowAddHotel(false);
                                    }}
                                    style={{ padding: '0.45rem 1rem', borderRadius: '8px', background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                                    Agregar
                                </button>
                            </div>
                        </div>
                    )}

                    {hotelsList.length === 0 && !showAddHotel && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                            Sin alojamientos registrados.
                        </div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div>
                        <label style={{ ...labelStyle, marginTop: 0 }}>Número de Confirmación</label>
                        <input
                            type="text"
                            placeholder="Ej. JULELYCONF-01"
                            value={formData.confirmation_id || ''}
                            readOnly
                            style={{ ...selectStyle, backgroundImage: 'none', paddingRight: '0.75rem', background: 'var(--bg-card-hover)', cursor: 'not-allowed', color: 'var(--text-secondary)' }}
                        />
                    </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                    <label style={{ ...labelStyle, marginTop: 0 }}>Notas Adicionales</label>
                    <textarea
                        placeholder="Requerimientos, alergias, o detalles extra..."
                        value={formData.additional_notes || ''}
                        onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                        style={{ ...selectStyle, backgroundImage: 'none', minHeight: '80px', resize: 'vertical' }}
                    />
                </div>
            </div>

            {/* Section 2: Itinerary Builder */}
            {formData.destination_id && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--bg-main)', padding: '1rem', color: 'white' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={18} /> Armar Itinerario de Viaje
                        </h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>
                            Selecciona las actividades y asigna el día del viaje en que se realizarán.
                        </p>
                    </div>

                    <div className={styles.itineraryBuilderGrid}>

                        {/* LEFT: Available POIs */}
                        <div style={{ borderRight: '1px solid var(--border-color)', padding: '1rem', background: 'var(--bg-card)' }}>
                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                                Actividades Disponibles
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {availablePOIs.length === 0 ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        No hay actividades registradas para este destino.
                                    </div>
                                ) : (
                                    availablePOIs.map(p => {
                                        const isSelected = selectedPOIs.find(s => s.id === p.id);
                                        return (
                                            <div
                                                key={p.id}
                                                onClick={() => !isSelected && handleAddPOI(p)}
                                                style={{
                                                    background: 'var(--bg-card-hover)',
                                                    padding: '0.75rem',
                                                    borderRadius: '8px',
                                                    border: isSelected ? '1px solid var(--border-color)' : '1px solid rgba(157, 116, 200, 0.3)',
                                                    cursor: isSelected ? 'default' : 'pointer',
                                                    opacity: isSelected ? 0.5 : 1,
                                                    transition: 'all 0.2s',
                                                    boxShadow: isSelected ? 'none' : 'var(--shadow-card)',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                                onMouseEnter={(e) => !isSelected && (e.currentTarget.style.transform = 'translateY(-2px)')}
                                                onMouseLeave={(e) => !isSelected && (e.currentTarget.style.transform = 'translateY(0)')}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{p.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{/* Description truncated? */ p.description?.substring(0, 50)}...</div>
                                                </div>
                                                {!isSelected && <Plus size={16} color="var(--primary-color)" />}
                                                {isSelected && <CheckCircle size={16} color="var(--accent-color)" />}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Timeline */}
                        <div style={{ padding: '1rem', background: 'var(--bg-card-hover)' }}>
                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary-color)', textAlign: 'center' }}>
                                Itinerario Final
                            </h4>

                            {selectedPOIs.length === 0 ? (
                                <div style={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--text-secondary)',
                                    gap: '1rem',
                                    border: '2px dashed var(--border-color)',
                                    borderRadius: '12px'
                                }}>
                                    <Calendar size={48} strokeWidth={1} />
                                    <span style={{ fontSize: '0.9rem' }}>Selecciona actividades para comenzar</span>
                                </div>
                            ) : (
                                <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                                    {/* Timeline Line */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '7px',
                                        top: '10px',
                                        bottom: '10px',
                                        width: '2px',
                                        background: 'var(--border-color)'
                                    }}></div>

                                    {(() => {
                                        const sorted = [...selectedPOIs].sort((a, b) => a.day - b.day);
                                        return sorted.map((p, idx) => (
                                            <div key={p.id} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                                                {/* Dot */}
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '-2.45rem',
                                                    top: '4px',
                                                    width: '16px',
                                                    height: '16px',
                                                    borderRadius: '50%',
                                                    background: 'var(--primary-color)',
                                                    border: '4px solid var(--bg-card)'
                                                }}></div>

                                                {/* Content Card */}
                                                <div style={{
                                                    background: 'rgba(157, 116, 200, 0.15)',
                                                    borderRadius: '8px',
                                                    padding: '0.75rem',
                                                    border: '1px solid rgba(157, 116, 200, 0.3)',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-color)' }}>DÍA</span>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={p.day}
                                                                onChange={(e) => handleDayChange(p.id, e.target.value)}
                                                                style={{
                                                                    width: '46px',
                                                                    padding: '2px 4px',
                                                                    border: '1px solid rgba(157, 116, 200, 0.5)',
                                                                    borderRadius: '6px',
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: 700,
                                                                    color: 'var(--primary-color)',
                                                                    background: 'var(--bg-card)',
                                                                    textAlign: 'center',
                                                                    outline: 'none'
                                                                }}
                                                            />
                                                        </div>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{p.name}</div>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => movePoi(p.id, -1)}
                                                            disabled={idx === 0}
                                                            style={{
                                                                padding: '4px',
                                                                borderRadius: '4px',
                                                                border: 'none',
                                                                background: idx === 0 ? 'transparent' : 'var(--bg-card)',
                                                                color: idx === 0 ? 'var(--text-light)' : 'var(--text-secondary)',
                                                                cursor: idx === 0 ? 'default' : 'pointer'
                                                            }}
                                                        >
                                                            <ArrowUp size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => movePoi(p.id, 1)}
                                                            disabled={idx === sorted.length - 1}
                                                            style={{
                                                                padding: '4px',
                                                                borderRadius: '4px',
                                                                border: 'none',
                                                                background: idx === sorted.length - 1 ? 'transparent' : 'var(--bg-card)',
                                                                color: idx === sorted.length - 1 ? 'var(--text-light)' : 'var(--text-secondary)',
                                                                cursor: idx === sorted.length - 1 ? 'default' : 'pointer'
                                                            }}
                                                        >
                                                            <ArrowDown size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemovePOI(p.id)}
                                                            style={{
                                                                padding: '4px',
                                                                borderRadius: '4px',
                                                                border: 'none',
                                                                background: 'rgba(239, 68, 68, 0.15)',
                                                                color: '#EF4444',
                                                                cursor: 'pointer',
                                                                marginLeft: '4px'
                                                            }}
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={onCancel} style={{ padding: '0.75rem 1.5rem', border: '1px solid var(--border-color)', background: 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, color: 'var(--text-secondary)' }}>Cancelar Registro</button>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Completar Venta</button>
            </div>
        </form>
    );
}
