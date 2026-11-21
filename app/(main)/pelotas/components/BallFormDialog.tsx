'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { BallFormValues, toBallFormValues, validateBallForm } from '@/lib/ball-form';
import { FormActionResult } from '@/lib/form-action';
import { Ball } from '@/types/sports';

interface BallFormDialogProps {
    visible: boolean;
    /** null = registrar una pelota nueva */
    ball: Ball | null;
    onHide: () => void;
    onSubmit: (values: BallFormValues) => Promise<FormActionResult>;
}

export default function BallFormDialog({ visible, ball, onHide, onSubmit }: BallFormDialogProps) {
    const editing = ball !== null;
    const [values, setValues] = useState<BallFormValues>(toBallFormValues(null));
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) return;
        setValues(toBallFormValues(ball));
        setSubmitted(false);
        setServerError(null);
    }, [visible, ball]);

    const errors = validateBallForm(values);
    const fieldError = (field: keyof BallFormValues) => (submitted ? errors[field] : undefined);
    const invalidClass = (field: keyof BallFormValues) => (fieldError(field) ? 'p-invalid' : undefined);
    const setField = <K extends keyof BallFormValues>(field: K, value: BallFormValues[K]) => setValues((current) => ({ ...current, [field]: value }));

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (Object.keys(errors).length > 0) return;

        setSaving(true);
        const result = await onSubmit(values);
        setSaving(false);

        if (result.ok) onHide();
        // 400 por campo se muestra aquí; el resto (409, 503...) lo muestra la página en un Toast
        else if (result.validation) setServerError(result.error ?? 'Revisa los datos de la pelota');
    };

    return (
        <Dialog header={editing ? 'Editar pelota' : 'Nueva pelota'} visible={visible} onHide={onHide} className="w-full md:w-8 lg:w-6 xl:w-4" breakpoints={{ '640px': '95vw' }} modal>
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                <div className="field">
                    <label htmlFor="ball-brand">Marca</label>
                    <InputText id="ball-brand" value={values.brand} onChange={(event) => setField('brand', event.target.value)} className={invalidClass('brand')} autoFocus />
                    {fieldError('brand') && <small className="p-error">{fieldError('brand')}</small>}
                </div>

                <div className="field">
                    <label htmlFor="ball-model">Modelo</label>
                    <InputText id="ball-model" value={values.model} onChange={(event) => setField('model', event.target.value)} className={invalidClass('model')} />
                    {fieldError('model') && <small className="p-error">{fieldError('model')}</small>}
                </div>

                <div className="field">
                    <label htmlFor="ball-size">Talla (opcional)</label>
                    <InputText id="ball-size" value={values.size} onChange={(event) => setField('size', event.target.value)} className={invalidClass('size')} placeholder="Ej. 5" />
                    {fieldError('size') && <small className="p-error">{fieldError('size')}</small>}
                </div>

                {editing && (
                    <div className="field flex align-items-center gap-2">
                        <InputSwitch inputId="ball-active" checked={values.active} onChange={(event) => setField('active', Boolean(event.value))} />
                        <label htmlFor="ball-active" className="m-0">
                            {values.active ? 'Activa' : 'Inactiva'}
                        </label>
                    </div>
                )}

                <div className="flex justify-content-end gap-2 mt-2">
                    <Button type="button" label="Cancelar" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button type="submit" label={editing ? 'Guardar cambios' : 'Registrar pelota'} icon="pi pi-check" className="w-auto" loading={saving} />
                </div>
            </form>
        </Dialog>
    );
}
