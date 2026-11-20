'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { FormActionResult } from '@/lib/form-action';
import { MatchFormValues, toMatchFormValues, validateMatchForm } from '@/lib/match-form';
import { Match } from '@/types/sports';
import { useMatchFormOptions } from '../hooks/useMatchFormOptions';

interface MatchFormDialogProps {
    visible: boolean;
    /** null = programar un partido nuevo */
    match: Match | null;
    onHide: () => void;
    onSubmit: (values: MatchFormValues) => Promise<FormActionResult>;
}

type Field = keyof MatchFormValues;

// HU-GC-06: programar o editar un partido (torneo → fase → equipos, escenario, pelota y fecha).
export default function MatchFormDialog({ visible, match, onHide, onSubmit }: MatchFormDialogProps) {
    const editing = match !== null;
    const [values, setValues] = useState<MatchFormValues>(toMatchFormValues(null));
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const options = useMatchFormOptions(visible, values.tournamentId, values.phaseId, match);

    useEffect(() => {
        if (!visible) return;
        setValues(toMatchFormValues(match));
        setSubmitted(false);
        setServerError(null);
    }, [visible, match]);

    const errors = validateMatchForm(values);
    const fieldError = (field: Field) => (submitted ? errors[field] : undefined);
    const invalidClass = (field: Field) => (fieldError(field) ? 'p-invalid' : undefined);

    // Cambiar el torneo o la fase limpia lo que depende de ellos
    const setField = (field: Field, value: number | null) =>
        setValues((current) => {
            const next = { ...current, [field]: value };
            if (field === 'tournamentId') Object.assign(next, { phaseId: null, homeTeamId: null, awayTeamId: null, venueId: null, ballId: null });
            if (field === 'phaseId') Object.assign(next, { homeTeamId: null, awayTeamId: null });
            return next;
        });

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (Object.keys(errors).length > 0) return;

        setSaving(true);
        const result = await onSubmit(values);
        setSaving(false);

        if (result.ok) onHide();
        // Las reglas del backend (no inscrito, fuera de fechas, pelota ocupada...) se muestran aquí
        else setServerError(result.error ?? 'No se pudo guardar el partido');
    };

    const dropdown = (field: Field, label: string, items: { label: string; value: number }[], placeholder: string, disabled = false, empty = 'Sin opciones') => (
        <div className="field col-12 md:col-6">
            <label htmlFor={`match-${field}`}>{label}</label>
            <Dropdown
                inputId={`match-${field}`}
                value={values[field]}
                options={items}
                onChange={(event) => setField(field, (event.value as number | null) ?? null)}
                placeholder={placeholder}
                emptyMessage={empty}
                filter={items.length > 8}
                disabled={disabled}
                className={invalidClass(field)}
            />
            {fieldError(field) && <small className="p-error">{fieldError(field)}</small>}
        </div>
    );

    const noTournament = values.tournamentId === null;

    return (
        <Dialog header={editing ? 'Editar partido' : 'Programar partido'} visible={visible} onHide={onHide} className="w-full md:w-10 lg:w-8 xl:w-6" breakpoints={{ '640px': '95vw' }} modal>
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}
                {options.error && <Message severity="warn" text={options.error} className="w-full mb-3" />}
                {options.noEnabledVenues && <Message severity="warn" text="El torneo no tiene escenarios habilitados: habilítalos en la pestaña Escenarios del torneo." className="w-full mb-3" />}

                <div className="formgrid grid">
                    {dropdown('tournamentId', 'Torneo', options.tournaments, 'Selecciona el torneo', editing)}
                    {dropdown('phaseId', 'Fase', options.phases, noTournament ? 'Primero elige el torneo' : 'Selecciona la fase', editing || noTournament, 'El torneo no tiene fases')}
                    {dropdown('homeTeamId', 'Equipo local', options.teams, 'Selecciona el equipo local', values.phaseId === null, 'No hay equipos inscritos en esta fase')}
                    {dropdown('awayTeamId', 'Equipo visitante', options.teams, 'Selecciona el equipo visitante', values.phaseId === null, 'No hay equipos inscritos en esta fase')}
                    {dropdown('venueId', 'Escenario', options.venues, 'Selecciona el escenario', noTournament, 'No hay escenarios habilitados')}
                    {dropdown('ballId', 'Pelota', options.balls, 'Selecciona la pelota', noTournament, 'No hay pelotas disponibles')}
                    <div className="field col-12 md:col-6">
                        <label htmlFor="match-scheduledAt">Fecha y hora</label>
                        <Calendar
                            inputId="match-scheduledAt"
                            value={values.scheduledAt}
                            onChange={(event) => setValues((current) => ({ ...current, scheduledAt: event.value instanceof Date ? event.value : null }))}
                            dateFormat="dd/mm/yy"
                            placeholder="dd/mm/aaaa hh:mm"
                            showTime
                            hourFormat="24"
                            showIcon
                            className={invalidClass('scheduledAt')}
                        />
                        {fieldError('scheduledAt') && <small className="p-error">{fieldError('scheduledAt')}</small>}
                    </div>
                </div>

                {!editing && <small className="text-600 block mb-3">Al programarlo se avisa por correo a los aficionados que asistieron o apostaron en partidos anteriores de estos equipos.</small>}

                <div className="flex justify-content-end gap-2 mt-2">
                    <Button type="button" label="Cancelar" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button type="submit" label={editing ? 'Guardar cambios' : 'Programar'} icon="pi pi-check" className="w-auto" loading={saving || options.loading} />
                </div>
            </form>
        </Dialog>
    );
}
