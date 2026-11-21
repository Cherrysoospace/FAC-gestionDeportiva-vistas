'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { confirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import EmptyState from '@/components/ui/EmptyState';
import {
    EMPTY_GOAL_FORM,
    GoalFormValues,
    toCreateGoalPayload,
    toGoalFormValues,
    toUpdateGoalPayload,
    validateGoalForm
} from '@/lib/goal-form';
import { formatScore } from '@/lib/match-labels';
import { isTournamentClosed } from '@/lib/tournament-labels';
import { ActionResult } from '@/types/action';
import { Goal, Match } from '@/types/sports';
import { useMatchGoals } from '../hooks/useMatchGoals';

interface MatchGoalsDialogProps {
    visible: boolean;
    match: Match | null;
    tournamentClosed?: boolean;
    canViewGoals: boolean;
    canCreateGoal: boolean;
    canUpdateGoal: boolean;
    canDeleteGoal: boolean;
    canLoadPlayers: boolean;
    onHide: () => void;
    onNotify: (result: ActionResult, successText: string, errorSummary?: string) => void;
}

export default function MatchGoalsDialog({
    visible,
    match,
    tournamentClosed,
    canViewGoals,
    canCreateGoal,
    canUpdateGoal,
    canDeleteGoal,
    canLoadPlayers,
    onHide,
    onNotify
}: MatchGoalsDialogProps) {
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [values, setValues] = useState<GoalFormValues>(EMPTY_GOAL_FORM);
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const isClosedTournament = tournamentClosed ?? isTournamentClosed(match?.phase.tournament.status);
    const effectiveCanCreate = canCreateGoal && !isClosedTournament;
    const effectiveCanUpdate = canUpdateGoal && !isClosedTournament;
    const effectiveCanDelete = canDeleteGoal && !isClosedTournament;
    const canEditAny = effectiveCanCreate || effectiveCanUpdate;
    const { goals, playerOptions, playerTeamMap, loading, loadingPlayers, error, create, update, remove } = useMatchGoals(
        match,
        visible,
        canViewGoals,
        canLoadPlayers && canEditAny
    );

    useEffect(() => {
        if (!visible) return;
        setEditingGoal(null);
        setValues(EMPTY_GOAL_FORM);
        setSubmitted(false);
        setServerError(null);
    }, [visible, match?.id]);

    const dropdownOptions = useMemo(() => {
        if (!editingGoal) return playerOptions;
        if (playerOptions.some((option) => option.value === editingGoal.player.id)) return playerOptions;
        return [
            {
                label: `${editingGoal.player.fullName} (${editingGoal.player.position})`,
                value: editingGoal.player.id,
                teamName: ''
            },
            ...playerOptions
        ];
    }, [playerOptions, editingGoal]);

    if (!match) return null;

    const showForm = editingGoal ? effectiveCanUpdate : effectiveCanCreate;
    const errors = validateGoalForm(values);
    const fieldError = (field: keyof GoalFormValues) => (submitted ? errors[field] : undefined);
    const invalidClass = (field: keyof GoalFormValues) => (fieldError(field) ? 'p-invalid' : undefined);
    const totalPoints = goals.reduce((sum, goal) => sum + goal.points, 0);

    const resetForm = () => {
        setEditingGoal(null);
        setValues(EMPTY_GOAL_FORM);
        setSubmitted(false);
        setServerError(null);
    };

    const handleEditClick = (goal: Goal) => {
        setEditingGoal(goal);
        setValues(toGoalFormValues(goal));
        setSubmitted(false);
        setServerError(null);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (Object.keys(errors).length > 0) return;

        setSaving(true);
        const result = editingGoal
            ? await update(editingGoal.id, toUpdateGoalPayload(values, editingGoal))
            : await create(toCreateGoalPayload(match.id, values));
        setSaving(false);

        if (result.ok) {
            onNotify(result, editingGoal ? 'Anotación actualizada.' : 'Anotación registrada y notificada.');
            resetForm();
        } else {
            setServerError(result.error ?? 'No se pudo guardar la anotación');
        }
    };

    const handleDelete = (goal: Goal) => {
        confirmDialog({
            header: 'Eliminar anotación',
            message: `¿Eliminar la anotación de ${goal.player.fullName} al minuto ${goal.minute}'?`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Volver',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                const result = await remove(goal.id);
                onNotify(result, 'Anotación eliminada.', 'No se pudo eliminar la anotación');
                if (result.ok && editingGoal?.id === goal.id) resetForm();
            }
        });
    };

    const actionsBody = (goal: Goal) => (
        <div className="flex gap-1">
            {effectiveCanUpdate && (
                <Button
                    icon="pi pi-pencil"
                    rounded
                    text
                    tooltip="Editar"
                    tooltipOptions={{ position: 'top' }}
                    aria-label="Editar anotación"
                    onClick={() => handleEditClick(goal)}
                />
            )}
            {effectiveCanDelete && (
                <Button
                    icon="pi pi-trash"
                    rounded
                    text
                    severity="danger"
                    tooltip="Eliminar"
                    tooltipOptions={{ position: 'top' }}
                    aria-label="Eliminar anotación"
                    onClick={() => handleDelete(goal)}
                />
            )}
        </div>
    );

    return (
        <Dialog
            header={`Anotaciones · ${match.homeTeam.name} vs ${match.awayTeam.name}`}
            visible={visible}
            onHide={onHide}
            className="w-full md:w-10 lg:w-8 xl:w-7"
            breakpoints={{ '640px': '95vw' }}
            modal
        >
            <div className="flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <span className="text-700">
                    Marcador actual: <strong className="text-900">{formatScore(match.homeScore, match.awayScore)}</strong>
                </span>
                <div className="flex gap-2">
                    <Tag value={`${goals.length} ${goals.length === 1 ? 'anotación' : 'anotaciones'}`} severity="info" />
                    <Tag value={`${totalPoints} ${totalPoints === 1 ? 'punto' : 'puntos'} registrados`} severity="success" />
                </div>
            </div>

            {error && <Message severity="error" text={error} className="w-full mb-3" />}

            {isClosedTournament && (
                <Message
                    severity="info"
                    text="El torneo está finalizado o cancelado: no se pueden registrar, editar ni eliminar anotaciones."
                    className="w-full mb-3"
                />
            )}

            {showForm && (
                <form onSubmit={handleSubmit} className="surface-50 border-1 surface-border border-round p-3 mb-3 p-fluid" noValidate>
                    <div className="flex align-items-center justify-content-between mb-2">
                        <span className="font-medium text-900">{editingGoal ? 'Editar anotación' : 'Registrar anotación'}</span>
                        {editingGoal && <Button type="button" label="Cancelar edición" text size="small" className="w-auto" onClick={resetForm} />}
                    </div>

                    {!canLoadPlayers && (
                        <Message
                            severity="warn"
                            text="Sin permiso para consultar plantillas (team-players): no se pueden listar los jugadores participantes."
                            className="w-full mb-3"
                        />
                    )}

                    {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                    <div className="formgrid grid">
                        <div className="field col-12 md:col-6">
                            <label htmlFor="goal-player">Jugador</label>
                            <Dropdown
                                inputId="goal-player"
                                value={values.playerId}
                                options={dropdownOptions}
                                onChange={(event) => setValues((current) => ({ ...current, playerId: (event.value as number | null) ?? null }))}
                                placeholder={loadingPlayers ? 'Cargando jugadores...' : 'Selecciona el jugador'}
                                emptyMessage="No hay jugadores habilitados en las plantillas"
                                filter={dropdownOptions.length > 6}
                                disabled={!canLoadPlayers && !editingGoal}
                                className={invalidClass('playerId')}
                            />
                            {fieldError('playerId') && <small className="p-error">{fieldError('playerId')}</small>}
                        </div>
                        <div className="field col-6 md:col-3">
                            <label htmlFor="goal-minute">Minuto</label>
                            <InputNumber
                                inputId="goal-minute"
                                value={values.minute}
                                onValueChange={(event) => setValues((current) => ({ ...current, minute: event.value ?? null }))}
                                min={0}
                                max={300}
                                useGrouping={false}
                                className={invalidClass('minute')}
                            />
                            {fieldError('minute') && <small className="p-error">{fieldError('minute')}</small>}
                        </div>
                        <div className="field col-6 md:col-3">
                            <label htmlFor="goal-points">Puntos</label>
                            <InputNumber
                                inputId="goal-points"
                                value={values.points}
                                onValueChange={(event) => setValues((current) => ({ ...current, points: event.value ?? null }))}
                                min={1}
                                max={10}
                                useGrouping={false}
                                className={invalidClass('points')}
                            />
                            {fieldError('points') && <small className="p-error">{fieldError('points')}</small>}
                        </div>
                        <div className="field col-12">
                            <label htmlFor="goal-description">Descripción (opcional)</label>
                            <InputText
                                id="goal-description"
                                value={values.description}
                                onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
                                placeholder="Ej. Gol de tiro libre, triple desde la esquina..."
                                maxLength={200}
                                className={invalidClass('description')}
                            />
                            {fieldError('description') && <small className="p-error">{fieldError('description')}</small>}
                        </div>
                    </div>

                    <div className="flex justify-content-end gap-2">
                        <Button
                            type="submit"
                            label={editingGoal ? 'Guardar cambios' : 'Registrar anotación'}
                            icon="pi pi-check"
                            className="w-auto"
                            loading={saving}
                            disabled={!canLoadPlayers && !editingGoal}
                        />
                    </div>
                </form>
            )}

            <DataTable
                value={goals}
                dataKey="id"
                loading={loading}
                paginator={!loading && goals.length > 8}
                rows={8}
                emptyMessage={<EmptyState icon="pi-list" title="Este partido aún no tiene anotaciones registradas." />}
            >
                <Column header="Minuto" body={(goal: Goal) => <Tag value={`${goal.minute}'`} severity="info" />} headerClassName="w-6rem" />
                <Column
                    header="Jugador"
                    body={(goal: Goal) => {
                        const teamName = playerTeamMap.get(goal.player.id);
                        return (
                            <div className="flex flex-column">
                                <span className="font-medium text-900">{goal.player.fullName}</span>
                                <span className="text-600 text-sm">
                                    {goal.player.position}
                                    {teamName ? ` · ${teamName}` : ''}
                                </span>
                            </div>
                        );
                    }}
                />
                <Column header="Puntos" body={(goal: Goal) => <Tag value={`+${goal.points}`} severity="success" />} headerClassName="w-6rem" />
                <Column
                    header="Descripción"
                    body={(goal: Goal) => goal.description ?? <span className="text-500">Sin descripción</span>}
                />
                {(effectiveCanUpdate || effectiveCanDelete) && <Column header="Acciones" body={actionsBody} headerClassName="w-7rem" />}
            </DataTable>
        </Dialog>
    );
}
