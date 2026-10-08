"use client";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema, LoginFormData } from "@/schema/validations";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [serverError, setServerError] = useState("");
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema)
    });

    const infoMessage = searchParams.get('reset')
    ? 'Contraseña actualizada. Ingresa con tu nueva contraseña.'
    : searchParams.get('registered')
    ? 'Cuenta creada. Ingresá con tus datos.'
    : null;

    const onSubmit = async (values: LoginFormData) => {
        setServerError('');
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword(values);
        
        if (error) {
            setServerError('Email o contraseña incorrectos');
            setLoading(false);
            return;
        }
        router.push('/')
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm">
                <h1 className="text-4xl">Electri<span className="text-blue-500">SaaS</span>
                </h1>

                {infoMessage && (
                    <p className="text-green-700 bg-green-50 border border-green-200 rounded-lg text-xs px-3 py-2 mb-4">
                        {infoMessage}
                    </p>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className="mb-3">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                           Email 
                        </label>
                    <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    className={`input-standard ${errors.email ? 'border-red-400 focus:ring-red-300' : ''}`}
                    placeholder="tu@email.com"
                />
                {errors.email && (
                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>
                )}
                    </div>

                    <div className="mb-2">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                            Contraseña
                        </label>
                    <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    {...register('password')}
                    className={`input-standard ${errors.password ? 'border-red-400 focus:ring-red-300' : ''}`}
                />
                {errors.password && (
                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>
                )}
                    </div>

                <div className="text-right mb-4">
                    <Link href="/auth/forgot-password" className="text-sm text-blue-500 hover:underline">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>

                {serverError && (
                    <p role="alert" className="text-red-500  text-xs mb-4">{serverError}</p>
                )}

                <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary btn-md mb-3">
                    {loading ? 'Ingresando...' : 'Ingresar'}
                </button>
                </form>

                <p className="text-center text-sm text-gray-500">
                    ¿No tenés cuenta?{' '}
                    <Link href="/auth/register" className="text-blue-600 font-medium hover:underline">
                        Registrate
                    </Link>
                </p>
                </div>
            </div>
    );
}

export default function Page() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Suspense fallback={null}>
                <LoginForm />
            </Suspense>
        </div>
    )
}