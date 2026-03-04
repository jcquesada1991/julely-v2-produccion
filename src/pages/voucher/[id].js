import { useRouter } from 'next/router';
import Head from 'next/head';
import { useApp } from '@/context/AppContext';
import styles from '@/styles/Voucher.module.css';
import { useEffect, useState } from 'react';
import { Download, ChevronLeft, Calendar, CheckSquare, FileText, MapPin, Pencil, Plus, X, User, Globe, CreditCard, ArrowUp, ArrowDown, DollarSign, Eye, EyeOff, Hash, Users, Building, Phone, AlignLeft } from 'lucide-react';

export default function Voucher() {
    const router = useRouter();
    const { id, edit } = router.query;
    const { getSaleDetails, clients, users, updateSale } = useApp();
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

    const defaultTerms = `Términos y Condiciones:\nImay LLC H/N/C Julely actúa solamente como intermediario entre los clientes y proveedores de servicio, líneas aéreas, hoteles, transportistas,\nguías, entre otros. Por tanto, no se hace responsable en caso de accidentes, pérdidas, demoras, daños, heridas, cambios de itinerario,\ncancelaciones de vuelos, enfermedad, actos de guerra, huelgas, actos de la naturaleza, robos, cuarentenas, accidentes, pandemias, epidemias\ny/u otros fuera de su control, antes, durante y después de su viaje o relacionadas al mismo. Cualquier reclamación por accidente, robos u\notros incidentes sufridos deberá ser sometido a la compañía que efectúa dicho servicio y será tramitada por este de acuerdo con la legislación\nque esté vigente en el país donde recibe el servicio.\nLos operadores y Julely se reservan el derecho, de ser necesario, de alterar u omitir cualquier porción del itinerario, sin previo aviso, por\ncualquier razón causada de fuerza mayor. Los servicios no prestados por causa de fuerza mayor no tienen derecho a reembolso. Julely no se\nresponsabiliza por la operación, acto, omisión, robo, accidentes, pandemias, epidemias o sucesos que ocurran antes, durante y después de su\nviaje. Los términos y condiciones de cancelación se encuentran disponibles 24/7 en www.julely.com. Estos pueden ser descargados en\ncualquier momento para su expediente. CLIENTE acepta y reconoce que al enviar el depósito para la reservación acepta los términos y\ncondiciones. RECOMENDAMOS que compre un seguro de viajes para su protección, desde el momento de su depósito.`;

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

            const hotelInfo = data.hotel_info || {};
            const overrides = hotelInfo.client_overrides || {};

            setEditDescription(overrides.description || dest.description_long || dest.subtitle || '');
            setEditTerms(overrides.terms || defaultTerms);
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
    }, [data, clients, users]);

    if (!data) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-primary)', background: 'var(--bg-main)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando Voucher...</div>;
    if (!data.destination) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-primary)', background: 'var(--bg-main)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Destino no encontrado</div>;

    const { destination: dest, voucher_code } = data;

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
    if (editConfirmation || isEditing) hotelInfoItems.push({ label: 'NÚMERO CONFIRMACIÓN', value: editConfirmation, setValue: setEditConfirmation, icon: Hash });

    // Client info items — only show fields that have data
    const clientInfoItems = [];

    const effectivePassport = editPassport;
    const effectiveNationality = editNationality;
    const effectivePhone = editPhone;
    const effectiveEmail = editEmail;

    if (effectivePassport || isEditing) clientInfoItems.push({ label: 'PASAPORTE', value: effectivePassport, setValue: setEditPassport, icon: CreditCard });
    if (effectiveNationality || isEditing) clientInfoItems.push({ label: 'NACIONALIDAD', value: effectiveNationality, setValue: setEditNationality, icon: Globe });
    if (effectivePhone || isEditing) clientInfoItems.push({ label: 'TELÉFONO', value: effectivePhone, setValue: setEditPhone, icon: User });
    if (effectiveEmail || isEditing) clientInfoItems.push({ label: 'EMAIL', value: effectiveEmail, setValue: setEditEmail, icon: User });

    return (
        <>
            <Head>
                <title>Voucher {voucher_code}</title>
            </Head>

            <div className={styles.voucherContainer}>
                {/* --- PAGE 1: COVER & QUICK INFO --- */}
                <div className={styles.voucherPage}>

                    <div className={styles.pagePadding}>
                        {/* 1. Top Header */}
                        <div className={styles.topHeader}>
                            <div className={styles.brandInfo}>
                                <img src="/images/logo.png" className={styles.logoImage} alt="Julely" style={{ height: '200px', objectFit: 'contain' }} />
                            </div>
                            <div className={styles.confirmationBox}>
                                <div className={styles.confLabel}>CONFIRMATION NUMBER</div>
                                <div className={styles.confNumber}>{voucher_code}</div>
                            </div>
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
                                <div className={styles.heroBadge}>Official Voucher</div>
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
                                    <h3>Primary Traveler</h3>
                                </div>
                                <h4 className={styles.travelerName}>
                                    {isEditing ? (
                                        <input className={styles.editInput} value={editClientName} onChange={(e) => setEditClientName(e.target.value)} placeholder="Nombre Cliente" />
                                    ) : (editClientName || "-")}
                                </h4>
                                <p className={styles.travelerSub}>
                                    Passport: {isEditing ? (
                                        <input className={styles.editInput} value={editPassport} onChange={(e) => setEditPassport(e.target.value)} style={{ width: '80px' }} placeholder="..." />
                                    ) : (editPassport || "-")}
                                </p>
                                <div className={styles.cardFooter}>
                                    <div className={styles.cardFooterLabel}>Total Guests</div>
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
                                    <h3>Travel Schedule</h3>
                                </div>
                                <div className={styles.scheduleRow}>
                                    <span className={styles.scheduleLabel}>Dates / Fecha del Viaje</span>
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
                                    <span className={styles.scheduleLabel}>Booking Date / Fecha de Emisión</span>
                                    <span className={styles.scheduleVal}>{formattedDate}</span>
                                </div>
                                <div className={styles.cardFooter}>
                                    <div className={styles.cardFooterLabel}>Agent</div>
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
                                            <h3>Payment Summary</h3>
                                        </div>
                                        <div className={styles.priceLabel}>Total Reservation</div>

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
                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Reservation Confirmed</span>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Extra Mini Info Grid (Optional/Editable fields) */}
                        {(editNationality || editPhone || editEmail || isEditing) && (
                            <div className={styles.extraInfoGrid}>
                                {(editNationality || isEditing) && (
                                    <div className={styles.extraInfoItem}>
                                        <div className={styles.extraIcon}><Globe size={14} /></div>
                                        <div className={styles.extraLabel}>Nationality</div>
                                        <div className={styles.extraVal}>
                                            {isEditing ? <input className={styles.editInput} value={editNationality} onChange={(e) => setEditNationality(e.target.value)} placeholder="..." style={{ textAlign: 'center' }} /> : (editNationality || "-")}
                                        </div>
                                    </div>
                                )}
                                {(editPhone || isEditing) && (
                                    <div className={styles.extraInfoItem}>
                                        <div className={styles.extraIcon}><Phone size={14} /></div>
                                        <div className={styles.extraLabel}>Phone</div>
                                        <div className={styles.extraVal}>
                                            {isEditing ? <input className={styles.editInput} value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="..." style={{ textAlign: 'center' }} /> : (editPhone || "-")}
                                        </div>
                                    </div>
                                )}
                                {(editEmail || isEditing) && (
                                    <div className={styles.extraInfoItem}>
                                        <div className={styles.extraIcon}><User size={14} /></div>
                                        <div className={styles.extraLabel}>Email</div>
                                        <div className={styles.extraVal} style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                                            {isEditing ? <input className={styles.editInput} value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="..." style={{ textAlign: 'center' }} /> : (editEmail || "-")}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Hotel Details Full Width Card */}
                        {(editHotel || isEditing) && (
                            <div className={styles.hotelDetailsBox}>
                                <div className={styles.hotelHeader}>
                                    <div className={styles.hotelIcon}><Building size={20} /></div>
                                    <div>
                                        <h3 className={styles.hotelCatTitle}>Accommodation Details</h3>
                                        <p className={styles.hotelCatSub}>Official Reservation Document</p>
                                    </div>
                                </div>
                                <div className={styles.hotelGrid}>
                                    <div className={styles.hotelCol}>
                                        <div className={styles.hotelItem}>
                                            <div className={styles.hotelItemLabel}>Hotel Name</div>
                                            <div className={styles.hotelItemVal}>
                                                {isEditing ? <input className={styles.editInput} value={editHotel} onChange={(e) => setEditHotel(e.target.value)} placeholder="Nombre del Hotel" /> : (editHotel || "-")}
                                            </div>
                                            <div className={styles.hotelStar}>
                                                {[1, 2, 3, 4, 5].map(s => <span key={s}><svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg></span>)}
                                            </div>
                                        </div>
                                        <div className={styles.hotelItem}>
                                            <div className={styles.hotelItemLabel}>Address</div>
                                            <div className={styles.hotelItemSub}>
                                                {isEditing ? <input className={styles.editInput} value={editHotelAddress} onChange={(e) => setEditHotelAddress(e.target.value)} placeholder="Dirección del Hotel" /> : (editHotelAddress || "-")}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.hotelCol}>
                                        <div className={styles.hotelItem}>
                                            <div className={styles.hotelItemLabel}>Room details (Occupancy)</div>
                                            <div className={styles.hotelItemVal}>
                                                {isEditing ? <input className={styles.editInput} value={editOccupancy} onChange={(e) => setEditOccupancy(e.target.value)} placeholder="Ej: Standard Double (DBL)" /> : (editOccupancy || "-")}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
                                            <div className={styles.hotelItem}>
                                                <div className={styles.hotelItemLabel}>Phone</div>
                                                <div className={styles.hotelItemSub}>
                                                    {isEditing ? <input className={styles.editInput} value={editHotelPhone} onChange={(e) => setEditHotelPhone(e.target.value)} placeholder="Teléfono" /> : (editHotelPhone || "-")}
                                                </div>
                                            </div>
                                            <div className={styles.hotelItem}>
                                                <div className={styles.hotelItemLabel}>Confirmation ID</div>
                                                <div className={styles.hotelItemVal} style={{ color: 'var(--primary-color)' }}>
                                                    {isEditing ? <input className={styles.editInput} value={editConfirmation} onChange={(e) => setEditConfirmation(e.target.value)} placeholder="ID" /> : (editConfirmation || "-")}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div> {/* END PAGE 1 */}

                {/* --- PAGE 2: INCLUDES, DESTINATION & GALLERY --- */}
                {(hasChecklist || hasDescription || (dest.gallery && dest.gallery.length > 0)) && (
                    <div className={styles.voucherPage}>
                        <div className={styles.pagePadding} style={{ paddingTop: '3rem' }}>

                            {/* 3. Checklist */}
                            {hasChecklist && (
                                <div className={styles.sectionBlock}>
                                    <h3 className={styles.sectionTitle}>
                                        <CheckSquare size={20} />
                                        INCLUDES / INCLUYE
                                    </h3>
                                    <div className={styles.checklistGrid}>
                                        {editChecklist.map((item, idx) => (
                                            <div key={idx} className={styles.checkItem}>
                                                {isEditing ? (
                                                    <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '8px' }}>
                                                        <button className={styles.editRemoveBtn} onClick={() => removeChecklistItem(idx)} type="button" title="Eliminar ítem">
                                                            <X size={14} />
                                                        </button>
                                                        <input
                                                            className={styles.editInput}
                                                            value={item}
                                                            onChange={(e) => updateChecklistItem(idx, e.target.value)}
                                                            placeholder="Escribir item..."
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className={styles.customCheck}>✓</div>
                                                        <span>{item}</span>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                        {isEditing && (
                                            <button className={styles.editAddBtn} onClick={addChecklistItem} type="button" style={{ gridColumn: '1 / -1', width: 'max-content' }}>
                                                <Plus size={16} /> Add Item
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 5. Dest Description */}
                            {hasDescription && (
                                <div className={styles.sectionBlock}>
                                    <h3 className={styles.sectionTitle}>
                                        <MapPin size={20} />
                                        ABOUT THE DESTINATION
                                    </h3>
                                    <div className={styles.descriptionText}>
                                        {isEditing ? (
                                            <textarea
                                                className={styles.editTextarea}
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                rows={4}
                                            />
                                        ) : editDescription}
                                    </div>
                                </div>
                            )}
                            {/* Optional Gallery on Page 2 */}
                            {dest.gallery && dest.gallery.length > 0 && (
                                <div className={styles.sectionBlock}>
                                    <h3 className={styles.sectionTitle}>
                                        <MapPin size={20} />
                                        DESTINATION PHOTOS
                                    </h3>
                                    <div className={styles.galleryGrid}>
                                        {dest.gallery.slice(0, 4).map((imgUrl, i) => (
                                            <img key={i} src={imgUrl} className={styles.galleryImg} alt="" />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- PAGE 3: ITINERARY --- */}
                {hasItinerary && (
                    <div className={styles.voucherPage}>
                        <div className={styles.pagePadding} style={{ paddingTop: '3rem' }}>
                            <div className={styles.sectionBlock} style={{ breakInside: 'auto' }}>
                                <h3 className={styles.sectionTitle}>
                                    <Calendar size={20} />
                                    DETAILED ITINERARY
                                </h3>
                                <div className={styles.itineraryList}>
                                    {editItinerary.map((item, idx) => (
                                        <div key={idx} className={styles.itineraryItem}>
                                            <div className={styles.dayBadge}>DAY {item.day || idx + 1}</div>
                                            <div className={styles.itineraryContent}>
                                                <h4 className={styles.itineraryTitle}>{item.name || item.title}</h4>
                                                {item.description && (
                                                    <p className={styles.itineraryDesc}>{item.description}</p>
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
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- PAGE 4: NOTES & TERMS --- */}
                {
                    (hasNotes || hasTerms) && (
                        <div className={styles.voucherPage}>
                            <div className={styles.pagePadding} style={{ paddingTop: '3rem', flex: 1 }}>
                                {/* 8. Additional Notes */}
                                {hasNotes && (
                                    <div className={styles.sectionBlock}>
                                        <h3 className={styles.sectionTitle}>
                                            <AlignLeft size={20} />
                                            ADDITIONAL NOTES
                                        </h3>
                                        <div className={styles.descriptionText} style={{ whiteSpace: 'pre-line' }}>
                                            {isEditing ? (
                                                <textarea
                                                    className={styles.editTextarea}
                                                    value={editNotes}
                                                    onChange={(e) => setEditNotes(e.target.value)}
                                                    rows={4}
                                                    placeholder="Escriba aquí notas adicionales para el cliente..."
                                                />
                                            ) : editNotes}
                                        </div>
                                    </div>
                                )}

                                {/* 9. Terms & Conditions */}
                                {hasTerms && (
                                    <div className={styles.sectionBlock}>
                                        <h3 className={styles.sectionTitle}>
                                            <FileText size={20} />
                                            TERMS & CONDITIONS
                                        </h3>
                                        <div className={styles.termsText}>
                                            {editTerms}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer on Last Page */}
                            <div className={styles.pagePadding} style={{ paddingBottom: '1.5rem', paddingTop: '0' }}>
                                <div className={styles.pageFooter}>
                                    <div className={styles.footerNote}>
                                        * Please present this voucher along with a valid ID at check-in. Cancellations must be made 72 hours prior to arrival to avoid penalties. Thank you for choosing Julely Viajando por el Mundo.
                                    </div>
                                    <div className={styles.footerContact}>
                                        <div className={styles.footerContactLabel}>Support</div>
                                        <div className={styles.footerContactEmail}>support@julely.com</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Signature fixed on bottom right */}
                <div className={styles.printSignature}>
                    <img src="/images/footer_signature_v2.jpg" alt="Signature" />
                </div>
            </div >

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
