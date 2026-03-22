import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';
import UserForm from '@/components/UserForm';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/DashboardV2.module.css';
import { Plus, Edit, Trash2, Mail, Shield, MapPin } from 'lucide-react';
import { useConfirm } from '@/components/ConfirmModal';

export default function Usuarios() {
    const { users, addUser, updateUser, deleteUser } = useApp();
    const { can, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const confirm = useConfirm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
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
        setIsDirty(false);
    };

    // Route guard: solo admin puede gestionar usuarios
    useEffect(() => {
        if (!authLoading && !can('canManageUsers')) {
            router.replace('/dashboard');
        }
    }, [authLoading, can, router]);

    // Mostrar nada mientras valida o si no tiene permisos
    if (authLoading || !can('canManageUsers')) {
        return null;
    }

    const handleOpenCreate = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const user = users.find(u => u.id === id);
        const name = user ? user.name : '';
        const ok = await confirm(
            'Eliminar Usuario',
            `¿Estás seguro de eliminar a "${name}"? Esta acción no se puede deshacer.`
        );
        if (ok) {
            deleteUser(id);
        }
    };

    const handleSubmit = (formData) => {
        if (editingUser) {
            updateUser(editingUser.id, formData);
        } else {
            addUser(formData);
        }
        setIsModalOpen(false);
        setIsDirty(false);
    };

    // Helper to get initials
    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    // Helper for random color based on name
    const getAvatarColor = (name) => {
        const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <DashboardLayout title="Gestión de Usuarios">
            <Head>
                <title>Usuarios | Julely</title>
            </Head>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 className={styles.pageTitle} style={{ fontSize: '2rem' }}>Usuarios</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Gestiona los usuarios y sus permisos</p>
                </div>
                <button className="btn-primary" onClick={handleOpenCreate}>
                    <Plus size={20} /> Nuevo Usuario
                </button>
            </div>

            <div className={styles.paramountCard}>
                <div className={styles.tableResponsiveWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.tableHeader}>Avatar</th>
                                <th className={styles.tableHeader}>Nombre</th>
                                <th className={styles.tableHeader}>Email</th>
                                <th className={styles.tableHeader}>Rol</th>
                                <th className={styles.tableHeader}>Estado</th>
                                <th className={styles.tableHeader} style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>

                                        <div className={styles.avatarInitials} style={{
                                            background: `linear-gradient(135deg, ${({
                                                'Administrador': 'var(--primary-color)',
                                                'admin': 'var(--primary-color)',
                                                'Asesor de Ventas': '#3B82F6',
                                                'asesor': '#3B82F6',
                                                'Supervisor': '#F59E0B',
                                                'supervisor': '#F59E0B',
                                                'Contabilidad': '#10B981',
                                                'contabilidad': '#10B981',
                                                'Operaciones': '#EC4899',
                                                'operaciones': '#EC4899'
                                            })[user.role] || 'var(--accent-color)'} 0%, ${({
                                                'Administrador': 'var(--primary-dark)',
                                                'admin': 'var(--primary-dark)',
                                                'Asesor de Ventas': '#1D4ED8',
                                                'asesor': '#1D4ED8',
                                                'Supervisor': '#D97706',
                                                'supervisor': '#D97706',
                                                'Contabilidad': '#065F46',
                                                'contabilidad': '#065F46',
                                                'Operaciones': '#BE185D',
                                                'operaciones': '#BE185D'
                                            })[user.role] || '#6FDA9A'} 100%)`,
                                            color: 'white'
                                        }}>
                                            {getInitials(user.name)}
                                        </div>
                                    </td>
                                    <td>
                                        <div>
                                            <div className={styles.textPrimary} style={{ fontWeight: 600 }}>{user.name} {user.surname}</div>
                                        </div>
                                    </td>
                                    <td className={styles.textSecondary}>{user.email}</td>
                                    <td>
                                        <span style={{
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            color: ({
                                                'Administrador': 'var(--primary-color)',
                                                'admin': 'var(--primary-color)',
                                                'Asesor de Ventas': '#3B82F6',
                                                'asesor': '#3B82F6',
                                                'Supervisor': '#F59E0B',
                                                'supervisor': '#F59E0B',
                                                'Contabilidad': '#10B981',
                                                'contabilidad': '#10B981',
                                                'Operaciones': '#EC4899',
                                                'operaciones': '#EC4899'
                                            })[user.role] || 'var(--text-secondary)',
                                            background: ({
                                                'Administrador': 'rgba(157, 116, 200, 0.15)',
                                                'admin': 'rgba(157, 116, 200, 0.15)',
                                                'Asesor de Ventas': 'rgba(59, 130, 246, 0.15)',
                                                'asesor': 'rgba(59, 130, 246, 0.15)',
                                                'Supervisor': 'rgba(245, 158, 11, 0.15)',
                                                'supervisor': 'rgba(245, 158, 11, 0.15)',
                                                'Contabilidad': 'rgba(16, 185, 129, 0.15)',
                                                'contabilidad': 'rgba(16, 185, 129, 0.15)',
                                                'Operaciones': 'rgba(236, 72, 153, 0.15)',
                                                'operaciones': 'rgba(236, 72, 153, 0.15)'
                                            })[user.role] || 'rgba(255,255,255,0.05)',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '99px',
                                            border: `1px solid ${({
                                                'Administrador': 'rgba(157, 116, 200, 0.3)',
                                                'admin': 'rgba(157, 116, 200, 0.3)',
                                                'Asesor de Ventas': 'rgba(59, 130, 246, 0.3)',
                                                'asesor': 'rgba(59, 130, 246, 0.3)',
                                                'Supervisor': 'rgba(245, 158, 11, 0.3)',
                                                'supervisor': 'rgba(245, 158, 11, 0.3)',
                                                'Contabilidad': 'rgba(16, 185, 129, 0.3)',
                                                'contabilidad': 'rgba(16, 185, 129, 0.3)',
                                                'Operaciones': 'rgba(236, 72, 153, 0.3)',
                                                'operaciones': 'rgba(236, 72, 153, 0.3)'
                                            })[user.role] || 'var(--border-color)'}`
                                        }}>
                                            {({
                                                'admin': 'Administrador',
                                                'asesor': 'Asesor de Ventas',
                                                'supervisor': 'Supervisor',
                                                'contabilidad': 'Contabilidad',
                                                'operaciones': 'Operaciones'
                                            })[user.role] || user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block',
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: 'var(--accent-color)',
                                            marginRight: '6px',
                                            boxShadow: '0 0 6px rgba(153, 221, 181, 0.4)'
                                        }}></span>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Activo</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <button
                                                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                                                data-tooltip="Editar Usuario"
                                                onClick={() => handleOpenEdit(user)}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                                data-tooltip="Eliminar"
                                                onClick={() => handleDelete(user.id)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                        No hay usuarios registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
            >
                <UserForm
                    initialData={editingUser}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseModal}
                    onDirty={setIsDirty}
                />
            </Modal>
        </DashboardLayout>
    );
}
