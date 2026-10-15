import { createSupabaseServer } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import BudgetActions from "@/app/budget/components/BudgetActions";
import PrintTrigger from './PrintTrigger';
import { unitPriceWithInflation } from "@/lib/pricing";

interface BudgetItem {
    id: number;
    budget_id: string;
    item_id: number;
    quantity: number;
    price_snapshot: number;
    name_snapshot: string;
    category_snapshot: string;
}

interface Props {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ print?: string }>;
}

export default async function SharePage({ params, searchParams }: Props) {
    const { id } = await params;
    const { print } = await searchParams;
    const supabase = await createSupabaseServer();

    // Fetch presupuesto
    const { data: budget, error } = await supabase
        .from('budget')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !budget) notFound();

    // Fetch items del presupuesto
    const { data: budgetItems } = await supabase
        .from('budget_items')
        .select('*')
        .eq('budget_id', id)
        .order('category_snapshot', { ascending: true });

    const items = budgetItems || [];

    // Agrupar por categoria
    const grouped = items.reduce((acc: { [key: string]: BudgetItem[] }, item) => {
        const cat = item.category_snapshot || 'Sin categoria';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    const formattedDate = new Date(budget.created_at).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires',
    });

    return (
        <>
        {print === '1' && <PrintTrigger />}
        
        <div className="share-page">
            {/* Header del documento */}
            <header className="share-header no-print-hide">
                <div className="share-header-inner">
                    <div>
                        <h1 className="share-logo">
                            {budget.company_name ?? 'ElectriSaaS'}
                        </h1>
                        <p className="share-tagline">
                            {budget.professional_name
                            ? `${budget.professional_name}${budget.matricula ? ` - Mat. ${budget.matricula}` : ''}`
                            : 'Presupuesto Eléctrico'}
                        </p>
                    </div>
                    <BudgetActions />
                </div>
            </header>

            {/* Documento */}
            <main className="share-document">
                {/* Cabecera del presupuesto */}
                <div className="share-doc-header">
                    <div className="share-doc-meta">
                        <div>
                            <p className="share-label">PRESUPUESTO PARA</p>
                            <h2 className="share-client-name">{budget.client}</h2>
                            {budget.address && (
                                <p className="share-meta-text">{budget.address}</p>
                            )}
                            {budget.phone && (
                                <p className="share-meta-text">{budget.phone}</p>
                            )}
                        </div>
                        <div className="share-doc-dates">
                            <div>
                                <p className="share-label">FECHA DE EMISIÓN</p>
                                <p className="share-meta-value">{formattedDate}</p>
                            </div>
                        <div>
                            <p className="share-label">VÁLIDO HASTA</p>
                            <p className="share-meta-value">
                                {new Date(budget.validity).toLocaleDateString('es-AR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                    timeZone: 'America/Argentina/Buenos_Aires',
                                })}
                            </p>
                        </div>
                        {budget.inflation > 0 && (
                            <div>
                                <p className="share-label">AJUSTE INFLACIÓN</p>
                                <p className="share-meta-value share-inflation-badge">{budget.inflation}%</p>
                            </div>
                        )}
                    </div>
                </div>
                </div>

                {/* Tabla de items */}
                <div className="share-items-section">
                    {Object.entries(grouped).map(([category, cartItems]) => (
                        <div key={category} className="share-category-block">
                            <h3 className="share-category-title">{category}</h3>
                            <table className="share-table">
                                <thead>
                                    <tr>
                                        <th className="share-th share-th-name">Descripción</th>
                                        <th className="share-th share-th-num">Cant.</th>
                                        <th className="share-th share-th-num">P. Unit.</th>
                                        <th className="share-th share-th-num">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cartItems.map((item, i) => {
                                        const unitPrice = unitPriceWithInflation(item.price_snapshot, budget.inflation);
                                        const subtotal = item.quantity * unitPrice;
                                        return (
                                            <tr key={i} className="share-tr">
                                                <td className="share-td share-td-name">{item.name_snapshot}</td>
                                                <td className="share-td">{item.quantity}</td>
                                                <td className="share-td share-td-num">
                                                    ${unitPrice.toLocaleString('es-AR')}
                                                </td>
                                                <td className="share-td share-td-num share-td-subtotal">
                                                    ${subtotal.toLocaleString('es-AR')}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>

                {/* Total */}
                <div className="share-total-row">
                    <span className="share-total-label">TOTAL PRESUPUESTO</span>
                    <span className="share-total-value">
                        ${budget.total.toLocaleString('es-AR')}
                    </span>
                </div>

                {/* Footer del documento */}
                <div className="share-doc-footer">
                    <p>Presupuesto generado con <strong>ElectriSaaS</strong>. Los precios solo incluyen materiales y no mano de obra, documento no valido como factura solo Válido hasta la fecha indicada.</p>
                </div>
            </main>
        </div>
        </>
    );
}