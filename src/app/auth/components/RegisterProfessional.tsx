"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { registerSchema, RegisterFormData } from "@/schema/validations";
import { useAuth } from "../hooks/useAuth";

export default function RegisterProfessional() {
    const router = useRouter();
    const { registerProfessional, isRegistering } = useAuth();
    const [serverError, setServerError] = React.useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (values: RegisterFormData) => {
        setServerError(null);
        const result = await registerProfessional(values);

        if (!result.success) {
            setServerError(result.error ?? 'Error al registrar');
            return;
        }

        router.push('/auth/login?registered=1');
    };

    return (
        <>
        {serverError && (
            <p role="alert" className="auth-alert auth-alert--error">{serverError}</p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <div className="auth-field">
                <label htmlFor="reg-name" className="auth-label">Nombre y Apellido</label>
                <input
                    id="reg-name"
                    {...register('name')}
                    className={`auth-input ${errors.name ? 'auth-input--error' : ''}`}
                    placeholder="Ej: John Doe"
                />
                {errors.name && <p className="auth-error-text">{errors.name.message}</p>}
            </div>

        {/* Columna izq: Empresa, Teléfono, Contraseña · Columna der: Matrícula, Email, Confirmar */}
            <div className="auth-grid-2">
                <div className="auth-field">
                    <label className="auth-label" htmlFor="reg-company">
                    Empresa <span className="auth-optional">(opcional)</span>
                    </label>
                <input
                    id="reg-company"
                    {...register('companyName')}
                    className={`auth-input ${errors.companyName ? 'auth-input--error' : ''}`}
                    placeholder="Ej: Instalaciones John Doe SRL"
                />
                {errors.companyName && <p className="auth-error-text">{errors.companyName.message}</p>}
            </div>

            <div className="auth-field">
                <label className="auth-label" htmlFor="reg-matricula">
                    Matrícula <span className="auth-optional">(opcional)</span>
                </label>
                <input
                    id="reg-matricula"
                    {...register('matricula')}
                    className={`auth-input ${errors.matricula ? 'auth-input--error' : ''}`}
                    placeholder="Ej: MN 12345"
                />
                {errors.matricula && <p className="auth-error-text">{errors.matricula.message}</p>}
            </div>

            <div className="auth-field">
                <label className="auth-label" htmlFor="reg-phone">
                    Teléfono
                </label>
                <input
                    id="reg-phone"
                    {...register('phone')}
                    type="text"
                    className={`auth-input ${errors.phone ? 'auth-input--error' : ''}`}
                    placeholder="Ej: 1123456789"
                />
                {errors.phone && <p className="auth-error-text">{errors.phone.message}</p>}
            </div>

            <div className="auth-field">
                <label className="auth-label" htmlFor="reg-email">
                    Email
                </label>
                <input
                    id="reg-email"
                    {...register('email')}
                    type="email"
                    className={`auth-input ${errors.email ? 'auth-input--error' : ''}`}
                    placeholder="tu@email.com"
                />
                {errors.email && <p className="auth-error-text">{errors.email.message}</p>}
            </div>

            <div className="auth-field">
                <label className="auth-label" htmlFor="reg-password">
                    Contraseña
                </label>
                <input
                    id="reg-password"
                    autoComplete="new-password"
                    {...register('password')}
                    type="password"
                    className={`auth-input ${errors.password ? 'auth-input--error' : ''}`}
                    placeholder="Mínimo 8 caracteres"
                />
                {errors.password && <p className="auth-error-text">{errors.password.message}</p>}
            </div>

            <div className="auth-field">
                <label className="auth-label" htmlFor="reg-confirm">
                    Confirmar Contraseña
                </label>
                <input
                    id="reg-confirm"
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                    type="password"
                    className={`auth-input ${errors.confirmPassword ? 'auth-input--error' : ''}`}
                    placeholder="Mínimo 8 caracteres"
                />
                {errors.confirmPassword && (
                    <p className="auth-error-text">{errors.confirmPassword.message}</p>
                )}
            </div>
            </div>
            
            <button
                type="submit"
                disabled={isRegistering}
                className="auth-submit"
            >
                {isRegistering ? 'Registrando...' : 'Crear cuenta'}
            </button>
        </form>
        </>
    )
}