'use client';
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { forgotPasswordSchema, ForgotPasswordFormData } from "@/schema/validations";
import { AuthShell } from "../components/AuthShell";

export default function ForgotPasswordPage() {
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (values: ForgotPasswordFormData) => {
        setLoading(true);
        await supabase.auth.resetPasswordForEmail(values.email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        setLoading(false);
        // No revelamos si el email existe o no en la base (seguridad)
        setSent(true);
    };

    return (
        <AuthShell
        eyebrow="Recuperar acceso"
        title="¿Olvidaste tu contraseña?"
        subtitle="Ingresá tu email y te enviamos las instrucciones para restablecerla."
        >
                {sent ? (
                    <p className="auth-alert auth-alert--success">Si el email ingresado está registrado, te enviamos un correo con instrucciones para restablecer tu contraseña.
                    </p>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form">
                        <div className="auth-field">
                            <label htmlFor="email" className="auth-label">Email</label>
                            <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            {...register("email")}
                            className={`auth-input ${errors.email ? 'auth-input--error' : ''}`}
                            placeholder="tu@email.com"
                            />
                            {errors.email && <p className="auth-error-text">{errors.email.message}</p>}
                        </div>

                        <button type="submit" disabled={loading} className="auth-submit">
                            {loading ? "Enviando..." : "Enviar instrucciones"}
                        </button>
                    </form>
                )}

                <div className="auth-links">
                    <Link href="/auth/login" className="auth-link">
                    Volver al inicio de sesión
                    </Link>
                    <Link href="/auth/register" className="auth-link">
                    Crear una cuenta
                    </Link>
                </div>
        </AuthShell>
    );
}