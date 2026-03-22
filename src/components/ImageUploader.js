import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, Link, X, Image as ImageIcon, Loader } from 'lucide-react';

/**
 * Comprime una imagen usando Canvas antes de subirla.
 * Reduce el tamaño de 4-8MB a ~300-500KB sin pérdida visual notable.
 */
async function compressImage(file, maxWidthPx = 1920, maxHeightPx = 1440, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Calcular dimensiones manteniendo proporción (Fit within maxWidth x maxHeight)
                let { width, height } = img;
                
                if (width > maxWidthPx || height > maxHeightPx) {
                    const ratio = Math.min(maxWidthPx / width, maxHeightPx / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Intentar WebP primero, fallback a JPEG
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            // Si WebP falla, intentar JPEG
                            canvas.toBlob(
                                (jpegBlob) => {
                                    if (jpegBlob) resolve(jpegBlob);
                                    else reject(new Error('No se pudo comprimir la imagen'));
                                },
                                'image/jpeg',
                                quality
                            );
                        }
                    },
                    'image/webp',
                    quality
                );
            };
            img.onerror = () => reject(new Error('No se pudo leer la imagen'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsDataURL(file);
    });
}

/**
 * ImageUploader — Componente reutilizable para subir imágenes.
 * Soporta dos modos:
 *   1. Subir archivo desde el dispositivo (→ Supabase Storage, con compresión automática)
 *   2. Pegar una URL externa directamente
 *
 * Props:
 *   value        — URL actual de la imagen (string)
 *   onChange     — función(url: string) que recibe la URL resultante
 *   bucket       — nombre del bucket en Supabase Storage (default: 'product-gallery')
 *   folder       — subcarpeta dentro del bucket (default: 'uploads')
 *   label        — texto del label (default: 'Imagen')
 *   placeholder  — texto del input URL (default: 'https://...')
 */
