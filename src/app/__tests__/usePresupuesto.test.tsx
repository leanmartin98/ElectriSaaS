import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// ------- Datos de prueba -------
const MOCK_ITEMS = [
    { id: 1, name: 'Cable 2.5mm', price: 1000, categories: { name: 'Cables' } },
    { id: 2, name: 'Termica 16A', price: 5000, categories: { name: 'Protecciones' } },
    { id: 3, name: 'Caño corrugado', price: 300, categories: { name: 'Cables' } },
];
 
// Query builder "thenable": todos los metodos encadenables decuelven el
// mismo objeto, y al hacer 'await' sobre el se resuelve con el resultado
// configurado para esa tabla. Esto evita tener que replicar la cadena
// exacta (.select().order() VS .insert().select()) en cada test.
function createQueryBuilder(result: { data?: unknown; error?: unknown }) {
    const builder: Record<string, unknown> = {
        select: vi.fn(() => builder),    
        insert: vi.fn(() => builder),      
        update: vi.fn(() => builder),
        upsert: vi.fn(() => builder),
        delete: vi.fn(() => builder),
        order: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        single: vi.fn(() => builder),
        then: (resolve: (value: unknown) => void) => Promise.resolve(result).then(resolve),
    };
    return builder;
}

const mockGetUser = vi.fn();
const mockFromResults: Record<string, { data?: unknown; error?: unknown }> = {};

vi.mock('@/app/lib/supabase', () => ({
    supabase: {
        from: (table: string) => createQueryBuilder(mockFromResults[table] ?? { data: null, error: null }),
        auth: { 
            getUser: () => mockGetUser(),
            getSession: () => Promise.resolve({ data: { session: { user: { id: 'user-abc' } } } }), 
        },
    },
}));

import { usePresupuesto } from '../budget/hooks/usePresupuesto';
import { act } from 'react';


function setItemsResult(
    data: unknown[] | null = MOCK_ITEMS, 
    error: { message: string } | null = null
) {
    mockFromResults['items'] = { data, error };
}

beforeEach(() => {
    localStorage.clear();

    //Simular interacciones de ventana
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    // Cargar dataset por defecto
    setItemsResult();
    mockFromResults['budget'] = { data: { id: 'budget-123' }, error: null };
    mockFromResults['budget_items'] = { data: null, error: null };
    mockFromResults['draft'] = { data: null, error: null };
    
    // Autenticacion por defecto
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-abc' } } });
});

afterEach(() => {
    vi.restoreAllMocks();
});

// Helper: espera a que termine la carga inicial de items y localStorage
async function renderLoadedHook() {
    const view = renderHook(() => usePresupuesto());
    await waitFor(() => expect(view.result.current.isLoadingItems).toBe(false));
    await waitFor(() => expect(view.result.current.isLoaded).toBe(true));
    return view;
}

