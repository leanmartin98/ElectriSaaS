import CatalogoAdmin from "../components/CatalogoAdmin";

export default function CatalogPage() {
    return (
        <main className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <h1 className="text-4xl text-center mb-5 tracking-tight">
                    Catálogo de <span className="text-blue-600">materiales</span>
                </h1>
                <CatalogoAdmin />
            </div>
        </main>
    );
}