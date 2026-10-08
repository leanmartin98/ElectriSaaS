// 1. Función para calcular la fecha de vencimiento (5 días a partir de hoy)
const getExpirationDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 5);
    return date.toISOString().split('T')[0];
}

// 2. Lista de items y precios base


// 3. Datos del cliente por defecto
export const DEFAULT_CLIENT = {
    client: '',
    address: '',
    phone: '',
    validity: getExpirationDate(),
}