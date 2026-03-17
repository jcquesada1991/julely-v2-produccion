import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from '@/styles/FormModal.module.css';
import { ROLES } from '@/context/AuthContext';

export default function UserForm({ initialData, onSubmit, onCancel, onDirty }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        lastName: '',
        email: '',
        password: '',
        role: ROLES.ASESOR
    });

    useEffect(() => {
        if (initialData) {
            const nameParts = initialData.name ? initialData.name.split(' ') : [''];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            setFormData({
                name: firstName,
                lastName: lastName,
                email: initialData.email || '',
                password: '',
                role: initialData.role || ROLES.ASESOR
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (onDirty) onDirty(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const submitData = {
                ...formData,
                name: `${formData.name} ${formData.lastName}`.trim(),
                // Only include password if it was set (for creation or update)
                ...(formData.password ? { password: formData.password } : {})
            };
            delete submitData.lastName;
            await onSubmit(submitData);
        } finally {
            setIsSubmitting(false);
        }
    };

    const roleOptions = [
        { value: ROLES.ADMIN, label: 'Administrador', desc: 'Control total del sistema', color: 'var(--primary-color)' },
        { value: ROLES.ASESOR, label: 'Asesor de Ventas', desc: 'Gestión de clientes y ventas', color: '#3B82F6' },
        { value: ROLES.SUPERVISOR, label: 'Supervisor', desc: 'Reportes y supervisión', color: '#F59E0B' },
        { value: ROLES.CONTABILIDAD, label: 'Contabilidad', desc: 'Datos financieros', color: '#10B981' },
        { value: ROLES.OPERACIONES, label: 'Operaciones', desc: 'Logística y proveedores', color: '#EC4899' },
    ];

    return (
        <form onSubmit={handleSubmit}>
            <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Nombre</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Ej. Juan"
                            className={styles.formInput}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Apellido</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Ej. Pérez"
                            className={styles.formInput}
                        />
                    </div>

                    <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                        <label className={styles.formLabel}>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="juan@travelagendy.com"
                            className={styles.formInput}
                        />
                    </div>

                    <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                        <label className={styles.formLabel}>
                            {initialData ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required={!initialData}
                                placeholder="••••••••"
                                className={styles.formInput}
                                style={{ paddingRight: '2.5rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '0.75rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                        <label className={styles.formLabel}>Rol del Usuario</label>
                        <div className={styles.radioGroup} style={{ flexDirection: 'column', gap: '0.5rem' }}>
                            {roleOptions.map((role) => (
                                <label
                                    key={role.value}
                                    className={styles.radioLabel}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        borderRadius: '8px',
                                        border: formData.role === role.value
                                            ? `2px solid ${role.color}`
                                            : '1px solid var(--border-color)',
                                        background: formData.role === role.value
                                            ? `${role.color}15`
                                            : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem'
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value={role.value}
                                        checked={formData.role === role.value}
                                        onChange={handleChange}
                                        className={styles.radioInput}
                                    />
                                    <div>
                                        <span style={{
                                            fontWeight: 600,
                                            color: formData.role === role.value ? role.color : 'var(--text-primary)'
                                        }}>
                                            {role.label}
                                        </span>
                                        <span style={{
                                            display: 'block',
                                            fontSize: '0.75rem',
                                            color: 'var(--text-secondary)',
                                            marginTop: '2px'
                                        }}>
                                            {role.desc}
                                        </span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={onCancel} disabled={isSubmitting}>
                    Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : (initialData ? 'Actualizar Usuario' : 'Crear Usuario')}
                </button>
            </div>
        </form>
    );
}
