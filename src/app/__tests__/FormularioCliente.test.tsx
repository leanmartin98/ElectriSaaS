import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import FormularioCliente from '@/app/budget/components/FormularioCliente';
import type { ClientFormData } from '@/schema/validations';

const getDefaultDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 5);
    return date.toISOString().split('T')[0];
};

const emptyData: ClientFormData = {
    client: '',
    address: '',
    phone: '',
    validity: getDefaultDate(),
};

const filledData: ClientFormData = {
    client: 'John Doe',
    address: 'Av. Siempre Viva 742',
    phone: '1234567890',
    validity: getDefaultDate(),
};

function setup(data: ClientFormData = emptyData) {
    const setData = vi.fn();
    const onClean = vi.fn();
    const user = userEvent.setup();

    render(<FormularioCliente data={data} setData={setData} onClean={onClean} />);

    return { setData, onClean, user };
};

describe('FormularioCliente', () => {
    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('prellena los campos con los datos recibidos por props', () => {
        setup(filledData);

        expect(screen.getByLabelText(/client/i)).toHaveValue(
            filledData.client
        );
        expect(screen.getByLabelText(/whatsapp/i)).toHaveValue(filledData.phone);
        expect(screen.getByLabelText(/direcci[oó]n/i)).toHaveValue(filledData.address);
    });

    it('muestra errores de validación al enviar el formulario vacio', async () => {
        const { setData, user } = setup(emptyData);

        await user.click(screen.getByRole('button', { name: /guardar datos/i }));

        expect(await screen.findByText(/el nombre del cliente es obligatorio/i)).toBeInTheDocument();
        expect(await screen.findByText(/el número de teléfono es obligatorio/i)).toBeInTheDocument();
        expect(await screen.findByText(/la dirección es obligatoria/i)).toBeInTheDocument();
        expect(setData).not.toHaveBeenCalled();
    });

    it('rechaza un teléfono inválido', async () => {
        const { setData, user } = setup(emptyData);

        await user.type(screen.getByLabelText(/cliente/i), 'Aná Gomez');
        await user.type(screen.getByLabelText(/whatsapp/i), 'abc');
        await user.type(screen.getByLabelText(/direcci[oó]n/i), 'Avenida Siempre Viva 742');

        await user.click(screen.getByRole('button', { name: /guardar datos/i }));

        expect(await screen.findByText(/ingresa un número de teléfono válido/i)).toBeInTheDocument();
        expect(setData).not.toHaveBeenCalled();
    });

    it('llama a setData con los valores cuando el formulario es válido', async () => {
        const { setData, user } = setup(emptyData);

        await user.type(screen.getByLabelText(/cliente/i), filledData.client);
        await user.type(screen.getByLabelText(/whatsapp/i), filledData.phone);
        await user.type(screen.getByLabelText(/direcci[oó]n/i), filledData.address);

        await user.click(screen.getByRole('button', { name: /guardar datos/i }));

        expect(setData).toHaveBeenCalledWith(filledData);

        await waitFor(() => {
            expect(setData).toHaveBeenCalledWith(
                expect.objectContaining({
                    client: filledData.client,
                    phone: filledData.phone,
                    address: filledData.address,
                })
            );
        });
    });

    it('muestra el mensaje de éxito tras un envio válido y lo oculta luego del reset diferido', async () => {
        const { user } = setup(filledData);

        await user.click(screen.getByRole('button', { name: /guardar datos/i }));

        expect(await screen.findByText(/datos guardados correctamente/i)).toBeInTheDocument();

        // El componente hace reset(values) 3s despues, lo que limpia isSubmitSuccessful
        await vi.advanceTimersByTimeAsync(3000);

        await waitFor(() => {
            expect(screen.queryByText(/datos guardados correctamente/i)).not.toBeInTheDocument();
        });
    });

    it('llama a onClean y limpia los campos al presionar limpiar', async () => {
        const { onClean, user } = setup(filledData);

        await user.click(screen.getByRole('button', { name: /limpiar/i }));

        expect(onClean).toHaveBeenCalledTimes(1);
        await waitFor(() => {
        expect(screen.getByLabelText(/cliente/i)).toHaveValue('');
        expect(screen.getByLabelText(/whatsapp/i)).toHaveValue('');
        expect(screen.getByLabelText(/direcci[oó]n/i)).toHaveValue('');
        });
    })
});