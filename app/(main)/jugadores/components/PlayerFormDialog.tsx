'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { FormActionResult } from '@/lib/form-action';
import { DOMINANT_FOOT_OPTIONS } from '@/lib/player-labels';
import { MAX_HEIGHT_CM, MIN_HEIGHT_CM, PlayerFormValues, toPlayerFormValues, validatePlayerForm } from '@/lib/player-form';
import { DominantFoot, Player } from '@/types/sports';

interface PlayerFormDialogProps {
    visible: boolean;
    /** null = registrar un jugador nuevo */
    player: Player | null;
    onHide: () => void;
    onSubmit: (values: PlayerFormValues) => Promise<FormActionResult>;
}

const NOT_APPLICABLE = { label: 'No aplica', value: null };

export default function PlayerFormDialog({ visible, player, onHide, onSubmit }: PlayerFormDialogProps) {
    const editing = player !== null;

    const [values, setValues] = useState<PlayerFormValues>(toPlayerFormValues(null));
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) return;
        setValues(toPlayerFormValues(player));
        setSubmitted(false);
        setServerError(null);
    }, [visible, player]);

    const errors = validatePlayerForm(values);
    const fieldError = (field: keyof PlayerFormValues) => (submitted ? errors[field] : undefined);
    const invalidClass = (field: keyof PlayerFormValues) => (fieldError(field) ? 'p-invalid' : undefined);
    const setText = (field: 'fullName' | 'documentNumber' | 'nationality' | 'position') => (event: React.ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, [field]: event.target.value }));

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (Object.keys(errors).length > 0) return;

        setSaving(true);
        const result = await onSubmit(values);
        setSaving(false);

        if (result.ok) onHide();
        // Errores por campo del backend: aquí. El documento repetido (409) lo muestra la página en un Toast.
        else if (result.validation) setServerError(result.error ?? 'Revisa los datos del jugador');
    };

    return (
        <Dialog header={editing ? 'Editar jugador' : 'Registrar jugador'} visible={visible} onHide={onHide} className="w-full md:w-10 lg:w-8 xl:w-6" breakpoints={{ '640px': '95vw' }} modal>
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                <div className="formgrid grid">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="player-name">Nombre completo</label>
                        <InputText id="player-name" value={values.fullName} onChange={setText('fullName')} className={invalidClass('fullName')} autoFocus />
                        {fieldError('fullName') && <small className="p-error">{fieldError('fullName')}</small>}
                    </div>
                    <div className="field col-12 md:col-6">
                        <label htmlFor="player-document">Documento</label>
                        <InputText id="player-document" value={values.documentNumber} onChange={setText('documentNumber')} className={invalidClass('documentNumber')} placeholder="Ej. 1.053.245.678" />
                        {fieldError('documentNumber') && <small className="p-error">{fieldError('documentNumber')}</small>}
                    </div>
                    <div className="field col-12 md:col-6">
                        <label htmlFor="player-birth">Fecha de nacimiento</label>
                        <Calendar
                            inputId="player-birth"
                            value={values.birthDate}
                            onChange={(event) => setValues((current) => ({ ...current, birthDate: event.value instanceof Date ? event.value : null }))}
                            dateFormat="dd/mm/yy"
                            placeholder="dd/mm/aaaa"
                            maxDate={new Date()}
                            showIcon
                            className={invalidClass('birthDate')}
                        />
                        {fieldError('birthDate') && <small className="p-error">{fieldError('birthDate')}</small>}
                    </div>
                    <div className="field col-12 md:col-6">
                        <label htmlFor="player-nationality">Nacionalidad</label>
                        <InputText id="player-nationality" value={values.nationality} onChange={setText('nationality')} className={invalidClass('nationality')} />
                        {fieldError('nationality') && <small className="p-error">{fieldError('nationality')}</small>}
                    </div>
                    <div className="field col-12 md:col-4">
                        <label htmlFor="player-position">Posición</label>
                        <InputText id="player-position" value={values.position} onChange={setText('position')} className={invalidClass('position')} placeholder="Ej. DEL, MC, POR" />
                        {fieldError('position') && <small className="p-error">{fieldError('position')}</small>}
                    </div>
                    <div className="field col-12 md:col-4">
                        <label htmlFor="player-height">Altura</label>
                        <InputNumber
                            inputId="player-height"
                            value={values.heightCm}
                            onValueChange={(event) => setValues((current) => ({ ...current, heightCm: event.value ?? null }))}
                            min={MIN_HEIGHT_CM}
                            max={MAX_HEIGHT_CM}
                            suffix=" cm"
                            className={invalidClass('heightCm')}
                        />
                        {fieldError('heightCm') && <small className="p-error">{fieldError('heightCm')}</small>}
                    </div>
                    <div className="field col-12 md:col-4">
                        <label htmlFor="player-foot">Pie dominante</label>
                        <Dropdown
                            inputId="player-foot"
                            value={values.dominantFoot}
                            options={[NOT_APPLICABLE, ...DOMINANT_FOOT_OPTIONS]}
                            onChange={(event) => setValues((current) => ({ ...current, dominantFoot: (event.value as DominantFoot | null) ?? null }))}
                        />
                    </div>
                </div>

                {editing && (
                    <div className="field flex align-items-center gap-2">
                        <InputSwitch inputId="player-active" checked={values.active} onChange={(event) => setValues((current) => ({ ...current, active: Boolean(event.value) }))} />
                        <label htmlFor="player-active" className="m-0">
                            {values.active ? 'Activo' : 'Inactivo'}
                        </label>
                    </div>
                )}

                <div className="flex justify-content-end gap-2 mt-2">
                    <Button type="button" label="Cancelar" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button type="submit" label={editing ? 'Guardar cambios' : 'Registrar jugador'} icon="pi pi-check" className="w-auto" loading={saving} />
                </div>
            </form>
        </Dialog>
    );
}
