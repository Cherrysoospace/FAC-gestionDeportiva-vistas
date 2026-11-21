import {
    CreatePaymentMethodPayload,
    FanPaymentMethod,
    PaymentMethod,
    PaymentMethodType,
    RegisterFanPaymentMethodPayload,
    UpdateFanPaymentMethodPayload,
    UpdatePaymentMethodPayload
} from '@/types/sports';

export const PAYMENT_METHOD_TYPE_LABELS: Record<PaymentMethodType, string> = {
    CARD: 'Tarjeta de crédito o débito',
    PSE: 'PSE (Débito bancario)',
    DIGITAL_WALLET: 'Billetera digital',
    BANK_TRANSFER: 'Transferencia bancaria'
};

export const PAYMENT_METHOD_TYPE_OPTIONS = (Object.keys(PAYMENT_METHOD_TYPE_LABELS) as PaymentMethodType[]).map((type) => ({
    label: PAYMENT_METHOD_TYPE_LABELS[type],
    value: type
}));

export const CARD_BRAND_OPTIONS = [
    { label: 'VISA', value: 'VISA' },
    { label: 'MASTERCARD', value: 'MASTERCARD' },
    { label: 'AMEX', value: 'AMEX' },
    { label: 'DINERS', value: 'DINERS' }
];

export const PSE_PERSON_TYPE_OPTIONS = [
    { label: 'Persona natural', value: 'NATURAL' },
    { label: 'Persona jurídica', value: 'JURIDICA' }
];

export const PSE_DOCUMENT_TYPE_OPTIONS = [
    { label: 'Cédula de ciudadanía (CC)', value: 'CC' },
    { label: 'Cédula de extranjería (CE)', value: 'CE' },
    { label: 'NIT', value: 'NIT' },
    { label: 'Pasaporte (PASSPORT)', value: 'PASSPORT' }
];

export const BANK_ACCOUNT_TYPE_OPTIONS = [
    { label: 'Cuenta de ahorros', value: 'SAVINGS' },
    { label: 'Cuenta corriente', value: 'CHECKING' }
];

const CARD_REFERENCE_REGEX = /^(?:\*{4})?\d{4}$/;
const PSE_DOCUMENT_REGEX = /^[A-Za-z0-9-]{5,20}$/;
const WALLET_PHONE_REGEX = /^\+?\d{10,15}$/;
const WALLET_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCOUNT_NUMBER_REGEX = /^\d{6,20}$/;

const ALLOWED_CARD_BRANDS = new Set(['VISA', 'MASTERCARD', 'AMEX', 'DINERS']);
const ALLOWED_PERSON_TYPES = new Set(['NATURAL', 'JURIDICA']);
const ALLOWED_DOC_TYPES = new Set(['CC', 'CE', 'NIT', 'PASSPORT']);
const ALLOWED_ACCOUNT_TYPES = new Set(['SAVINGS', 'CHECKING']);

// ---- Formulario de Catálogo (/payment-methods) ----

export interface CatalogPaymentMethodFormValues {
    name: string;
    type: PaymentMethodType | null;
    description: string;
    active: boolean;
}

export type CatalogPaymentMethodFormErrors = Partial<Record<keyof CatalogPaymentMethodFormValues, string>>;

export const EMPTY_CATALOG_PAYMENT_METHOD_FORM: CatalogPaymentMethodFormValues = {
    name: '',
    type: null,
    description: '',
    active: true
};

export function toCatalogPaymentMethodFormValues(method: PaymentMethod | null): CatalogPaymentMethodFormValues {
    if (!method) return EMPTY_CATALOG_PAYMENT_METHOD_FORM;
    return {
        name: method.name,
        type: method.type,
        description: method.description ?? '',
        active: method.active
    };
}

export function validateCatalogPaymentMethodForm(values: CatalogPaymentMethodFormValues): CatalogPaymentMethodFormErrors {
    const errors: CatalogPaymentMethodFormErrors = {};
    const name = values.name.trim();
    const description = values.description.trim();

    if (!name) errors.name = 'El nombre es obligatorio';
    else if (name.length > 80) errors.name = 'El nombre no puede superar los 80 caracteres';

    if (!values.type) errors.type = 'El tipo de método de pago es obligatorio';

    if (description.length > 250) errors.description = 'La descripción no puede superar los 250 caracteres';

    return errors;
}

