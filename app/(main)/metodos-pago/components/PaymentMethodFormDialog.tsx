'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { FormActionResult } from '@/lib/form-action';
import {
    CatalogPaymentMethodFormValues,
    PAYMENT_METHOD_TYPE_OPTIONS,
    toCatalogPaymentMethodFormValues,
    validateCatalogPaymentMethodForm
} from '@/lib/payment-method-form';
import { PaymentMethod, PaymentMethodType } from '@/types/sports';

interface PaymentMethodFormDialogProps {
    visible: boolean;
    paymentMethod: PaymentMethod | null;
    onHide: () => void;
    onSubmit: (values: CatalogPaymentMethodFormValues) => Promise<FormActionResult>;
}

export default function PaymentMethodFormDialog({ visible, paymentMethod, onHide, onSubmit }: PaymentMethodFormDialogProps) {
    const editing = paymentMethod !== null;
    const typeLocked = editing && paymentMethod.fanPaymentMethodsCount > 0;

    const [values, setValues] = useState<CatalogPaymentMethodFormValues>(toCatalogPaymentMethodFormValues(null));
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) return;
        setValues(toCatalogPaymentMethodFormValues(paymentMethod));
        setSubmitted(false);
        setServerError(null);
    }, [visible, paymentMethod]);

    const errors = validateCatalogPaymentMethodForm(values);
    const fieldError = (field: keyof CatalogPaymentMethodFormValues) => (submitted ? errors[field] : undefined);
    const invalidClass = (field: keyof CatalogPaymentMethodFormValues) => (fieldError(field) ? 'p-invalid' : undefined);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (Object.keys(errors).length > 0) return;

        setSaving(true);
        const result = await onSubmit(values);
        setSaving(false);

        if (result.ok) onHide();
        else setServerError(result.error ?? 'No se pudo guardar el método de pago');
    };

    return (
        <Dialog
            header={editing ? 'Editar método de pago' : 'Nuevo método de pago'}
            visible={visible}
            onHide={onHide}
            className="w-full md:w-8 lg:w-6 xl:w-4"
            breakpoints={{ '640px': '95vw' }}
            modal
        >
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                <div className="field">
                    <label htmlFor="pm-name">Nombre</label>
                    <InputText
                        id="pm-name"
                        value={values.name}
                        onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Ej. Tarjeta Crédito / Débito"
                        className={invalidClass('name')}
                        autoFocus
                    />
                    {fieldError('name') && <small className="p-error">{fieldError('name')}</small>}
                </div>

                <div className="field">
                    <label htmlFor="pm-type">Tipo de medio de pago</label>
                    <Dropdown
                        inputId="pm-type"
                        value={values.type}
                        options={PAYMENT_METHOD_TYPE_OPTIONS}
                        onChange={(event) => setValues((current) => ({ ...current, type: (event.value as PaymentMethodType | null) ?? null }))}
                        placeholder="Selecciona un tipo"
                        disabled={typeLocked}
                        className={invalidClass('type')}
                    />
                    {fieldError('type') && <small className="p-error">{fieldError('type')}</small>}
                    {typeLocked && (
                        <small className="text-600">
                            No se puede cambiar el tipo porque ya tiene aficionados asociados ({paymentMethod.fanPaymentMethodsCount}).
                        </small>
                    )}
                </div>

                <div className="field">
                    <label htmlFor="pm-description">Descripción (opcional)</label>
                    <InputTextarea
                        id="pm-description"
                        rows={3}
                        value={values.description}
                        onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
                        className={invalidClass('description')}
                    />
                    {fieldError('description') && <small className="p-error">{fieldError('description')}</small>}
                </div>

                {editing && (
                    <div className="field flex align-items-center gap-2">
                        <InputSwitch
                            inputId="pm-active"
                            checked={values.active}
                            onChange={(event) => setValues((current) => ({ ...current, active: Boolean(event.value) }))}
                        />
                        <label htmlFor="pm-active" className="m-0">
                            {values.active ? 'Activo' : 'Inactivo'}
                        </label>
                    </div>
                )}

                <div className="flex justify-content-end gap-2 mt-3">
                    <Button type="button" label="Cancelar" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button type="submit" label={editing ? 'Guardar cambios' : 'Crear'} icon="pi pi-check" className="w-auto" loading={saving} />
                </div>
            </form>
        </Dialog>
    );
}