export default function ImageUploader({
    value = '',
    onChange,
    bucket = 'product-gallery',
    folder = 'uploads',
    label = 'Imagen',
    placeholder = 'https://...',
    disableUrl = false,
    multiple = false,
    maxFiles = 3,
    maxSizeMB = 20, // Permitimos hasta 20MB originales (se comprimirán)
}) {
    const [mode, setMode] = useState(disableUrl ? 'upload' : 'url'); // 'url' | 'upload'
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    // Normalizar value para múltiples imágenes
    const currentImages = multiple ? (Array.isArray(value) ? value : (value ? [value] : [])) : null;

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (multiple) {
            const totalAfterUpload = (currentImages?.length || 0) + files.length;
            if (totalAfterUpload > maxFiles) {
                const remaining = maxFiles - (currentImages?.length || 0);
                setError(remaining <= 0
                    ? `Ya tienes el máximo de ${maxFiles} imágenes.`
                    : `Solo puedes añadir ${remaining} imagen${remaining !== 1 ? 'es' : ''} más (máximo ${maxFiles}).`
                );
                return;
            }
        }

        // Validar tipos
        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                setError('Solo se permiten imágenes (JPG, PNG, WebP, etc.)');
                return;
            }
            if (file.size > maxSizeMB * 1024 * 1024) {
                setError(`Alguna imagen supera los ${maxSizeMB} MB permitidos.`);
                return;
            }
        }

        setError('');
        setUploading(true);
        setUploadProgress('Preparando imágenes...');

        try {
            const publicUrls = [];

            for (let idx = 0; idx < files.length; idx++) {
                const file = files[idx];

                if (files.length > 1) {
                    setUploadProgress(`Procesando imagen ${idx + 1} de ${files.length}...`);
                } else {
                    setUploadProgress('Procesando imagen...');
                }

                // 1. Comprimir imagen antes de subir
                let uploadBlob;
                try {
                    // Promise with timeout for compression
                    uploadBlob = await Promise.race([
                        compressImage(file),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de compresión')), 15000))
                    ]);
                } catch (e) {
                    console.warn('Error comprimiendo, usando original:', e);
                    // Si falla la compresión, subir el original
                    uploadBlob = file;
                }

                if (files.length > 1) {
                    setUploadProgress(`Subiendo imagen ${idx + 1} de ${files.length}...`);
                } else {
                    setUploadProgress('Subiendo imagen...');
                }

                // 2. Generar nombre de archivo
                const isWebP = uploadBlob.type === 'image/webp';
                const ext = isWebP ? 'webp' : (file.name.split('.').pop() || 'jpg');
                const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

                // 3. Subir a Supabase Storage con timeout de 30s
                const uploadPromise = supabase.storage
                    .from(bucket)
                    .upload(fileName, uploadBlob, {
                        cacheControl: '3600',
                        upsert: false,
                        contentType: uploadBlob.type,
                    });

                const { error: uploadError } = await Promise.race([
                    uploadPromise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('La subida de imagen tardó demasiado (30s). Inténtalo de nuevo.')), 30000))
                ]);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(fileName);

                publicUrls.push(publicUrl);
            }

            if (multiple) {
                // Añadir nuevas URLs a las existentes
                onChange([...(currentImages || []), ...publicUrls]);
            } else {
                onChange(publicUrls[0]);
            }
        } catch (err) {
            console.error('Error general de subida:', err);
            setError('Error al subir imagen(es): ' + (err.message || 'Inténtalo de nuevo'));
        } finally {
            setUploading(false);
            setUploadProgress('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const clearImage = () => {
        onChange('');
        setError('');
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        fontSize: '0.9rem',
        background: 'var(--bg-main)',
        color: 'var(--text-primary)',
        boxSizing: 'border-box',
    };

    return (
        <div style={{ marginTop: '1rem' }}>
            {/* Label + toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {label}
                </label>
                {!disableUrl && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={() => setMode('url')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                                padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer',
                                fontSize: '0.75rem', fontWeight: 600, border: '1px solid var(--border-color)',
                                background: mode === 'url' ? 'var(--primary-color)' : 'transparent',
                                color: mode === 'url' ? 'white' : 'var(--text-secondary)',
                            }}
                        >
                            <Link size={12} /> URL
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('upload')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                                padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer',
                                fontSize: '0.75rem', fontWeight: 600, border: '1px solid var(--border-color)',
                                background: mode === 'upload' ? 'var(--primary-color)' : 'transparent',
                                color: mode === 'upload' ? 'white' : 'var(--text-secondary)',
                            }}
                        >
                            <Upload size={12} /> Subir archivo
                        </button>
                    </div>
                )}
            </div>

            {/* Mode: URL */}
            {!disableUrl && mode === 'url' && (
                <input
                    type="text"
                    style={inputStyle}
                    value={typeof value === 'string' ? value : ''}
                    onChange={(e) => { onChange(e.target.value); setError(''); }}
                    placeholder={placeholder}
                />
            )}

            {/* Mode: Upload */}
            {mode === 'upload' && (
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple={multiple}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        style={{
                            width: '100%', padding: '2rem', border: '2px dashed var(--border-color)',
                            borderRadius: '10px', background: 'var(--bg-card-hover)',
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            color: 'var(--text-secondary)', display: 'flex',
                            flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                    >
                        {uploading ? (
                            <>
                                <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
                                <span>{uploadProgress || 'Procesando...'}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    Comprimiendo y subiendo imagen, por favor espera...
                                </span>
                            </>
                        ) : (
                            <>
                                <Upload size={24} />
                                <span style={{ fontWeight: 600 }}>Haz clic para seleccionar imagen{multiple ? ` (hasta ${maxFiles})` : ''}</span>
                                <span style={{ fontSize: '0.75rem' }}>JPG, PNG, WebP · Se comprimirán automáticamente</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Error */}
            {error && (
                <div style={{ marginTop: '0.4rem', color: '#EF4444', fontSize: '0.8rem' }}>
                    {error}
                </div>
            )}

            {/* Preview: single */}
            {!multiple && value && typeof value === 'string' && (
                <div style={{ marginTop: '0.75rem', position: 'relative', display: 'inline-block' }}>
                    <img
                        src={value}
                        alt="Vista previa"
                        style={{
                            height: '100px', width: '160px', objectFit: 'cover',
                            borderRadius: '8px', border: '1px solid var(--border-color)',
                            display: 'block',
                        }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <button
                        type="button"
                        onClick={clearImage}
                        style={{
                            position: 'absolute', top: '-8px', right: '-8px',
                            background: '#EF4444', color: 'white', border: 'none',
                            borderRadius: '50%', width: '22px', height: '22px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', padding: 0,
                        }}
                    >
                        <X size={12} />
                    </button>
                </div>
            )}

            {/* Preview: multiple — galería con botón eliminar por imagen */}
            {multiple && currentImages && currentImages.length > 0 && (
                <div style={{
                    marginTop: '0.75rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                }}>
                    {currentImages.map((url, idx) => (
                        <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                            <img
                                src={url}
                                alt={`Imagen ${idx + 1}`}
                                style={{
                                    height: '80px', width: '110px', objectFit: 'cover',
                                    borderRadius: '8px', border: '1px solid var(--border-color)',
                                    display: 'block',
                                }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const updated = currentImages.filter((_, i) => i !== idx);
                                    onChange(updated);
                                    setError('');
                                }}
                                style={{
                                    position: 'absolute', top: '-8px', right: '-8px',
                                    background: '#EF4444', color: 'white', border: 'none',
                                    borderRadius: '50%', width: '22px', height: '22px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', padding: 0,
                                }}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Spin animation (inline keyframes workaround) */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
