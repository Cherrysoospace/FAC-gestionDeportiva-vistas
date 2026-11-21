'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/layout/context/authcontext';
import ProtectedRoute from '@/layout/ProtectedRoute';
import { FormActionResult } from '@/lib/form-action';
import {
    BOARD_VIEW_ENDPOINTS,
    GOAL_CREATE_ENDPOINT,
    GOAL_DELETE_ENDPOINT,
    GOAL_UPDATE_ENDPOINT,
    GOALS_LIST_ENDPOINT,
    MATCH_CREATE_ENDPOINT,
    MATCH_DELETE_ENDPOINT,
    MATCH_FORM_ENDPOINTS,
    MATCH_RECORD_RESULT_ENDPOINT,
    MATCH_UPDATE_ENDPOINT,
    MATCHES_VIEW_ENDPOINTS
} from '@/lib/match-constants';
import { MatchFormValues, toCreateMatchPayload, toUpdateMatchPayload } from '@/lib/match-form';
import {
    canCancelMatch,
    canDeleteMatch,
    canEditMatch,
    canRecordResult,
    canStartMatch,
    canToggleMatchBetting,
    canViewMatchGoals,
    formatScore,
    MATCH_STATUS_LABELS,
    MATCH_STATUS_OPTIONS,
    MATCH_STATUS_SEVERITY
} from '@/lib/match-labels';
import { TEAM_PLAYERS_LIST_ENDPOINT } from '@/lib/player-constants';
import { TOURNAMENTS_VIEW_ENDPOINTS } from '@/lib/tournament-constants';
import { formatDateTime, isTournamentClosed } from '@/lib/tournament-labels';
import { listTournaments } from '@/lib/tournaments-api';
import { ActionResult } from '@/types/action';
import { EndpointRequirement } from '@/types/security';
import { Match, MatchStatus, RecordMatchResultPayload, Tournament } from '@/types/sports';
import MatchFormDialog from './components/MatchFormDialog';
import MatchGoalsDialog from './components/MatchGoalsDialog';
import MatchResultDialog from './components/MatchResultDialog';
import { useMatches } from './hooks/useMatches';

const SKELETON_ROWS = Array.from({ length: 5 }, (_, index) => ({ id: -(index + 1) } as Match));

type DialogState = { visible: boolean; match: Match | null };

export default function MatchesPage() {
    return (
        <ProtectedRoute requiredEndpoints={MATCHES_VIEW_ENDPOINTS}>
            <MatchesContent />
        </ProtectedRoute>
    );
}

