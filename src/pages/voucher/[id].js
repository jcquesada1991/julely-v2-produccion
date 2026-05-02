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
    const [editHotels, setEditHotels] = useState([]);
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

            // Support both new (hotels array) and legacy (flat fields) format
            const firstHotel = Array.isArray(hotelInfo.hotels) && hotelInfo.hotels.length > 0
                ? hotelInfo.hotels[0]
                : hotelInfo;
            setEditHotel(firstHotel.hotel_name || '');
            setEditHotelAddress(firstHotel.hotel_address || '');
            setEditHotelPhone(firstHotel.hotel_phone || '');
            setEditOccupancy(firstHotel.occupancy || '');
            setEditConfirmation(hotelInfo.confirmation_id || '');
            setEditHotels(Array.isArray(hotelInfo.hotels) ? hotelInfo.hotels : (hotelInfo.hotel_name ? [{ hotel_name: hotelInfo.hotel_name, hotel_address: hotelInfo.hotel_address || '', hotel_phone: hotelInfo.hotel_phone || '', occupancy: hotelInfo.occupancy || '' }] : []));

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
        const isBig = (item) => item && (!!item.image || item.images?.length > 0 || (item.description || '').length > 200);
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
                hotels: editHotels.length > 0 ? editHotels : undefined,
                hotel_name: editHotels[0]?.hotel_name ?? editHotel,
                hotel_address: editHotels[0]?.hotel_address ?? editHotelAddress,
                hotel_phone: editHotels[0]?.hotel_phone ?? editHotelPhone,
                occupancy: editHotels[0]?.occupancy ?? editOccupancy,
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
    // ============== HELPERS V2 ==============
    const formatDateLong = (d) => {
        if (!d) return '—';
        const date = new Date(`${d}T12:00:00`);
        const day = date.getDate().toString().padStart(2, '0');
        const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} · ${month} · ${year}`;
    };

    const tripDays = (() => {
        if (editTravelDate && editReturnDate) {
            const d1 = new Date(editTravelDate);
            const d2 = new Date(editReturnDate);
            const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
            return diff > 0 ? diff : null;
        }
        return null;
    })();
    const tripNights = tripDays ? tripDays - 1 : null;

    const tripLabel = (() => {
        const parts = [];
        if (data.num_adults > 1 || (data.num_children || 0) > 0) parts.push('VIAJE GRUPAL');
        else parts.push('VIAJE INDIVIDUAL');
        if (tripDays) parts.push(`${tripDays} DÍAS / ${tripNights} NOCHES`);
        return parts.join(' · ');
    })();

    // Asesor data — siempre del profile registrado en BD (no editable manualmente)
    // Prioridad: assigned_to (UUID asesor asignado) → created_by (UUID creador) → prepared_by (texto fallback)
    const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(v);
    const asesorIdCandidates = [data.assigned_to, data.created_by, data.prepared_by].filter(Boolean);
    const asesorUuid = asesorIdCandidates.find(isUuid);
    const asesorProfile = asesorUuid ? users?.find(u => String(u.id) === String(asesorUuid)) : null;
    // Fallback name si no hay profile: prepared_by string si existe, o "Julely Travels"
    const preparedByText = asesorIdCandidates.find(v => typeof v === 'string' && !isUuid(v));
    const asesorName = asesorProfile?.full_name || preparedByText || 'Julely Travels';
    const asesorEmail = asesorProfile?.email || '';
    const asesorRole = asesorProfile?.role || 'Asesor';
    const asesorInitials = (asesorName || 'J').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();

    const destTitleClean = (dest.title || '').replace(/\s*\(Eliminado\)\s*$/, '').trim();

    // Smart chunking V2: pack ~4 units per page (big day = 2 units, compact day = 1)
    const isBigDay = (item) => item && (!!item.image || (item.images && item.images.length > 0) || (item.description || '').length > 280);
    const buildItineraryPagesV2 = (items) => {
        const pages = [];
        let current = [];
        let used = 0;
        const MAX = 4;
        for (const d of items) {
            const cost = isBigDay(d) ? 2 : 1;
            if (used + cost > MAX && current.length > 0) {
                pages.push(current);
                current = [d];
                used = cost;
            } else {
                current.push(d);
                used += cost;
            }
        }
        if (current.length > 0) pages.push(current);
        return pages.length > 0 ? pages : [[]];
    };
    const itineraryPagesV2 = hasItinerary ? buildItineraryPagesV2(editItinerary) : [];

    const renderImageBlock = (item) => {
        if (item.images && item.images.length > 1) {
            return (
                <div className={styles.dayImageStack}>
                    {item.images.slice(0, 2).map((img, i) => (
                        <img key={i} src={img.url || img} alt={item.name || item.title} />
                    ))}
                </div>
            );
        }
        const url = item.image || (item.images && item.images[0]?.url);
        return url ? <img className={styles.dayImage} src={url} alt={item.name || item.title} /> : null;
    };

    // Total pages count for footer numbering
    const totalPages = 1 + 1 + itineraryPagesV2.length + (hasNotes ? displayedNotesPages.length : 0) + displayedTermsPages.length;
    let pageCounter = { n: 0 };
    const nextPageNum = () => { pageCounter.n += 1; return pageCounter.n; };

    return (
        <>
            <Head>
                <title>Voucher {voucher_code}</title>
            </Head>

            <div className={styles.voucherContainer}>

                {/* ============== PAGE 1 — COVER ============== */}
                <div className={`${styles.voucherPage} ${styles.coverPage}`}>
                    {(() => { nextPageNum(); return null; })()}
                    <div className={styles.coverHero}>
                        <img
                            src={dest.hero_image_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2670&auto=format&fit=crop'}
                            alt={destTitleClean}
                        />
                        <div className={styles.coverBrand}>
                            <img src="/images/logo_transparent.png" alt="Julely" />
                        </div>
                        <div className={styles.coverMeta}>
                            <div className={styles.coverBadge}>VOUCHER OFICIAL</div>
                            <div className={styles.coverCode}>{voucher_code}</div>
                        </div>
                        <div className={styles.coverText}>
                            <div className={styles.coverLabel}>{tripLabel}</div>
                            <h1 className={styles.coverTitle}>{destTitleClean}.</h1>
                            {dest.subtitle && <div className={styles.coverSubtitle}>{dest.subtitle}</div>}
                        </div>
                    </div>

                    <div className={`${styles.coverInfoStrip} ${!showPrice ? styles.noPrice : ''}`}>
                        <div className={styles.infoBlock}>
                            <div className={styles.label}>VIAJERO PRINCIPAL</div>
                            <div className={styles.value}>
                                {isEditing
                                    ? <input className={styles.editInput} value={editClientName} onChange={(e) => setEditClientName(e.target.value)} placeholder="Nombre del viajero" />
                                    : (editClientName || '—')}
                            </div>
                            <div className={styles.sub}>
                                {editAdults} Adulto(s){editChildren > 0 ? `, ${editChildren} Menor(es)` : ''}{editOccupancy ? ` · ${editOccupancy}` : ''}
                            </div>
                        </div>
                        <div className={styles.infoBlock}>
                            <div className={styles.label}>FECHA DE SALIDA</div>
                            <div className={styles.value}>
                                {isEditing
                                    ? <input type="date" className={styles.editInput} value={editTravelDate} onChange={(e) => setEditTravelDate(e.target.value)} />
                                    : formatDateLong(editTravelDate)}
                            </div>
                            <div className={styles.sub}>{tripDays ? `${tripDays} días / ${tripNights} noches` : 'Duración por confirmar'}</div>
                        </div>
                        <div className={styles.infoBlock}>
                            <div className={styles.label}>EMITIDO EL</div>
                            <div className={styles.value}>{formattedDate}</div>
                            <div className={styles.sub}>Reserva confirmada</div>
                        </div>
                        {showPrice && (
                            <div className={styles.infoBlock}>
                                <div className={styles.label}>RESERVA TOTAL</div>
                                <div className={`${styles.value} ${styles.priceVal}`}>
                                    {isEditing
                                        ? <span>$<input className={styles.editInput} value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ width: '90px', display: 'inline-block' }} /></span>
                                        : `$${Number(editPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                                </div>
                                <div className={styles.sub}>USD · {isEditing ? 'Editable' : 'Confirmada'}</div>
                            </div>
                        )}
                    </div>

                    <div className={styles.coverBody}>
                        <div className={styles.coverSection}>
                            <h3>Datos del pasajero</h3>
                            <div className={styles.personalGrid}>
                                <div className={styles.personalItem}>
                                    <div className={styles.lbl}>Pasaporte</div>
                                    <div className={styles.val}>
                                        {isEditing
                                            ? <input className={styles.editInput} value={editPassport} onChange={(e) => setEditPassport(e.target.value)} />
                                            : (editPassport || '—')}
                                    </div>
                                </div>
                                <div className={styles.personalItem}>
                                    <div className={styles.lbl}>Nacionalidad</div>
                                    <div className={styles.val}>
                                        {isEditing
                                            ? <input className={styles.editInput} value={editNationality} onChange={(e) => setEditNationality(e.target.value)} />
                                            : (editNationality || '—')}
                                    </div>
                                </div>
                                <div className={styles.personalItem}>
                                    <div className={styles.lbl}>Teléfono</div>
                                    <div className={styles.val}>
                                        {isEditing
                                            ? <input className={styles.editInput} value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                                            : (editPhone || '—')}
                                    </div>
                                </div>
                                <div className={styles.personalItem}>
                                    <div className={styles.lbl}>Email</div>
                                    <div className={`${styles.val} ${styles.valEmail}`}>
                                        {isEditing
                                            ? <input className={styles.editInput} value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                                            : (editEmail || '—')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.coverSection}>
                            <h3>Asesor de viaje</h3>
                            <div className={styles.asesorCard}>
                                <div className={styles.asesorAvatar}>{asesorInitials}</div>
                                <div className={styles.asesorInfo}>
                                    <div className={styles.asesorTopLabel}>PREPARADO POR</div>
                                    <div className={styles.asesorName}>{asesorName}</div>
                                    <div className={styles.asesorMeta}>
                                        {asesorRole}{asesorEmail ? ` · ${asesorEmail}` : ''}
                                    </div>
                                </div>
                            </div>
                            {isEditing && (
                                <div style={{ fontSize: '9px', color: 'var(--ink-soft)', marginTop: '6px', fontStyle: 'italic', textAlign: 'right' }}>
                                    El asesor se asigna automáticamente del usuario que crea la venta · No editable
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.coverFooterStrip}>
                        <div><strong>JULELY TRAVELS</strong> &nbsp;·&nbsp; info@julely.com &nbsp;·&nbsp; 939-525-0701 &nbsp;·&nbsp; www.julelyapp.com</div>
                        <div>Pág. 1 / {totalPages}</div>
                    </div>
                </div>

                {/* ============== PAGE 2 — DETAILS ============== */}
                {(editHotels.length > 0 || editHotel || hasChecklist || hasDescription) && (
                    <div className={styles.voucherPage}>
                        {(() => { nextPageNum(); return null; })()}
                        <div className={styles.pageHeader}>
                            <img src="/images/logo_transparent.png" alt="Julely" />
                            <div className={styles.voucherIdLabel}>VOUCHER &nbsp;<strong>{voucher_code}</strong></div>
                        </div>

                        {(editHotels.length > 0 || editHotel) && (
                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>Su alojamiento</div>
                                <div className={styles.sectionSubtitle}>{editHotels.length > 1 ? 'Hoteles reservados' : 'Hotel reservado'}</div>
                                {editHotels.length > 0 ? editHotels.map((h, hIdx) => (
                                    <div key={hIdx} className={styles.hotelCard}>
                                        <div className={styles.hotelName}>{h.hotel_name || 'Hotel por confirmar'}</div>
                                        <div className={styles.hotelTag}>{editHotels.length > 1 ? `Alojamiento ${hIdx + 1} · ` : ''}Información oficial para su check-in</div>
                                        <div className={styles.hotelGrid}>
                                            {h.hotel_address && <div className={styles.hotelItem}><div className={styles.lbl}>Dirección</div><div className={styles.val}>{h.hotel_address}</div></div>}
                                            {h.hotel_phone && <div className={styles.hotelItem}><div className={styles.lbl}>Teléfono</div><div className={styles.val}>{h.hotel_phone}</div></div>}
                                            {h.occupancy && <div className={styles.hotelItem}><div className={styles.lbl}>Ocupación</div><div className={styles.val}>{h.occupancy}</div></div>}
                                            {hIdx === 0 && editConfirmation && <div className={styles.hotelItem}><div className={styles.lbl}>Confirmación interna</div><div className={styles.val}>{editConfirmation}</div></div>}
                                            {hIdx === 0 && voucher_code && <div className={styles.hotelItem}><div className={styles.lbl}>Voucher</div><div className={styles.val}>{voucher_code}</div></div>}
                                        </div>
                                    </div>
                                )) : (
                                    <div className={styles.hotelCard}>
                                        <div className={styles.hotelName}>{editHotel || 'Hotel por confirmar'}</div>
                                        <div className={styles.hotelTag}>Información oficial para su check-in</div>
                                        <div className={styles.hotelGrid}>
                                            {editHotelAddress && <div className={styles.hotelItem}><div className={styles.lbl}>Dirección</div><div className={styles.val}>{editHotelAddress}</div></div>}
                                            {editHotelPhone && <div className={styles.hotelItem}><div className={styles.lbl}>Teléfono</div><div className={styles.val}>{editHotelPhone}</div></div>}
                                            {editOccupancy && <div className={styles.hotelItem}><div className={styles.lbl}>Ocupación</div><div className={styles.val}>{editOccupancy}</div></div>}
                                            {editConfirmation && <div className={styles.hotelItem}><div className={styles.lbl}>Confirmación interna</div><div className={styles.val}>{editConfirmation}</div></div>}
                                            {voucher_code && <div className={styles.hotelItem}><div className={styles.lbl}>Voucher</div><div className={styles.val}>{voucher_code}</div></div>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {hasChecklist && (
                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>Qué incluye su viaje</div>
                                <div className={styles.sectionSubtitle}>Servicios cubiertos por el paquete</div>
                                <div className={styles.includesGrid}>
                                    {editChecklist.map((item, idx) => (
                                        <div key={idx} className={styles.includeItem}>
                                            <div className={styles.includeCheck}>✓</div>
                                            <div style={{ flex: 1 }}>
                                                {isEditing ? (
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <input className={styles.editInput} value={item} onChange={(e) => updateChecklistItem(idx, e.target.value)} />
                                                        <button className={styles.editRemoveBtn} onClick={() => removeChecklistItem(idx)} type="button">✖</button>
                                                    </div>
                                                ) : item}
                                            </div>
                                        </div>
                                    ))}
                                    {isEditing && (
                                        <button className={styles.editAddBtn} onClick={addChecklistItem} type="button" style={{ gridColumn: '1 / -1' }}>+ Añadir ítem</button>
                                    )}
                                </div>
                            </div>
                        )}

                        {hasDescription && (
                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>Sobre {destTitleClean}</div>
                                <div className={styles.sectionSubtitle}>El destino que la espera</div>
                                <div className={styles.destinationText}>
                                    {isEditing
                                        ? <textarea className={styles.editTextarea} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={6} />
                                        : editDescription}
                                </div>
                            </div>
                        )}

                        <div className={styles.pageFooter}>
                            <div className={styles.legalLine}><span className={styles.brandName}>Julely Travels</span> · Documento oficial sujeto a términos y condiciones.</div>
                            <div className={styles.pageNum}>Pág. {pageCounter.n} / {totalPages}</div>
                        </div>
                    </div>
                )}

                {/* ============== ITINERARY PAGES ============== */}
                {hasItinerary && itineraryPagesV2.map((pageItems, pageIdx) => (
                    <div key={`itinerary-${pageIdx}`} className={styles.voucherPage}>
                        {(() => { nextPageNum(); return null; })()}
                        <div className={styles.pageHeader}>
                            <img src="/images/logo_transparent.png" alt="Julely" />
                            <div className={styles.voucherIdLabel}>VOUCHER &nbsp;<strong>{voucher_code}</strong></div>
                        </div>

                        {pageIdx === 0 && (
                            <div className={styles.section} style={{ marginBottom: '14px' }}>
                                <div className={styles.sectionTitle}>Itinerario detallado</div>
                                <div className={styles.sectionSubtitle}>Su viaje día por día</div>
                            </div>
                        )}

                        {pageItems.map((item) => {
                            const realIdx = editItinerary.indexOf(item);
                            const dayNum = item.day || (realIdx + 1);
                            const dayNumStr = String(dayNum).padStart(2, '0');
                            const big = isBigDay(item);
                            const hasImg = !!item.image || (item.images && item.images.length > 0);

                            if (!big) {
                                // COMPACT
                                return (
                                    <div key={realIdx} className={`${styles.itineraryDay} ${styles.compact}`}>
                                        <div className={styles.dayTextBlock}>
                                            <div className={styles.dayBadge}><span className={styles.dayNum}>{dayNumStr}</span> &nbsp; DÍA</div>
                                            {isEditing ? (
                                                <input
                                                    className={styles.editInput}
                                                    value={item.name || item.title || ''}
                                                    onChange={(e) => {
                                                        const upd = [...editItinerary];
                                                        upd[realIdx] = { ...upd[realIdx], name: e.target.value };
                                                        setEditItinerary(upd);
                                                    }}
                                                    style={{ flex: 1 }}
                                                />
                                            ) : (
                                                <div className={styles.dayTitleInline}>{item.name || item.title}</div>
                                            )}
                                            {!isEditing && (
                                                <div className={styles.dayDescInline}>{item.description || 'Día de tránsito.'}</div>
                                            )}
                                            {isEditing && (
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button className={styles.editRemoveBtn} onClick={() => moveItineraryItemUp(realIdx)} disabled={realIdx === 0} type="button" style={{ opacity: realIdx === 0 ? 0.3 : 1 }}><ArrowUp size={14} /></button>
                                                    <button className={styles.editRemoveBtn} onClick={() => moveItineraryItemDown(realIdx)} disabled={realIdx === editItinerary.length - 1} type="button" style={{ opacity: realIdx === editItinerary.length - 1 ? 0.3 : 1 }}><ArrowDown size={14} /></button>
                                                    <button className={styles.editRemoveBtn} onClick={() => removeItineraryItem(realIdx)} type="button"><X size={14} /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            // BIG DAY (with or without image)
                            return (
                                <div key={realIdx} className={`${styles.itineraryDay} ${!hasImg ? styles.noImage : ''}`}>
                                    {hasImg && renderImageBlock(item)}
                                    <div className={styles.dayTextBlock}>
                                        <div className={styles.dayBadge}><span className={styles.dayNum}>{dayNumStr}</span> &nbsp; DÍA</div>
                                        {isEditing ? (
                                            <>
                                                <input
                                                    className={styles.editInput}
                                                    value={item.name || item.title || ''}
                                                    onChange={(e) => {
                                                        const upd = [...editItinerary];
                                                        upd[realIdx] = { ...upd[realIdx], name: e.target.value };
                                                        setEditItinerary(upd);
                                                    }}
                                                    style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}
                                                />
                                                <textarea
                                                    className={styles.editTextarea}
                                                    value={item.description || ''}
                                                    onChange={(e) => {
                                                        const upd = [...editItinerary];
                                                        upd[realIdx] = { ...upd[realIdx], description: e.target.value };
                                                        setEditItinerary(upd);
                                                    }}
                                                    rows={4}
                                                />
                                                <div className={styles.dayEditControls}>
                                                    <button className={styles.editRemoveBtn} onClick={() => moveItineraryItemUp(realIdx)} disabled={realIdx === 0} type="button"><ArrowUp size={14} /></button>
                                                    <button className={styles.editRemoveBtn} onClick={() => moveItineraryItemDown(realIdx)} disabled={realIdx === editItinerary.length - 1} type="button"><ArrowDown size={14} /></button>
                                                    <button className={styles.editRemoveBtn} onClick={() => removeItineraryItem(realIdx)} type="button"><X size={14} /></button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className={styles.dayTitle}>{item.name || item.title}</div>
                                                {item.description && <div className={styles.dayDesc}>{item.description}</div>}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {isEditing && pageIdx === itineraryPagesV2.length - 1 && (
                            <div style={{ marginTop: '14px' }}>
                                <select className={styles.editInput} value="" onChange={handleAddExcursion} style={{ padding: '8px', cursor: 'pointer' }}>
                                    <option value="">+ Añadir Día / Excursión...</option>
                                    {availableExcursions.map(exc => (
                                        <option key={exc.id} value={exc.id}>{exc.name}</option>
                                    ))}
                                    <option value="custom">Día Libre / Personalizado</option>
                                </select>
                            </div>
                        )}

                        <div className={styles.pageFooter}>
                            <div className={styles.legalLine}><span className={styles.brandName}>Julely Travels</span> · Documento oficial sujeto a términos y condiciones.</div>
                            <div className={styles.pageNum}>Pág. {pageCounter.n} / {totalPages}</div>
                        </div>
                    </div>
                ))}

                {/* ============== NOTES PAGES ============== */}
                {hasNotes && displayedNotesPages.map((pageText, pageIdx) => (
                    <div key={`notes-${pageIdx}`} className={styles.voucherPage}>
                        {(() => { nextPageNum(); return null; })()}
                        <div className={styles.pageHeader}>
                            <img src="/images/logo_transparent.png" alt="Julely" />
                            <div className={styles.voucherIdLabel}>VOUCHER &nbsp;<strong>{voucher_code}</strong></div>
                        </div>

                        {pageIdx === 0 && (
                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>Notas adicionales</div>
                                <div className={styles.sectionSubtitle}>Información para su viaje</div>
                            </div>
                        )}

                        <div className={styles.notesText}>
                            {isEditing && pageIdx === 0 ? (
                                <textarea className={styles.editTextarea} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={14} placeholder="Notas adicionales para el cliente..." />
                            ) : (!isEditing || pageIdx > 0 ? pageText : null)}
                        </div>

                        <div className={styles.pageFooter}>
                            <div className={styles.legalLine}><span className={styles.brandName}>Julely Travels</span> · Documento oficial sujeto a términos y condiciones.</div>
                            <div className={styles.pageNum}>Pág. {pageCounter.n} / {totalPages}</div>
                        </div>
                    </div>
                ))}

                {/* ============== TERMS PAGES ============== */}
                {hasTerms && displayedTermsPages.map((pageText, pageIdx) => {
                    const isLast = pageIdx === displayedTermsPages.length - 1;
                    return (
                        <div key={`terms-${pageIdx}`} className={styles.voucherPage}>
                            {(() => { nextPageNum(); return null; })()}
                            <div className={styles.pageHeader}>
                                <img src="/images/logo_transparent.png" alt="Julely" />
                                <div className={styles.voucherIdLabel}>VOUCHER &nbsp;<strong>{voucher_code}</strong></div>
                            </div>

                            {pageIdx === 0 && (
                                <>
                                    <div className={styles.section} style={{ marginBottom: '6px' }}>
                                        <div className={styles.sectionTitle}>Términos y condiciones</div>
                                        <div className={styles.sectionSubtitle}>Léalos detenidamente antes de su viaje</div>
                                    </div>
                                    <div className={styles.termsEditNote}>[Términos editables desde Configuración → Términos y condiciones]</div>
                                </>
                            )}

                            <div className={styles.termsText}>
                                {isEditing && pageIdx === 0 ? (
                                    <textarea className={styles.editTextarea} value={editTerms} onChange={(e) => setEditTerms(e.target.value)} rows={28} style={{ height: '600px', columnCount: 1 }} />
                                ) : (
                                    !isEditing || pageIdx > 0 ? pageText.split('\n').filter(l => l.trim()).map((line, i) => (
                                        <p key={i}>{line}</p>
                                    )) : null
                                )}
                            </div>

                            {isLast && (
                                <div className={styles.signatureBlock}>
                                    <div className={styles.docNote}>
                                        Documento de viaje oficial.<br />
                                        Sujeto a los términos y condiciones estipulados.<br />
                                        Valide la información antes de su viaje.
                                        <span className={styles.legalName}>Imay LLC H/N/C Julely · Razón social</span>
                                    </div>
                                    <div className={styles.signWrap}>
                                        <img src="/images/footer_signature_v2.jpg" alt="Firma Julely" />
                                        <div className={styles.signLabel}>Julely Travels</div>
                                    </div>
                                </div>
                            )}

                            <div className={styles.pageFooter}>
                                <div className={styles.legalLine}><span className={styles.brandName}>Julely Travels</span> · Imay LLC H/N/C Julely · 939-525-0701 · info@julely.com</div>
                                <div className={styles.pageNum}>Pág. {pageCounter.n} / {totalPages}</div>
                            </div>
                        </div>
                    );
                })}

            </div>

            {/* ============== ACTION BAR ============== */}
            <div className={styles.actions}>
                <button className={styles.btnBack} onClick={() => router.back()}>
                    <ChevronLeft size={18} /> Volver
                </button>
                {isEditing && (
                    <button className={styles.btnPrice} type="button" onClick={() => setShowPrice(!showPrice)}>
                        {showPrice ? <Eye size={16} /> : <EyeOff size={16} />}
                        Precio: {showPrice ? 'Visible' : 'Oculto'}
                    </button>
                )}
                <button className={`${styles.btnEdit} ${isEditing ? styles.active : ''}`} onClick={handleToggleEdit}>
                    <Pencil size={18} /> {isEditing ? 'Guardar y Listo' : 'Editar'}
                </button>
                <button className={styles.btnDownload} onClick={() => {
                    if (isEditing) handleToggleEdit().then(() => setTimeout(() => window.print(), 300));
                    else setTimeout(() => window.print(), 100);
                }}>
                    <Download size={18} /> Descargar PDF
                </button>
            </div>
        </>
    );
}
