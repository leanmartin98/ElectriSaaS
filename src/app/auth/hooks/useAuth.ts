import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RegisterFormData } from '@/schema/validations';

// Traduce los mensajes mas comunes de error de Supabase a español
function mapAuthError(message: string): string {
    if (message.includes('already registered')) {
        return 'Ya existe una cuenta con este email';
    }
    if (message.includes('Password should be')) {
        return 'La contraseña no cumple con los requisitos mínimos';
    }
    return 'Hubo un error al crear la cuenta. Intenta nuevamente.'
};

export function useAuth() {
    const [isRegistering, setIsRegistering] = useState(false);

    const registerProfessional = async (
        values: RegisterFormData
    ): Promise<{ success: boolean; error?: string }> => {
        setIsRegistering(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: values.email,
                password: values.password,
                options: {
                    // Estos datos viajan a auth.users.raw_user_meta_data
                    // y el trigger on_auth_user_created los copia a profiles
                    data: {
                        name: values.name,
                        company_name: values.companyName || null,
                        matricula: values.matricula || null,
                        phone: values.phone,
                    },
                },
            });

            if (error) throw error;
            if (!data.user) throw new Error('No se pudo crear el usuario');
                
            return { success: true };
        } catch (err) {
            console.error('Error al registrar profesional:', err);
            const message = 
            err instanceof Error ? err.message : 'Error desconocido al registrar';
            return { success: false, error: mapAuthError(message) };
        } finally {
            setIsRegistering(false);
        }
    };

    return { registerProfessional, isRegistering };
}