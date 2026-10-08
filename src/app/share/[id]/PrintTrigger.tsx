'use client';
import { useEffect } from "react";

export default function PrintTrigger() {
    useEffect(() => {
        // Delay para que el DOM termine de renderizar
        const timer = setTimeout(() => {
            window.print();
        }, 800);
            return () => clearTimeout(timer);
    }, []);

    return null;
}