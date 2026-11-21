'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { AdminFanFormValues, toAdminFanFormValues, validateAdminFanForm } from '@/lib/fan-form';
import { FormActionResult } from '@/lib/form-action';
import { Fan } from '@/types/sports';

interface FanFormDialogProps {
    visible: boolean;
    /** null = registrar un aficionado nuevo */
    fan: Fan | null;
    onHide: () => void;
    onSubmit: (values: AdminFanFormValues) => Promise<FormActionResult>;
}

export default function FanFormDialog({ visible, fan, onHide, onSubmit }: FanFormDialogProps) {
    const editing = fan !== null;
    const [values, setValues] = useState<AdminFanFormValues>(toAdminFanFormValues(null));
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) return;
        setValues(toAdminFanFormValues(fan));
        setSubmitted(false);
        setServerError(null);
    }, [visible, fan]);

    const errors = validateAdminFanForm(values, editing);
    const fieldError = (field: keyof AdminFanFormValues) => (submitted ? errors[field] : undefined);
    const invalidClass = (field: keyof AdminFanFormValues) => (fieldError(field) ? 'p-invalid' : undefined);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (Object.keys(errors).length > 0) return;

        setSaving(true);
        const result = await onSubmit(values);
        setSaving(false);

        if (result.ok) onHide();
        else setServerError(result.error ?? 'No se pudo guardar el aficionado');
    };

    return (
        <Dialog
            header={editing ? 'Editar aficionado' : 'Nuevo aficionado'}
            visible={visible}
            onHide={onHide}
            className="w-full md:w-8 lg:w-6 xl:w-5"
            breakpoints={{ '640px': '95vw' }}
            modal
        >
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                <div className="formgrid grid">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="fan-security-user">ID usuario de seguridad</label>
                        <InputNumber
                            inputId="fan-security-user"
                            value={values.securityUserId}
                            onValueChange={(event) => setValues((current) => ({ ...current, securityUserId: event.value ?? null }))}
                            min={1}
                            useGrouping={false}
                            disabled={editing}
                            placeholder="Ej. 12"
                            className={invalidClass('securityUserId')}
                        />
                        {fieldError('securityUserId') && <small className="p-error">{fieldError('securityUserId')}</small>}
                        {editing && <small className="text-600">El vínculo con ms_security no se puede modificar.</small>}
                    </div>

                    <div className="field col-12 md:col-6">
                        <label htmlFor="fan-document">Documento</label>
                        <InputText
                            id="fan-document"
                            value={values.documentNumber}
                            onChange={(event) => setValues((current) => ({ ...current, documentNumber: event.target.value }))}
                            placeholder="Ej. 1053800123"
                            className={invalidClass('documentNumber')}
                        />
                        {fieldError('documentNumber') && <small className="p-error">{fieldError('documentNumber')}</small>}
                    </div>

                    <div className="field col-12">
                        <label htmlFor="fan-name">Nombre completo</label>
                        <InputText
                            id="fan-name"
                            value={values.fullName}
                            onChange={(event) => setValues((current) => ({ ...current, fullName: event.target.value }))}
                            className={invalidClass('fullName')}
                            autoFocus
                        />
                        {fieldError('fullName') && <small className="p-error">{fieldError('fullName')}</small>}
                    </div>

                    <div className="field col-12 md:col-6">
                        <label htmlFor="fan-email">Correo electrónico</label>
                        <InputText
                            id="fan-email"
                            type="email"
                            value={values.email}
                            onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
                            className={invalidClass('email')}
                        />
                        {fieldError('email') && <small className="p-error">{fieldError('email')}</small>}
                    </div>

                    <div className="field col-12 md:col-6">
                        <label htmlFor="fan-phone">Teléfono (opcional)</label>
                        <InputText
                            id="fan-phone"
                            value={values.phone}
                            onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))}
                            placeholder="Ej. 3001234567"
                            className={invalidClass('phone')}
                        />
                        {fieldError('phone') && <small className="p-error">{fieldError('phone')}</small>}
                    </div>
                </div>

                {editing && (
                    <div className="field flex align-items-center gap-2 mt-1">
                        <InputSwitch
                            inputId="fan-active"
                            checked={values.active}
                            onChange={(event) => setValues((current) => ({ ...current, active: Boolean(event.value) }))}
                        />
                        <label htmlFor="fan-active" className="m-0">
                            {values.active ? 'Activo' : 'Inactivo'}
                        </label>
                    </div>
                )}

                <div className="flex justify-content-end gap-2 mt-3">
                    <Button type="button" label="Cancelar" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button type="submit" label={editing ? 'Guardar cambios' : 'Registrar aficionado'} icon="pi pi-check" className="w-auto" loading={saving} />
                </div>
            </form>
        </Dialog>
    );
}
