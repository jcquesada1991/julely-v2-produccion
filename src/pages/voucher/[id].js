import { useRouter } from 'next/router';
import Head from 'next/head';
import { useApp } from '@/context/AppContext';
import styles from '@/styles/Voucher.module.css';
import { useEffect, useState } from 'react';
import { Download, ChevronLeft, Calendar, CheckSquare, FileText, MapPin, Pencil, Plus, X, User, Globe, CreditCard, ArrowUp, ArrowDown, DollarSign, Eye, EyeOff, Hash, Users, Building, Phone, AlignLeft, Mail } from 'lucide-react';

export default function Voucher() {
    const router = useRouter();
    const { id, edit } = router.query;
    const { getSaleDetails, clients, users, updateSale, systemSettings, isLoading: appLoading, itineraries } = useApp();
    const [data, setData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Auto-enter edit mode if ?edit=true
    useEffect(() => {
        if (edit === 'true') {
            setIsEditing(true);
        }
    }, [edit]);

    // Editable state
    const [editClientName, setEditClientName] = useState('');
    const [editPassport, setEditPassport] = useState('');
    const [editNationality, setEditNationality] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editPreparedBy, setEditPreparedBy] = useState('');
    const [editChecklist, setEditChecklist] = useState([]);
    const [editItinerary, setEditItinerary] = useState([]);
    const [editTerms, setEditTerms] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [showPrice, setShowPrice] = useState(false);

    // New fields requested
    const [editTravelDate, setEditTravelDate] = useState('');
    const [editReturnDate, setEditReturnDate] = useState('');
    const [editAdults, setEditAdults] = useState(1);
    const [editChildren, setEditChildren] = useState(0);
    const [editHotel, setEditHotel] = useState('');
    const [editHotelAddress, setEditHotelAddress] = useState('');
    const [editHotelPhone, setEditHotelPhone] = useState('');
    const [editOccupancy, setEditOccupancy] = useState('');
    const [editConfirmation, setEditConfirmation] = useState('');
    const [editNotes, setEditNotes] = useState('');

    // Client extended data
    const [clientData, setClientData] = useState(null);

    const [systemTerms, setSystemTerms] = useState('Cargando términos...');

    useEffect(() => {
        if (!appLoading) {
            setSystemTerms(systemSettings?.['terms_and_conditions'] || 'Términos y condiciones no configurados en el sistema.');
        }
    }, [systemSettings, appLoading]);

    useEffect(() => {
        if (id) {
            const details = getSaleDetails(id);
            setData(details);
        }
    }, [id, getSaleDetails]);

    // Initialize editable fields when data loads
    useEffect(() => {
        if (data) {
            const dest = data.destination || {};
            setEditClientName(data.client_name || '');
            setEditPrice(data.total_amount ? String(data.total_amount) : '0');
            setEditDate(data.date || new Date().toISOString().split('T')[0]);
            setEditTravelDate(data.travel_date || '');
            setEditReturnDate(data.return_date || '');

            const hotelInfo = data.hotel_info || {};
            const overrides = hotelInfo.client_overrides || {};

            setEditDescription(overrides.description || dest.description_long || dest.subtitle || '');
            setEditTerms(overrides.terms || systemTerms);
            setEditNotes(overrides.notes || '');

            setEditHotel(hotelInfo.hotel_name || '');
            setEditHotelAddress(hotelInfo.hotel_address || '');
            setEditHotelPhone(hotelInfo.hotel_phone || '');
            setEditOccupancy(hotelInfo.occupancy || '');
            setEditConfirmation(hotelInfo.confirmation_id || '');

            // Initialize Pax
            setEditAdults(data.num_adults || overrides.adults || 1);
            setEditChildren(data.num_children || overrides.children || 0);

            // Initialize Price toggle
            setShowPrice(hotelInfo.show_price_on_voucher ?? true);

            const includes = (data.custom_includes && data.custom_includes.length > 0)
                ? data.custom_includes
                : ((dest.includes && dest.includes.length > 0) ? dest.includes : [
                    "Aéreos internacionales ida y vuelta",
                    "Traslados aeropuerto /hotel /aeropuerto",
                    "Alojamiento",
                    "Excursiones descritas en el itinerario",
                    "Guía de habla hispana",
                    "Desayunos",
                    "Impuestos"
                ]);
            setEditChecklist(includes);

            const itinerary = (data.custom_itinerary && data.custom_itinerary.length > 0)
                ? data.custom_itinerary
                : (dest.itinerary || []);
            setEditItinerary(itinerary.map((item, idx) => ({
                ...item,
                day: item.day || idx + 1
            })));

            // Find the full client data from clients array
            if (clients && data.client_name) {
                const found = clients.find(c =>
                    data.client_name.includes(c.name) && (c.surname ? data.client_name.includes(c.surname) : true)
                );
                setClientData(found || null);
                if (found) {
                    const hotelInfo = data.hotel_info || {};
                    const overrides = hotelInfo.client_overrides || {};
                    setEditPassport(overrides.passport || found.passport || '');
                    setEditNationality(overrides.nationality || found.nationality || '');
                    setEditPhone(overrides.phone || found.phone || '');
                    setEditEmail(overrides.email || found.email || '');
                }
            }

            // Resolver el nombre del preparador desde users/profiles
            // En AppContext: assigned_to se renombra a created_by en la normalización
            const preparedById = data.prepared_by || data.assigned_to || data.created_by;
            if (preparedById) {
                // Buscar en la lista de usuarios por ID
                const preparer = users?.find(u => u.id === preparedById);
                if (preparer) {
                    setEditPreparedBy(preparer.full_name || `${preparer.name} ${preparer.surname}`.trim());
                } else {
                    // Si no está en la lista (UUID), dejar vacío; si es texto, usarlo directamente
                    setEditPreparedBy(
                        typeof preparedById === 'string' && !preparedById.includes('-')
                            ? preparedById
                            : ''
                    );
                }
            }
        }
    }, [data, clients, users, systemTerms]);

    if (!data) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-primary)', background: 'var(--bg-main)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando Voucher...</div>;
    if (!data.destination) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-primary)', background: 'var(--bg-main)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Destino no encontrado</div>;

    // --- PAGINATION LOGIC FOR TERMS ---
    const getTermsPages = (text, charLimit = 3200) => {
        if (!text) return [];
        const paragraphs = text.split('\n');
        const pages = [];
        let currentPage = '';

        paragraphs.forEach(p => {
            if (currentPage.length + p.length > charLimit && currentPage.length > 0) {
                pages.push(currentPage.trim());
                currentPage = p + '\n';
            } else {
                currentPage += p + '\n';
            }
        });
        if (currentPage.trim().length > 0) pages.push(currentPage.trim());
        return pages;
    };

    const termsPages = getTermsPages(editTerms, 3200);
    const displayedTermsPages = termsPages.length > 0 ? termsPages : [''];

    const notesPages = getTermsPages(editNotes, 2500);
    const displayedNotesPages = notesPages.length > 0 ? notesPages : [''];

    const chunkArray = (arr, size) => {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    };

    // Chunk itinerary items
    // Chunking adaptativo: 2 por página si algún ítem tiene imagen o descripción larga, 3 si son cortos
    const buildItineraryPages = (items) => {
        if (items.length === 0) return [[]];
        const isBig = (item) => item && (!!item.image || (item.description || '').length > 200);
        const pages = [];
        let i = 0;
        while (i < items.length) {
            const a = items[i];
            const b = i + 1 < items.length ? items[i + 1] : null;
            const c = i + 2 < items.length ? items[i + 2] : null;
            if (!isBig(a) && b && !isBig(b) && c) {
                pages.push([a, b, c]);
                i += 3;
            } else {
                pages.push(b ? [a, b] : [a]);
                i += b ? 2 : 1;
            }
        }
        return pages;
    };
    const itineraryPages = buildItineraryPages(editItinerary);

    const { destination: dest, voucher_code } = data;

    const availableExcursions = (itineraries || []).filter(i =>
        String(i.destination_id) === String(dest?.id) &&
        !editItinerary.some(ei => ei.name === i.name || ei.id === i.id)
    );

    const handleAddExcursion = (e) => {
        const val = e.target.value;
        if (!val) return;

        if (val === 'custom') {
            setEditItinerary([...editItinerary, {
                title: 'Día Libre',
                name: 'Día Libre',
                description: 'Actividades personales o libres.',
                day: editItinerary.length + 1
            }]);
        } else {
            const exc = itineraries.find(i => String(i.id) === String(val));
            if (exc) {
                setEditItinerary([...editItinerary, {
                    ...exc,
                    day: editItinerary.length + 1
                }]);
            }
        }
        e.target.value = ''; // reset select
    };

    const formattedDate = editDate
        ? new Date(`${editDate}T12:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Checklist helpers
    const addChecklistItem = () => setEditChecklist([...editChecklist, '']);
    const removeChecklistItem = (idx) => setEditChecklist(editChecklist.filter((_, i) => i !== idx));
    const updateChecklistItem = (idx, val) => {
        const updated = [...editChecklist];
        updated[idx] = val;
        setEditChecklist(updated);
    };

    const handlePaxChange = (type, val) => {
        let newAdults = editAdults;
        let newChildren = editChildren;
        if (type === 'adults') {
            newAdults = val;
            setEditAdults(val);
        } else {
            newChildren = val;
            setEditChildren(val);
        }

        // Recalculate price
        const itinerary = editItinerary.length > 0 ? editItinerary : (data?.custom_itinerary || []);
        if (itinerary.length > 0) {
            const newTotal = itinerary.reduce((acc, curr) => {
                const adultTotal = (Number(curr.price_adult || curr.price || 0)) * newAdults;
                const childTotal = (Number(curr.price_child || 0)) * newChildren;
                return acc + adultTotal + childTotal;
            }, 0);
            setEditPrice(String(newTotal));
        }
    };

    // Itinerary helpers
    const removeItineraryItem = (idx) => {
        const updated = editItinerary.filter((_, i) => i !== idx).map((item, i) => ({ ...item, day: i + 1 }));
        setEditItinerary(updated);
    };
    const moveItineraryItemUp = (idx) => {
        if (idx === 0) return;
        const updated = [...editItinerary];
        const temp = updated[idx];
        updated[idx] = updated[idx - 1];
        updated[idx - 1] = temp;
        setEditItinerary(updated.map((item, i) => ({ ...item, day: i + 1 })));
    };
    const moveItineraryItemDown = (idx) => {
        if (idx === editItinerary.length - 1) return;
        const updated = [...editItinerary];
        const temp = updated[idx];
        updated[idx] = updated[idx + 1];
        updated[idx + 1] = temp;
        setEditItinerary(updated.map((item, i) => ({ ...item, day: i + 1 })));
    };

    const hasChecklist = editChecklist.length > 0 || isEditing;
    const hasDescription = (editDescription && editDescription.trim().length > 0) || isEditing;
    const hasItinerary = editItinerary.length > 0 || isEditing;
    const hasTerms = (editTerms && editTerms.trim().length > 0) || isEditing;
    const hasNotes = (editNotes && editNotes.trim().length > 0) || isEditing;

    const handleToggleEdit = async () => {
        if (isEditing) {
            // Save Changes when switching from Edit back to View mode
            const updatedHotelInfo = {
                ...(data.hotel_info || {}),
                show_price_on_voucher: showPrice,
                hotel_name: editHotel,
                hotel_address: editHotelAddress,
                hotel_phone: editHotelPhone,
                occupancy: editOccupancy,
                confirmation_id: editConfirmation,
                client_overrides: {
                    passport: editPassport,
                    nationality: editNationality,
                    phone: editPhone,
                    email: editEmail,
                    adults: editAdults,
                    children: editChildren,
                    notes: editNotes,
                    terms: editTerms,
                    description: editDescription
                }
            };

            const updatedSale = {
                client_name: editClientName || data.client_name,
                total_amount: editPrice ? parseFloat(editPrice) : data.total_amount,
                num_adults: editAdults,
                num_children: editChildren,
                travel_date: editTravelDate || data.travel_date,
                return_date: editReturnDate || data.return_date,
                custom_itinerary: editItinerary.length > 0 ? editItinerary : data.custom_itinerary,
                custom_includes: editChecklist,
                prepared_by: editPreparedBy || data.prepared_by,
                hotel_info: updatedHotelInfo
            };

            await updateSale(id, updatedSale);
        }
        setIsEditing(!isEditing);
    };

    // Hotel/Reservation info items — only show fields that have data
    const hotelInfoItems = [];
    if (editHotel || isEditing) hotelInfoItems.push({ label: 'HOTEL / ALOJAMIENTO', value: editHotel, setValue: setEditHotel, icon: Building });
    if (editHotelAddress || isEditing) hotelInfoItems.push({ label: 'DIRECCIÓN', value: editHotelAddress, setValue: setEditHotelAddress, icon: MapPin });
    if (editHotelPhone || isEditing) hotelInfoItems.push({ label: 'TELÉFONO HOTEL', value: editHotelPhone, setValue: setEditHotelPhone, icon: Phone });
    if (editOccupancy || isEditing) hotelInfoItems.push({ label: 'OCUPACIÓN', value: editOccupancy, setValue: setEditOccupancy, icon: User });
    if (data.confirmation_code || voucher_code || isEditing) hotelInfoItems.push({ label: 'NÚMERO CONFIRMACIÓN', value: data.confirmation_code || voucher_code, readOnly: true, icon: Hash });

    // Client info items — only show fields that have data
    const clientInfoItems = [];

    const effectivePassport = editPassport;
    const effectiveNationality = editNationality;
    const effectivePhone = editPhone;
    const effectiveEmail = editEmail;

    if (effectivePassport || isEditing) clientInfoItems.push({ label: 'PASAPORTE', value: effectivePassport, setValue: setEditPassport, icon: CreditCard });
    if (effectiveNationality || isEditing) clientInfoItems.push({ label: 'NACIONALIDAD', value: effectiveNationality, setValue: setEditNationality, icon: Globe });
    if (effectivePhone || isEditing) clientInfoItems.push({ label: 'TELÉFONO', value: effectivePhone, setValue: setEditPhone, icon: Phone });
    if (effectiveEmail || isEditing) clientInfoItems.push({ label: 'EMAIL', value: effectiveEmail, setValue: setEditEmail, icon: Mail });

    return (
        <>
            <Head>
                <title>Voucher {voucher_code}</title>
            </Head>

            <div className={styles.voucherContainer}>
                {/* --- PAGE 1: COVER --- */}
                <div className={styles.voucherPage}>

                    <div className={styles.pagePadding}>
                        {/* 1. Top Header */}
                        <div className={styles.topHeader}>
                            <div className={styles.brandInfo}>
                                <img src="/images/logo_transparent.png" className={styles.logoImage} alt="Julely" style={{ objectFit: 'contain' }} />
                                {/* Slogan is already integrated or handled globally, just keeping logo top-left */}
                            </div>
                            {/* Removed NÚMERO DE CONFIRMACIÓN code block here */}
                        </div>

                        {/* 2. Hero Image Banner */}
                        <div className={styles.heroBanner} style={{ marginTop: '-1rem' }}>
                            <img
                                src={dest.hero_image_url}
                                className={styles.heroImg}
                                alt={dest.title}
                                onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2670&auto=format&fit=crop'}
                            />
                            <div className={styles.heroOverlay}></div>
                            <div className={styles.heroText}>
                                <div className={styles.heroBadge}>Voucher Oficial</div>
                                <h2 className={styles.heroTitle}>
                                    {dest.title?.includes('(Eliminado)') ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                                            <span style={{ textDecoration: 'line-through', opacity: 0.8 }}>
                                                {dest.title.replace(' (Eliminado)', '')}
                                            </span>
                                            <span style={{ fontSize: '0.45em', background: 'rgba(239, 68, 68, 0.8)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, letterSpacing: '1px' }}>
                                                ELIMINADO
                                            </span>
                                        </div>
                                    ) : dest.title}
                                </h2>
                            </div>
                        </div>

                        {/* 3. Essential Trip Info Grid */}
                        <div className={styles.infoGrid} style={{ gridTemplateColumns: showPrice ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)' }}>

                            {/* Traveler Details */}
                            <div className={`${styles.infoCard} ${styles.cardTraveler}`}>
                                <div className={styles.infoCardHeader}>
                                    <User size={16} />
                                    <h3>Viajero Principal</h3>
                                </div>
                                <h4 className={styles.travelerName}>
                                    {isEditing ? (
                                        <input className={styles.editInput} value={editClientName} onChange={(e) => setEditClientName(e.target.value)} placeholder="Nombre Cliente" />
                                    ) : (editClientName || "-")}
                                </h4>
                                <p className={styles.travelerSub}>
                                    Pasaporte: {isEditing ? (
                                        <input className={styles.editInput} value={editPassport} onChange={(e) => setEditPassport(e.target.value)} style={{ width: '80px' }} placeholder="..." />
                                    ) : (editPassport || "-")}
                                </p>
                                <div className={styles.cardFooter}>
                                    <div className={styles.cardFooterLabel}>Total de Pasajeros</div>
                                    <div className={styles.cardFooterVal}>
                                        {isEditing ? (
                                            <div style={{ display: 'flex', gap: '0.25rem', flexDirection: 'column' }}>
                                                <select
                                                    className={styles.editInput}
                                                    value={editAdults}
                                                    onChange={(e) => handlePaxChange('adults', Number(e.target.value))}
                                                    style={{ padding: '4px', fontSize: '0.8rem' }}
                                                >
                                                    {[...Array(10)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1} Adulto(s)</option>)}
                                                </select>
                                                <select
                                                    className={styles.editInput}
                                                    value={editChildren}
                                                    onChange={(e) => handlePaxChange('children', Number(e.target.value))}
                                                    style={{ padding: '4px', fontSize: '0.8rem' }}
                                                >
                                                    {[...Array(11)].map((_, i) => <option key={i} value={i}>{i} Menor(es)</option>)}
                                                </select>
                                            </div>
                                        ) : (
                                            `${editAdults} Adulto(s)${editChildren > 0 ? `, ${editChildren} Menor(es)` : ''}`
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Travel Schedule */}
                            <div className={`${styles.infoCard} ${styles.cardSchedule}`}>
                                <div className={styles.infoCardHeader}>
                                    <Calendar size={16} />
                                    <h3>Itinerario de Viaje</h3>
                                </div>
                                <div className={styles.scheduleRow}>
                                    <span className={styles.scheduleLabel}>Fecha de Salida</span>
                                    <span className={styles.scheduleVal}>
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                className={styles.editInput}
                                                value={editTravelDate}
                                                onChange={(e) => setEditTravelDate(e.target.value)}
                                            />
                                        ) : (
                                            editTravelDate
                                                ? new Date(`${editTravelDate}T12:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                                : "-"
                                        )}
                                    </span>
                                </div>
                                <div className={styles.scheduleRow} style={{ marginTop: '0.25rem' }}>
                                    <span className={styles.scheduleLabel}>Fecha de Regreso</span>
                                    <span className={styles.scheduleVal}>
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                className={styles.editInput}
                                                value={editReturnDate}
                                                onChange={(e) => setEditReturnDate(e.target.value)}
                                            />
                                        ) : (
                                            editReturnDate
                                                ? new Date(`${editReturnDate}T12:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                                : "-"
                                        )}
                                    </span>
                                </div>
                                <div className={styles.scheduleRow} style={{ marginTop: '0.25rem' }}>
                                    <span className={styles.scheduleLabel}>Fecha de Venta</span>
                                    <span className={styles.scheduleVal}>{formattedDate}</span>
                                </div>
                                <div className={styles.cardFooter}>
                                    <div className={styles.cardFooterLabel}>Vendedor</div>
                                    <div className={styles.cardFooterVal}>
                                        {isEditing ? (
                                            <input className={styles.editInput} value={editPreparedBy} onChange={(e) => setEditPreparedBy(e.target.value)} placeholder="Vendedor" />
                                        ) : (editPreparedBy || 'Julely Travel')}
                                    </div>
                                </div>
                            </div>

                            {/* Payment Summary */}
                            {showPrice && (
                                <div className={`${styles.infoCard} ${styles.cardPricing}`}>
                                    <div>
                                        <div className={styles.infoCardHeader}>
                                            <DollarSign size={16} />
                                            <h3>Resumen de Pago</h3>
                                        </div>
                                        <div className={styles.priceLabel}>Reserva Total</div>

                                        <div className={styles.priceVal}>
                                            {isEditing ? (
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    $<input className={styles.editInput} value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ width: '100px', fontSize: '1.5rem', fontWeight: 'bold' }} placeholder="0.00" />
                                                </div>
                                            ) : `$${Number(editPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                                        </div>

                                    </div>
                                    <div className={styles.cardFooter}>
                                        <CheckSquare size={14} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Reserva Confirmada</span>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Additional Info Block for Page 1 */}
                        <div className={styles.extraInfoGrid} style={{ marginTop: '2rem' }}>
                            {clientInfoItems.map((item, idx) => (
                                <div key={idx} className={styles.extraInfoItem}>
                                    <div className={styles.extraIcon}><item.icon size={20} /></div>
                                    <div className={styles.extraLabel}>{item.label}</div>
                                    {isEditing && !item.readOnly ? (
                                        <input
                                            className={styles.editInput}
                                            style={{ textAlign: 'center' }}
                                            value={item.value}
                                            onChange={(e) => item.setValue(e.target.value)}
                                        />
                                    ) : (
                                        <div className={styles.extraVal}>{item.value || "-"}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- PAGE 2: DETAILS (Hotel, Includes, Description) --- */}
                {(hotelInfoItems.length > 0 || hasChecklist || hasDescription) && (
                    <div className={styles.voucherPage}>
                        <div className={styles.mainContent}>

                            {/* Hotel Details */}
                            {hotelInfoItems.length > 0 && (
                                <div className={styles.sectionBlock}>
                                    <div className={styles.hotelDetailsBox}>
                                        <div className={styles.hotelHeader}>
                                            <div className={styles.hotelIcon}>
                                                <Building size={24} />
                                            </div>
                                            <div>
                                                <h3 className={styles.hotelCatTitle}>Datos del Alojamiento</h3>
                                                <p className={styles.hotelCatSub}>Información oficial para su check-in</p>
                                            </div>
                                        </div>
                                        <div className={styles.hotelGrid}>
                                            {hotelInfoItems.map((item, idx) => (
                                                <div key={idx} className={styles.hotelCol}>
                                                    <div className={styles.hotelItemLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                        <item.icon size={12} style={{ color: 'var(--primary-color)' }} />
                                                        {item.label}
                                                    </div>
                                                    {isEditing && !item.readOnly ? (
                                                        <input
                                                            className={styles.editInput}
                                                            value={item.value}
                                                            onChange={(e) => item.setValue(e.target.value)}
                                                            placeholder={item.label}
                                                            style={{ fontSize: '1rem', fontWeight: 600 }}
                                                        />
                                                    ) : (
                                                        <div className={styles.hotelItemVal}>{item.value || "-"}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* What's Included */}
                            {hasChecklist && (
                                <div className={styles.sectionBlock}>
                                    <h3 className={styles.sectionTitle}>
                                        <CheckSquare size={20} />
                                        QUÉ INCLUYE SU VIAJE
                                    </h3>
                                    <div className={styles.checklistGrid}>
                                        {editChecklist.map((item, idx) => (
                                            <div key={idx} className={styles.checkItem}>
                                                <div className={styles.customCheck}>✓</div>
                                                <div style={{ flex: 1 }}>
                                                    {isEditing ? (
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <input
                                                                className={styles.editInput}
                                                                value={item}
                                                                onChange={(e) => updateChecklistItem(idx, e.target.value)}
                                                            />
                                                            <button className={styles.editRemoveBtn} onClick={() => removeChecklistItem(idx)} type="button">✖</button>
                                                        </div>
                                                    ) : (
                                                        item
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {isEditing && (
                                            <button className={styles.editAddBtn} onClick={addChecklistItem} type="button" style={{ gridColumn: '1 / -1' }}>
                                                + Añadir Ítem
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Destination Description */}
                            {hasDescription && (
                                <div className={styles.sectionBlock}>
                                    <h3 className={styles.sectionTitle}>
                                        <Globe size={20} />
                                        SOBRE EL DESTINO
                                    </h3>
                                    <div className={styles.descriptionText} style={{ whiteSpace: 'pre-line' }}>
                                        {isEditing ? (
                                            <textarea
                                                className={styles.editTextarea}
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                rows={5}
                                            />
                                        ) : (
                                            editDescription
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}

                {/* --- PAGE 3+: ITINERARY --- */}
                {hasItinerary && itineraryPages.map((pageItems, pageIdx) => (
                    <div className={styles.voucherPage} key={`itinerary-page-${pageIdx}`}>
                        <div className={styles.mainContent}>
                            <div className={styles.sectionBlock}>
                                {pageIdx === 0 && (
                                    <h3 className={styles.sectionTitle}>
                                        <Calendar size={20} />
                                        ITINERARIO DETALLADO
                                    </h3>
                                )}
                                <div className={styles.itineraryList}>
                                    {pageItems.map((item, idxInPage) => {
                                        const idx = editItinerary.indexOf(item);
                                        return (
                                            <div key={idx} className={styles.itineraryItem}>
                                                <div className={styles.dayBadge}>DÍA {item.day || idx + 1}</div>
                                                <div className={styles.itineraryContent}>
                                                    {isEditing ? (
                                                        <>
                                                            <input
                                                                className={styles.editInput}
                                                                value={item.name || item.title}
                                                                onChange={(e) => {
                                                                    const updated = [...editItinerary];
                                                                    updated[idx] = { ...updated[idx], name: e.target.value };
                                                                    setEditItinerary(updated);
                                                                }}
                                                                style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}
                                                            />
                                                            <textarea
                                                                className={styles.editTextarea}
                                                                value={item.description || ''}
                                                                onChange={(e) => {
                                                                    const updated = [...editItinerary];
                                                                    updated[idx] = { ...updated[idx], description: e.target.value };
                                                                    setEditItinerary(updated);
                                                                }}
                                                                style={{ minHeight: '60px', padding: '0.5rem', marginBottom: '1rem' }}
                                                            />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <h4 className={styles.itineraryTitle}>{item.name || item.title}</h4>
                                                            {item.description && (
                                                                <p className={styles.itineraryDesc}>{item.description}</p>
                                                            )}
                                                        </>
                                                    )}
                                                    {item.image && (
                                                        <div className={styles.itineraryImageWrapper}>
                                                            <img src={item.image} alt={item.name || item.title} />
                                                        </div>
                                                    )}
                                                </div>
                                                {isEditing && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', justifyContent: 'center', marginLeft: '1rem' }}>
                                                        <button className={styles.editRemoveBtn} onClick={() => moveItineraryItemUp(idx)} type="button" disabled={idx === 0} style={{ opacity: idx === 0 ? 0.3 : 1, color: 'var(--primary-color)', background: 'rgba(127,19,236,0.1)' }}>
                                                            <ArrowUp size={16} />
                                                        </button>
                                                        <button className={styles.editRemoveBtn} onClick={() => moveItineraryItemDown(idx)} type="button" disabled={idx === editItinerary.length - 1} style={{ opacity: idx === editItinerary.length - 1 ? 0.3 : 1, color: 'var(--primary-color)', background: 'rgba(127,19,236,0.1)' }}>
                                                            <ArrowDown size={16} />
                                                        </button>
                                                        <button className={styles.editRemoveBtn} onClick={() => removeItineraryItem(idx)} type="button" style={{ marginTop: '0.5rem' }}>
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {isEditing && pageIdx === itineraryPages.length - 1 && (
                                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <select
                                            className={styles.editInput}
                                            value=""
                                            onChange={handleAddExcursion}
                                            style={{ flex: 1, padding: '0.75rem', background: 'rgba(127,19,236,0.05)', borderRadius: '8px', border: '1px dashed var(--primary-color)' }}
                                        >
                                            <option value="">+ Añadir Día / Excursión...</option>
                                            {availableExcursions.map(exc => (
                                                <option key={exc.id} value={exc.id}>{exc.name}</option>
                                            ))}
                                            <option value="custom">Día Libre / Personalizado</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* --- PAGE 4: NOTES --- */}
                {hasNotes && displayedNotesPages.map((pageText, pageIdx) => (
                    <div className={styles.voucherPage} key={`notes-page-${pageIdx}`}>
                        <div className={styles.pagePadding} style={{ paddingTop: '3rem', flex: 1 }}>
                            <div className={styles.sectionBlock}>
                                {pageIdx === 0 && (
                                    <h3 className={styles.sectionTitle}>
                                        <AlignLeft size={20} />
                                        NOTAS ADICIONALES
                                    </h3>
                                )}
                                <div className={styles.descriptionText} style={{ whiteSpace: 'pre-line' }}>
                                    {isEditing && pageIdx === 0 ? (
                                        <textarea
                                            className={styles.editTextarea}
                                            value={editNotes}
                                            onChange={(e) => setEditNotes(e.target.value)}
                                            rows={12}
                                            placeholder="Escriba aquí notas adicionales para el cliente..."
                                        />
                                    ) : (!isEditing || pageIdx > 0 ? pageText : null)}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* --- MULTI-PAGE: TERMS & CONDITIONS --- */}
                {hasTerms && displayedTermsPages.map((pageText, pageIdx) => (
                    <div className={styles.voucherPage} key={`terms-page-${pageIdx}`}>
                        <div className={styles.pagePadding} style={{ paddingTop: '3rem', flex: 1 }}>
                            <div className={styles.sectionBlock}>
                                {pageIdx === 0 && (
                                    <h3 className={styles.sectionTitle}>
                                        <FileText size={20} />
                                        TÉRMINOS Y CONDICIONES
                                    </h3>
                                )}
                                <div className={styles.termsText} style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                                    {isEditing && pageIdx === 0 ? (
                                        <textarea
                                            className={styles.editTextarea}
                                            value={editTerms}
                                            onChange={(e) => setEditTerms(e.target.value)}
                                            rows={25}
                                            style={{ height: '700px' }}
                                        />
                                    ) : (
                                        !isEditing || pageIdx > 0 ? pageText : null
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer on Last Page */}
                        {pageIdx === displayedTermsPages.length - 1 && (
                            <div className={styles.pagePadding} style={{ paddingBottom: '1.5rem', paddingTop: '0', marginTop: 'auto' }}>
                                <div className={styles.pageFooter} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', position: 'relative' }}>
                                    <div className={styles.footerNote}>
                                        DOCUMENTO DE VIAJE OFICIAL<br />
                                        Sujeto a los términos y condiciones estipulados. Valide la información antes de su viaje.
                                    </div>

                                    {/* Signature fixed on bottom right */}
                                    <div className={styles.printSignature}>
                                        <img src="/images/footer_signature_v2.jpg" alt="Signature" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className={styles.actions}>
                <button className={styles.btnBack} onClick={() => router.back()}>
                    <ChevronLeft size={20} /> Volver
                </button>
                {isEditing && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'var(--bg-card)', padding: '0.4rem 1rem',
                        borderRadius: '99px', border: '1px solid var(--border-color)'
                    }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {showPrice ? <DollarSign size={16} /> : <EyeOff size={16} />}
                            Precio Visible
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowPrice(!showPrice)}
                            style={{
                                width: '40px', height: '22px', borderRadius: '11px',
                                border: 'none', cursor: 'pointer', position: 'relative',
                                background: showPrice ? 'var(--primary-color)' : 'rgba(255,255,255,0.2)',
                                transition: 'background 0.3s',
                                padding: 0,
                                marginLeft: '8px'
                            }}
                        >
                            <div style={{
                                width: '16px', height: '16px', borderRadius: '50%',
                                background: 'white',
                                position: 'absolute', top: '3px',
                                left: showPrice ? '21px' : '3px',
                                transition: 'left 0.3s',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                            }} />
                        </button>
                    </div>
                )}
                <button
                    className={`${styles.btnEdit} ${isEditing ? styles.active : ''}`}
                    onClick={handleToggleEdit}
                >
                    <Pencil size={18} /> {isEditing ? 'Guardar y Listo' : 'Editar'}
                </button>
                <button className={styles.btnDownload} onClick={() => {
                    if (isEditing) handleToggleEdit().then(() => setTimeout(() => window.print(), 300));
                    else setTimeout(() => window.print(), 100);
                }}>
                    <Download size={20} /> Descargar PDF
                </button>
            </div>
        </>
    );
}
