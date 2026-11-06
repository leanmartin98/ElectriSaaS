import { describe, it, expect, vi } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ItemForm from '@/app/admin/components/ItemForm';
import type { CatalogItem } from '@/hooks/useCatalogo';
import type { ItemFormData } from '@/schema/validations';

const CATEGORIES = [
    { id: 1, name: 'Cables' },
    { id: 2, name: 'Protecciones' },
];

const EXISTING: CatalogItem = {
    id: 9,
    name: 'Termica 16A',
    price: 2500,
    unit: 'unidad',
    active: true,
    category_id: 2,
    categories: { name: 'Protecciones' },
};

type SubmitMock = Mock<(values: ItemFormData) => Promise<{ ok: boolean; error?: string }>>;

function setup({
    initial,
    onSubmit = vi.fn<(values: ItemFormData) => Promise<{ ok: boolean; error?: string }>>().mockResolvedValue({ ok: true }),
}: { initial?: CatalogItem; onSubmit?: SubmitMock } = {}) {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<ItemForm categories={CATEGORIES} initial={initial} onSubmit={onSubmit} onCancel={onCancel} />);
    return { onSubmit, onCancel, user };
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText(/^nombre$/i), 'Cable 4mm');
    await user.selectOptions(screen.getByLabelText(/^categoría$/i), 'Cables');
    await user.type(screen.getByLabelText(/^precio$/i), '1500');
    await user.selectOptions(screen.getByLabelText(/^unidad$/i), 'metro');
}

describe('ItemForm', () => {
    it('muestra errores de validación al enviar vacío', async () => {
        const { onSubmit, user } = setup();

        await user.click(screen.getByRole('button', { name: /guardar/i }));

        expect(await screen.findByText(/el nombre es obligatorio/i)).toBeInTheDocument();
        expect(await screen.findByText(/seleccioná una categoría/i)).toBeInTheDocument();
        expect(await screen.findByText(/ingresa un precio válido/i)).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('rechaza un precio igual a 0', async () => {
        const { onSubmit, user } = setup();

        await fillValid(user);
        const price = screen.getByLabelText(/^precio$/i);
        await user.clear(price);
        await user.type(price, '0');
        await user.click(screen.getByRole('button', { name: /guardar/i }));

        expect(await screen.findByText(/el precio debe ser mayor a 0/i)).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('envía los valores con los tipos correctos cuando el formulario es válido', async () => {
        const { onSubmit, user } = setup();

        await fillValid(user);
        await user.click(screen.getByRole('button', { name: /guardar/i }));

        await vi.waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith({
                name: 'Cable 4mm',
                category_id: 1,
                price: 1500,
                unit: 'metro',
            })
        );
    });

    it('en modo edición prellena los campos', () => {
        setup({ initial: EXISTING });

        expect(screen.getByRole('heading', { name: /editar material/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/^nombre$/i)).toHaveValue('Termica 16A');
        expect(screen.getByLabelText(/^categoría$/i)).toHaveValue('2');
        expect(screen.getByLabelText(/^precio$/i)).toHaveValue(2500);
        expect(screen.getByLabelText(/^unidad$/i)).toHaveValue('unidad');
    });

    it('en modo alta muestra el título de nuevo material', () => {
        setup();
        expect(screen.getByRole('heading', { name: /nuevo material/i })).toBeInTheDocument();
    });

    it('muestra el error que devuelve el servidor', async () => {
        const onSubmit = vi.fn<(values: ItemFormData) => Promise<{ ok: boolean; error?: string }>>()
            .mockResolvedValue({ ok: false, error: 'No se pudo guardar el item. Intentá nuevamente.' });
        const { user } = setup({ onSubmit });

        await fillValid(user);
        await user.click(screen.getByRole('button', { name: /guardar/i }));

        expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo guardar el item/i);
    });

    it('llama a onCancel al presionar cancelar', async () => {
        const { onCancel, user } = setup();

        await user.click(screen.getByRole('button', { name: /cancelar/i }));

        expect(onCancel).toHaveBeenCalledTimes(1);
    });
});