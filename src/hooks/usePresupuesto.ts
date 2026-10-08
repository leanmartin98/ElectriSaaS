import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { DEFAULT_CLIENT } from "@/constants";


interface Item {
    id: number;
    name: string;
    price: number;
    categories: {
        name: string;
    } | null;
}

export function usePresupuesto() {
    const [items, setItems] = useState<Item[]>([]); // Estado para los items de la DB
    const [inflation, setInflation] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [amounts, setAmounts] = useState<{ [key: number]: number }>({});
    const [clientData, setClientData] = useState(DEFAULT_CLIENT);
    const [isLoadingItems, setIsLoadingItems] = useState(true);
    const [isSharing, setIsSharing] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [formKey, setFormKey] = useState(0); // Para resetear el formulario
    const [profile, setProfile] = useState<{ name: string; company_name: string | null; matricula: string | null; phone: string } | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activeItems = items.filter(item => (amounts[item.id] || 0) > 0);


    // 1. Cargar items desde Supabase
    useEffect(() => {
        async function fetchItems() {
            try {
                // El await se frena acá si la URL es inválida
                const { data, error } = await supabase
                    .from('items')
                    .select(`*, categories (name)`)
                    .order('name', { ascending: true });

                if (error) console.error("Error items:", error.message); 
                else setItems(data || []);
            } catch (error) {
                console.error("FATAL ERROR:", error);
            } finally {
                setIsLoadingItems(false);
            }
        }
        fetchItems();
    }, []);

    // 2. Cargar profile del profesional desde Supabase
    useEffect(() => {
        let isMounted = true;

        async function fetchProfile() {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user) return;

                const { data, error } = await supabase
                    .from('profiles')
                    .select('name, company_name, matricula, phone')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error("Error al cargar profile:", error.message);
                    return;
                }

                if (isMounted) {
                    setProfile(data);
                }
            } catch (error) {
                console.error("FATAL ERROR en fetchProfile:", error);
            } finally {
                if (isMounted) {
                    setIsLoadingProfile(false);
                }
            }
        }

        fetchProfile();

        return () => {
            isMounted = false;
        };
    }, []);

    //cargar draft desde Supabase
    useEffect(() => {
        let isMounted = true; // Para evitar setState en componente desmontado

        async function loadDraft() {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError || !user) {
                    if (isMounted) setIsLoaded(true);
                    return;
                }

            const { data, error } = await supabase
                .from('draft')
                .select('*')
                .eq('user_id', user.id)
                .single();

                if (isMounted) {
                    if (data) {
                        if (data.inflation != null) setInflation(data.inflation);
                        if (data.amounts) setAmounts(data.amounts);
                        if (data.client_data) setClientData(data.client_data);
                    }

                    if (error && error.code !== 'PGRST116') {
                        console.error("Error al cargar el draft:", error.message);
                    }
                }
            } catch (error) {
                console.error("FATAL ERROR en loadDraft:", error);
            } finally {
                if (isMounted) {
                    setIsLoaded(true);
                }
            }
        }
        loadDraft();

        return () => {
            isMounted = false;
        };
    }, []);

    // Guardar draft en Supabase con (debounce 800ms)
    useEffect(() => {
        if (!isLoaded) return;

        //Limpiamos el timer anterior si el usuario sigue escribiendo
        if (saveTimer.current) clearTimeout(saveTimer.current);

        saveTimer.current = setTimeout(async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) return;

                const { error } = await supabase.from('draft').upsert({
                    user_id: session.user.id,
                    inflation,
                    amounts,
                    client_data: clientData,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

                if (error) throw error;

            } catch (error: unknown) {
                const err = error as {
                    message?: string;
                    details?: string;
                    hint?: string;
                    code?: string;
                };

                console.error("FATAL ERROR en saveDraft:", err?.message, err?.details, err?.hint, err?.code);
            }
        }, 800);

        //Cleanup: matar el timer si el componente se desmonta
        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
        };
    }, [inflation, amounts, clientData, isLoaded]);

    // Logica de Negocio (Acciones)
    const adjustQuantity = (id: number, delta: number) => {
        setAmounts(prev => ({
            ...prev,
            [id]: Math.min(999, Math.max(0, (prev[id] || 0) + delta))
        }));
        setShareUrl(null); // Invalida la URL compartida si se cambia algo
    };

    const handleClean = async () => {
        if (!confirm('¿Borrar todo?')) return;

        if (saveTimer.current) {
            clearTimeout(saveTimer.current);
        } // Evitar que se guarde el draft después de limpiar

        setAmounts({});
        setInflation(0);
        setClientData(DEFAULT_CLIENT);
        setShareUrl(null);
        setFormKey(prev => prev + 1); // Resetea el formulario

        try {
         //Limpiar draft en DB
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
            const { error } = await supabase.from('draft').upsert({
                user_id: session.user.id,
                inflation: 0,
                amounts: {},
                client_data: DEFAULT_CLIENT,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

            if (error) throw error;
        }
        } catch (error: unknown) {
            const err = error as {
                message?: string;
                details?: string;
                hint?: string;
                code?: string;
            };

            console.error('Error al blanquear el borrador en la DB:', err?.message, err?.details, err?.hint, err?.code);
        }
    }

    // Guardar presupuesto en DB y generar URL compartible
    const shareBudget = async (): Promise<string | null> => {
        if (activeItems.length === 0) {
            alert("Agrega al menos un item para compartir el presupuesto.");
            return null;
        }

        setIsSharing(true);
        try {
            //1. Insertar cabecera del presupuesto
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuario no autenticado");

            const { data: budget, error: budgetError } = await supabase
                .from('budget')
                .insert({
                    user_id: user.id,
                    client: clientData.client || 'Sin Nombre',
                    address: clientData.address || '',
                    phone: clientData.phone || '',
                    validity: clientData.validity,
                    inflation,
                    total: Math.round(total),
                    professional_name: profile?.name ?? null,
                    company_name: profile?.company_name ?? null,
                    matricula: profile?.matricula ?? null,
                    professional_phone: profile?.phone ?? null,
                })
                .select('id')
                .single();

                if (budgetError || !budget) throw budgetError;

                //2. Insertar lineas del presupuesto (con snapshot de precios)
                const budgetItems = activeItems.map(item => ({
                    budget_id: budget.id,
                    item_id: item.id,
                    quantity: amounts[item.id],
                    price_snapshot: item.price,
                    name_snapshot: item.name,
                    category_snapshot: item.categories?.name ?? 'Sin categoria',
                }));

                const { error: itemsError } = await supabase
                    .from('budget_items')
                    .insert(budgetItems);

                    if (itemsError) throw itemsError;

                const url = `${window.location.origin}/share/${budget.id}`;
                setShareUrl(url);
                return url;
        } catch (err) {
            console.error("Error al guardar presupuesto:", err);
            alert('Hubo un error al guardar el presupuesto. Revisa la consola.');
            return null;
        } finally {
            setIsSharing(false);
        }
    }

    const total = useMemo(() => {
        return items.reduce((acc, item) => {
            const quantity = amounts[item.id] || 0;
            return acc + quantity * item.price * (1 + inflation / 100);
        }, 0);
    }, [items, amounts, inflation])

    const groupedItems = useMemo(() => {
        const groups: { [key: string]: { categoryName: string; items: Item[] } } = {};

        items.forEach((item) => {
            const catName = item.categories?.name ?? 'Sin categoria';

            if (!groups[catName]) {
                groups[catName] = { categoryName: catName, items: [] };
            }
            groups[catName].items.push(item);
        });

        return Object.values(groups).sort((a, b) => a.categoryName.localeCompare(b.categoryName)
        );
    }, [items]);

    return {
        items,
        groupedItems,
        isLoadingItems,
        inflation,
        setInflation,
        setAmounts,
        amounts,
        clientData,
        setClientData,
        total,
        isLoaded,
        adjustQuantity,
        handleClean,
        shareBudget,
        isSharing,
        shareUrl,
        activeItems,
        formKey,
        profile,
        isLoadingProfile,
    };
}