function MatchesContent() {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl } = useAuth();
    const [tournamentId, setTournamentId] = useState<number | null>(null);
    const [status, setStatus] = useState<MatchStatus | null>(null);
    const [dialog, setDialog] = useState<DialogState>({ visible: false, match: null });
    const [resultMatch, setResultMatch] = useState<Match | null>(null);
    const [goalsMatch, setGoalsMatch] = useState<Match | null>(null);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);

    const can = (...endpoints: EndpointRequirement[]) => endpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    const canCreate = can(MATCH_CREATE_ENDPOINT, ...MATCH_FORM_ENDPOINTS);
    const canUpdate = can(MATCH_UPDATE_ENDPOINT);
    const canEdit = canUpdate && can(...MATCH_FORM_ENDPOINTS);
    const canDelete = can(MATCH_DELETE_ENDPOINT);
    const canViewBoard = can(...BOARD_VIEW_ENDPOINTS);
    const canRecordMatchResult = can(MATCH_RECORD_RESULT_ENDPOINT);
    const canViewGoals = can(GOALS_LIST_ENDPOINT);
    const canCreateGoal = can(GOAL_CREATE_ENDPOINT);
    const canUpdateGoal = can(GOAL_UPDATE_ENDPOINT);
    const canDeleteGoal = can(GOAL_DELETE_ENDPOINT);
    const canLoadTeamPlayers = can(TEAM_PLAYERS_LIST_ENDPOINT);
    const canListTournaments = can(...TOURNAMENTS_VIEW_ENDPOINTS);

    const { matches, loading, error, reload, create, update, changeStatus, toggleBetting, recordResult, remove } = useMatches({ tournamentId, status });

    const tournamentStatusById = useMemo(
        () => new Map(tournaments.map((tournament) => [tournament.id, tournament.status])),
        [tournaments]
    );
    const isMatchTournamentClosed = (match: Match) =>
        isTournamentClosed(match.phase.tournament.status ?? tournamentStatusById.get(match.phase.tournament.id));

    // Filtro por torneo
    useEffect(() => {
        if (!canListTournaments) return;
        const controller = new AbortController();
        listTournaments({}, controller.signal)
            .then(setTournaments)
            .catch(() => undefined);
        return () => controller.abort();
    }, [canListTournaments]);

    const notify = (result: ActionResult, successText: string, errorSummary = 'No se pudo completar') =>
        toast.current?.show(result.ok ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 } : { severity: 'error', summary: errorSummary, detail: result.error, life: 6000 });

    // Los errores los muestra el formulario; aquí solo el éxito
    const handleSubmit = async (values: MatchFormValues): Promise<FormActionResult> => {
        const editing = dialog.match;
        const result = editing ? await update(editing.id, toUpdateMatchPayload(values, editing)) : await create(toCreateMatchPayload(values));
        if (result.ok) notify(result, editing ? 'Partido actualizado.' : 'Partido programado.');
        return result;
    };

    const handleRecordResult = async (matchId: number, payload: RecordMatchResultPayload): Promise<FormActionResult> => {
        const wasFinished = resultMatch?.status === 'FINISHED';
        const result = await recordResult(matchId, payload);
        if (result.ok) {
            notify(result, wasFinished ? 'Marcador actualizado correctamente.' : 'Resultado final registrado y partido finalizado.');
        }
        return result;
    };

    const confirmStatus = (match: Match, next: MatchStatus) =>
        confirmDialog({
            header: next === 'IN_PROGRESS' ? 'Iniciar partido' : 'Cancelar partido',
            message:
                next === 'IN_PROGRESS'
                    ? `¿Iniciar ${match.homeTeam.name} vs ${match.awayTeam.name}? Se cierran sus apuestas y ya no se podrán cambiar equipos, escenario, pelota ni fecha.`
                    : `¿Cancelar ${match.homeTeam.name} vs ${match.awayTeam.name}? No se puede deshacer.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: next === 'IN_PROGRESS' ? 'Iniciar' : 'Cancelar partido',
            rejectLabel: 'Volver',
            acceptClassName: next === 'CANCELLED' ? 'p-button-danger' : undefined,
            accept: async () => {
                const result = await changeStatus(match.id, next);
                notify(result, `El partido pasó a ${MATCH_STATUS_LABELS[next].toLowerCase()}.`, 'No se pudo cambiar el estado');
            }
        });

    const confirmBettingToggle = (match: Match) => {
        const nextOpen = !match.bettingOpen;
        confirmDialog({
            header: nextOpen ? 'Reabrir apuestas' : 'Cerrar apuestas',
            message: nextOpen
                ? `¿Reabrir las apuestas para ${match.homeTeam.name} vs ${match.awayTeam.name}? Los aficionados podrán registrar, editar o cancelar apuestas nuevamente mientras el partido siga programado.`
                : `¿Cerrar las apuestas para ${match.homeTeam.name} vs ${match.awayTeam.name}? No se permitirán nuevas apuestas ni cambios hasta que se reabran.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: nextOpen ? 'Reabrir apuestas' : 'Cerrar apuestas',
            rejectLabel: 'Volver',
            acceptClassName: nextOpen ? undefined : 'p-button-warning',
            accept: async () => {
                const result = await toggleBetting(match.id, nextOpen);
                notify(
                    result,
                    nextOpen ? 'Apuestas reabiertas para este partido.' : 'Apuestas cerradas para este partido.',
                    'No se pudo actualizar el estado de apuestas'
                );
            }
        });
    };

    const handleDelete = (match: Match) =>
        confirmDialog({
            header: 'Eliminar partido',
            message: `¿Eliminar ${match.homeTeam.name} vs ${match.awayTeam.name}? Si ya tiene información asociada, cancélalo en su lugar.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Volver',
            acceptClassName: 'p-button-danger',
            accept: async () => notify(await remove(match.id), 'Partido eliminado.', 'No se puede eliminar el partido')
        });

    const cell = (render: (match: Match) => ReactNode, width = '6rem') =>
        function CellBody(match: Match) {
            return loading ? <Skeleton width={width} /> : render(match);
        };

    const dateBody = cell((match) => formatDateTime(match.scheduledAt), '8rem');
    const phaseBody = cell(
        (match) => (
            <div className="flex flex-column">
                <span className="text-900">{match.phase.tournament.name}</span>
                <span className="text-600 text-sm">{match.phase.label}</span>
            </div>
        ),
        '8rem'
    );
    const teamsBody = cell(
        (match) => (
            <span className="font-medium text-900">
                {match.homeTeam.name} <span className="text-600 mx-2">{formatScore(match.homeScore, match.awayScore)}</span> {match.awayTeam.name}
            </span>
        ),
        '12rem'
    );
    const venueBody = cell((match) => match.venue.name);
    const statusBody = cell(
        (match) => (
            <div className="flex flex-wrap gap-1 align-items-center">
                <Tag value={MATCH_STATUS_LABELS[match.status]} severity={MATCH_STATUS_SEVERITY[match.status]} />
                {match.status === 'SCHEDULED' && (
                    <Tag value={match.bettingOpen ? 'Apuestas abiertas' : 'Apuestas cerradas'} severity={match.bettingOpen ? 'success' : 'warning'} />
                )}
            </div>
        ),
        '8rem'
    );

    const actionsBody = (match: Match) => {
        if (loading) return <Skeleton width="10rem" height="2rem" />;
        const tournamentClosed = isMatchTournamentClosed(match);
        return (
            <div className="flex gap-1">
                {canViewBoard && <Button icon="pi pi-map" rounded text tooltip="Pizarra" tooltipOptions={{ position: 'top' }} aria-label="Ver pizarra" onClick={() => router.push(`/partidos/${match.id}/pizarra`)} />}
                {canViewGoals && canViewMatchGoals(match.status) && (
                    <Button icon="pi pi-list" rounded text tooltip="Anotaciones" tooltipOptions={{ position: 'top' }} aria-label="Ver anotaciones del partido" onClick={() => setGoalsMatch(match)} />
                )}
                {canRecordMatchResult && canRecordResult(match.status) && (
                    <Button
                        icon="pi pi-check-circle"
                        rounded
                        text
                        severity="help"
                        tooltip={
                            tournamentClosed
                                ? 'El torneo está finalizado o cancelado: no se puede editar el resultado'
                                : match.status === 'FINISHED'
                                  ? 'Corregir resultado'
                                  : 'Registrar resultado final'
                        }
                        tooltipOptions={{ position: 'top', showOnDisabled: true }}
                        aria-label="Registrar resultado final"
                        disabled={tournamentClosed}
                        onClick={() => setResultMatch(match)}
                    />
                )}
                {canEdit && canEditMatch(match.status) && <Button icon="pi pi-pencil" rounded text tooltip="Editar" tooltipOptions={{ position: 'top' }} aria-label="Editar partido" onClick={() => setDialog({ visible: true, match })} />}
                {canUpdate && canToggleMatchBetting(match.status) && (
                    <Button
                        icon={match.bettingOpen ? 'pi pi-lock' : 'pi pi-lock-open'}
                        rounded
                        text
                        severity={match.bettingOpen ? 'warning' : 'success'}
                        tooltip={
                            !match.bettingOpen && tournamentClosed
                                ? 'El torneo está finalizado o cancelado: no se pueden reabrir apuestas'
                                : match.bettingOpen
                                  ? 'Cerrar apuestas'
                                  : 'Reabrir apuestas'
                        }
                        tooltipOptions={{ position: 'top', showOnDisabled: true }}
                        aria-label={match.bettingOpen ? 'Cerrar apuestas del partido' : 'Reabrir apuestas del partido'}
                        disabled={!match.bettingOpen && tournamentClosed}
                        onClick={() => confirmBettingToggle(match)}
                    />
                )}
                {canUpdate && canStartMatch(match.status) && (
                    <Button icon="pi pi-play" rounded text severity="success" tooltip="Iniciar" tooltipOptions={{ position: 'top' }} aria-label="Iniciar partido" onClick={() => confirmStatus(match, 'IN_PROGRESS')} />
                )}
                {canUpdate && canCancelMatch(match.status) && (
                    <Button icon="pi pi-ban" rounded text severity="warning" tooltip="Cancelar" tooltipOptions={{ position: 'top' }} aria-label="Cancelar partido" onClick={() => confirmStatus(match, 'CANCELLED')} />
                )}
                {canDelete && canDeleteMatch(match.status) && <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Eliminar" tooltipOptions={{ position: 'top' }} aria-label="Eliminar partido" onClick={() => handleDelete(match)} />}
            </div>
        );
    };

    const hasFilters = tournamentId !== null || status !== null;

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            <PageHeader
                title="Partidos"
                subtitle="Programa los partidos de cada fase, inícialos o cancélalos y sigue su desarrollo en la pizarra."
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Partidos' }]}
                actions={canCreate && <Button label="Programar partido" icon="pi pi-plus" onClick={() => setDialog({ visible: true, match: null })} />}
            />

            {error && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message severity="error" text={error} className="w-full" />
                    <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
                </div>
            )}

            <div className="card">
                <h5>Listado de partidos</h5>
                <div className="grid mb-2">
                    <div className="col-12 md:col-6 lg:col-4">
                        <Dropdown
                            value={tournamentId}
                            options={tournaments.map((tournament) => ({ label: tournament.name, value: tournament.id }))}
                            onChange={(event) => setTournamentId((event.value as number | null) ?? null)}
                            placeholder={canListTournaments ? 'Todos los torneos' : 'Sin permiso para ver torneos'}
                            aria-label="Filtrar por torneo"
                            showClear
                            disabled={!canListTournaments}
                            className="w-full"
                        />
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <Dropdown
                            value={status}
                            options={MATCH_STATUS_OPTIONS}
                            onChange={(event) => setStatus((event.value as MatchStatus | null) ?? null)}
                            placeholder="Todos los estados"
                            aria-label="Filtrar por estado"
                            showClear
                            className="w-full"
                        />
                    </div>
                </div>

                <DataTable
                    value={loading ? SKELETON_ROWS : matches}
                    dataKey="id"
                    paginator={!loading && matches.length > 10}
                    rows={10}
                    emptyMessage={<EmptyState icon="pi-calendar" title={hasFilters ? 'Ningún partido coincide con los filtros.' : 'No hay partidos programados.'} />}
                >
                    <Column header="Fecha" body={dateBody} />
                    <Column header="Torneo / fase" body={phaseBody} />
                    <Column header="Partido" body={teamsBody} />
                    <Column header="Escenario" body={venueBody} />
                    <Column header="Estado" body={statusBody} />
                    <Column header="Acciones" body={actionsBody} headerClassName="w-15rem" />
                </DataTable>
            </div>

            <MatchFormDialog visible={dialog.visible} match={dialog.match} onHide={() => setDialog({ visible: false, match: null })} onSubmit={handleSubmit} />
            <MatchResultDialog visible={resultMatch !== null} match={resultMatch} onHide={() => setResultMatch(null)} onSubmit={handleRecordResult} />
            <MatchGoalsDialog
                visible={goalsMatch !== null}
                match={goalsMatch}
                tournamentClosed={goalsMatch ? isMatchTournamentClosed(goalsMatch) : false}
                canViewGoals={canViewGoals}
                canCreateGoal={canCreateGoal}
                canUpdateGoal={canUpdateGoal}
                canDeleteGoal={canDeleteGoal}
                canLoadPlayers={canLoadTeamPlayers}
                onHide={() => setGoalsMatch(null)}
                onNotify={notify}
            />
        </>
    );
}
