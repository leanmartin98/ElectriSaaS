import Link from "next/link";
import { Zap } from "lucide-react";
import type { ReactNode } from "react";

interface AuthShellProps {
    active?: "login" | "register";
    wide?: boolean;
    eyebrow: string;
    title: string;
    subtitle: string;
    children: ReactNode;
}

function Brand() {
    return (
        <div className="auth-brand">
            <span className="auth-logo-mark">
                <Zap size={22} strokeWidth={2.5} />
            </span>
            <span className="auth-brand-name">
                Electri<span>SaaS</span>
            </span>
        </div>
    );
}

export function AuthShell({ active, wide, eyebrow, title, subtitle, children }: AuthShellProps) {
    return (
        <main className={`auth-page ${wide ? "auth-page--wide" : ""}`}>
            <aside className="auth-aside">
                <Brand />
                <div className="auth-aside-body">
                    <p className="auth-aside-eyebrow">Presupuestos sin vueltas</p>
                    <p className="auth-aside-title">
                        Tu trabajo vale.
                        <br />
                        Presupuestalo bien.
                    </p>
                    <p className="auth-aside-text">
                        Armá presupuestos profesionales, elegí materiales y compartilos con tus clientes en minutos.
                    </p>
                </div>
                <p className="auth-aside-foot">Hecho para profesionales eléctricos.</p>
            </aside>

            <section className="auth-main">
                <div className={`auth-card ${wide ? "auth-card--wide" : ""}`}>
                    <div className="auth-mobile-brand">
                        <Brand />
                    </div>

                    <p className="auth-eyebrow">{eyebrow}</p>
                    <h1 className="auth-title">{title}</h1>
                    <p className="auth-subtitle">{subtitle}</p>

                    {active && (
                        <nav className="auth-tabs" aria-label="Acceso">
                            <Link
                            href="/auth/login"
                            className={`auth-tab ${active === "login" ? "auth-tab--active" : ""}`}
                            aria-current={active === "login" ? "page" : undefined}
                            >
                                Ingresar
                            </Link>

                            <Link
                            href="/auth/register"
                            className={`auth-tab ${active === "register" ? "auth-tab--active" : ""}`}
                            aria-current={active === "register" ? "page" : undefined}
                            >
                                Registrarme
                            </Link>
                        </nav>
                    )}

                    {children}

                    <p className="auth-footnote">© 2026 ElectriSaaS. Todos los derechos reservados.</p>
                </div>
            </section>
        </main>
    );
}