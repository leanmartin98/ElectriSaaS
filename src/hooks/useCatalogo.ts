import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { ItemFormData } from '@/schema/validations';

export interface CatalogItem {
    id: number;
    name: string;
    price: number;
    unit: string;
    active: boolean;
    category_id: number;
    categories: { name: string } | null;
}

export interface Category {
    id: number;
    name: string;
}

type Result = { ok: boolean; error?: string };

function logError(context: string, error: unknown) {
    const err = error as { message?: string; details?: string; hint?: string; code?: string };
    console.error(context, err?.message, err?.details, err?.hint, err?.code);
}

async function fetchCatalog(){
    const [itemsRes, catsRes] = await Promise.all([
        supabase
            .from('items')
            .select('id, name, price, unit, active, category_id, categories (name)')
            .order('name', { ascending: true }),
        supabase.from('categories').select('id, name').order('name', { ascending: true }),
    ]);

    if (itemsRes.error) logError('Error al cargar items:', itemsRes.error);
    if (catsRes.error) logError('Error al cargar categorías:', catsRes.error);

   const formattedItems: CatalogItem[] = ((itemsRes.data ?? []) as Array<Record<string, unknown>>).map((item) => ({
        ...item,
        categories: Array.isArray(item.categories)
            ? (item.categories[0] as Category ?? null)
            : null
    })) as unknown as CatalogItem[];

    return {
        items: formattedItems,
        categories: (catsRes.data ?? []) as Category[],
    };
}

export function useCatalogo() {
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isloading, setIsLoading] = useState(true);

    const reload = async () => {
        const data = await fetchCatalog();
        setItems(data.items);
        setCategories(data.categories);
    };

    useEffect(() => {
        let isMounted = true;

        async function init() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data } = await supabase
                        .from('profiles')
                        .select('is_admin')
                        .eq('id', user.id)
                        .single();
                    if (isMounted) setIsAdmin(!!data?.is_admin);
                }

                const data = await fetchCatalog();
                if (isMounted) {
                    setItems(data.items);
                    setCategories(data.categories);
                }
            } catch (error) {
                logError('Error al inicializar el catálogo:', error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        init();
        return () => { isMounted = false; };
    }, []);

    // -------------Items----------------------
    const saveItem = async (values: ItemFormData, id?: number): Promise<Result> => {
        const payload = { ...values, updated_at: new Date().toISOString() };
        const { error } = id
            ? await supabase.from('items').update(payload).eq('id', id)
            : await supabase.from('items').insert(payload);

        if (error) {
            logError('Error al guardar item:', error);
            return { ok: false, error: 'No se pudo guardar el item. Intenta nuevamente.' };
        }
        await reload();
        return { ok: true };
    };

    const toggleActive = async (item: CatalogItem): Promise<Result> => {
        const { error } = await supabase
            .from('items')
            .update({ active: !item.active, updated_at: new Date().toISOString() })
            .eq('id', item.id);

        if (error) {
            logError('Error al archivar item:', error);
            return { ok: false, error: 'No se pudo actualizar el item.' };
        }
        await reload();
        return { ok: true };
    };

    // -------------Categories----------------------
    const saveCategory = async (name: string, id?: number): Promise<Result> => {
        const { error } = id
            ? await supabase.from('categories').update({ name }).eq('id', id)
            : await supabase.from('categories').insert({ name });
            
        if (error) {
            logError('Error al guardar categoria:', error);
            return {
                ok: false,
                error: error.code === '23505'
                    ? 'Ya existe una categoría con ese nombre.'
                    : 'No se pudo guardar la categoría.',
            };
        }
        await reload();
        return { ok: true };
    };

    const deleteCategory = async (id: number): Promise<Result> => {
        const { error } = await supabase.from('categories').delete().eq('id', id);

        if (error) {
            logError('Error al borrar categoría:', error);
            return {
                ok: false,
                error: error.code === '23503'
                    ? 'La categoría tiene items asociados (incluso archivados). Reasignalos antes de borrarla.'
                    : 'No se pudo borrar la categoría.',
            };
        }
        await reload();
        return { ok: true };
    };

    return {
        items,
        categories,
        isAdmin,
        isloading,
        saveItem,
        toggleActive,
        saveCategory,
        deleteCategory,
    };
}