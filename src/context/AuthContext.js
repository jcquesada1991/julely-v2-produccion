import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

// ─── Role Definitions & Permissions ──────────────────────────────────
export const ROLES = {
    ADMIN: 'admin',
    ASESOR: 'asesor',
    SUPERVISOR: 'supervisor',
    CONTABILIDAD: 'contabilidad',
    OPERACIONES: 'operaciones'
};

// Mapa de roles a nombres mostrados en la UI
export const ROLE_LABELS = {
    admin: 'Administrador',
    asesor: 'Asesor de Ventas',
    supervisor: 'Supervisor',
    contabilidad: 'Contabilidad',
    operaciones: 'Operaciones'
};

const PERMISSIONS = {
    [ROLES.ADMIN]: {
        canDeleteClients: true,
        canViewFinancials: true,
        canViewAllSales: true,
        canExportData: true,
        canManageUsers: true,
        canManageDestinations: true,
        canManageItineraries: true,
    },
    [ROLES.ASESOR]: {
        canDeleteClients: false,
        canViewFinancials: false,
        canViewAllSales: false,
        canExportData: false,
        canManageUsers: false,
        canManageDestinations: false,
        canManageItineraries: false,
    },
    [ROLES.SUPERVISOR]: {
        canDeleteClients: false,
        canViewFinancials: true,
        canViewAllSales: true,
        canExportData: true,
        canManageUsers: false,
        canManageDestinations: false,
        canManageItineraries: false,
    },
    [ROLES.CONTABILIDAD]: {
        canDeleteClients: false,
        canViewFinancials: true,
        canViewAllSales: true,
        canExportData: true,
        canManageUsers: false,
        canManageDestinations: false,
        canManageItineraries: false,
    },
    [ROLES.OPERACIONES]: {
        canDeleteClients: false,
        canViewFinancials: false,
        canViewAllSales: true,
        canExportData: false,
        canManageUsers: false,
        canManageDestinations: true,
        canManageItineraries: true,
    },
};

// ─── Provider ────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Carga el perfil completo desde la tabla profiles
    const loadProfile = async (authUser) => {
        if (!authUser) {
            setCurrentUser(null);
            return;
        }
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (error) throw error;

            setCurrentUser({
                id: authUser.id,
                email: authUser.email,
                name: profile.full_name,
                full_name: profile.full_name,
                role: profile.role,                       // 'admin' | 'asesor' | etc.
                roleLabel: ROLE_LABELS[profile.role] || profile.role,
                is_active: profile.is_active,
                created_at: profile.created_at,
            });
        } catch (err) {
            console.error('Error loading profile:', err);
            setCurrentUser(null);
        }
    };

    // Escuchar cambios de sesión de Supabase Auth
    useEffect(() => {
        // Sesión inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            loadProfile(session?.user ?? null).finally(() => setIsLoading(false));
        });

        // Listener de cambios (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_OUT' || !session) {
                    setCurrentUser(null);
                    router.push('/login');
                } else {
                    await loadProfile(session?.user ?? null);
                }
                setIsLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Login — usaremos en login.js directamente con supabase.auth.signInWithPassword
    // Este helper es para compatibilidad con código existente
    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        router.push('/login');
    };

    // Auto-logout after 30 minutos de inactividad
    useEffect(() => {
        if (!currentUser) return;

        let timeoutId;
        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                // Notificar de alguna manera si quisieras, aquí cerramos sesión directamente
                logout();
            }, 60 * 60 * 1000); // 60 minutos
        };

        const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
        
        events.forEach(e => window.addEventListener(e, resetTimer));
        resetTimer();

        return () => {
            events.forEach(e => window.removeEventListener(e, resetTimer));
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [currentUser]);

    // Permission helpers — mantiene la misma API que antes
    const getPermissions = () => {
        if (!currentUser) return {};
        return PERMISSIONS[currentUser.role] || PERMISSIONS[ROLES.ASESOR];
    };

    const can = (permission) => {
        const perms = getPermissions();
        return !!perms[permission];
    };

    return (
        <AuthContext.Provider value={{
            currentUser,
            isLoading,
            login,
            logout,
            getPermissions,
            can,
            ROLES,
            ROLE_LABELS,
            supabase  // exponer el cliente para consultas directas
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
