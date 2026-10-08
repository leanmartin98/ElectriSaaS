"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

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
        return acc + (amounts[item.id] || 0) * item.price * (1 + inflation / 100);
}, 0);

    const selectedCount = items.reduce((acc, item) => acc + (amounts[item.id] || 0), 0);

    return ( 
        <div className="accordion-category">
            <button 
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="accordion-header"
                >
            <div className= "flex items-center gap-3">
                <ChevronDown 
                className="accordion-chevron"
                style={{ transform: isOpen ? "rotate(-90deg)" : "rotate(0deg)" }}
                />
                <span className="font-semibold text-gray-800">{categoryName}
                </span>
                {selectedCount > 0 && (
                    <span className="accordion-badge">{selectedCount > 999 ? '999+' : selectedCount}</span>
                )}
            </div>
            {categoryTotal > 0 && (
                <span className="text-sm font-bold text-blue-600">
                    ${Math.round(categoryTotal).toLocaleString("es-AR")}
                </span>
            )}
            </button>

            {isOpen && (
                <div className="accordion-body">
                    {items.map((item) => (
                        <div className="card-item" key={item.id}>
                            <div>
                                <h3 className="font-bold text-gray-800 text-sm">{item.name}</h3>
                                <p className="text-blue-600 font-medium text-sm">
                                    ${(item.price * (1 + inflation / 100)).toLocaleString("es-AR")}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                className="btn-counter-minus"
                                onClick={() => adjustQuantity(item.id, -1)}
                                >
                                    -
                                </button>
                                <input
                                className="input-counter"
                                type="number"
                                min="0"
                                max='999'
                                value={amounts[item.id] || 0}
                                onChange={(e) => {
                                    const val = Math.min(999, Math.max(0, parseInt(e.target.value) || 0));
                                    adjustQuantity(item.id, val - (amounts[item.id] || 0));
                                }}
                                onFocus={(e) => e.target.select()}
                                />
                                <button
                                className="btn-counter-plus"
                                onClick={() => adjustQuantity(item.id, 1)}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}