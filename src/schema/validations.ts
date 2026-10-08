import { z } from "zod";

const today = new Date();
today.setHours(0, 0, 0, 0);

export const clientSchema = z.object({
    client: z
        .string()
        .min(1, "El nombre del cliente es obligatorio")
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .max(80, "El nombre no puede exceder los 80 caracteres"),

    phone: z
        .string()
        .min(1, "El número de teléfono es obligatorio")
        .regex(/^\+?[0-9\s\-()]{7,20}$/, "Ingresa un número de teléfono válido"),

    address: z
        .string()
        .min(1, "La dirección es obligatoria")
        .max(120, "La dirección no puede superar los 120 caracteres"),

    validity: z
        .string()
        .min(1, "la fecha de validez es obligatoria")
        .refine((val) => {
            const now = new Date();
            const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

            const [year, month, day] = val.split("-").map(Number);
            const selectedLocal = new Date(year, month - 1, day).getTime();

            return selectedLocal >= todayLocal;
        }, "La fecha de validez no puede ser anterior a hoy"),
});

export type ClientFormData = z.infer<typeof clientSchema>;

export const registerSchema = z.object({
    name: z 
         .string()
         .min(1, 'El nombre y apellido son obligatorios')
         .min(3, 'El nombre debe tener al menos 3 caracteres')
         .max(80, 'El nombre no puede exceder los 80 caracteres'),

    companyName: z
         .string()
         .max(80, 'El nombre de la empresa no puede exceder los 80 caracteres')
         .optional()
         .or(z.literal('')),

    matricula: z
         .string()
         .max(40, 'La matrícula no puede exceder los 40 caracteres')
         .optional()
         .or(z.literal('')),

    phone: z
         .string()
         .min(1, 'El número de teléfono es obligatorio')
         .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Ingresa un número de teléfono válido'),

    email: z
         .string()
         .min(1, 'El correo electrónico es obligatorio')
         .email('Ingresa un email válido'),

    password: z
         .string()
         .min(8, 'La contraseña debe tener al menos 8 caracteres'),

    confirmPassword: z.string(),
})
.refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
    email: z
         .string()
         .min(1, 'El email es obligatorio')
         .email('Ingresa un email válido'),
    password: z
         .string()
         .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
    email: z
         .string()
         .min(1, 'El email es obligatorio')
         .email('Ingresa un email válido'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
    password: z
         .string()
         .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
})
.refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;