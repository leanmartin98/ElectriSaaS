import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryManager from '@/app/admin/components/CategoryManager';

const CATEGORIES = [
    { id: 1, name: 'Cajas' },
    { id: 2, name: 'Cables' },
];

function setup({
    onSave = vi.fn().mockResolvedValue({ ok: true }),
    onDelete = vi.fn().mockResolvedValue({ ok: true }),
} = {}) {
    const user = userEvent.setup();
    render(<CategoryManager categories={CATEGORIES} onSave={onSave} onDelete={onDelete} />);
    return { onSave, onDelete, user };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('CategoryManager', () => {
    it('lista las categorías existentes', () => {
        setup();
        expect(screen.getByText('Cajas')).toBeInTheDocument();
        expect(screen.getByText('Cables')).toBeInTheDocument();
    });

    describe('agregar', () => {
        it('agrega una categoría válida (sin espacios sobrantes) y limpia el input', async () => {
            const { onSave, user } = setup();
            const input = screen.getByLabelText(/nueva categoría/i);

            await user.type(input, '  Cañerías ');
            await user.click(screen.getByRole('button', { name: /agregar/i }));

            expect(onSave).toHaveBeenCalledWith('Cañerías', undefined);
            await waitFor(() => expect(input).toHaveValue(''));
        });

        it('rechaza un nombre vacío', async () => {
            const { onSave, user } = setup();

            await user.click(screen.getByRole('button', { name: /agregar/i }));

            expect(await screen.findByText(/el nombre es obligatorio/i)).toBeInTheDocument();
            expect(onSave).not.toHaveBeenCalled();
        });

        it('rechaza un duplicado sin distinguir mayúsculas', async () => {
            const { onSave, user } = setup();

            await user.type(screen.getByLabelText(/nueva categoría/i), 'cajas');
            await user.click(screen.getByRole('button', { name: /agregar/i }));

            expect(
                await screen.findByText((content) => content.toLowerCase().includes('ya existe una categoría con ese nombre'))
            ).toBeInTheDocument();
            
            expect(onSave).not.toHaveBeenCalled();
        });

        it('muestra el error que devuelve el servidor', async () => {
            const onSave = vi.fn().mockResolvedValue({ ok: false, error: 'No se pudo guardar la categoría.' });
            const { user } = setup({ onSave });

            await user.type(screen.getByLabelText(/nueva categoría/i), 'Tableros');
            await user.click(screen.getByRole('button', { name: /agregar/i }));

            expect(await screen.findByText(/no se pudo guardar la categoría/i)).toBeInTheDocument();
        });
    });

    describe('renombrar', () => {
        it('precarga el nombre actual y permite cambiar solo las mayúsculas de la misma categoría', async () => {
            const { onSave, user } = setup();

            await user.click(screen.getAllByRole('button', { name: /renombrar/i })[0]);
            const input = screen.getByLabelText(/renombrar cajas/i);
            expect(input).toHaveValue('Cajas');

            await user.clear(input);
            await user.type(input, 'CAJAS');
            await user.click(screen.getByRole('button', { name: /^ok$/i }));

            expect(onSave).toHaveBeenCalledWith('CAJAS', 1);
        });

        it('rechaza renombrar al nombre de OTRA categoría', async () => {
            const { onSave, user } = setup();

            await user.click(screen.getAllByRole('button', { name: /renombrar/i })[0]);
            const input = screen.getByLabelText(/renombrar cajas/i);
            await user.clear(input);
            await user.type(input, 'cables');
            await user.click(screen.getByRole('button', { name: /^ok$/i }));

            expect(await screen.findByText(/ya existe una categoría con ese nombre/i)).toBeInTheDocument();
            expect(onSave).not.toHaveBeenCalled();
        });

        it('cancela la edición sin guardar', async () => {
            const { onSave, user } = setup();

            await user.click(screen.getAllByRole('button', { name: /renombrar/i })[0]);
            await user.click(screen.getByRole('button', { name: /cancelar/i }));

            expect(onSave).not.toHaveBeenCalled();
            expect(screen.queryByLabelText(/renombrar cajas/i)).not.toBeInTheDocument();
        });
    });

    describe('borrar', () => {
        it('borra la categoría al confirmar', async () => {
            vi.spyOn(window, 'confirm').mockReturnValue(true);
            const { onDelete, user } = setup();

            await user.click(screen.getAllByRole('button', { name: /borrar/i })[0]);

            expect(onDelete).toHaveBeenCalledWith(1);
        });

        it('no borra si el usuario cancela la confirmación', async () => {
            vi.spyOn(window, 'confirm').mockReturnValue(false);
            const { onDelete, user } = setup();

            await user.click(screen.getAllByRole('button', { name: /borrar/i })[0]);

            expect(onDelete).not.toHaveBeenCalled();
        });

        it('muestra el error cuando la categoría tiene items asociados', async () => {
            vi.spyOn(window, 'confirm').mockReturnValue(true);
            const onDelete = vi.fn().mockResolvedValue({ ok: false, error: 'La categoría tiene items asociados.' });
            const { user } = setup({ onDelete });

            await user.click(screen.getAllByRole('button', { name: /borrar/i })[0]);

            expect(await screen.findByText(/items asociados/i)).toBeInTheDocument();
        });
    });
});