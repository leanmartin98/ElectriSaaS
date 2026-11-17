"use client";
import { useState } from "react";
import { ChevronDown, Package } from "lucide-react";
import { lineSubtotal, unitPriceWithInflation } from '@/lib/pricing';

interface Item {
    id: number;
    name: string;
    price: number;
}

interface AccordionCategoryProps {
    categoryName: string;
    items: Item[];
    amounts: { [key: number]: number };
    inflation: number;
    adjustQuantity: (id: number, delta: number) => void;
}

export default function AccordionCategory({
    categoryName, 
    items, 
    amounts, 
    inflation, 
    adjustQuantity,
} : AccordionCategoryProps) {
    const [isOpen, setIsOpen] = useState(false);

    const categoryTotal = items.reduce((acc, item) => {
        return acc + lineSubtotal(item.price, amounts[item.id] || 0, inflation);
    }, 0);

    const selectedCount = items.reduce((acc, item) => acc + (amounts[item.id] || 0), 0);

    return (
        <article className="acc">
            <button 
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="acc-header"
                aria-expanded={isOpen}
                >
                <span className="acc-icon">
                    <Package size={20} />
                </span>

                <span className="acc-info">
                    <span className="acc-name">{categoryName}</span>
                    <span className="acc-meta">
                        {items.length} {items.length === 1 ? 'material' : 'materiales'}
                    </span>
                </span>
                
            {selectedCount > 0 && (
                <span className="acc-badge">{selectedCount > 999 ? '999+' : selectedCount}</span>
            )}
            {categoryTotal > 0 && (
                <span className="acc-total">
                    ${Math.round(categoryTotal).toLocaleString("es-AR")}
                </span>
            )}

            <ChevronDown 
               size={20}
               className={`acc-chevron ${isOpen ? 'acc-chevron--open' : ''}`}/>
            </button>

            {isOpen && (
                <div className="acc-body">
                    {items.map((item) => (
                        <div className="acc-item" key={item.id}>
                            <div className="acc-item-info">
                                <p className="acc-item-name">{item.name}</p>
                                <p className="acc-item-price">
                                    ${unitPriceWithInflation(item.price, inflation).toLocaleString("es-AR")}
                                </p>
                            </div>
                            <div className="acc-qty">
                                <button
                                type="button"
                                className="acc-qty-btn"
                                aria-label={`Restar uno a ${item.name}`}
                                onClick={() => adjustQuantity(item.id, -1)}
                                >
                                    -
                                </button>
                                <input
                                className="acc-qty-input"
                                type="number"
                                min="0"
                                max='999'
                                aria-label={`Cantidad de ${item.name}`}
                                value={amounts[item.id] || 0}
                                onChange={(e) => {
                                    const val = Math.min(999, Math.max(0, parseInt(e.target.value) || 0));
                                    adjustQuantity(item.id, val - (amounts[item.id] || 0));
                                }}
                                onFocus={(e) => e.target.select()}
                                />
                                <button
                                type="button"
                                className="acc-qty-btn acc-qty-btn--plus"
                                aria-label={`Sumar uno a ${item.name}`}
                                onClick={() => adjustQuantity(item.id, 1)}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </article>
    );
}