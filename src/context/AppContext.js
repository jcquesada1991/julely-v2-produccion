import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useNotification } from './NotificationContext';

const AppContext = createContext();

export function AppProvider({ children }) {
    const { showNotification } = useNotification();

    // ─── STATE ────────────────────────────────────────────────────────
    const [destinations, setDestinations] = useState([]);
    const [sales, setSales] = useState([]);
    const [salesPage, setSalesPage] = useState(0);
    const [hasMoreSales, setHasMoreSales] = useState(true);

    const [users, setUsers] = useState([]);
    
    const [clients, setClients] = useState([]);
    const [clientsPage, setClientsPage] = useState(0);
    const [hasMoreClients, setHasMoreClients] = useState(true);
    
    const PAGE_SIZE = 200;
    const [itineraries, setItineraries] = useState([]);
    const [systemSettings, setSystemSettings] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    // Ref para las imágenes de destinos (para que el realtime las use)
    const destImagesRef = useRef({});
    const isLoadingMoreSalesRef = useRef(false);
    const isLoadingMoreClientsRef = useRef(false);

    // ─── HELPERS DE NORMALIZACIÓN ─────────────────────────────────────
    const normalizeBooking = useCallback((s) => ({
        ...s,
        date: s.booking_date || s.created_at,
        created_by: s.assigned_to,
        status: s.status === 'confirmada' ? 'Confirmada'
            : s.status === 'pendiente' ? 'Pendiente'
                : s.status === 'cancelada' ? 'Cancelada'
                    : 'Completada',
    }), []);

    const normalizeProfile = useCallback((u) => ({
        ...u,
        name: u.full_name ? u.full_name.split(' ')[0] : '',
        surname: u.full_name ? u.full_name.split(' ').slice(1).join(' ') : '',
        role: {
            admin: 'Administrador',
            asesor: 'Asesor de Ventas',
            supervisor: 'Supervisor',
            contabilidad: 'Contabilidad',
            operaciones: 'Operaciones',
        }[u.role] || u.role,
    }), []);

    const normalizeDestination = useCallback((d) => ({
        ...d,
        isPremium: d.is_premium,
        isFavorite: false,
        images: destImagesRef.current[d.id] || [],
    }), []);

    const ensureSession = async () => {
        try {
            // Helper function to manage timeouts for auth checks
            const withTimeout = (promise, ms = 15000) => {
                let timeoutId;
                const timeoutPromise = new Promise((_, reject) => {
                    timeoutId = setTimeout(() => reject(new Error('Timeout de conexión con el servidor')), ms);
                });
                return Promise.race([promise, timeoutPromise]).finally(() => {
                    clearTimeout(timeoutId);
                });
            };

            // Intentar obtener sesión actual usando getSession (maneja auto-refresh localmente de forma segura)
            const { data: { session }, error: sessionErr } = await withTimeout(supabase.auth.getSession());
            
            if (sessionErr) throw sessionErr;

            if (!session) {
                throw new Error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
            }
            return true;
        } catch (error) {
            console.error('Error en validación de sesión:', error);
            const msg = error.message || 'Error de conexión';
            showNotification(msg, 'error');
            throw error; // Re-lanzar para que el CRUD sepa que falló
        }
    };

    // ─── LOAD ALL DATA (on mount) ─────────────────────────────────────
    const loadAll = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const [
                { data: destData, error: destErr },
                { data: salesData, error: salesErr },
                { data: usersData, error: usersErr },
                { data: clientsData, error: clientsErr },
                { data: activData, error: activErr },
                { data: destImgData, error: destImgErr },
                { data: settingsData, error: settingsErr },
            ] = await Promise.all([
                supabase.from('destinations').select('*').order('created_at', { ascending: false }).limit(200),
                supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(200),
                supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100),
                // JOIN con client_identity para traer nationality
                supabase.from('clients').select('*, client_identity(nationality)').order('created_at', { ascending: false }).limit(200),
                supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(200),
                supabase.from('destination_images').select('*').order('display_order', { ascending: true }),
                supabase.from('settings').select('*'),
            ]);

            if (destErr) console.error('Error cargando destinos:', destErr);
            if (salesErr) console.error('Error cargando ventas:', salesErr);
            if (usersErr) console.error('Error cargando usuarios:', usersErr);
            if (clientsErr) console.error('Error cargando clientes:', clientsErr);
            if (activErr) console.error('Error cargando actividades:', activErr);
            if (destImgErr) console.error('Error cargando imágenes de destinos:', destImgErr);
            if (settingsErr) console.error('Error cargando settings:', settingsErr);

            // Agrupar imágenes por destination_id
            const imagesByDest = {};
            (destImgData || []).forEach(img => {
                if (!imagesByDest[img.destination_id]) imagesByDest[img.destination_id] = [];
                imagesByDest[img.destination_id].push(img);
            });
            destImagesRef.current = imagesByDest;

            // Normalize destinations (include gallery images)
            setDestinations((destData || []).map(d => ({
                ...d,
                isPremium: d.is_premium,
                isFavorite: false,
                images: imagesByDest[d.id] || [],
            })));


            // Normalize bookings
            setSales((salesData || []).map(normalizeBooking));
            setSalesPage(0);
            setHasMoreSales(salesData?.length === 200);

            // Normalize profiles
            setUsers((usersData || []).map(normalizeProfile));

            // Normalize clients — aplanar client_identity al nivel raíz
            setClientsPage(0);
            setHasMoreClients(clientsData?.length === 200);
            setClients((clientsData || []).map(c => {
                const identity = Array.isArray(c.client_identity) ? c.client_identity[0] : c.client_identity;
                return {
                    ...c,
                    nationality: identity?.nationality || c.nationality || '',
                    registration_date: c.booking_date || '', // Map booking_date to registration_date in UI
                };
            }));

            // Normalize activities
            setItineraries((activData || []).map(a => ({
                ...a,
                image: a.image_url,
            })));

            const settingsMap = {};
            (settingsData || []).forEach(s => {
                settingsMap[s.key] = s.value;
            });
            setSystemSettings(settingsMap);
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [normalizeBooking, normalizeProfile]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    // ─── SUPABASE REALTIME SUBSCRIPTIONS ─────────────────────────────
    useEffect(() => {
        // Suscripción a bookings (ventas)
        const bookingsChannel = supabase
            .channel('realtime-bookings')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, (payload) => {
                setSales(prev => {
                    if (prev.find(s => String(s.id) === String(payload.new.id))) return prev;
                    return [normalizeBooking(payload.new), ...prev];
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, (payload) => {
                setSales(prev => prev.map(s => String(s.id) === String(payload.new.id) ? normalizeBooking(payload.new) : s));
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bookings' }, (payload) => {
                setSales(prev => prev.filter(s => String(s.id) !== String(payload.old.id)));
            })
            .subscribe();

        // Suscripción a destinations
        const destinationsChannel = supabase
            .channel('realtime-destinations')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'destinations' }, (payload) => {
                setDestinations(prev => {
                    if (prev.find(d => String(d.id) === String(payload.new.id))) return prev;
                    return [normalizeDestination(payload.new), ...prev];
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'destinations' }, (payload) => {
                setDestinations(prev => prev.map(d => String(d.id) === String(payload.new.id)
                    ? { ...normalizeDestination(payload.new), images: d.images || [] }
                    : d));
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'destinations' }, (payload) => {
                setDestinations(prev => prev.filter(d => String(d.id) !== String(payload.old.id)));
            })
            .subscribe();

        // Suscripción a clients
        const clientsChannel = supabase
            .channel('realtime-clients')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clients' }, (payload) => {
                setClients(prev => {
                    if (prev.find(c => String(c.id) === String(payload.new.id))) return prev;
                    return [{ ...payload.new, nationality: '', registration_date: payload.new.booking_date || '' }, ...prev];
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clients' }, (payload) => {
                setClients(prev => prev.map(c => String(c.id) === String(payload.new.id)
                    ? { ...c, ...payload.new, nationality: c.nationality || '', registration_date: payload.new.booking_date || '' }
                    : c));
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'clients' }, (payload) => {
                setClients(prev => prev.filter(c => String(c.id) !== String(payload.old.id)));
            })
            .subscribe();

        // Suscripción a activities (excursiones/itinerarios)
        const activitiesChannel = supabase
            .channel('realtime-activities')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, (payload) => {
                setItineraries(prev => {
                    if (prev.find(i => String(i.id) === String(payload.new.id))) return prev;
                    return [{ ...payload.new, image: payload.new.image_url }, ...prev];
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'activities' }, (payload) => {
                setItineraries(prev => prev.map(i => String(i.id) === String(payload.new.id)
                    ? { ...payload.new, image: payload.new.image_url }
                    : i));
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'activities' }, (payload) => {
                setItineraries(prev => prev.filter(i => String(i.id) !== String(payload.old.id)));
            })
            .subscribe();

        // Suscripción a profiles (usuarios)
        const profilesChannel = supabase
            .channel('realtime-profiles')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, (payload) => {
                setUsers(prev => {
                    if (prev.find(u => String(u.id) === String(payload.new.id))) return prev;
                    return [normalizeProfile(payload.new), ...prev];
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
                setUsers(prev => prev.map(u => String(u.id) === String(payload.new.id) ? normalizeProfile(payload.new) : u));
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'profiles' }, (payload) => {
                setUsers(prev => prev.filter(u => String(u.id) !== String(payload.old.id)));
            })
            .subscribe();

        // Cleanup al desmontar
        return () => {
            supabase.removeChannel(bookingsChannel);
            supabase.removeChannel(destinationsChannel);
            supabase.removeChannel(clientsChannel);
            supabase.removeChannel(activitiesChannel);
            supabase.removeChannel(profilesChannel);
        };
    }, [normalizeBooking, normalizeProfile, normalizeDestination]);

    // ─── LOAD MORE FUNCTIONS ──────────────────────────────────────────
    const loadMoreSales = async () => {
        if (!hasMoreSales || isLoadingMoreSalesRef.current) return;
        isLoadingMoreSalesRef.current = true;
        try {
            const nextOffset = (salesPage + 1) * PAGE_SIZE;
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .order('created_at', { ascending: false })
                .range(nextOffset, nextOffset + PAGE_SIZE - 1);

            if (error) { console.error('Error loadMoreSales:', error); return; }
            if (data.length < PAGE_SIZE) setHasMoreSales(false);

            setSales(prev => {
                const newItems = data.filter(d => !prev.find(p => String(p.id) === String(d.id))).map(normalizeBooking);
                return [...prev, ...newItems];
            });
            setSalesPage(prev => prev + 1);
        } catch (err) { console.error('Error loadMoreSales:', err); }
        finally { isLoadingMoreSalesRef.current = false; }
    };

    const loadMoreClients = async () => {
        if (!hasMoreClients || isLoadingMoreClientsRef.current) return;
        isLoadingMoreClientsRef.current = true;
        try {
            const nextOffset = (clientsPage + 1) * PAGE_SIZE;
            const { data, error } = await supabase
                .from('clients')
                .select('*, client_identity(nationality)')
                .order('created_at', { ascending: false })
                .range(nextOffset, nextOffset + PAGE_SIZE - 1);

            if (error) { console.error('Error loadMoreClients:', error); return; }
            if (data.length < PAGE_SIZE) setHasMoreClients(false);

            setClients(prev => {
                const newItems = data.filter(d => !prev.find(p => String(p.id) === String(d.id))).map(c => {
                    const identity = Array.isArray(c.client_identity) ? c.client_identity[0] : c.client_identity;
                    return {
                        ...c,
                        nationality: identity?.nationality || c.nationality || '',
                        registration_date: c.booking_date || '',
                    };
                });
                return [...prev, ...newItems];
            });
            setClientsPage(prev => prev + 1);
        } catch (err) { console.error('Error loadMoreClients:', err); }
        finally { isLoadingMoreClientsRef.current = false; }
    };

    // ════════════════════════════════════════════════════════════════
    // DESTINOS CRUD
    // ════════════════════════════════════════════════════════════════
    const addDestination = async (newDest) => {
        try { await ensureSession(); } catch (err) { showNotification(err.message, 'error'); return false; }
        const { data, error } = await supabase
            .from('destinations')
            .insert([{
                title: newDest.title,
                subtitle: newDest.subtitle,
                description_long: newDest.description_long || newDest.description,
                category: newDest.category || 'Economy',
                airport_code: newDest.airport_code,
                currency: newDest.currency || 'USD',
                price_adult: parseFloat(newDest.price) || 0,
                hero_image_url: newDest.hero_image_url || newDest.imageUrl || '',
                is_premium: newDest.isPremium || false,
                is_active: true,
            }])
            .select()
            .single();

        if (error) { showNotification('Error al crear destino', 'error'); console.error(error); return false; }
        setDestinations(prev => {
            const exists = prev.find(d => String(d.id) === String(data.id));
            if (exists) {
                return prev.map(d => String(d.id) === String(data.id) ? { ...d, ...data, isPremium: data.is_premium, isFavorite: false } : d);
            }
            return [{ ...data, isPremium: data.is_premium, isFavorite: false }, ...prev];
        });
        showNotification(`Destino "${data.title}" creado correctamente`);
        await loadAll(true);
        return true;
    };

    const updateDestination = async (id, updatedDest) => {
        try { await ensureSession(); } catch (err) { showNotification(err.message, 'error'); return false; }
        const { data, error } = await supabase
            .from('destinations')
            .update({
                title: updatedDest.title,
                subtitle: updatedDest.subtitle,
                description_long: updatedDest.description_long || updatedDest.description,
                category: updatedDest.category || 'Economy',
                airport_code: updatedDest.airport_code,
                price_adult: parseFloat(updatedDest.price) || 0,
                hero_image_url: updatedDest.hero_image_url || updatedDest.imageUrl || '',
                is_premium: updatedDest.isPremium || false,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) { showNotification('Error al actualizar destino', 'error'); return false; }
        setDestinations(prev => {
            const exists = prev.find(d => String(d.id) === String(id));
            if (exists) {
                return prev.map(d => String(d.id) === String(id) ? { ...d, ...data, isPremium: data.is_premium, isFavorite: false } : d);
            }
            return [{ ...data, isPremium: data.is_premium, isFavorite: false }, ...prev];
        });
        showNotification('Destino actualizado correctamente');
        await loadAll(true);
        return true;
    };

    const deleteDestination = async (id) => {
        try { await ensureSession(); } catch (err) { showNotification(err.message, 'error'); return false; }
        try {
            // 1. Eliminar excursiones (actividades) asociadas
            const { error: activError } = await supabase
                .from('activities')
                .delete()
                .eq('destination_id', id);

            if (activError) {
                console.error('Error al eliminar excursiones del destino:', activError);
            }

            // 2. Eliminar imágenes de galería asociadas
            await supabase
                .from('destination_images')
                .delete()
                .eq('destination_id', id);

            // 3. Finalmente eliminar el destino
            const { data, error } = await supabase.from('destinations').delete().eq('id', id).select();

            if (error) {
                console.error('Error al eliminar destino:', error);
                showNotification(
                    error.code === '23503'
                        ? 'No se puede eliminar: hay ventas vinculadas a este destino'
                        : 'Error al eliminar destino: ' + (error.message || 'Intenta de nuevo'),
                    'error'
                );
                return false;
            }

            if (!data || data.length === 0) {
                showNotification('No se pudo eliminar el destino (Verifique permisos)', 'error');
                return false;
            }

            // Actualizar estado local
            setDestinations(prev => prev.filter(d => String(d.id) !== String(id)));
            setItineraries(prev => prev.filter(i => String(i.destination_id) !== String(id)));

            showNotification('Destino y sus excursiones eliminados', 'info');
            await loadAll(true);
            return true;
        } catch (err) {
            console.error('Error en el proceso de eliminación:', err);
            showNotification('Error inesperado al eliminar el destino', 'error');
            return false;
        }
    };

    // ════════════════════════════════════════════════════════════════
    // VENTAS / BOOKINGS CRUD
    // ════════════════════════════════════════════════════════════════
    const addSale = async (newSale) => {
        try {
            await ensureSession();
            const dest = destinations.find(d => String(d.id) === String(newSale.destination_id));
            const prefix = dest ? dest.title.substring(0, 3).toUpperCase() : 'GEN';
            const timestamp = Date.now().toString().slice(-3);
            const voucherCode = `VOU-${prefix}-${timestamp}`;
            const today = new Date().toISOString().split('T')[0];

            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            const { data, error } = await supabase
                .from('bookings')
                .insert([{
                    voucher_code: voucherCode,
                    destination_id: newSale.destination_id || null,
                    destination_name: dest ? dest.title : 'Desconocido',
                    client_id: newSale.client_id || null,
                    assigned_to: user?.id || null,
                    client_name: newSale.client_name,
                    num_adults: newSale.num_adults || 1,
                    num_children: newSale.num_children || 0,
                    total_amount: parseFloat(newSale.total_amount) || 0,
                    amount_paid: parseFloat(newSale.amount_paid) || 0,
                    currency: newSale.currency || 'USD',
                    travel_date: newSale.travel_date || null,
                    return_date: newSale.return_date || null,
                    booking_date: newSale.booking_date || today,
                    emission_date: today,
                    status: 'confirmada',
                    hotel_info: {
                        ...(newSale.hotel_info || {}),
                        show_price_on_voucher: newSale.show_price_on_voucher ?? true
                    },
                    custom_itinerary: newSale.custom_itinerary || [],
                    custom_includes: newSale.custom_includes || [],
                    prepared_by: newSale.prepared_by || null,
                }])
                .select()
                .single();

            if (error) throw error;

            setSales(prev => {
                const exists = prev.find(s => String(s.id) === String(data.id));
                if (exists) {
                    return prev.map(s => String(s.id) === String(data.id) ? { ...s, ...normalizeBooking(data) } : s);
                }
                return [normalizeBooking(data), ...prev];
            });
            showNotification('Venta registrada exitosamente');
            await loadAll(true);
            return true;
        } catch (err) {
            console.error('Error al registrar venta:', err);
            // Si el error ya fue mostrado por ensureSession, no repetimos
            if (!err.message.includes('sesión')) {
                showNotification('Error al registrar la venta. Intenta de nuevo.', 'error');
            }
            return false;
        }
    };

    const updateSale = async (id, updatedFields) => {
        try {
            await ensureSession();
            const { data, error } = await supabase
                .from('bookings')
                .update(updatedFields)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            setSales(prev => {
                const exists = prev.find(s => String(s.id) === String(id));
                if (exists) {
                    return prev.map(s => String(s.id) === String(id) ? normalizeBooking({ ...s, ...data }) : s);
                }
                return [normalizeBooking(data), ...prev];
            });
            showNotification('Voucher guardado correctamente');
            await loadAll(true);
            return data;
        } catch (err) {
            console.error('Error al actualizar venta:', err);
            if (!err.message.includes('sesión')) {
                showNotification('Error al actualizar venta. Intenta de nuevo.', 'error');
            }
            return null;
        }
    };

    const deleteSale = async (id) => {
        try {
            await ensureSession();
            const { data, error } = await supabase.from('bookings').delete().eq('id', id).select();
            if (error) throw error;

            if (!data || data.length === 0) {
                showNotification('No se pudo eliminar la venta (Verifique permisos)', 'error');
                return false;
            }
            setSales(prev => prev.filter(s => String(s.id) !== String(id)));
            showNotification('Venta eliminada', 'info');
            await loadAll(true);
            return true;
        } catch (error) {
            console.error('Error al eliminar venta:', error);
            if (!error.message.includes('sesión')) {
                showNotification('Error al eliminar venta: ' + (error.message || 'Intenta de nuevo'), 'error');
            }
            return false;
        }
    };

    const getSaleDetails = (saleId) => {
        const sale = sales.find(s => String(s.id) === String(saleId));
        if (!sale) return null;

        const dest = destinations.find(d => String(d.id) === String(sale.destination_id));

        let finalDest = dest;
        if (!dest) {
            finalDest = {
                title: sale.destination_name ? `${sale.destination_name} (Eliminado)` : 'Destino Desconocido',
                hero_image_url: '', // Will fallback to the default image in the UI
                includes: []
            };
        }

        return { ...sale, destination: finalDest };
    };

    // ════════════════════════════════════════════════════════════════
    // USUARIOS / PROFILES CRUD
    // ════════════════════════════════════════════════════════════════
    const addUser = async (newUser) => {
        const roleKey = {
            'Administrador': 'admin',
            'Asesor de Ventas': 'asesor',
            'Supervisor': 'supervisor',
            'Contabilidad': 'contabilidad',
            'Operaciones': 'operaciones',
        }[newUser.role] || 'asesor';

        try {
            // Obtener el access token de la sesión actual
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                throw new Error('No hay sesión activa. Por favor inicia sesión de nuevo.');
            }

            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            const resp = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                    'apikey': supabaseKey,
                },
                body: JSON.stringify({
                    email: newUser.email,
                    password: newUser.password || 'Julely2024!',
                    full_name: `${newUser.name} ${newUser.surname || ''}`.trim(),
                    role: roleKey,
                }),
            });

            const result = await resp.json();
            if (!resp.ok || result.error) {
                throw new Error(result.error || `Error HTTP ${resp.status}`);
            }

            // Recargar lista de usuarios
            const { data: profilesData } = await supabase
                .from('profiles').select('*').order('created_at', { ascending: false });

            setUsers((profilesData || []).map(normalizeProfile));

            showNotification(`Usuario "${newUser.name}" creado correctamente`);
            await loadAll(true);
            return true;
        } catch (err) {
            console.error('Error creando usuario:', err);
            showNotification(`Error al crear usuario: ${err.message || 'Intenta de nuevo'}`, 'error');
            return false;
        }
    };

    const updateUser = async (id, updatedUser) => {
        const roleKey = {
            'Administrador': 'admin', 'Asesor de Ventas': 'asesor',
            'Supervisor': 'supervisor', 'Contabilidad': 'contabilidad', 'Operaciones': 'operaciones',
        }[updatedUser.role] || updatedUser.role;

        try {
            // If password is provided, use Edge Function to update via Auth Admin API
            if (updatedUser.password) {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) {
                    throw new Error('No hay sesión activa. Por favor inicia sesión de nuevo.');
                }

                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

                const resp = await fetch(`${supabaseUrl}/functions/v1/update-user`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                        'apikey': supabaseKey,
                    },
                    body: JSON.stringify({
                        user_id: id,
                        password: updatedUser.password,
                        full_name: `${updatedUser.name} ${updatedUser.surname || ''}`.trim(),
                        role: roleKey,
                    }),
                });

                const result = await resp.json();
                if (!resp.ok || result.error) {
                    throw new Error(result.error || `Error ${resp.status}`);
                }
            } else {
                // No password change — update profile directly
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        full_name: `${updatedUser.name} ${updatedUser.surname || ''}`.trim(),
                        role: roleKey,
                        is_active: updatedUser.is_active !== false,
                    })
                    .eq('id', id);

                if (error) throw error;
            }

            // Reload user in local state
            const { data: refreshed } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (refreshed) {
                setUsers(prev => prev.map(u => String(u.id) === String(id) ? normalizeProfile(refreshed) : u));
            }

            showNotification(
                updatedUser.password
                    ? 'Usuario y contraseña actualizados correctamente'
                    : 'Usuario actualizado correctamente'
            );
            await loadAll(true);
            return true;
        } catch (err) {
            console.error('Error actualizando usuario:', err);
            showNotification(`Error al actualizar usuario: ${err.message || 'Intenta de nuevo'}`, 'error');
            return false;
        }
    };

    const deleteUser = async (id) => {
        try {
            await ensureSession();
            // Nota: Esto solo elimina el perfil, el usuario en auth.users requiere permisos de Admin API.
            const { data, error } = await supabase.from('profiles').delete().eq('id', id).select();
            if (error) throw error;

            if (!data || data.length === 0) {
                showNotification('No se pudo eliminar el usuario (Verifique permisos)', 'error');
                return false;
            }
            setUsers(prev => prev.filter(u => String(u.id) !== String(id)));
            showNotification('Usuario eliminado', 'info');
            await loadAll(true);
            return true;
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            if (!error.message.includes('sesión')) {
                showNotification(
                    error.code === '23503'
                        ? 'No se puede eliminar: el usuario tiene registros vinculados'
                        : 'Error al eliminar usuario: ' + (error.message || 'Intenta de nuevo'),
                    'error'
                );
            }
            return false;
        }
    };

    // ════════════════════════════════════════════════════════════════
    // CLIENTES CRUD
    // ════════════════════════════════════════════════════════════════
    const addClient = async (newClient) => {
        try { await ensureSession(); } catch (err) { showNotification(err.message, 'error'); return false; }
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        const { data, error } = await supabase
            .from('clients')
            .insert([{
                name: newClient.name,
                surname: newClient.surname,
                phone: newClient.phone,
                email: newClient.email,
                notes: newClient.notes,
                booking_date: newClient.registration_date || null,
                created_by: user?.id || null,
            }])
            .select().single();

        if (error) { showNotification('Error al crear cliente', 'error'); console.error(error); return false; }

        if (newClient.nationality) {
            const { error: identityError } = await supabase.from('client_identity').insert([{
                client_id: data.id,
                nationality: newClient.nationality || null,
            }]);
            if (identityError) {
                console.error('Error insertando identidad (RLS):', identityError);
                showNotification(`Cliente creado con alerta en identidad: ${identityError.message}`, 'error');
            }
        }

        setClients(prev => {
            const exists = prev.find(c => String(c.id) === String(data.id));
            if (exists) {
                return prev.map(c => String(c.id) === String(data.id) ? { ...c, ...data, nationality: newClient.nationality || c.nationality || '' } : c);
            }
            return [{
                ...data,
                nationality: newClient.nationality || '',
                registration_date: newClient.registration_date || data.booking_date || '',
            }, ...prev];
        });
        showNotification(`Cliente "${data.name}" creado correctamente`);
        await loadAll(true);
        return true;
    };

    const updateClient = async (id, updatedClient) => {
        try { await ensureSession(); } catch (err) { showNotification(err.message, 'error'); return false; }
        const { data, error } = await supabase
            .from('clients')
            .update({
                name: updatedClient.name,
                surname: updatedClient.surname,
                phone: updatedClient.phone,
                email: updatedClient.email,
                notes: updatedClient.notes,
                booking_date: updatedClient.registration_date || null,
            })
            .eq('id', id).select().single();

        if (error) { showNotification('Error al actualizar cliente', 'error'); return false; }

        if (updatedClient.nationality) {
            const { error: identityError } = await supabase.from('client_identity').upsert([{
                client_id: id,
                nationality: updatedClient.nationality || null,
            }], { onConflict: 'client_id' });
            if (identityError) {
                console.error('Error actualizando identidad (RLS):', identityError);
                showNotification(`Identidad no actualizada por permisos: ${identityError.message}`, 'error');
            }
        }

        setClients(prev => {
            const exists = prev.find(c => String(c.id) === String(data.id));
            if (exists) {
                return prev.map(c => String(c.id) === String(data.id) ? { ...c, ...data, nationality: updatedClient.nationality || c.nationality || '', registration_date: updatedClient.registration_date || data.booking_date || '' } : c);
            }
            return [{
                ...data,
                nationality: updatedClient.nationality || '',
                registration_date: updatedClient.registration_date || data.booking_date || '',
            }, ...prev];
        });
        showNotification('Cliente actualizado correctamente');
        await loadAll(true);
        return true;
    };

    const deleteClient = async (id) => {
        try {
            await ensureSession();
            const { data, error } = await supabase.from('clients').delete().eq('id', id).select();
            if (error) throw error;

            if (!data || data.length === 0) {
                showNotification('No se pudo eliminar el cliente (Verifique permisos)', 'error');
                return false;
            }
            setClients(prev => prev.filter(c => String(c.id) !== String(id)));
            showNotification('Cliente eliminado', 'info');
            await loadAll(true);
            return true;
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            if (!error.message.includes('sesión')) {
                showNotification(
                    error.code === '23503'
                        ? 'No se puede eliminar: el cliente tiene ventas vinculadas'
                        : 'Error al eliminar cliente: ' + (error.message || 'Intenta de nuevo'),
                    'error'
                );
            }
            return false;
        }
    };

    // ════════════════════════════════════════════════════════════════
    // ITINERARIOS / ACTIVIDADES CRUD
    // ════════════════════════════════════════════════════════════════
    const addItinerary = async (newItinerary) => {
        try {
            await ensureSession();
            const dest = destinations.find(d => String(d.id) === String(newItinerary.destination_id));
            const { data, error } = await supabase
                .from('activities')
                .insert([{
                    destination_id: newItinerary.destination_id || null,
                    destination_name: dest ? dest.title : 'Desconocido',
                    name: newItinerary.name,
                    description: newItinerary.description,
                    price_adult: parseFloat(newItinerary.price_adult) || 0,
                    price_child: parseFloat(newItinerary.price_child) || 0,
                    image_url: newItinerary.image || '',
                    is_active: true,
                }])
                .select().single();

            if (error) throw error;
            setItineraries(prev => {
                const exists = prev.find(i => String(i.id) === String(data.id));
                if (exists) {
                    return prev.map(i => String(i.id) === String(data.id) ? { ...i, ...data, image: data.image_url } : i);
                }
                return [{ ...data, image: data.image_url }, ...prev];
            });
            showNotification('Excursión creada correctamente');
            await loadAll(true);
            return true;
        } catch (error) {
            console.error('Error al crear excursión:', error);
            if (!error.message.includes('sesión')) {
                showNotification('Error al crear excursión: ' + (error.message || 'Intenta de nuevo'), 'error');
            }
            return false;
        }
    };

    const updateItinerary = async (id, updatedItinerary) => {
        try {
            await ensureSession();
            const dest = destinations.find(d => String(d.id) === String(updatedItinerary.destination_id));
            const { data, error } = await supabase
                .from('activities')
                .update({
                    destination_id: updatedItinerary.destination_id || null,
                    destination_name: dest ? dest.title : 'Desconocido',
                    name: updatedItinerary.name,
                    description: updatedItinerary.description,
                    price_adult: parseFloat(updatedItinerary.price_adult) || 0,
                    price_child: parseFloat(updatedItinerary.price_child) || 0,
                    image_url: updatedItinerary.image || '',
                })
                .eq('id', id).select().single();

            if (error) throw error;
            setItineraries(prev => {
                const exists = prev.find(i => String(i.id) === String(id));
                if (exists) {
                    return prev.map(i => String(i.id) === String(id) ? { ...i, ...data, image: data.image_url } : i);
                }
                return [{ ...data, image: data.image_url }, ...prev];
            });
            showNotification('Excursión actualizada correctamente');
            await loadAll(true);
            return true;
        } catch (error) {
            console.error('Error al actualizar excursión:', error);
            if (!error.message.includes('sesión')) {
                showNotification('Error al actualizar excursión: ' + (error.message || 'Intenta de nuevo'), 'error');
            }
            return false;
        }
    };

    const deleteItinerary = async (id) => {
        try {
            await ensureSession();
            const { data, error } = await supabase.from('activities').delete().eq('id', id).select();
            if (error) throw error;

            if (!data || data.length === 0) {
                showNotification('No se pudo eliminar la excursión (Verifique permisos)', 'error');
                return false;
            }
            setItineraries(prev => prev.filter(i => String(i.id) !== String(id)));
            showNotification('Excursión eliminada', 'info');
            await loadAll(true);
            return true;
        } catch (error) {
            console.error('Error al eliminar excursión:', error);
            if (!error.message.includes('sesión')) {
                showNotification('Error al eliminar excursión: ' + (error.message || 'Intenta de nuevo'), 'error');
            }
            return false;
        }
    };

    // ════════════════════════════════════════════════════════════════
    // IMÁGENES DE DESTINOS
    // ════════════════════════════════════════════════════════════════
    const addDestinationImages = async (destinationId, urls) => {
        await ensureSession();
        // urls: array de strings URL
        if (!urls || urls.length === 0) return [];
        const rows = urls.map((url, idx) => ({
            destination_id: destinationId,
            url,
            display_order: idx,
        }));
        const { data, error } = await supabase
            .from('destination_images')
            .insert(rows)
            .select();
        if (error) { console.error('Error guardando imágenes:', error); return []; }
        // Actualizar estado local
        setDestinations(prev => prev.map(d =>
            String(d.id) === String(destinationId)
                ? { ...d, images: [...(d.images || []), ...data] }
                : d
        ));
        return data;
    };

    const deleteDestinationImage = async (imageId, destinationId) => {
        await ensureSession();
        const { error } = await supabase.from('destination_images').delete().eq('id', imageId);
        if (error) { showNotification('Error al eliminar imagen', 'error'); return; }
        setDestinations(prev => prev.map(d =>
            String(d.id) === String(destinationId)
                ? { ...d, images: (d.images || []).filter(img => img.id !== imageId) }
                : d
        ));
    };

    const updateSystemSetting = async (key, value) => {
        await ensureSession();
        const { error } = await supabase.from('settings').upsert({ key, value });
        if (error) { showNotification('Error al guardar configuración', 'error'); throw error; }
        setSystemSettings(prev => ({ ...prev, [key]: value }));
        return true;
    };


    // ─── STATS ─────────────────────────────────────────────────────
    const stats = {
        totalRevenue: sales.reduce((acc, s) => acc + (parseFloat(s.total_amount) || 0), 0),
        activeDestinations: destinations.filter(d => d.is_active).length,
        totalSales: sales.length,
        uniqueClients: new Set(sales.map(s => s.client_name)).size,
    };

    return (
        <AppContext.Provider value={{
            destinations, sales, users, clients, itineraries, systemSettings, isLoading, stats,
            loadMoreSales, hasMoreSales,
            loadMoreClients, hasMoreClients,
            addDestination, updateDestination, deleteDestination,
            addDestinationImages, deleteDestinationImage,
            addSale, updateSale, deleteSale, getSaleDetails,
            addUser, updateUser, deleteUser,
            addClient, updateClient, deleteClient,
            addItinerary, updateItinerary, deleteItinerary,
            updateSystemSetting,
            refetch: loadAll,
        }}>
            {children}
        </AppContext.Provider>
    );

}

export const useApp = () => useContext(AppContext);
