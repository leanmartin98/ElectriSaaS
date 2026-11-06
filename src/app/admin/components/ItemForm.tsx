'use client';
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { itemSchema, ItemFormData, UNITS } from "@/schema/validations";
import type { CatalogItem, Category } from "@/hooks/useCatalogo";

interface Props {
    categories: Category[];
    initial?: CatalogItem;
    onSubmit: (values: ItemFormData) => Promise<{ ok: boolean; error?: string }>;
    onCancel: () => void;
}

export default function ItemForm({ categories, initial, onSubmit, onCancel }: Props) {
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ItemFormData>({
        resolver: zodResolver(itemSchema),
        defaultValues: initial
        ? {
            name: initial.name,
            category_id: initial.category_id,
            price: initial.price,
            unit: initial.unit as ItemFormData['unit'],
        }
        : { name: '', unit: 'unidad' },
    });

    const submit = async (values: ItemFormData) => {
        setServerError(null);
        const result = await onSubmit(values);
        if (!result.ok) setServerError(result.error ?? 'Error al guardar');
    };

    return (
        <form onSubmit={handleSubmit(submit)} className="card-formulario admin-form" noValidate>
            <h2 className="admin-title">{initial ? 'Editar material' : 'Nuevo material'}</h2>

            <div className="admin-field">
                <label htmlFor="item-name" className="admin-label">Nombre</label>
                <input id="item-name" {...register('name')} className="input-standard" placeholder="Ej: Cable unipolar 2.5mm" />
                {errors.name && <p className="admin-error">{errors.name.message}</p>}
            </div>

            <div className="admin-field">
                <label htmlFor="item-category" className="admin-label">Categoría</label>
                <select id="item-category" {...register('category_id', { valueAsNumber: true })} className="input-standard">
                    <option value="">Seleccioná una categoría</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                {errors.category_id && <p className="admin-error">{errors.category_id.message}</p>}
            </div>

            <div className="admin-row">
                <div className="admin-field">
                    <label htmlFor="item-price" className="admin-label">Precio</label>
                    <input 
                    type="number"
                    id="item-price"
                    step="0.01"
                    min="0"
                    className="input-standard"
                    {...register('price', { valueAsNumber: true })} 
                    />
                    {errors.price && <p className="admin-error">{errors.price.message}</p>}
                </div>

                <div className="admin-field">
                    <label htmlFor="item-unit" className="admin-label">Unidad</label>
                    <select id="item-unit" className="input-standard" {...register('unit')}>
                        {UNITS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                    {errors.unit && <p className="admin-error">{errors.unit.message}</p>}
                </div>
            </div>

            {serverError && <p role="alert" className="admin-error">{serverError}</p>}

            <div className="admin-actions">
                <button type="button" onClick={onCancel} className="btn btn-secondary">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-md">
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </form>
    )
}