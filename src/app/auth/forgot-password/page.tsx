'use client';
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { forgotPasswordSchema, ForgotPasswordFormData } from "@/schema/validations";

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
            redirectTo: `${window.location.origin}/reset-password`,
        });
        setLoading(false);
        // No revelamos si el email existe o no en la base (seguridad)
        setSent(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm">
                <h1 className="text-4xl mb-2">
                    Electri<span className="text-blue-500">SaaS</span>
                </h1>
                <p className="text-sm text-gray-500 mb-6">Recuperar contraseña</p>

                {sent ? (
                    <p className="text-green-500">Si el email ingresado está registrado, te enviamos un correo
                        con instrucciones para restablecer tu contraseña.
                    </p>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                                Email
                            </label>
                            <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            {...register("email")}
                            className={`input-standard ${errors.email ? 'border-red-400 focus:ring-red-300' : ''}`}
                            placeholder="tu@email.com"
                            />
                            {errors.email && (
                                <p
                                className="text-red-500 text-sm mt-1 ml-1"
                                >
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <button type="submit" disabled={loading} className="w-full btn btn-primary btn-md mb-3">
                            {loading ? "Enviando..." : "Enviar instrucciones"}
                        </button>
                    </form>
                )}

                <p className="text-center text-sm text-gray-500 mt-4">
                    <Link href="/auth/login" className="text-blue-500 hover:underline">
                        Volver al inicio de sesión
                    </Link>
                </p>
                <p className="text-center text-sm text-gray-500 mt-2">
                    <Link href="/auth/register" className="text-blue-500 hover:underline">
                        Crear una cuenta
                    </Link>
                </p>
                <p className="text-center text-xs text-gray-400 mt-4">
                    © 2026 ElectriSaaS. Todos los derechos reservados.
                </p>
            </div>
        </div>
    )
}