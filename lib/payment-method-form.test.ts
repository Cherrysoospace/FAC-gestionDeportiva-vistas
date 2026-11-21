import { describe, expect, it } from 'vitest';
import { FanPaymentMethod, PaymentMethod } from '@/types/sports';
import {
    createEmptyFanPaymentMethodForm,
    formatFanPaymentMethodDetails,
    toCreatePaymentMethodPayload,
    toFanPaymentMethodFormValues,
    toRegisterFanPaymentMethodPayload,
    toUpdateFanPaymentMethodPayload,
    toUpdatePaymentMethodPayload,
    validateCatalogPaymentMethodForm,
    validateFanPaymentMethodForm
} from './payment-method-form';

const REFERENCE_DATE = new Date(2026, 4, 15); // Mayo 2026

const catalogMethod: PaymentMethod = {
    id: 1,
    name: 'Tarjeta Crédito / Débito',
    type: 'CARD',
    description: 'Pagos con tarjeta nacional',
    active: true,
    fanPaymentMethodsCount: 2
};

describe('payment-method-form', () => {
    it('valida el formulario de catálogo y construye payloads parciales', () => {
        const invalid = validateCatalogPaymentMethodForm({
            name: '   ',
            type: null,
            description: 'x'.repeat(251),
            active: true
        });
        expect(invalid.name).toBeDefined();
        expect(invalid.type).toBeDefined();
        expect(invalid.description).toBeDefined();

        const created = toCreatePaymentMethodPayload({
            name: '  PSE Nacional  ',
            type: 'PSE',
            description: '   ',
            active: true
        });
        expect(created).toEqual({ name: 'PSE Nacional', type: 'PSE', description: null });

        const updated = toUpdatePaymentMethodPayload(
            {
                name: 'Tarjeta Crédito / Débito',
                type: 'CARD',
                description: 'Nueva descripción',
                active: false
            },
            catalogMethod
        );
        expect(updated).toEqual({ description: 'Nueva descripción', active: false });
    });

    it('replica las reglas de tarjeta (CARD) incluyendo vencimiento', () => {
        const base = createEmptyFanPaymentMethodForm(1);
        base.alias = 'Visa personal';
        base.reference = '1234';
        base.cardHolder = 'Fercho';
        base.brand = 'VISA';
        base.expirationMonth = 3;
        base.expirationYear = 2026;

        const expiredErrors = validateFanPaymentMethodForm(base, 'CARD', false, REFERENCE_DATE);
        expect(expiredErrors.expirationMonth).toContain('vencida');

        base.reference = '12';
        const refErrors = validateFanPaymentMethodForm(base, 'CARD', false, REFERENCE_DATE);
        expect(refErrors.reference).toBeDefined();

        base.reference = '****4321';
        base.expirationMonth = 12;
        base.expirationYear = 2028;
        expect(validateFanPaymentMethodForm(base, 'CARD', false, REFERENCE_DATE)).toEqual({});

        const payload = toRegisterFanPaymentMethodPayload(base, 'CARD');
        expect(payload).toEqual({
            paymentMethodId: 1,
            alias: 'Visa personal',
            reference: '****4321',
            details: {
                cardHolder: 'Fercho',
                brand: 'VISA',
                expirationMonth: 12,
                expirationYear: 2028
            }
        });
    });

    it('valida las estrategias PSE, DIGITAL_WALLET y BANK_TRANSFER', () => {
        const pse = createEmptyFanPaymentMethodForm(2);
        pse.alias = 'Cuenta PSE';
        pse.reference = 'PSE-9001';
        pse.bankName = 'Bancolombia';
        pse.personType = 'NATURAL';
        pse.documentType = 'CC';
        pse.documentNumber = '1053800123';
        expect(validateFanPaymentMethodForm(pse, 'PSE', false, REFERENCE_DATE)).toEqual({});

        const wallet = createEmptyFanPaymentMethodForm(3);
        wallet.alias = 'Mi Nequi';
        wallet.reference = '3001234567';
        wallet.provider = 'Nequi';
        wallet.accountHolder = 'Fernando';
        expect(validateFanPaymentMethodForm(wallet, 'DIGITAL_WALLET', false, REFERENCE_DATE)).toEqual({});

        wallet.reference = 'abc';
        expect(validateFanPaymentMethodForm(wallet, 'DIGITAL_WALLET', false, REFERENCE_DATE).reference).toBeDefined();

        const transfer = createEmptyFanPaymentMethodForm(4);
        transfer.alias = 'Ahorros Davivienda';
        transfer.reference = '1234567890';
        transfer.bankName = 'Davivienda';
        transfer.accountType = 'SAVINGS';
        transfer.accountHolder = 'Fernando';
        expect(validateFanPaymentMethodForm(transfer, 'BANK_TRANSFER', false, REFERENCE_DATE)).toEqual({});
    });

    it('genera payload de actualización y formatea detalles de billetera', () => {
        const existing: FanPaymentMethod = {
            id: 10,
            alias: 'Nequi principal',
            reference: '3001234567',
            details: { provider: 'Nequi', accountHolder: 'Fernando' },
            active: true,
            createdAt: '2026-11-20T12:00:00.000Z',
            fanId: 5,
            paymentMethod: { id: 3, name: 'Billetera', type: 'DIGITAL_WALLET', active: true }
        };

        const values = toFanPaymentMethodFormValues(existing);
        values.alias = 'Nequi apuestas';
        values.active = false;

        expect(toUpdateFanPaymentMethodPayload(values, existing)).toEqual({
            alias: 'Nequi apuestas',
            active: false
        });
        expect(formatFanPaymentMethodDetails(existing)).toBe('Nequi · Titular: Fernando');
    });
});

