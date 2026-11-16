"use client";
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { resetPasswordSchema, ResetPasswordFormData } from '@/schema/validations';
import { AuthShell } from '../components/AuthShell';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [ready, setReady] = useState(false);
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    });

    useEffect(() => {
        // Supabase detecta el token de recuperacion de la URL y dispara este evento
        const { data: listener } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') setReady(true);
        });

        // Por si el evento ya disparó antes de que este componente montara
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) setReady(true);
        });

        return () => listener.subscription.unsubscribe();
    }, []);

    const onSubmit = async (values: ResetPasswordFormData) => {
        setServerError('');
        setLoading(true);

        const { error } = await supabase.auth.updateUser({password: values.password});

        if (error) {
            setServerError('No pudimos actualizar tu contraseña. El link puede haber expirado.');
            setLoading(false);
            return;
        }

        router.push('/auth/login?reset=1');
    };

    if (!ready) {
        return (
            <AuthShell
            eyebrow='Recuperar acceso'
            title='Validando el link'
            subtitle='Un momento, por favor.'
            >
                <p className='auth-subtitle'>Validando el link de recuperación...</p>
            </AuthShell>
        );
    }

    return (
        <AuthShell
        eyebrow='Último paso'
        title='Elegí tu nueva contraseña'
        subtitle='Usá al menos 8 caracteres. Después vas a poder ingresar con ella.'
        >
            {serverError && (
                <p role='alert' className='auth-alert auth-alert--error'>{serverError}</p>
            )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className='auth-field'>
                        <label htmlFor='password' className='auth-label'>Nueva contraseña</label>
                        <input
                            id='password'
                            type='password'
                            autoComplete='new-password'
                            {...register('password')}
                            className={`auth-input ${errors.password ? 'auth-input--error' : ''}`}
                            placeholder='Mínimo 8 cararcteres'
                        />
                        {errors.password &&<p className='auth-error-text'>{errors.password.message}</p>}
                    </div>

                    <div className='auth-field'>
                        <label htmlFor="confirmPassword" className='auth-label'>Confirmar contraseña</label>
                        <input
                            id='confirmPassword'
                            type='password'
                            autoComplete='new-password'
                            {...register('confirmPassword')}
                            className={`auth-input ${errors.confirmPassword ? 'auth-input--error' : ''}`}
                            placeholder="Repetí la contraseña"
                        />
                        {errors.confirmPassword && <p className='auth-error-text'>{errors.confirmPassword.message}</p>}
                    </div>

                    <button type='submit' disabled={loading} className='auth-submit'>
                        {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
                    </button>
                </form>
        </AuthShell>
    );
}