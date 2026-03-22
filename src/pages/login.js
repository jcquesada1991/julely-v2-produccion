import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import styles from '@/styles/Login.module.css';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
    const router = useRouter();
    const { currentUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirigir al dashboard cuando el perfil ya esté cargado
    useEffect(() => {
        if (currentUser) {
            router.push('/dashboard');
        }
    }, [currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                if (authError.message.includes('Invalid login credentials')) {
                    setError('Credenciales inválidas. Verifica tu email y contraseña.');
                } else if (authError.message.includes('Email not confirmed')) {
                    setError('Debes confirmar tu email antes de ingresar.');
                } else {
                    setError('Error al iniciar sesión. Intenta de nuevo.');
                }
                setIsLoading(false);
                return;
            }
            // La navegación la maneja el useEffect cuando AuthContext actualiza currentUser
        } catch (err) {
            console.error('Login error:', err);
            setError('Error de conexión. Intenta de nuevo.');
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <Head>
                <title>Login | Julely</title>
            </Head>

            {/* Background elements */}
            <div className={styles.backgroundOverlay}></div>

            {/* Glassmorphism Login Box */}
            <div className={styles.loginCard}>

                <div className={styles.welcomeText}>
                    Bienvenido a Julely ✈️
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.errorMessage}>{error}</div>}

                    <div className={styles.inputGroup}>
                        <label>EMAIL</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nombre@ejemplo.com"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>CONTRASEÑA</label>
                        <div className={styles.passwordWrapper}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                className={styles.eyeBtn}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', marginTop: '-0.5rem', marginBottom: '1.5rem' }}>
                        <Link href="/forgot-password" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'none' }}>
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>

                    <button type="submit" className={styles.loginBtn} disabled={isLoading}>
                        {isLoading ? 'Ingresando...' : <><LogIn size={18} /> INGRESAR</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
