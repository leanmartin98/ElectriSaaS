export const unitPriceWithInflation = (price: number, inflation: number) =>
    Math.round(price * (1 + inflation / 100));

export const lineSubtotal = (price: number, quantity: number, inflation: number) =>
    quantity * unitPriceWithInflation(price, inflation);