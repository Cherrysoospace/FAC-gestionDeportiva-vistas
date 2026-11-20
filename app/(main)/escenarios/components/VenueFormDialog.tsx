'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { FormActionResult } from '@/lib/form-action';
import { toVenueFormValues, validateVenueForm, VenueFormValues } from '@/lib/venue-form';
import { Venue, VenueParent } from '@/types/sports';

interface VenueFormDialogProps {
    visible: boolean;
    /** null = crear un escenario nuevo */
    venue: Venue | null;
    /** Al crear un espacio interno desde el detalle: el padre queda fijo */
    fixedParent?: VenueParent | null;
    /** Escenarios activos para elegir el padre (GET /venues?active=true) */
    parentOptions: Venue[];
    onHide: () => void;
    onSubmit: (values: VenueFormValues) => Promise<FormActionResult>;
}

const PRINCIPAL = { label: 'Ninguno (escenario principal)', value: null };

export default function VenueFormDialog({ visible, venue, fixedParent = null, parentOptions, onHide, onSubmit }: VenueFormDialogProps) {
    const editing = venue !== null;

    const [values, setValues] = useState<VenueFormValues>(toVenueFormValues(null));
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) return;
        setValues(toVenueFormValues(venue, fixedParent?.id ?? null));
        setSubmitted(false);
        setServerError(null);
    }, [visible, venue, fixedParent]);

    // No se ofrece el propio escenario como padre; los ciclos más profundos los rechaza el backend
    const options = useMemo(() => {
        const list = parentOptions.filter((option) => option.id !== venue?.id).map((option) => ({ label: option.parent ? `${option.name} (en ${option.parent.name})` : option.name, value: option.id as number | null }));
        // Al editar se muestra el padre actual aunque esté inactivo
        if (venue?.parent && !list.some((option) => option.value === venue.parent?.id)) list.unshift({ label: venue.parent.name, value: venue.parent.id });
        return [PRINCIPAL, ...list];
    }, [parentOptions, venue]);

    const errors = validateVenueForm(values);
    const fieldError = (field: keyof VenueFormValues) => (submitted ? errors[field] : undefined);
    const invalidClass = (field: keyof VenueFormValues) => (fieldError(field) ? 'p-invalid' : undefined);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (Object.keys(errors).length > 0) return;

        setSaving(true);
        const result = await onSubmit(values);
        setSaving(false);

        if (result.ok) onHide();
        else if (result.validation) setServerError(result.error ?? 'Revisa los datos del escenario');
    };

    const title = editing ? 'Editar escenario' : fixedParent ? `Nuevo espacio interno de ${fixedParent.name}` : 'Nuevo escenario';

    return (
        <Dialog header={title} visible={visible} onHide={onHide} className="w-full md:w-8 lg:w-6 xl:w-4" breakpoints={{ '640px': '95vw' }} modal>
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                <div className="field">
                    <label htmlFor="venue-name">Nombre</label>
                    <InputText id="venue-name" value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} className={invalidClass('name')} placeholder="Ej. Estadio Palogrande o Cancha 2" autoFocus />
                    {fieldError('name') && <small className="p-error">{fieldError('name')}</small>}
                </div>

                <div className="field">
                    <label htmlFor="venue-address">Dirección (opcional)</label>
                    <InputText id="venue-address" value={values.address} onChange={(event) => setValues((current) => ({ ...current, address: event.target.value }))} className={invalidClass('address')} />
                    {fieldError('address') && <small className="p-error">{fieldError('address')}</small>}
                </div>

                {!fixedParent && (
                    <div className="field">
                        <label htmlFor="venue-parent">Pertenece a</label>
                        <Dropdown inputId="venue-parent" value={values.parentId} options={options} onChange={(event) => setValues((current) => ({ ...current, parentId: (event.value as number | null) ?? null }))} filter={options.length > 8} />
                        <small className="text-600">Elige un escenario si este es un espacio interno (por ejemplo, una cancha dentro de un complejo).</small>
                    </div>
                )}

                {editing && (
                    <div className="field flex align-items-center gap-2">
                        <InputSwitch inputId="venue-active" checked={values.active} onChange={(event) => setValues((current) => ({ ...current, active: Boolean(event.value) }))} />
                        <label htmlFor="venue-active" className="m-0">
                            {values.active ? 'Activo' : 'Inactivo'}
                        </label>
                    </div>
                )}

                <div className="flex justify-content-end gap-2 mt-2">
                    <Button type="button" label="Cancelar" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button type="submit" label={editing ? 'Guardar cambios' : 'Crear'} icon="pi pi-check" className="w-auto" loading={saving} />
                </div>
            </form>
        </Dialog>
    );
}
