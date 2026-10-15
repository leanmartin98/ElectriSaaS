'use client';
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
        <form onSubmit={handleSubmit(onSubmit)} className="card-formulario">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Registro de Profesional
            </h2>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                    Nombre y Apellido
                </label>
                <input
                    {...register('name')}
                    className={`input-standard ${errors.name ? "border-red-400 focus:ring-red-300" : ""}`}
                />
                {errors.name && (
                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.name.message}</p>
                )}
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                    Empresa (opcional)
                </label>
                <input
                    {...register('companyName')}
                    className={`input-standard ${errors.companyName ? 'border-red-400 focus-ring-red-300' : ''}`}
                    placeholder="Ej: Instalaciones John Doe SRL"
                />
                {errors.companyName && (
                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.companyName.message}</p>
                )}
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                    Matrícula (opcional)
                </label>
                <input
                    {...register('matricula')}
                    className={`input-standard ${errors.matricula ? 'border-red-400 focus-ring-red-300' : ''}`}
                    placeholder="Ej: MN 12345"
                />
                {errors.matricula && (
                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.matricula.message}</p>
                )}
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                    Teléfono
                </label>
                <input
                    {...register('phone')}
                    type="text"
                    className={`input-standard ${errors.phone ? 'border-red-400 focus-ring-red-300' : ''}`}
                    placeholder="Ej: 1123456789"
                />
                {errors.phone && (
                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.phone.message}</p>
                )}
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                    Email
                </label>
                <input
                    {...register('email')}
                    type="email"
                    className={`input-standard ${errors.email ? 'border-red-400 focus-ring-red-300' : ''}`}
                    placeholder="tu@email.com"
                />
                {errors.email && (
                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>
                )}
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                    Contraseña
                </label>
                <input
                    {...register('password')}
                    type="password"
                    className={`input-standard ${errors.password ? 'border-red-400 focus-ring-red-300' : ''}`}
                    placeholder="Mínimo 8 caracteres"
                />
                {errors.password && (
                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>
                )}
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                    Confirmar Contraseña
                </label>
                <input
                    {...register('confirmPassword')}
                    type="password"
                    className={`input-standard ${errors.confirmPassword ? 'border-red-400 focus-ring-red-300' : ''}`}
                    placeholder="Mínimo 8 caracteres"
                />
                {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.confirmPassword.message}</p>
                )}
            </div>

            {serverError && (
                    <p className="text-red-500 text-sm text-center mb-4 font-medium">{serverError}</p>
            )}

            <button
                type="submit"
                disabled={isRegistering}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50"
            >
                {isRegistering ? 'Registrando...' : 'Registrar'}
            </button>
        </form>
    )
}