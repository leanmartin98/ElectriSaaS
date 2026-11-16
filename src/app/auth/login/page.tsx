"use client";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema, LoginFormData } from "@/schema/validations";
import { AuthShell } from "../components/AuthShell";

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
        <AuthShell
            active="login"
            eyebrow="Bienvenido de nuevo"
            title="Ingresá a tu cuenta"
            subtitle="Usá el email y la contraseña con los que te registraste."
        >
                {infoMessage && (
                    <p className="auth-alert auth-alert--success">
                        {infoMessage}
                    </p>
                )}

                {serverError && (
                <p role="alert" className="auth-alert auth-alert--error">{serverError}</p>
            )}

                <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
                    <div className="auth-field">
                    <label htmlFor="email" className="auth-label">Email</label>
                    <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    className={`auth-input ${errors.email ? 'auth-input--error' : ''}`}
                    placeholder="tu@email.com"
                />
                {errors.email && <p className="auth-error-text">{errors.email.message}</p>}
                    </div>

                <div className="auth-field">
                    <label htmlFor="password" className="auth-label">Contraseña</label>
                    <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    {...register('password')}
                    className={`auth-input ${errors.password ? 'auth-input--error' : ''}`}
                />
                {errors.password && <p className="auth-error-text">{errors.password.message}</p>}
                </div>

                <div className="auth-row-end">
                    <Link href="/auth/forgot-password" className="auth-link">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>

                {serverError &&<p role="alert" className="auth-alert auth-alert--error">{serverError}</p>}

                <button
                type="submit"
                disabled={loading}
                className="auth-submit">
                    {loading ? 'Ingresando...' : 'Ingresar'}
                </button>
                </form>
        </AuthShell>
    );
}

export default function Page() {
    return (
            <Suspense fallback={null}>
                <LoginForm />
            </Suspense>
    );
}