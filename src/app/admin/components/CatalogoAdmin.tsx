'use client';
import { useMemo, useState } from "react";
import { useCatalogo, CatalogItem } from "@/hooks/useCatalogo";
import type { ItemFormData } from "@/schema/validations";
import ItemForm from "./ItemForm";
import CategoryManager from "./CategoryManager";

export default function CatalogoAdmin() {
    const {
        items, categories, isAdmin, isloading,
        saveItem, toggleActive, saveCategory, deleteCategory
    } = useCatalogo();

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');
    const [showArchived, setShowArchived] = useState(false);
    const [editing, setEditing] = useState<CatalogItem | 'new' | null>(null);

    const categoryNames = useMemo( 
        () => new Map(categories.map((c) => [c.id, c.name])),
        [categories]
    );

    const filtered = useMemo(() => {
        const term = search.trim().toLocaleLowerCase();
        return items.filter((i) => 
        (showArchived || i.active) &&
        (categoryFilter === 'all' || i.category_id === categoryFilter) && 
        (!term || i.name.toLocaleLowerCase().includes(term))
    );
    }, [items, search, categoryFilter, showArchived]);

    if (isloading) return <p>Cargando catálogo...</p>;
    if (!isAdmin) return <p className="admin-error">No tenés permiso para administrar el catálogo.</p>

    const handleSubmit = async (values: ItemFormData) => {
        const result = await saveItem(values, editing !== 'new' && editing ? editing.id : undefined);
        if (result.ok) setEditing(null);
        return result;
    };

    return (
        <div className="admin-layout">
            <aside className="admin-side">
                {editing ? (
                    <ItemForm
                    key={editing === 'new' ? 'new' : editing.id} // remount al cambiar item
                    categories={categories}
                    initial={editing === 'new' ? undefined : editing}
                    onSubmit={handleSubmit}
                    onCancel={() => setEditing(null)}
                    />
                ) : (
                    <CategoryManager categories={categories} onSave={saveCategory} onDelete={deleteCategory} />
                )}
            </aside>

            <section className="admin-main">
                <div className="admin-toolbar">
                    <input
                    className="input-standard" 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar material..."
                    aria-label="Buscar material"
                    />

                    <select 
                    value={categoryFilter} 
                    onChange={(e) => setCategoryFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="input-standard"
                    aria-label="Filtrar por categoría"
                    >
                        <option value="all">Todas las categorías</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <label className="admin-check">
                        <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)}/>
                        Ver archivados
                    </label>
                    <button type="button" onClick={() => setEditing('new')} className="btn btn-primary btn-md">
                        Nuevo material
                    </button>
                </div>

                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Categoría</th>
                                <th className="admin-num">Precio</th>
                                <th>Unidad</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((item) => (
                                <tr key={item.id} className={item.active ? '' : 'admin-row-archived'}>
                                    <td>{item.name}</td>
                                    <td>{categoryNames.get(item.category_id) ?? 'Sin categoria'}</td>
                                    <td className="admin-num">${item.price.toLocaleString('es-AR')}</td>
                                    <td>{item.unit}</td>
                                    <td className="admin-cell-actions">
                                        <button className="btn btn-outline btn-sm" type="button" onClick={() => setEditing(item)}>Editar</button>
                                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => toggleActive(item)}>{item.active ? 'Archivar' : 'Restaurar'}</button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={5} className="admin-empty">No hay materiales para mostrar.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}