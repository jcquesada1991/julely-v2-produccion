import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '@/styles/DashboardV2.module.css';
import { LogOut, LayoutGrid, Briefcase, Calendar, Users, Map, User, Menu, X, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function DashboardLayout({ children, title }) {
    const router = useRouter();
    const { currentUser, isLoading, logout, can } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isActive = (path) => router.pathname === path ? styles.navItemActive : '';

    const handleLogout = () => {
        logout();
    };

    // Función para obtener iniciales del nombre
    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Route protection: redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !currentUser) {
            router.push('/login');
        }
    }, [isLoading, currentUser, router]);

    // Show nothing while checking auth
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

    // Build menu items based on permissions
    const menuItems = [
        { icon: LayoutGrid, label: 'Dashboard', path: '/dashboard', show: true },
        { icon: User, label: 'Clientes', path: '/dashboard/clientes', show: true },
        { icon: Briefcase, label: 'Destinos', path: '/dashboard/destinos', show: true },
        { icon: Map, label: 'Excursiones', path: '/dashboard/itinerarios', show: true },
        { icon: Calendar, label: 'Ventas', path: '/dashboard/ventas', show: true },
        { icon: Users, label: 'Usuarios', path: '/dashboard/usuarios', show: can('canManageUsers') },
    ];

    // Role badge color
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
            {/* Top Navigation Bar */}
            <nav className={styles.topNav}>
                <div className={styles.navHeader}>
                    <div className={styles.brand} onClick={() => router.push('/dashboard')}>
                        <div className={styles.brandLogo}>
                            <img src="/images/logo_transparent.png" alt="Julely" style={{ height: '145px', objectFit: 'contain' }} />
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

                <div className={`${styles.navLinks} ${isMenuOpen ? styles.showMenu : ''}`}>
                    {menuItems.filter(item => item.show).map((item) => {
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
                </div>

                <div className={styles.actions}>
                    {/* Avatar con iniciales estilo Google */}
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

                    {/* Botón de Logout */}
                    <button
                        className={styles.logoutBtn}
                        onClick={handleLogout}
                        title="Cerrar Sesión"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}