export function toCreatePaymentMethodPayload(values: CatalogPaymentMethodFormValues): CreatePaymentMethodPayload {
    const description = values.description.trim();
    return {
        name: values.name.trim(),
        type: values.type as PaymentMethodType,
        description: description || null
    };
}

export function toUpdatePaymentMethodPayload(values: CatalogPaymentMethodFormValues, original: PaymentMethod): UpdatePaymentMethodPayload {
    const payload: UpdatePaymentMethodPayload = {};
    const name = values.name.trim();
    const description = values.description.trim() || null;

    if (name !== original.name) payload.name = name;
    if (values.type && values.type !== original.type) payload.type = values.type;
    if (description !== original.description) payload.description = description;
    if (values.active !== original.active) payload.active = values.active;

    return payload;
}

// ---- Formulario de Billetera del Aficionado (/me/payment-methods) ----

export interface FanPaymentMethodFormValues {
    paymentMethodId: number | null;
    alias: string;
    reference: string;
    active: boolean;
    // CARD
    cardHolder: string;
    brand: string;
    expirationMonth: number | null;
    expirationYear: number | null;
    // PSE / BANK_TRANSFER
    bankName: string;
    personType: string;
    documentType: string;
    documentNumber: string;
    // DIGITAL_WALLET
    provider: string;
    accountHolder: string;
    // BANK_TRANSFER
    accountType: string;
}

export type FanPaymentMethodFormErrors = Partial<Record<keyof FanPaymentMethodFormValues, string>>;

function readDetailString(details: Record<string, unknown>, key: string): string {
    const value = details[key];
    return typeof value === 'string' ? value : '';
}

