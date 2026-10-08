"use client";
import { useState } from "react";
import FormularioCliente from "./FormularioCliente";
import AccordionCategory from "./AccordionCategory";
import { usePresupuesto } from "@/hooks/usePresupuesto";

export default function Presupuestador() {
    const {
        groupedItems,
        isLoadingItems,
        inflation,
        setInflation,
        amounts,
        adjustQuantity,
        clientData,
        setClientData,
        isLoaded,
        total,
        handleClean,
        shareBudget,
        isSharing,
        shareUrl,
        activeItems,
        formKey,
        isLoadingProfile,
    } = usePresupuesto();

    const [copied, setCopied] = useState(false);

    if (isLoadingItems) return <p>
        Cargando items...
    </p>

    const handleShare = async () => {
        let url = shareUrl;
        if (!url) {
            url = await shareBudget();
        }
        if (url) {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    const handlePDF = async () => {
        let url = shareUrl;
        if (!url) {
            url = await shareBudget();
        }
        if (url) {
            window.open(`${url}?print=1`, '_blank');
        }
    };

    const hasClientData = !!(clientData.client && clientData.phone && clientData.address);

    return (
        <div className="grid-presupuestador">
            {/* Columna Izquierda: Formulario */}
            <aside className="md:col-span-1">
                {isLoaded && (
                    <FormularioCliente
                        key={formKey} // Forzar remount para resetear el formulario
                        data={clientData}
                        setData={setClientData}
                        onClean={handleClean}
                    />
                )}
            </aside>

            {/* Columna Derecha: Items y Total */}
            <div className="space-y-4">
                {/* Preview de datos (Opcional) */}
                {(clientData.client || clientData.address || clientData.phone || clientData.validity) && (
                    <div className="card-preview-client">
                        <p className="text-blue-800 text-sm italic">
                            Presupuestando para: <strong className="block text-base not-italic">{clientData.client || '...'}</strong>
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-blue-700">
                            {clientData.address && (<span>📍 {clientData.address}</span>)}
                            {clientData.phone && (
                                <a href={`https://wa.me/${clientData.phone.replace(/\D/g, '')}`} target="_blank" className="hover:underline">
                                    <span>📱</span> {clientData.phone}
                                </a>
                            )}
                            <span className="flex items-center gap-1"><span>📅</span> Vence: {clientData.validity}</span>
                        </div>
                    </div>
                )}

                {/* Control de inflación */}
                <section className="section-inflation">
                    <label className="text-xs uppercase font-bold text-orange-800 block mb-2 tracking-widest">Ajuste por Inflación: %{inflation}
                    </label>
                    <input
                        type="range"
                        value={inflation}
                        onChange={(e) => setInflation(parseInt(e.target.value))}
                        className="slider-inflation" />
                </section>

                {/* Lista de items */}
                <div className="space-y-2">
                    {groupedItems.map((group) => (
                        <AccordionCategory
                            key={group.categoryName}
                            categoryName={group.categoryName}
                            items={group.items}
                            amounts={amounts}
                            inflation={inflation}
                            adjustQuantity={adjustQuantity}
                        />
                    ))}
                </div>
            </div>

            {/* Feedback de URL compartida */}
            {shareUrl && (
                <div className="share-url-banner">
                    <span className="text-xs text-green-700 font-medium">Presupuesto listo</span>
                    <a 
                    href={shareUrl}
                    target="_blank"
                    className="text-xs text-blue-600 underline truncate max-w-xs"
                    >
                        Ver presupuesto 
                    </a>
                </div>
            )}

                {/* Footer del Presupuestador */}
                <footer className="sticky-footer">
                    <div className="max-w-4xl mx-auto flex justify-between items-center">
                        <div>
                            <p className="text-[10px] uppercase text-gray-400 font-bold tracking-tighter">Total Estimado</p>
                            <p className="text-2xl md:text-3xl font-black text-gray-900 leading-none">${Math.round(total).toLocaleString('es-AR')}</p>
                        </div>

                        <div className="flex gap-3">
                        <button 
                        className="share-download-btn"
                        onClick={handleShare}
                        disabled={isSharing || activeItems.length === 0 || !hasClientData || isLoadingProfile}
                        >
                            {isLoadingProfile ? (
                                <span className="loading-dots">Cargando</span>
                            ) : isSharing ? (
                                <span className="loading-dots">Guardando</span>
                            ) : copied ? (
                                '¡Copiado!'
                            ) : (
                                <>Compartir</>
                            )}
                        </button>

                        {/* Boton PDF */}
                        <button
                        className="btn-pdf"
                        disabled={isSharing || activeItems.length === 0 || !hasClientData || isLoadingProfile}
                        onClick={handlePDF}
                        >
                            {isLoadingProfile ? '...' : isSharing ? '...' : 'PDF'}
                        </button>
                        </div>
                    </div>
                </footer>
        </div>
    );
}