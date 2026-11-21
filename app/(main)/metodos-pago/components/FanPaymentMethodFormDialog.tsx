'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { FormActionResult } from '@/lib/form-action';
import {
    BANK_ACCOUNT_TYPE_OPTIONS,
    CARD_BRAND_OPTIONS,
    FanPaymentMethodFormValues,
    PAYMENT_METHOD_TYPE_LABELS,
    PSE_DOCUMENT_TYPE_OPTIONS,
    PSE_PERSON_TYPE_OPTIONS,
    toFanPaymentMethodFormValues,
    validateFanPaymentMethodForm
} from '@/lib/payment-method-form';
import { FanPaymentMethod, PaymentMethod, PaymentMethodType } from '@/types/sports';

interface FanPaymentMethodFormDialogProps {
    visible: boolean;
    item: FanPaymentMethod | null;
    catalogOptions: PaymentMethod[];
    onHide: () => void;
    onSubmit: (values: FanPaymentMethodFormValues, resolvedType: PaymentMethodType) => Promise<FormActionResult>;
}

function referenceLabelFor(type: PaymentMethodType | null): { label: string; placeholder: string; hint: string } {
    if (type === 'CARD') {
        return {
            label: 'Últimos 4 dígitos de la tarjeta',
            placeholder: 'Ej. 1234 o ****1234',
            hint: 'Por seguridad ingresa únicamente los últimos 4 dígitos.'
        };
    }
    if (type === 'PSE') {
        return {
            label: 'Referencia de cuenta PSE',
            placeholder: 'Ej. PSE-BANCOLOMBIA',
            hint: 'Mínimo 4 caracteres para identificar tu cuenta.'
        };
    }
    if (type === 'DIGITAL_WALLET') {
        return {
            label: 'Celular o correo vinculado',
            placeholder: 'Ej. 3001234567 o usuario@correo.com',
            hint: 'Celular (10 a 15 dígitos) o correo electrónico válido.'
        };
    }
    if (type === 'BANK_TRANSFER') {
        return {
            label: 'Número de cuenta bancaria',
            placeholder: 'Ej. 12345678901',
            hint: 'Entre 6 y 20 dígitos numéricos.'
        };
    }
    return {
        label: 'Referencia',
        placeholder: 'Referencia del medio de pago',
        hint: ''
    };
}

