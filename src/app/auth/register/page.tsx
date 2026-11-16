import RegisterProfessional from "../components/RegisterProfessional";
import { AuthShell } from "../components/AuthShell";

export default function RegisterPage() {
    return (
        <AuthShell
            active="register"
            wide
            eyebrow="Empezá hoy"
            title="Creá tu cuenta profesional"
            subtitle="Estos datos aparecerán en el encabezado de tus presupuestos."
        >
            <RegisterProfessional />
        </AuthShell>
    );
};