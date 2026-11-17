import { Zap } from "lucide-react";

interface AppHeaderProps {
    profile: {
        name: string;
        company_name: string | null;
        matricula: string | null;
    } | null;
}

export default function AppHeader({ profile }: AppHeaderProps) {
    return (
        <header className="app-header">
            <div className="app-header-inner">
                <div className="app-brand">
                    <span className="app-logo-mark">
                        <Zap size={22} strokeWidth={2.5} />
                    </span>
                    <div>
                        <p className="app-brand-name">
                            Electri<span>SaaS</span>
                        </p>
                        <p className="app-brand-sub">Nuevo presupuesto</p>
                    </div>
                </div>

                <div className="app-user">
                    <p className="app-user-name">
                        {profile?.company_name || profile?.name || ''}
                    </p>
                    <p className="app-user-sub">
                        {profile?.matricula ? `Mat. ${profile.matricula}` : 'Profesional electricista'}
                    </p>
                </div>
            </div>
        </header>
    )
}