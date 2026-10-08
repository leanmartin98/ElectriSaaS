'use client';

export default function BudgetActions() {
    return (
        <div className="share-header-actions print:hidden">
            <button 
            className="share-download-btn"
            onClick={() => window.print()}
            id="print-btn"
            >
                Descargar PDF
            </button>
        </div>
    );
}