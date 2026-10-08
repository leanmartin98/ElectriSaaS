import Presupuestador from "./budget/components/Presupuestador";

const Home = () => {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl text-center mb-5 tracking-tight">Electri<span className="text-blue-600">SaaS</span>
        </h1>
        <Presupuestador />
      </div>
    </main>
  )
}

export default Home;