describe('usePresupuesto', () => {

    describe('carga inicial', () => {
        it('carga los items desde Supabase y los agrupa por categoria', async() => {
            const { result } = await renderLoadedHook();

            expect(result.current.items).toHaveLength(3);
            const categoryNames = result.current.groupedItems.map(g => g.categoryName);
            expect(categoryNames).toEqual(['Cables', 'Protecciones']); // Orden Alfabeticos
        });

        it('deja items vacio y no rompe si Supabase devuelve error', async() => {
            setItemsResult(null, { message: 'boom' });
            const { result } = await renderLoadedHook();

            expect(result.current.items).toEqual([]);
            expect(result.current.groupedItems).toEqual([]);
        });

        it('arranca sin cantidades ni inflacion si no hay nada en localStorage', async() => {
            const { result } = await renderLoadedHook();
            
            expect(result.current.inflation).toBe(0);
            expect(result.current.amounts).toEqual({});
            expect(result.current.activeItems).toEqual([]);
        });
    });

    describe('adjustQuantity', () => {
        it('incrementa la cantidad de un item', async() => {
            const { result } = await renderLoadedHook();

            act(() => result.current.adjustQuantity(1, 1));

            expect(result.current.amounts[1]).toBe(1);
        });

        it('nunca deja la cantidad en negativo (clamp en 0)', async () => {
            const { result } = await renderLoadedHook();

            act(() => result.current.adjustQuantity(1, 2));
            expect(result.current.amounts[1]).toBe(2);

            act(() => result.current.adjustQuantity(1, -1));
            expect(result.current.amounts[1]).toBe(1);
        });

        it('acumula incrementos sucesivos', async () => {
            const { result } = await renderLoadedHook();

            act(() => {
                result.current.adjustQuantity(2, 1);
                result.current.adjustQuantity(2, 1);
                result.current.adjustQuantity(2, 1);
            });
            expect(result.current.amounts[2]).toBe(3);
        });

        it('agrega el item a activeItems solo cuando su cantidad es > 0', async () => {
            const { result } = await renderLoadedHook();

            act(() => result.current.adjustQuantity(3, 2));

            expect(result.current.activeItems.map(i => i.id)).toEqual([3]);

            act(() => result.current.adjustQuantity(3, -2));

            expect(result.current.activeItems).toEqual([]);
        });
    });

    describe('calculo de total', () => {
        it('calcula el total sin inflacion', async () => {
            const { result } = await renderLoadedHook();

            act(() => {
                result.current.adjustQuantity(1, 2); // 2 * 1000 = 2000
                result.current.adjustQuantity(2, 1); // 1 * 5000 = 5000
            });

            expect(result.current.total).toBe(7000);
        });

        it('aplica el porcentaje de inflacion sobre el total', async () => {
            const { result } = await renderLoadedHook();

            act(() => {
                result.current.adjustQuantity(1, 2);
                result.current.setInflation(10);
            });

            expect(result.current.total).toBe(2200);
        });

        it('el total es 0 si no hay items seleccionados', async () => {
            const { result } = await renderLoadedHook();
            expect(result.current.total).toBe(0);
        });
    });

    describe('handleClean', () => {
        it('limpia cantidades, inflacion, cliente y shareUrl al confirmar', async () => {
            const { result } = await renderLoadedHook();

            act(() => {
                result.current.adjustQuantity(1, 3);
                result.current.setInflation(15);
            });
            expect(result.current.amounts[1]).toBe(3);

            await act(async () => await result.current.handleClean());

            expect(result.current.amounts).toEqual({});
            expect(result.current.inflation).toBe(0);
            expect(result.current.shareUrl).toBeNull();
        });

        it('no borra nada si el usuario cancela la confirmacion', async () => {
            const { result } = await renderLoadedHook();

            act(() => result.current.adjustQuantity(1, 3));
            expect(result.current.amounts[1]).toBe(3);

            vi.spyOn(window, 'confirm').mockReturnValue(false);

            await act(async () => result.current.handleClean());

            expect(result.current.amounts[1]).toBe(3);
            expect(result.current.amounts).toEqual({1: 3});
        });
    });

    describe('shareBudget', () => {
        it('devuelve null y alerta si no hay items activos', async () => {
            const { result } = await renderLoadedHook();

            let url: string | null = null;
            await act(async () => {
                url = await result.current.shareBudget();
            });

            expect(url).toBeNull();
            expect(window.alert).toHaveBeenCalled();
        });

        it('genera una URL compartible si hay items y usuario autenticado', async () => {
            const { result } = await renderLoadedHook();

            act(() => result.current.adjustQuantity(1, 2));

            let url: string | null = null;
            await act(async () => {
                url = await result.current.shareBudget();
            });

            expect(url).toContain('/share/budget-123');
            expect(result.current.shareUrl).toBe(url);
        });

        it('devuelve null si supabase falla al insertar el presupuesto', async () => {
            mockFromResults['budget'] = { data: null, error: { message: 'insert failed'}};
            const { result } = await renderLoadedHook();

            act(() => result.current.adjustQuantity(1, 1));

            let url: string | null = null;
            await act(async () => {
                url = await result.current.shareBudget();
            });

            expect(url).toBeNull();
        });
    });

    describe('persistencia en loadDraft', () => {
        it('restaura inflacion, cantidades y clientes guardados', async () => {
            mockFromResults['draft'] = {
                data: {
                    inflation: 20,
                    amounts: { 1: 5 },
                    client_data: { client: 'Juan Perez', address: 'Calle Falsa 123', phone: '+541112345678', validity: '2026-01-01' },
                },
                error: null
            };

            const { result } = await renderLoadedHook();

            expect(result.current.inflation).toBe(20);
            expect(result.current.amounts).toEqual({ 1: 5 });
            expect(result.current.clientData.client).toBe('Juan Perez');
    });
});
});