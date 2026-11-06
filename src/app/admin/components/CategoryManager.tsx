'use client';
import { useState } from "react";
import { categorySchema } from "@/schema/validations";
import type { Category } from "@/hooks/useCatalogo";

interface Props {
    categories: Category[];
    onSave: (name: string, id?: number) => Promise<{ ok: boolean; error?: string }>;
    onDelete: (id: number) => Promise<{ ok: boolean; error?: string }>;
}

export default function CategoryManager({ categories, onSave, onDelete } : Props) {
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const save = async (name: string, id?: number) => {
        const parsed = categorySchema.safeParse({ name });
        if (!parsed.success) {
            setError(parsed.error.issues[0].message);
            return false;
        };

        // Duplicados (sin distinguir mayúsculas/minúsculas), ignorando la propia categoria al renombrar
        const isDuplicate = categories.some(
            (c) => c.id !== id && c.name.toLowerCase() === parsed.data.name.toLowerCase()
        );
        if (isDuplicate) {
            setError('Ya existe una categoría con ese nombre');
            return false;
        }

        const result = await onSave(parsed.data.name, id);
        setError(result.ok ? null : result.error ?? 'Error al guardar');
        return result.ok;
    };

    const handleAdd = async () => {
        if (await save(newName)) setNewName('');
    };

    const handleRename = async (id: number) => {
        if (await save(editingName, id)) setEditingId(null);
    };

    const handleDelete = async (c: Category) => {
        if (!confirm(`¿Borrar la categoria "${c.name}"?`)) return;
        const result = await onDelete(c.id);
        setError(result.ok ? null : result.error ?? 'Error al borrar')
    };

    return (
        <section className="card-formulario admin-form">
            <h2 className="admin-title">Categorías</h2>

            <div className="admin-row">
                <input 
                className="input-standard"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nueva categoria (Ej: Cañerias)"
                aria-label="Nueva categoría"
                />
                <button type="button" onClick={handleAdd} className="btn btn-primary btn-md">Agregar</button>
            </div>

            {error && <p role="alert" className="admin-error">{error}</p>}

            <ul className="admin-category-list">
                {categories.map((c) => (
                    <li key={c.id} className="admin-category-row">
                        {editingId === c.id ? (
                            <>
                                <input
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className="input-standard"
                                    aria-label={`Renombrar ${c.name}`}
                                />
                                <button type="button" onClick={() => handleRename(c.id)} className="btn btn-primary btn-sm">OK</button>
                                <button type="button" onClick={() => setEditingId(null)} className="btn btn-ghost btn-sm">Cancelar</button>
                            </>
                        ) : (
                            <>
                                <span className="admin-category-name">{c.name}</span>
                                <button
                                    type="button"
                                    onClick={() => { setEditingId(c.id); setEditingName(c.name); setError(null); }}
                                    className="btn btn-outline btn-sm"
                                >
                                    Renombrar
                                </button>
                                <button type="button" onClick={() => handleDelete(c)} className="btn btn-danger btn-sm">Borrar</button>
                            </>
                        )}
                    </li>
                ))}
            </ul> 
        </section>
    )
}