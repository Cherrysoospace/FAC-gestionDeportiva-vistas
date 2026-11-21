import { CreateFanPayload, Fan, RegisterMyFanPayload, UpdateFanPayload, UpdateMyFanPayload } from '@/types/sports';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeFanDocument(value: string): string {
    return value.replace(/[\s.-]/g, '').toUpperCase();
}

export function normalizeFanEmail(value: string): string {
    return value.trim().toLowerCase();
}

export interface MyFanFormValues {
    fullName: string;
    documentNumber: string;
    email: string;
    phone: string;
}

export interface AdminFanFormValues extends MyFanFormValues {
    securityUserId: number | null;
    active: boolean;
}

export type MyFanFormErrors = Partial<Record<keyof MyFanFormValues, string>>;
export type AdminFanFormErrors = Partial<Record<keyof AdminFanFormValues, string>>;

export const EMPTY_ADMIN_FAN_FORM: AdminFanFormValues = {
    securityUserId: null,
    fullName: '',
    documentNumber: '',
    email: '',
    phone: '',
    active: true
};

export function toAdminFanFormValues(fan: Fan | null): AdminFanFormValues {
    if (!fan) return EMPTY_ADMIN_FAN_FORM;
    return {
        securityUserId: fan.securityUserId,
        fullName: fan.fullName,
        documentNumber: fan.documentNumber,
        email: fan.email,
        phone: fan.phone ?? '',
        active: fan.active
    };
}

export function toMyFanFormValues(fan: Fan | null, fallbackName = '', fallbackEmail = ''): MyFanFormValues {
    if (!fan) {
        return {
            fullName: fallbackName,
            documentNumber: '',
            email: fallbackEmail,
            phone: ''
        };
    }
    return {
        fullName: fan.fullName,
        documentNumber: fan.documentNumber,
        email: fan.email,
        phone: fan.phone ?? ''
    };
}

export function validateMyFanForm(values: MyFanFormValues): MyFanFormErrors {
    const errors: MyFanFormErrors = {};
    const fullName = values.fullName.trim();
    const documentNumber = normalizeFanDocument(values.documentNumber);
    const email = normalizeFanEmail(values.email);
    const phone = values.phone.trim();

    if (!fullName) errors.fullName = 'El nombre completo es obligatorio';
    else if (fullName.length > 120) errors.fullName = 'El nombre completo no puede superar los 120 caracteres';

    if (!documentNumber) errors.documentNumber = 'El documento es obligatorio';
    else if (documentNumber.length > 20) errors.documentNumber = 'El documento no puede superar los 20 caracteres';

    if (!email) errors.email = 'El correo electrónico es obligatorio';
    else if (email.length > 150) errors.email = 'El correo no puede superar los 150 caracteres';
    else if (!EMAIL_REGEX.test(email)) errors.email = 'El correo electrónico no tiene un formato válido';

    if (phone.length > 30) errors.phone = 'El teléfono no puede superar los 30 caracteres';

    return errors;
}

export function validateAdminFanForm(values: AdminFanFormValues, editing: boolean): AdminFanFormErrors {
    const errors: AdminFanFormErrors = { ...validateMyFanForm(values) };

    if (!editing) {
        if (values.securityUserId === null || !Number.isInteger(values.securityUserId) || values.securityUserId < 1) {
            errors.securityUserId = 'El identificador del usuario de seguridad es obligatorio y debe ser entero positivo';
        }
    }

    return errors;
}

export function toCreateFanPayload(values: AdminFanFormValues): CreateFanPayload {
    const phone = values.phone.trim();
    return {
        securityUserId: values.securityUserId ?? 0,
        fullName: values.fullName.trim(),
        documentNumber: normalizeFanDocument(values.documentNumber),
        email: normalizeFanEmail(values.email),
        phone: phone || null
    };
}

export function toUpdateFanPayload(values: AdminFanFormValues, original: Fan): UpdateFanPayload {
    const payload: UpdateFanPayload = {};
    const fullName = values.fullName.trim();
    const documentNumber = normalizeFanDocument(values.documentNumber);
    const email = normalizeFanEmail(values.email);
    const phone = values.phone.trim() || null;

    if (fullName !== original.fullName) payload.fullName = fullName;
    if (documentNumber !== original.documentNumber) payload.documentNumber = documentNumber;
    if (email !== original.email) payload.email = email;
    if (phone !== original.phone) payload.phone = phone;
    if (values.active !== original.active) payload.active = values.active;

    return payload;
}

export function toRegisterMyFanPayload(values: MyFanFormValues): RegisterMyFanPayload {
    const phone = values.phone.trim();
    return {
        fullName: values.fullName.trim(),
        documentNumber: normalizeFanDocument(values.documentNumber),
        email: normalizeFanEmail(values.email),
        phone: phone || null
    };
}

export function toUpdateMyFanPayload(values: MyFanFormValues, original: Fan): UpdateMyFanPayload {
    const payload: UpdateMyFanPayload = {};
    const fullName = values.fullName.trim();
    const documentNumber = normalizeFanDocument(values.documentNumber);
    const email = normalizeFanEmail(values.email);
    const phone = values.phone.trim() || null;

    if (fullName !== original.fullName) payload.fullName = fullName;
    if (documentNumber !== original.documentNumber) payload.documentNumber = documentNumber;
    if (email !== original.email) payload.email = email;
    if (phone !== original.phone) payload.phone = phone;

    return payload;
}
