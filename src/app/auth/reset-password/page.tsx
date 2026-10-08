import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { resetPasswordSchema, ResetPasswordFormData } from '@/schema/validations';

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
            <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
                <p className='text-gray-500'>Validando el link de recuperación...</p>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
            <div className='bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm'>
                <h1 className='text-4x1 mb-6'>
                    Electri<span className='text-blue-500'>SaaS</span>
                </h1>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className='mb-4'>
                        <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
                            Nueva contraseña
                        </label>
                        <input
                            id='password'
                            type='password'
                            autoComplete='new-password'
                            {...register('password')}
                            className={`input-standard ${errors.password ? 'border-red-400 focus:ring-red-300' : ''}`}
                        />
                        {errors.password && (
                            <p className='mt-1 text-xs ml-1 text-red-500'>{errors.password.message}</p>
                        )}
                    </div>

                    <div className='mb-4'>
                        <label htmlFor="confirmPassword" className='block text-sm font-medium text-gray-700 mb-1 ml-1'>
                            Confirmar contraseña
                        </label>
                        <input
                            id='confirmPassword'
                            type='password'
                            autoComplete='new-password'
                            {...register('confirmPassword')}
                            className={`input-standard ${errors.confirmPassword ? 'border-red-400 focus:ring-red-300' : ''}`}
                        />
                        {errors.confirmPassword && (
                            <p className='mt-1 text-xs ml-1 text-red-500'>{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    {serverError && (
                        <p role='alert' className='mt-1 text-xs ml-1 text-red-500'>{serverError}</p>
                    )}

                    <button type='submit' disabled={loading} className='w-full btn btn-primary btn-md'>
                        {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
                    </button>
                </form>
            </div>
        </div>
    );
}