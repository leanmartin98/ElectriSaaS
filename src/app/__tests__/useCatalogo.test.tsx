import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// ------- Datos de prueba -------
const MOCK_CATEGORIES = [
    { id: 1, name: 'Cables' },
    { id: 2, name: 'Protecciones' },
];

const MOCK_ITEMS = [
    { id: 1, name: 'Cable 2.5mm', price: 1000, unit: 'metro', active: true, category_id: 1, categories: { name: 'Cables' } },
    { id: 2, name: 'Termica 16A', price: 5000, unit: 'unidad', active: false, category_id: 2, categories: { name: 'Protecciones' } }
];

type Result = { data?: unknown; error?: unknown };
type Builder = Record<string, Mock>;

// Query builder "thenable": todos los metodos encadenables devuelven el mismo
// objeto y al hacer 'await' se resuelve con el resultado configurado para la tabla.
function createQueryBuider(result: Result): Builder {
    const builder: Builder = {
        select: vi.fn(() => builder),
        insert: vi.fn(() => builder),
        update: vi.fn(() => builder),
        delete: vi.fn(() => builder),
        order: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        single: vi.fn(() => builder),
        then: vi.fn((resolve: (value: unknown) => void) => Promise.resolve(result).then(resolve)),
    };
    return builder;
}

// Registro de todos los builders creados, para inspeccionar que se llamó en cada tabla
const builders: { table: string; builder: Builder }[] = [];
const mockGetUser = vi.fn();
const mockFromResults: Record<string, Result> = {};

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: (table: string) => {
            const builder = createQueryBuider(mockFromResults[table] || { data: [], error: null });
            builders.push({ table, builder });
            return builder;
        },
        auth: { getUser: () => mockGetUser() },
    },
}));

import { useCatalogo } from '@/hooks/useCatalogo';

const buildersOf = (table: string) => builders.filter(b => b.table === table).map(b => b.builder);

// Devuelve el builder de `table` en el que se llamó a `method`
function findBuilder(table: string, method: string): Builder {
    const found = buildersOf(table).find(b => b[method].mock.calls.length > 0);
    if (!found) throw new Error(`No se llamó a ${table}.${method}`);
    return found;
}

// Cuantas veces se hizo un select sobre la tabla (carga inicial + recargas)
const selectCount = (table: string) =>
    buildersOf(table).filter(b => b.select.mock.calls.length > 0).length;

type Outcome = { ok: boolean; error?: string } | undefined;

const NEW_ITEM = { name: 'Cable 4mm', category_id: 1, price: 1500, unit: 'metro' as const };

beforeEach(() => {
    builders.length = 0;
    vi.spyOn(console, 'error').mockImplementation(() => {}); // logError ensucia la salida

    mockFromResults['items'] = { data: MOCK_ITEMS, error: null };
    mockFromResults['categories'] = { data: MOCK_CATEGORIES, error: null };
    mockFromResults['profiles'] = { data: { is_admin: true }, error: null };
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-abc' } } });
});

afterEach(() => {
    vi.restoreAllMocks();
});

async function renderLoadedHook() {
    const view = renderHook(() => useCatalogo());
    await waitFor(() => expect(view.result.current.isloading).toBe(false));
    return view;
}

