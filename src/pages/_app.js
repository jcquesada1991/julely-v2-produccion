import '@/styles/globals.css';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { NotificationProvider } from '@/context/NotificationContext';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import { ConfirmProvider } from '@/components/ConfirmModal';

// Pages that don't need AppProvider (no DB data needed)
const PUBLIC_PAGES = ['/login', '/'];

function AppShell({ Component, pageProps }) {
    const router = useRouter();
    const isPublicPage = PUBLIC_PAGES.includes(router.pathname);

    const headBlock = (
        <Head>
            <title>Julely | Agencia de Viajes</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="description" content="Julely - Viajando por el Mundo. Gestión profesional de viajes y turismo." />
            <link rel="icon" type="image/png" href="/favicon.png" />
            <link rel="apple-touch-icon" href="/favicon.png" />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        </Head>
    );

    // Public pages: no need to load all DB data
    if (isPublicPage) {
        return (
            <NotificationProvider>
                <ConfirmProvider>
                    {headBlock}
                    <Component {...pageProps} />
                </ConfirmProvider>
            </NotificationProvider>
        );
    }

    // Dashboard pages: load full data context
    return (
        <NotificationProvider>
            <AppProvider>
                <ConfirmProvider>
                    {headBlock}
                    <Component {...pageProps} />
                </ConfirmProvider>
            </AppProvider>
        </NotificationProvider>
    );
}

export default function App({ Component, pageProps }) {
    return (
        <AuthProvider>
            <AppShell Component={Component} pageProps={pageProps} />
        </AuthProvider>
    );
}