function readDetailNumber(details: Record<string, unknown>, key: string): number | null {
    const value = details[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function createEmptyFanPaymentMethodForm(defaultMethodId: number | null = null): FanPaymentMethodFormValues {
    return {
        paymentMethodId: defaultMethodId,
        alias: '',
        reference: '',
        active: true,
        cardHolder: '',
        brand: 'VISA',
        expirationMonth: null,
        expirationYear: null,
        bankName: '',
        personType: 'NATURAL',
        documentType: 'CC',
        documentNumber: '',
        provider: '',
        accountHolder: '',
        accountType: 'SAVINGS'
    };
}

export function toFanPaymentMethodFormValues(item: FanPaymentMethod | null, defaultMethodId: number | null = null): FanPaymentMethodFormValues {
    if (!item) return createEmptyFanPaymentMethodForm(defaultMethodId);

    const details = item.details ?? {};
    return {
        paymentMethodId: item.paymentMethod.id,
        alias: item.alias,
        reference: item.reference,
        active: item.active,
        cardHolder: readDetailString(details, 'cardHolder'),
        brand: readDetailString(details, 'brand') || 'VISA',
        expirationMonth: readDetailNumber(details, 'expirationMonth'),
        expirationYear: readDetailNumber(details, 'expirationYear'),
        bankName: readDetailString(details, 'bankName'),
        personType: readDetailString(details, 'personType') || 'NATURAL',
        documentType: readDetailString(details, 'documentType') || 'CC',
        documentNumber: readDetailString(details, 'documentNumber'),
        provider: readDetailString(details, 'provider'),
        accountHolder: readDetailString(details, 'accountHolder'),
        accountType: readDetailString(details, 'accountType') || 'SAVINGS'
    };
}

export function validateFanPaymentMethodForm(
    values: FanPaymentMethodFormValues,
    type: PaymentMethodType | null,
    editing: boolean,
    now: Date = new Date()
): FanPaymentMethodFormErrors {
    const errors: FanPaymentMethodFormErrors = {};
    const alias = values.alias.trim();
    const reference = values.reference.trim();

    if (!editing && (values.paymentMethodId === null || !Number.isInteger(values.paymentMethodId) || values.paymentMethodId < 1)) {
        errors.paymentMethodId = 'Debes seleccionar un método de pago del catálogo';
    }

    if (!alias) errors.alias = 'El alias es obligatorio';
    else if (alias.length > 80) errors.alias = 'El alias no puede superar los 80 caracteres';

    if (!reference) errors.reference = 'La referencia es obligatoria';
    else if (reference.length > 100) errors.reference = 'La referencia no puede superar los 100 caracteres';

    if (!type) return errors;

    if (type === 'CARD') {
        if (reference && !CARD_REFERENCE_REGEX.test(reference)) {
            errors.reference = 'Debe contener los últimos 4 dígitos (ej. 1234 o ****1234)';
        }
        if (values.cardHolder.trim().length < 3) {
            errors.cardHolder = 'El titular de la tarjeta debe tener al menos 3 caracteres';
        }
        const brand = values.brand.trim().toUpperCase();
        if (!ALLOWED_CARD_BRANDS.has(brand)) {
            errors.brand = 'Selecciona una franquicia válida (VISA, MASTERCARD, AMEX, DINERS)';
        }

        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const month = values.expirationMonth;
        const year = values.expirationYear;

        if (month === null || !Number.isInteger(month) || month < 1 || month > 12) {
            errors.expirationMonth = 'El mes de vencimiento debe estar entre 1 y 12';
        }
        if (year === null || !Number.isInteger(year) || year < currentYear || year > currentYear + 20) {
            errors.expirationYear = `El año de vencimiento debe estar entre ${currentYear} y ${currentYear + 20}`;
        }
        if (
            month !== null &&
            year !== null &&
            Number.isInteger(month) &&
            Number.isInteger(year) &&
            year === currentYear &&
            month < currentMonth
        ) {
            errors.expirationMonth = 'La tarjeta ingresada se encuentra vencida';
        }
    } else if (type === 'PSE') {
        if (reference && reference.length < 4) {
            errors.reference = 'La referencia para PSE debe tener al menos 4 caracteres';
        }
        if (values.bankName.trim().length < 2) {
            errors.bankName = 'El nombre del banco debe tener al menos 2 caracteres';
        }
        if (!ALLOWED_PERSON_TYPES.has(values.personType.trim().toUpperCase())) {
            errors.personType = 'Selecciona un tipo de persona válido';
        }
        if (!ALLOWED_DOC_TYPES.has(values.documentType.trim().toUpperCase())) {
            errors.documentType = 'Selecciona un tipo de documento válido';
        }
        const docNumber = values.documentNumber.trim();
        if (!PSE_DOCUMENT_REGEX.test(docNumber)) {
            errors.documentNumber = 'El documento debe ser alfanumérico entre 5 y 20 caracteres';
        }
    } else if (type === 'DIGITAL_WALLET') {
        if (reference && !WALLET_PHONE_REGEX.test(reference) && !WALLET_EMAIL_REGEX.test(reference)) {
            errors.reference = 'La referencia debe ser un celular (10 a 15 dígitos) o un correo válido';
        }
        if (values.provider.trim().length < 2) {
            errors.provider = 'El proveedor de la billetera debe tener al menos 2 caracteres';
        }
        if (values.accountHolder.trim().length < 3) {
            errors.accountHolder = 'El titular de la cuenta debe tener al menos 3 caracteres';
        }
    } else if (type === 'BANK_TRANSFER') {
        if (reference && !ACCOUNT_NUMBER_REGEX.test(reference)) {
            errors.reference = 'Debe ser un número de cuenta entre 6 y 20 dígitos';
        }
        if (values.bankName.trim().length < 2) {
            errors.bankName = 'El banco debe tener al menos 2 caracteres';
        }
        if (!ALLOWED_ACCOUNT_TYPES.has(values.accountType.trim().toUpperCase())) {
            errors.accountType = 'Selecciona un tipo de cuenta válido';
        }
        if (values.accountHolder.trim().length < 3) {
            errors.accountHolder = 'El titular de la cuenta debe tener al menos 3 caracteres';
        }
    }

    return errors;
}

export function buildFanPaymentMethodDetails(type: PaymentMethodType, values: FanPaymentMethodFormValues): Record<string, unknown> {
    if (type === 'CARD') {
        return {
            cardHolder: values.cardHolder.trim(),
            brand: values.brand.trim().toUpperCase(),
            expirationMonth: values.expirationMonth ?? 1,
            expirationYear: values.expirationYear ?? new Date().getFullYear()
        };
    }

    if (type === 'PSE') {
        return {
            bankName: values.bankName.trim(),
            personType: values.personType.trim().toUpperCase(),
            documentType: values.documentType.trim().toUpperCase(),
            documentNumber: values.documentNumber.trim()
        };
    }

    if (type === 'DIGITAL_WALLET') {
        return {
            provider: values.provider.trim(),
            accountHolder: values.accountHolder.trim()
        };
    }

    return {
        bankName: values.bankName.trim(),
        accountType: values.accountType.trim().toUpperCase(),
        accountHolder: values.accountHolder.trim()
    };
}

export function toRegisterFanPaymentMethodPayload(
    values: FanPaymentMethodFormValues,
    type: PaymentMethodType
): RegisterFanPaymentMethodPayload {
    return {
        paymentMethodId: values.paymentMethodId ?? 0,
        alias: values.alias.trim(),
        reference: values.reference.trim(),
        details: buildFanPaymentMethodDetails(type, values)
    };
}

export function toUpdateFanPaymentMethodPayload(
    values: FanPaymentMethodFormValues,
    original: FanPaymentMethod
): UpdateFanPaymentMethodPayload {
    const payload: UpdateFanPaymentMethodPayload = {};
    const alias = values.alias.trim();
    const reference = values.reference.trim();
    const nextDetails = buildFanPaymentMethodDetails(original.paymentMethod.type, values);
    const originalDetails = toFanPaymentMethodFormValues(original);
    const prevDetails = buildFanPaymentMethodDetails(original.paymentMethod.type, originalDetails);

    if (alias !== original.alias) payload.alias = alias;
    if (reference !== original.reference) payload.reference = reference;
    if (JSON.stringify(nextDetails) !== JSON.stringify(prevDetails)) payload.details = nextDetails;
    if (values.active !== original.active) payload.active = values.active;

    return payload;
}

export function formatFanPaymentMethodDetails(item: FanPaymentMethod): string {
    const details = item.details ?? {};
    const type = item.paymentMethod.type;

    if (type === 'CARD') {
        const brand = readDetailString(details, 'brand') || 'Tarjeta';
        const holder = readDetailString(details, 'cardHolder');
        const month = readDetailNumber(details, 'expirationMonth');
        const year = readDetailNumber(details, 'expirationYear');
        const exp = month && year ? `Vence ${String(month).padStart(2, '0')}/${year}` : '';
        return [brand, holder ? `Titular: ${holder}` : '', exp].filter(Boolean).join(' · ');
    }

    if (type === 'PSE') {
        const bank = readDetailString(details, 'bankName');
        const docType = readDetailString(details, 'documentType');
        const docNumber = readDetailString(details, 'documentNumber');
        const personType = readDetailString(details, 'personType');
        const doc = docType && docNumber ? `${docType} ${docNumber}` : docNumber;
        return [bank, doc, personType].filter(Boolean).join(' · ');
    }

    if (type === 'DIGITAL_WALLET') {
        const provider = readDetailString(details, 'provider');
        const holder = readDetailString(details, 'accountHolder');
        return [provider, holder ? `Titular: ${holder}` : ''].filter(Boolean).join(' · ');
    }

    const bank = readDetailString(details, 'bankName');
    const accountType = readDetailString(details, 'accountType');
    const accountLabel = accountType === 'SAVINGS' ? 'Ahorros' : accountType === 'CHECKING' ? 'Corriente' : accountType;
    const holder = readDetailString(details, 'accountHolder');
    return [bank, accountLabel, holder ? `Titular: ${holder}` : ''].filter(Boolean).join(' · ');
}

