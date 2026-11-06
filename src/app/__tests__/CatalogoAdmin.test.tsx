import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockUseCatalogo = vi.fn();
vi.mock('@/hooks/useCatalogo', () => ({
    useCatalogo: () => mockUseCatalogo(),
}));

import CatalogoAdmin from '@/app/admin/components/CatalogoAdmin';

const CATEGORIES = [
    { id: 1, name: 'Cables' },
    { id: 2, name: 'Protecciones' },
];

const ITEMS = [
    // El join embebido viene en null: el nombre debe resolverse por category_id
    { id: 1, name: 'Cable 2.5mm', price: 1000, unit: 'metro', active: true, category_id: 1, categories: null },
    { id: 2, name: 'Termica 16A', price: 5000, unit: 'unidad', active: true, category_id: 2, categories: { name: 'Protecciones' } },
    { id: 3, name: 'Cable viejo', price: 10, unit: 'metro', active: false, category_id: 1, categories: { name: 'Cables' } },
];

function setup(overrides: Record<string, unknown> = {}) {
    const hook = {
        items: ITEMS,
        categories: CATEGORIES,
        isAdmin: true,
        isLoading: false,
        saveItem: vi.fn().mockResolvedValue({ ok: true }),
        toggleActive: vi.fn().mockResolvedValue({ ok: true }),
        saveCategory: vi.fn().mockResolvedValue({ ok: true }),
        deleteCategory: vi.fn().mockResolvedValue({ ok: true }),
        ...overrides,
    };
    mockUseCatalogo.mockReturnValue(hook);
    const user = userEvent.setup();
    render(<CatalogoAdmin />);
    return { hook, user };
}

const table = () => within(screen.getByRole('table'));

describe('CatalogoAdmin', () => {
    it('muestra un mensaje de carga mientras se obtienen los datos', () => {
        setup({ isloading: true });
        expect(screen.getByText(/cargando catálogo/i)).toBeInTheDocument();
    });

    it('no tenés permiso para administrar el catálogo', () => {
        setup({ isAdmin: false });

        expect(screen.getByText(/no tenés permiso/i)).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    describe('listado', () => {
        it('oculta los archivados por defecto y los muestra con "Ver archivados"', async () => {
            const { user } = setup();

            expect(table().getByText('Cable 2.5mm')).toBeInTheDocument();
            expect(table().queryByText('Cable viejo')).not.toBeInTheDocument();

            await user.click(screen.getByLabelText(/ver archivados/i));

            expect(table().getByText('Cable viejo')).toBeInTheDocument();
        });

        it('resuelve el nombre de la categoría por category_id aunque el join venga en null', () => {
            setup();

            const row = screen.getByText('Cable 2.5mm').closest('tr') as HTMLElement;
            expect(within(row).getByText('Cables')).toBeInTheDocument();
            expect(table().queryByText(/sin categoria/i)).not.toBeInTheDocument();
        });

        it('muestra "Sin categoría" si el category_id no existe', () => {
            setup({
                items: [{ ...ITEMS[0], category_id: 99 }],
            });

            expect(table().getByText(/sin categoria/i)).toBeInTheDocument();
        });

        it('filtra por texto de búsqueda', async () => {
            const { user } = setup();

            await user.type(screen.getByLabelText(/buscar material/i), 'termica');

            expect(table().getByText('Termica 16A')).toBeInTheDocument();
            expect(table().queryByText('Cable 2.5mm')).not.toBeInTheDocument();
        });

        it('filtra por categoría', async () => {
            const { user } = setup();

            await user.selectOptions(screen.getByLabelText(/filtrar por categoría/i), 'Protecciones');

            expect(table().getByText('Termica 16A')).toBeInTheDocument();
            expect(table().queryByText('Cable 2.5mm')).not.toBeInTheDocument();
        });

        it('muestra un mensaje cuando no hay resultados', async () => {
            const { user } = setup();

            await user.type(screen.getByLabelText(/buscar material/i), 'zzz');

            expect(screen.getByText(/no hay materiales para mostrar/i)).toBeInTheDocument();
        });
    });

    describe('acciones', () => {
        it('archiva un material activo', async () => {
            const { hook, user } = setup();

            await user.click(screen.getAllByRole('button', { name: /archivar/i })[0]);

            expect(hook.toggleActive).toHaveBeenCalledWith(ITEMS[0]);
        });

        it('abre el formulario de alta y vuelve al panel de categorías al cancelar', async () => {
            const { user } = setup();
            expect(screen.getByRole('heading', { name: /categorías/i })).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /nuevo material/i }));
            expect(screen.getByRole('heading', { name: /nuevo material/i })).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /cancelar/i }));
            expect(screen.getByRole('heading', { name: /categorías/i })).toBeInTheDocument();
        });

        it('abre el formulario de edición con los datos del material', async () => {
            const { user } = setup();

            await user.click(screen.getAllByRole('button', { name: /editar/i })[0]);

            expect(screen.getByRole('heading', { name: /editar material/i })).toBeInTheDocument();
            expect(screen.getByLabelText(/^nombre$/i)).toHaveValue('Cable 2.5mm');
        });
    });
});