import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '@/styles/DashboardV2.module.css';
import { LogOut, LayoutGrid, Briefcase, Calendar, Users, Map, User, Menu, X, Shield, Building, MoreHorizontal, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function DashboardLayout({ children, title }) {
    const router = useRouter();
    const { currentUser, isLoading, logout, can } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [overflowStart, setOverflowStart] = useState(-1);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const navLinksRef = useRef(null);
    const measureContainerRef = useRef(null);
    const moreMenuRef = useRef(null);

    // Build menu items (antes del early return para que los hooks puedan usarlos)
    const menuItems = [
        { icon: LayoutGrid, label: 'Dashboard', path: '/dashboard', show: true },
        { icon: Briefcase, label: 'Destinos', path: '/dashboard/destinos', show: true },
        { icon: Map, label: 'Excursiones', path: '/dashboard/itinerarios', show: true },
        { icon: User, label: 'Clientes', path: '/dashboard/clientes', show: true },
        { icon: Calendar, label: 'Ventas', path: '/dashboard/ventas', show: true },
        { icon: Building, label: 'Hoteles', path: '/dashboard/hoteles', show: can('canManageDestinations') },
        { icon: Users, label: 'Usuarios', path: '/dashboard/usuarios', show: can('canManageUsers') },
        { icon: Shield, label: 'Configuración', path: '/dashboard/configuracion', show: can('canManageUsers') },
    ];
    const filteredItems = menuItems.filter(item => item.show);

    // Cerrar dropdown "Más" al hacer click fuera
    useEffect(() => {
        if (!showMoreMenu) return;
        const handler = (e) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
                setShowMoreMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showMoreMenu]);

    // Calcula cuántos items caben en navLinks (priority+ navigation)
    const recalculate = useCallback(() => {
        const container = navLinksRef.current;
        const measureEl = measureContainerRef.current;
        if (!container || !measureEl) return;

        const available = container.offsetWidth;
        const GAP = 8;        // gap entre items (0.5rem)
        const MORE_BTN_W = 80; // ancho aprox del botón "Más ▾"

        const items = Array.from(measureEl.children);
        let total = 0;
        let cutoff = -1;

        for (let i = 0; i < items.length; i++) {
            const w = items[i].offsetWidth + GAP;
            const isLast = i === items.length - 1;
            // Si añadir este item (+ espacio para botón "Más" si quedan más) desborda, cortar aquí
            if (total + w + (isLast ? 0 : MORE_BTN_W + GAP) > available) {
                cutoff = i;
                break;
            }
            total += w;
        }

        setOverflowStart(cutoff);
    }, []);

    useEffect(() => {
        const container = navLinksRef.current;
        if (!container) return;
        const ro = new ResizeObserver(recalculate);
        ro.observe(container);
        recalculate();
        return () => ro.disconnect();
    }, [recalculate, filteredItems.length]);

    const visibleItems = overflowStart === -1 ? filteredItems : filteredItems.slice(0, overflowStart);
    const hiddenItems = overflowStart === -1 ? [] : filteredItems.slice(overflowStart);
    const hasActiveHidden = hiddenItems.some(item => router.pathname === item.path);

    // Route protection
    useEffect(() => {
        if (!isLoading && !currentUser) {
            router.push('/login');
        }
    }, [isLoading, currentUser, router]);

    if (isLoading || !currentUser) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-main)',
                color: 'var(--text-secondary)'
            }}>
                Cargando...
            </div>
        );
    }

    const isActive = (path) => router.pathname === path ? styles.navItemActive : '';
    const handleLogout = () => { logout(); };

    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const getRoleBadgeColor = (role) => {
        const colors = {
            'Administrador': 'var(--primary-color)',
            'Asesor de Ventas': '#3B82F6',
            'Supervisor': '#F59E0B',
            'Contabilidad': '#10B981',
            'Operaciones': '#EC4899',
        };
        return colors[role] || 'var(--text-secondary)';
    };

    return (
        <div className={styles.dashboardContainer}>
            <nav className={styles.topNav}>
                {/* Logo + botón hamburguesa (siempre visible) */}
                <div className={styles.navHeader}>
                    <div className={styles.brand} onClick={() => router.push('/dashboard')}>
                        <div className={styles.brandLogo}>
                            <img src="/images/logo_transparent.png" alt="Julely" className={styles.navLogoImg} />
                        </div>
                    </div>
                    <button
                        className={styles.mobileMenuBtn}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Nav de escritorio: priority+ navigation */}
                <div ref={navLinksRef} className={styles.navLinks}>
                    {/* Contenedor oculto para medir el ancho natural de cada item */}
                    <div ref={measureContainerRef} className={styles.measureContainer} aria-hidden="true">
                        {filteredItems.map(item => {
                            const Icon = item.icon;
                            return (
                                <span key={item.path} className={styles.navItem}>
                                    <Icon size={18} />
                                    {item.label}
                                </span>
                            );
                        })}
                    </div>

                    {/* Items visibles (los que caben) */}
                    {visibleItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`${styles.navItem} ${isActive(item.path)}`}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}

                    {/* Botón "Más" con dropdown para los items que no caben */}
                    {hiddenItems.length > 0 && (
                        <div ref={moreMenuRef} className={styles.moreMenuContainer}>
                            <button
                                className={`${styles.navItem} ${styles.moreBtn} ${hasActiveHidden ? styles.navItemActive : ''}`}
                                onClick={() => setShowMoreMenu(v => !v)}
                                aria-expanded={showMoreMenu}
                            >
                                <MoreHorizontal size={18} />
                                Más
                                <ChevronDown
                                    size={13}
                                    style={{
                                        transform: showMoreMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s ease',
                                        flexShrink: 0,
                                    }}
                                />
                            </button>
                            {showMoreMenu && (
                                <div className={styles.moreDropdown}>
                                    {hiddenItems.map(item => {
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.path}
                                                href={item.path}
                                                className={`${styles.moreDropdownItem} ${router.pathname === item.path ? styles.moreDropdownItemActive : ''}`}
                                                onClick={() => setShowMoreMenu(false)}
                                            >
                                                <Icon size={16} />
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Acciones de escritorio (usuario + logout) */}
                <div className={styles.actions}>
                    <div className={styles.userProfile}>
                        <div className={styles.avatarInitials}>
                            {getInitials(`${currentUser.name} ${currentUser.surname || ''}`)}
                        </div>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>
                                {currentUser.name} {currentUser.surname || ''}
                            </span>
                            <span className={styles.userRole} style={{ color: getRoleBadgeColor(currentUser.role) }}>
                                {currentUser.role}
                            </span>
                        </div>
                    </div>
                    <button className={styles.logoutBtn} onClick={handleLogout} title="Cerrar Sesión">
                        <LogOut size={20} />
                    </button>
                </div>

                {/* Menú móvil (hamburguesa): todos los items + acciones */}
                <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.showMenu : ''}`}>
                    {filteredItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`${styles.navItem} ${isActive(item.path)}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                    <div className={styles.mobileMenuActions}>
                        <div className={styles.userProfile}>
                            <div className={styles.avatarInitials}>
                                {getInitials(`${currentUser.name} ${currentUser.surname || ''}`)}
                            </div>
                            <div className={styles.userInfo}>
                                <span className={styles.userName}>
                                    {currentUser.name} {currentUser.surname || ''}
                                </span>
                                <span className={styles.userRole} style={{ color: getRoleBadgeColor(currentUser.role) }}>
                                    {currentUser.role}
                                </span>
                            </div>
                        </div>
                        <button className={styles.logoutBtn} onClick={handleLogout} title="Cerrar Sesión">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </nav>

            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}