export default function FanPaymentMethodFormDialog({
    visible,
    item,
    catalogOptions,
    onHide,
    onSubmit
}: FanPaymentMethodFormDialogProps) {
    const editing = item !== null;
    const defaultCatalogId = catalogOptions[0]?.id ?? null;

    const [values, setValues] = useState<FanPaymentMethodFormValues>(toFanPaymentMethodFormValues(null, defaultCatalogId));
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) return;
        setValues(toFanPaymentMethodFormValues(item, item ? item.paymentMethod.id : catalogOptions[0]?.id ?? null));
        setSubmitted(false);
        setServerError(null);
    }, [visible, item, catalogOptions]);

    const selectedCatalog = useMemo(() => {
        if (item) return item.paymentMethod;
        return catalogOptions.find((method) => method.id === values.paymentMethodId) ?? null;
    }, [item, catalogOptions, values.paymentMethodId]);

    const selectedType = selectedCatalog?.type ?? null;
    const errors = validateFanPaymentMethodForm(values, selectedType, editing);
    const fieldError = (field: keyof FanPaymentMethodFormValues) => (submitted ? errors[field] : undefined);
    const invalidClass = (field: keyof FanPaymentMethodFormValues) => (fieldError(field) ? 'p-invalid' : undefined);

    const methodDropdownOptions = useMemo(() => {
        if (item) {
            return [{ label: `${item.paymentMethod.name} (${PAYMENT_METHOD_TYPE_LABELS[item.paymentMethod.type]})`, value: item.paymentMethod.id }];
        }
        return catalogOptions.map((method) => ({
            label: `${method.name} (${PAYMENT_METHOD_TYPE_LABELS[method.type]})`,
            value: method.id
        }));
    }, [item, catalogOptions]);

    const refMeta = referenceLabelFor(selectedType);
    const currentYear = new Date().getFullYear();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (Object.keys(errors).length > 0 || !selectedType) return;

        setSaving(true);
        const result = await onSubmit(values, selectedType);
        setSaving(false);

        if (result.ok) onHide();
        else setServerError(result.error ?? 'No se pudo guardar el método de pago');
    };

    return (
        <Dialog
            header={editing ? 'Editar método de pago propio' : 'Registrar método de pago'}
            visible={visible}
            onHide={onHide}
            className="w-full md:w-8 lg:w-6 xl:w-5"
            breakpoints={{ '640px': '95vw' }}
            modal
        >
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                {!editing && catalogOptions.length === 0 && (
                    <Message
                        severity="warn"
                        text="No hay métodos de pago activos disponibles en el catálogo en este momento."
                        className="w-full mb-3"
                    />
                )}

                <div className="formgrid grid">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="fan-pm-catalog">Método de pago</label>
                        <Dropdown
                            inputId="fan-pm-catalog"
                            value={values.paymentMethodId}
                            options={methodDropdownOptions}
                            onChange={(event) => setValues((current) => ({ ...current, paymentMethodId: (event.value as number | null) ?? null }))}
                            placeholder="Selecciona un método"
                            disabled={editing || catalogOptions.length === 0}
                            className={invalidClass('paymentMethodId')}
                        />
                        {fieldError('paymentMethodId') && <small className="p-error">{fieldError('paymentMethodId')}</small>}
                    </div>

                    <div className="field col-12 md:col-6">
                        <label htmlFor="fan-pm-alias">Alias</label>
                        <InputText
                            id="fan-pm-alias"
                            value={values.alias}
                            onChange={(event) => setValues((current) => ({ ...current, alias: event.target.value }))}
                            placeholder="Ej. Visa personal, Nequi principal"
                            className={invalidClass('alias')}
                            autoFocus
                        />
                        {fieldError('alias') && <small className="p-error">{fieldError('alias')}</small>}
                    </div>

                    <div className="field col-12">
                        <label htmlFor="fan-pm-reference">{refMeta.label}</label>
                        <InputText
                            id="fan-pm-reference"
                            value={values.reference}
                            onChange={(event) => setValues((current) => ({ ...current, reference: event.target.value }))}
                            placeholder={refMeta.placeholder}
                            className={invalidClass('reference')}
                        />
                        {fieldError('reference') ? (
                            <small className="p-error">{fieldError('reference')}</small>
                        ) : (
                            refMeta.hint && <small className="text-600">{refMeta.hint}</small>
                        )}
                    </div>

                    {selectedType === 'CARD' && (
                        <>
                            <div className="field col-12 md:col-8">
                                <label htmlFor="fan-pm-card-holder">Titular de la tarjeta</label>
                                <InputText
                                    id="fan-pm-card-holder"
                                    value={values.cardHolder}
                                    onChange={(event) => setValues((current) => ({ ...current, cardHolder: event.target.value }))}
                                    className={invalidClass('cardHolder')}
                                />
                                {fieldError('cardHolder') && <small className="p-error">{fieldError('cardHolder')}</small>}
                            </div>
                            <div className="field col-12 md:col-4">
                                <label htmlFor="fan-pm-brand">Franquicia</label>
                                <Dropdown
                                    inputId="fan-pm-brand"
                                    value={values.brand}
                                    options={CARD_BRAND_OPTIONS}
                                    onChange={(event) => setValues((current) => ({ ...current, brand: String(event.value ?? 'VISA') }))}
                                    className={invalidClass('brand')}
                                />
                                {fieldError('brand') && <small className="p-error">{fieldError('brand')}</small>}
                            </div>
                            <div className="field col-12 md:col-6">
                                <label htmlFor="fan-pm-exp-month">Mes de vencimiento</label>
                                <InputNumber
                                    inputId="fan-pm-exp-month"
                                    value={values.expirationMonth}
                                    onValueChange={(event) => setValues((current) => ({ ...current, expirationMonth: event.value ?? null }))}
                                    min={1}
                                    max={12}
                                    useGrouping={false}
                                    placeholder="1 - 12"
                                    className={invalidClass('expirationMonth')}
                                />
                                {fieldError('expirationMonth') && <small className="p-error">{fieldError('expirationMonth')}</small>}
                            </div>
                            <div className="field col-12 md:col-6">
                                <label htmlFor="fan-pm-exp-year">Año de vencimiento</label>
                                <InputNumber
                                    inputId="fan-pm-exp-year"
                                    value={values.expirationYear}
                                    onValueChange={(event) => setValues((current) => ({ ...current, expirationYear: event.value ?? null }))}
                                    min={currentYear}
                                    max={currentYear + 20}
                                    useGrouping={false}
                                    placeholder={`Ej. ${currentYear + 2}`}
                                    className={invalidClass('expirationYear')}
                                />
                                {fieldError('expirationYear') && <small className="p-error">{fieldError('expirationYear')}</small>}
                            </div>
                        </>
                    )}

                    {selectedType === 'PSE' && (
                        <>
                            <div className="field col-12 md:col-6">
                                <label htmlFor="fan-pm-pse-bank">Banco</label>
                                <InputText
                                    id="fan-pm-pse-bank"
                                    value={values.bankName}
                                    onChange={(event) => setValues((current) => ({ ...current, bankName: event.target.value }))}
                                    placeholder="Ej. Bancolombia"
                                    className={invalidClass('bankName')}
                                />
                                {fieldError('bankName') && <small className="p-error">{fieldError('bankName')}</small>}
                            </div>
                            <div className="field col-12 md:col-6">
                                <label htmlFor="fan-pm-pse-person">Tipo de persona</label>
                                <Dropdown
                                    inputId="fan-pm-pse-person"
                                    value={values.personType}
                                    options={PSE_PERSON_TYPE_OPTIONS}
                                    onChange={(event) => setValues((current) => ({ ...current, personType: String(event.value ?? 'NATURAL') }))}
                                    className={invalidClass('personType')}
                                />
                                {fieldError('personType') && <small className="p-error">{fieldError('personType')}</small>}
                            </div>
                            <div className="field col-12 md:col-6">
                                <label htmlFor="fan-pm-pse-doc-type">Tipo de documento</label>
                                <Dropdown
                                    inputId="fan-pm-pse-doc-type"
                                    value={values.documentType}
                                    options={PSE_DOCUMENT_TYPE_OPTIONS}
                                    onChange={(event) => setValues((current) => ({ ...current, documentType: String(event.value ?? 'CC') }))}
                                    className={invalidClass('documentType')}
                                />
                                {fieldError('documentType') && <small className="p-error">{fieldError('documentType')}</small>}
                            </div>
                            <div className="field col-12 md:col-6">
                                <label htmlFor="fan-pm-pse-doc-num">Número de documento</label>
                                <InputText
                                    id="fan-pm-pse-doc-num"
                                    value={values.documentNumber}
                                    onChange={(event) => setValues((current) => ({ ...current, documentNumber: event.target.value }))}
                                    className={invalidClass('documentNumber')}
                                />
                                {fieldError('documentNumber') && <small className="p-error">{fieldError('documentNumber')}</small>}
                            </div>
                        </>
                    )}

                    {selectedType === 'DIGITAL_WALLET' && (
                        <>
                            <div className="field col-12 md:col-6">
                                <label htmlFor="fan-pm-wallet-provider">Proveedor de billetera</label>
                                <InputText
                                    id="fan-pm-wallet-provider"
                                    value={values.provider}
                                    onChange={(event) => setValues((current) => ({ ...current, provider: event.target.value }))}
                                    placeholder="Ej. Nequi, Daviplata, PayPal"
                                    className={invalidClass('provider')}
                                />
                                {fieldError('provider') && <small className="p-error">{fieldError('provider')}</small>}
                            </div>
                            <div className="field col-12 md:col-6">
                                <label htmlFor="fan-pm-wallet-holder">Titular de la cuenta</label>
                                <InputText
                                    id="fan-pm-wallet-holder"
                                    value={values.accountHolder}
                                    onChange={(event) => setValues((current) => ({ ...current, accountHolder: event.target.value }))}
                                    className={invalidClass('accountHolder')}
                                />
                                {fieldError('accountHolder') && <small className="p-error">{fieldError('accountHolder')}</small>}
                            </div>
                        </>
                    )}

                    {selectedType === 'BANK_TRANSFER' && (
                        <>
                            <div className="field col-12 md:col-6">
                                <label htmlFor="fan-pm-bank-name">Banco</label>
                                <InputText
                                    id="fan-pm-bank-name"
                                    value={values.bankName}
                                    onChange={(event) => setValues((current) => ({ ...current, bankName: event.target.value }))}
                                    placeholder="Ej. Banco de Bogotá"
                                    className={invalidClass('bankName')}
                                />
                                {fieldError('bankName') && <small className="p-error">{fieldError('bankName')}</small>}
                            </div>
                            <div className="field col-12 md:col-6">
                                <label htmlFor="fan-pm-bank-account-type">Tipo de cuenta</label>
                                <Dropdown
                                    inputId="fan-pm-bank-account-type"
                                    value={values.accountType}
                                    options={BANK_ACCOUNT_TYPE_OPTIONS}
                                    onChange={(event) => setValues((current) => ({ ...current, accountType: String(event.value ?? 'SAVINGS') }))}
                                    className={invalidClass('accountType')}
                                />
                                {fieldError('accountType') && <small className="p-error">{fieldError('accountType')}</small>}
                            </div>
                            <div className="field col-12">
                                <label htmlFor="fan-pm-bank-holder">Titular de la cuenta</label>
                                <InputText
                                    id="fan-pm-bank-holder"
                                    value={values.accountHolder}
                                    onChange={(event) => setValues((current) => ({ ...current, accountHolder: event.target.value }))}
                                    className={invalidClass('accountHolder')}
                                />
                                {fieldError('accountHolder') && <small className="p-error">{fieldError('accountHolder')}</small>}
                            </div>
                        </>
                    )}
                </div>

                {editing && (
                    <div className="field flex align-items-center gap-2 mt-1">
                        <InputSwitch
                            inputId="fan-pm-active"
                            checked={values.active}
                            onChange={(event) => setValues((current) => ({ ...current, active: Boolean(event.value) }))}
                        />
                        <label htmlFor="fan-pm-active" className="m-0">
                            {values.active ? 'Activo' : 'Inactivo'}
                        </label>
                    </div>
                )}

                <div className="flex justify-content-end gap-2 mt-3">
                    <Button type="button" label="Cancelar" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button
                        type="submit"
                        label={editing ? 'Guardar cambios' : 'Registrar método'}
                        icon="pi pi-check"
                        className="w-auto"
                        loading={saving}
                        disabled={!editing && catalogOptions.length === 0}
                    />
                </div>
            </form>
        </Dialog>
    );
}

