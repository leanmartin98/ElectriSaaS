"use client";
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientSchema, ClientFormData } from '@/schema/validations';


interface FormProps {
    data: ClientFormData;
    setData: (data: ClientFormData) => void;
    onClean: () => void;
}

const getDefaultDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 5);
    return date.toISOString().split('T')[0];
};

export default function FormularioCliente({ data, setData, onClean }: FormProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitSuccessful },
    } = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
        defaultValues: data,
    });

    const onSubmit = (values: ClientFormData) => {
        setData(values);
        setTimeout(() => reset(values), 3000);
    }

    const handleClean = () => {
        onClean();
        reset({ client: '', phone: '', address: '', validity: getDefaultDate() });
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="card-formulario">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Datos del Cliente</h2>

            <div className="mb-4">
                <label htmlFor='client-input' className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                    Cliente
                </label>
                <input
                    id='client-input'
                    {...register('client')}
                    className={`input-standard ${errors.client ? 'border-red-400 focus:ring-red-300' : ''}`}
                    placeholder="Ingrese el nombre del cliente"
                />
                {errors.client && (
                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.client.message}</p>
                )}
            </div>

            <div className="mb-4">
                <label htmlFor='phone-input' className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp
                </label>
                <input
                    id='phone-input'
                    {...register('phone')}
                    className={`input-standard ${errors.phone ? 'border-red-400 focus:ring-red-300' : ''}`}
                    placeholder="Ej: 1123456789"
                />
                {errors.phone && (
                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.phone.message}</p>
                )}
            </div>

            <div className="mb-6">
                <label htmlFor='address-input' className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                </label>
                <input
                    id='address-input'
                    {...register('address')}
                    className={`input-standard ${errors.address ? 'border-red-400 focus:ring-red-300' : ''}`}
                    placeholder="Ingrese la dirección del cliente"
                />
                {errors.address && (
                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.address.message}</p>
                )}
            </div>

            <div className="mb-6">
                <label htmlFor='validity-input' className="block text-sm font-medium text-gray-700  mb-2 ml-1">
                    Fecha de Validez
                </label>
                <input
                    id='validity-input'
                    {...register('validity')}
                    type="date"
                    className={`input-standard ${errors.validity ? 'border-red-400 focus:ring-red-300' : ''}`}
                />
                {errors.validity && (
                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.validity.message}</p>
                )}
            </div>

            {isSubmitSuccessful && (
                <p className="text-green-600 text-xs text-center mb-3 font-medium">
                    ✅ Datos guardados correctamente
                </p>
            )}

            <div className="flex gap-3 mt-8">
                <button
                    type="button"
                    onClick={handleClean}
                    className="btn btn-secondary btn-md"
                >
                    Limpiar
                </button>
                <button
                    type="submit"
                    className="btn btn-primary btn-md"
                >
                    Guardar Datos
                </button>
            </div>
        </form>
    );
}