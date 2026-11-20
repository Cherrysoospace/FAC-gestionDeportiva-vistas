'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { ContractFormValues, toContractFormValues, validateContractForm } from '@/lib/contract-form';
import { FormActionResult } from '@/lib/form-action';
import { Player, TeamPlayer } from '@/types/sports';

interface ContractFormDialogProps {
    visible: boolean;
    teamName: string;
    /** null = asignar un jugador nuevo a la plantilla */
    contract: TeamPlayer | null;
    /** Jugadores activos (GET /players?active=true) */
    players: Player[];
    /** Jugadores con contrato vigente o próximo en este equipo: no se ofrecen */
    rosterPlayerIds: Set<number>;
    onHide: () => void;
    onSubmit: (values: ContractFormValues) => Promise<FormActionResult>;
}

// Asignar un jugador al equipo con las fechas del contrato, o corregir las fechas de un contrato vigente.
export default function ContractFormDialog({ visible, teamName, contract, players, rosterPlayerIds, onHide, onSubmit }: ContractFormDialogProps) {
    const editing = contract !== null;

    const [values, setValues] = useState<ContractFormValues>(toContractFormValues(null));
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) return;
        setValues(toContractFormValues(contract));
        setSubmitted(false);
        setServerError(null);
    }, [visible, contract]);

    const playerOptions = useMemo(() => players.filter((player) => !rosterPlayerIds.has(player.id)).map((player) => ({ label: `${player.fullName} · ${player.position} · ${player.documentNumber}`, value: player.id })), [players, rosterPlayerIds]);

    const errors = validateContractForm(values, editing);
    const fieldError = (field: keyof ContractFormValues) => (submitted ? errors[field] : undefined);
    const invalidClass = (field: keyof ContractFormValues) => (fieldError(field) ? 'p-invalid' : undefined);
    const setDate = (field: 'startDate' | 'endDate') => (event: { value?: Date | Date[] | null | string }) => setValues((current) => ({ ...current, [field]: event.value instanceof Date ? event.value : null }));

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (Object.keys(errors).length > 0) return;

        setSaving(true);
        const result = await onSubmit(values);
        setSaving(false);

        if (result.ok) onHide();
        // El 409 ("ya se encuentra asociado al equipo") se muestra aquí, como en el mockup
        else setServerError(result.error ?? 'No se pudo guardar el contrato');
    };

    return (
        <Dialog header={editing ? `Editar contrato de ${contract.player.fullName}` : `Asignar jugador a ${teamName}`} visible={visible} onHide={onHide} className="w-full md:w-8 lg:w-6 xl:w-4" breakpoints={{ '640px': '95vw' }} modal>
            <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                {!editing && (
                    <div className="field">
                        <label htmlFor="contract-player">Jugador</label>
                        <Dropdown
                            inputId="contract-player"
                            value={values.playerId}
                            options={playerOptions}
                            onChange={(event) => setValues((current) => ({ ...current, playerId: (event.value as number | null) ?? null }))}
                            placeholder="Buscar y seleccionar jugador"
                            emptyMessage="No hay jugadores activos disponibles"
                            filter
                            filterBy="label"
                            className={invalidClass('playerId')}
                        />
                        {fieldError('playerId') && <small className="p-error">{fieldError('playerId')}</small>}
                    </div>
                )}

                <div className="formgrid grid">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="contract-start">Fecha de inicio del contrato</label>
                        <Calendar inputId="contract-start" value={values.startDate} onChange={setDate('startDate')} dateFormat="dd/mm/yy" placeholder="dd/mm/aaaa" showIcon className={invalidClass('startDate')} />
                        {fieldError('startDate') && <small className="p-error">{fieldError('startDate')}</small>}
                    </div>
                    <div className="field col-12 md:col-6">
                        <label htmlFor="contract-end">Fecha de fin del contrato</label>
                        <Calendar inputId="contract-end" value={values.endDate} onChange={setDate('endDate')} dateFormat="dd/mm/yy" placeholder="dd/mm/aaaa" minDate={values.startDate ?? undefined} showIcon className={invalidClass('endDate')} />
                        {fieldError('endDate') && <small className="p-error">{fieldError('endDate')}</small>}
                    </div>
                </div>

                <div className="flex justify-content-end gap-2 mt-2">
                    <Button type="button" label="Cancelar" outlined className="w-auto" onClick={onHide} disabled={saving} />
                    <Button type="submit" label={editing ? 'Guardar cambios' : 'Asignar'} icon="pi pi-check" className="w-auto" loading={saving} />
                </div>
            </form>
        </Dialog>
    );
}