describe('useCatalogo', () => {

    describe('carga inicial', () => {
        it('carga items y categorias', async () => {
            const { result } = await renderLoadedHook();

            expect(result.current.items).toHaveLength(2);
            expect(result.current.categories).toEqual(MOCK_CATEGORIES);
        });

        it('marca isAdmin cuando el perfil es admin', async () => {
           const { result } = await renderLoadedHook();
            expect(result.current.isAdmin).toBe(true); 
        });

        it('isAdmin es false si el perfil no es admin', async () => {
            mockFromResults['profiles'] = { data: { is_admin: false }, error: null };
            const { result } = await renderLoadedHook();
            expect(result.current.isAdmin).toBe(false);
        });

        it('isAdmin es false y no consulta profiles si no hay usuario', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const { result } = await renderLoadedHook();

            expect(result.current.isAdmin).toBe(false);
            expect(buildersOf('profiles')).toHaveLength(0);
        });

        it('deja items vacío y no rompe si Supabase devuelve error', async () => {
            mockFromResults['items'] = { data: null, error: { message: 'boom' } };
            const { result } = await renderLoadedHook();

            expect(result.current.items).toEqual([]);
            expect(result.current.categories).toEqual(MOCK_CATEGORIES);
        });
    });

    describe('saveItem', () => {
       it('inserta cuando no se pasa id', async () => {
            const { result } = await renderLoadedHook();

            let outcome: Outcome;
            await act(async () => {
                outcome = await result.current.saveItem(NEW_ITEM);
            });

            expect(outcome?.ok).toBe(true);
            expect(findBuilder('items', 'insert').insert).toHaveBeenCalledWith(
                expect.objectContaining({ ...NEW_ITEM, updated_at: expect.any(String) })
            );
        });

        it('actualiza filtrando por id cuando se pasa id', async () => {
            const { result } = await renderLoadedHook();

            await act(async () => {
                await result.current.saveItem(NEW_ITEM, 7);
            });

            const writer = findBuilder('items', 'update');
            expect(writer.update).toHaveBeenCalledWith(expect.objectContaining(NEW_ITEM));
            expect(writer.eq).toHaveBeenCalledWith('id', 7);
        });

        it('recarga el catálogo después de guardar', async () => {
            const { result } = await renderLoadedHook();
            expect(selectCount('items')).toBe(1);

            await act(async () => {
                await result.current.saveItem(NEW_ITEM);
            });

            expect(selectCount('items')).toBe(2);
        });

         it('devuelve error y no recarga si Supabase falla', async () => {
            const { result } = await renderLoadedHook();
            mockFromResults['items'] = { data: null, error: { code: 'XX', message: 'insert failed' } };

            let outcome: Outcome;
            await act(async () => {
                outcome = await result.current.saveItem(NEW_ITEM);
            });

            expect(outcome?.ok).toBe(false);
            expect(outcome?.error).toMatch(/no se pudo guardar/i);
            expect(selectCount('items')).toBe(1);
        });
    })

    describe('toggleActive', () => {
        it('archiva un item activo', async () => {
            const { result } = await renderLoadedHook();

            await act(async () => {
                await result.current.toggleActive(result.current.items[0]); // activo
            });

            const writer = findBuilder('items', 'update');
            expect(writer.update).toHaveBeenCalledWith(expect.objectContaining({ active: false }));
            expect(writer.eq).toHaveBeenCalledWith('id', 1);
        });

        it('restaura un item archivado', async () => {
            const { result } = await renderLoadedHook();

            await act(async () => {
                await result.current.toggleActive(result.current.items[1]); // archivado
            });

            const writer = findBuilder('items', 'update');
            expect(writer.update).toHaveBeenCalledWith(expect.objectContaining({ active: true }));
            expect(writer.eq).toHaveBeenCalledWith('id', 2);
        });
    });

    describe('saveCategory', () => {
        it('inserta una categoría nueva', async () => {
            const { result } = await renderLoadedHook();

            let outcome: Outcome;
            await act(async () => {
                outcome = await result.current.saveCategory('Cañerías');
            });

            expect(outcome?.ok).toBe(true);
            expect(findBuilder('categories', 'insert').insert).toHaveBeenCalledWith({ name: 'Cañerías' });
        });

        it('renombra una categoría existente', async () => {
            const { result } = await renderLoadedHook();

            await act(async () => {
                await result.current.saveCategory('Tableros', 2);
            });

            const writer = findBuilder('categories', 'update');
            expect(writer.update).toHaveBeenCalledWith({ name: 'Tableros' });
            expect(writer.eq).toHaveBeenCalledWith('id', 2);
        });

         it('devuelve el mensaje de duplicado ante el error 23505', async () => {
            const { result } = await renderLoadedHook();
            mockFromResults['categories'] = { data: null, error: { code: '23505', message: 'duplicate' } };

            let outcome: Outcome;
            await act(async () => {
                outcome = await result.current.saveCategory('Cables');
            });

            expect(outcome?.ok).toBe(false);
            expect(outcome?.error).toMatch(/ya existe una categoría/i);
        });

         it('devuelve un mensaje genérico ante otros errores', async () => {
            const { result } = await renderLoadedHook();
            mockFromResults['categories'] = { data: null, error: { code: 'XX', message: 'boom' } };

            let outcome: Outcome;
            await act(async () => {
                outcome = await result.current.saveCategory('Cajas');
            });

            expect(outcome?.error).toMatch(/no se pudo guardar la categoría/i);
        });
    });

    describe('deleteCategory', () => {
        it('borra la categoría por id y recarga', async () => {
            const { result } = await renderLoadedHook();

            let outcome: Outcome;
            await act(async () => {
                outcome = await result.current.deleteCategory(2);
            });

            expect(outcome?.ok).toBe(true);
            expect(findBuilder('categories', 'delete').eq).toHaveBeenCalledWith('id', 2);
            expect(buildersOf('categories').filter(b => b.select.mock.calls.length > 0)).toHaveLength(2);
        });

        it('avisa que tiene items asociados ante el error 23503', async () => {
            const { result } = await renderLoadedHook();
            mockFromResults['categories'] = { data: null, error: { code: '23503', message: 'fk violation' } };

            let outcome: Outcome;
            await act(async () => {
                outcome = await result.current.deleteCategory(1);
            });

            expect(outcome?.ok).toBe(false);
            expect(outcome?.error).toMatch(/items asociados/i);
        });
    });
})