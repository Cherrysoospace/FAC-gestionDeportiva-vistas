'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { TabPanel, TabView } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/layout/context/authcontext';
import ProtectedRoute from '@/layout/ProtectedRoute';
import {
    REGISTRATION_CREATE_ENDPOINT,
    REGISTRATION_WITHDRAW_ENDPOINT,
    REGISTRATIONS_LIST_ENDPOINT,
    SPORTS_LIST_ENDPOINT,
    TOURNAMENT_DETAIL_ENDPOINTS,
    TOURNAMENT_DEVELOPMENT_ENDPOINT,
    TOURNAMENT_UPDATE_ENDPOINT
} from '@/lib/tournament-constants';
import { TEAM_DETAIL_ENDPOINTS, TEAMS_VIEW_ENDPOINTS } from '@/lib/team-constants';
import { toUpdatePayload, TournamentActionResult, TournamentFormValues } from '@/lib/tournament-form';
import { allowedTransitions, formatDateTime, formatDay, TOURNAMENT_STATUS_LABELS } from '@/lib/tournament-labels';
import { ActionResult } from '@/types/action';
import { EndpointRequirement } from '@/types/security';
import { Registration, Tournament, TournamentStatus, TournamentVenue } from '@/types/sports';
import { TOURNAMENT_VENUE_CREATE_ENDPOINT, TOURNAMENT_VENUE_DELETE_ENDPOINT, TOURNAMENT_VENUES_LIST_ENDPOINT, VENUE_DETAIL_ENDPOINTS, VENUES_VIEW_ENDPOINTS } from '@/lib/venue-constants';
import {
    FINAL_PHASE_CREATE_ENDPOINT,
    FINAL_PHASE_DELETE_ENDPOINT,
    FINAL_PHASE_UPDATE_ENDPOINT,
    FINAL_PHASES_LIST_ENDPOINT,
    GROUP_PHASE_CREATE_ENDPOINT,
    GROUP_PHASE_DELETE_ENDPOINT,
    GROUP_PHASE_UPDATE_ENDPOINT,
    GROUP_PHASES_LIST_ENDPOINT,
    GROUP_TEAM_ASSIGN_ENDPOINT,
    GROUP_TEAM_REMOVE_ENDPOINT,
    GROUP_TEAMS_LIST_ENDPOINT
} from '@/lib/phase-constants';
import FinalPhasesPanel from '../components/FinalPhasesPanel';
import GroupPhasesPanel from '../components/GroupPhasesPanel';
import { TournamentActiveTag, TournamentStatusTag } from '../components/TournamentBadges';
import TournamentDevelopmentPanel from '../components/TournamentDevelopmentPanel';
import TournamentFormDialog from '../components/TournamentFormDialog';
import TournamentRegistrationsPanel from '../components/TournamentRegistrationsPanel';
import TournamentStatusDialog from '../components/TournamentStatusDialog';
import TournamentVenuesPanel from '../components/TournamentVenuesPanel';
import { useSportOptions } from '../../hooks/useSportOptions';
import { useVenueOptions } from '../../hooks/useVenueOptions';
import { useTournamentDetail } from '../hooks/useTournamentDetail';
import { useTournamentRegistrations } from '../hooks/useTournamentRegistrations';
import { useTournamentVenues } from '../hooks/useTournamentVenues';

interface TournamentDetailPageProps {
    params: { id: string };
}

export default function TournamentDetailPage({ params }: TournamentDetailPageProps) {
    return (
        <ProtectedRoute requiredEndpoints={TOURNAMENT_DETAIL_ENDPOINTS}>
            <TournamentDetailContent tournamentId={Number(params.id)} />
        </ProtectedRoute>
    );
}

function TournamentDetailContent({ tournamentId }: { tournamentId: number }) {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl } = useAuth();
    const { tournament, loading, loadError, update, changeStatus, reload } = useTournamentDetail(tournamentId);
    const [dialog, setDialog] = useState<'form' | 'status' | null>(null);

    const can = (...endpoints: EndpointRequirement[]) => endpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    const canUpdate = can(TOURNAMENT_UPDATE_ENDPOINT);
    const canListSports = can(SPORTS_LIST_ENDPOINT);
    const { sports } = useSportOptions(canListSports && canUpdate);

    // Pestaña Escenarios (Escenario-Torneo)
    const canListTournamentVenues = can(TOURNAMENT_VENUES_LIST_ENDPOINT);
    const canEnableVenue = can(TOURNAMENT_VENUE_CREATE_ENDPOINT, ...VENUES_VIEW_ENDPOINTS);
    const canRemoveVenue = can(TOURNAMENT_VENUE_DELETE_ENDPOINT);
    const canViewVenue = can(...VENUE_DETAIL_ENDPOINTS);
    const tournamentVenues = useTournamentVenues(tournamentId, canListTournamentVenues);
    const { venues } = useVenueOptions(canEnableVenue);

    // Pestaña Inscripciones (HU-GC-03)
    const canListRegistrations = can(REGISTRATIONS_LIST_ENDPOINT);
    const canCreateRegistration = can(REGISTRATION_CREATE_ENDPOINT, ...TEAMS_VIEW_ENDPOINTS);
    const canWithdrawRegistration = can(REGISTRATION_WITHDRAW_ENDPOINT);
    const canViewTeam = can(...TEAM_DETAIL_ENDPOINTS);
    const tournamentRegistrations = useTournamentRegistrations(tournamentId, tournament?.sport.id ?? null, canListRegistrations, canCreateRegistration);

    // Pestañas Grupos y Fases finales (Fase de grupos / Fase final del diagrama)
    const canListGroupPhases = can(GROUP_PHASES_LIST_ENDPOINT);
    const canCreateGroupPhase = can(GROUP_PHASE_CREATE_ENDPOINT);
    const canUpdateGroupPhase = can(GROUP_PHASE_UPDATE_ENDPOINT);
    const canDeleteGroupPhase = can(GROUP_PHASE_DELETE_ENDPOINT);
    const canListGroupTeams = can(GROUP_TEAMS_LIST_ENDPOINT);
    const canAssignGroupTeam = can(GROUP_TEAM_ASSIGN_ENDPOINT);
    const canRemoveGroupTeam = can(GROUP_TEAM_REMOVE_ENDPOINT);
    const canListFinalPhases = can(FINAL_PHASES_LIST_ENDPOINT);
    const canCreateFinalPhase = can(FINAL_PHASE_CREATE_ENDPOINT);
    const canUpdateFinalPhase = can(FINAL_PHASE_UPDATE_ENDPOINT);
    const canDeleteFinalPhase = can(FINAL_PHASE_DELETE_ENDPOINT);

    // Pestaña Desarrollo (HU-GC-08b): solo con permiso de GET /tournaments/{id}/development
    const canViewDevelopment = can(TOURNAMENT_DEVELOPMENT_ENDPOINT);

    const handleEnableVenue = async (venueId: number) => {
        const result = await tournamentVenues.enable(venueId);
        const name = venues.find((venue) => venue.id === venueId)?.name ?? 'El escenario';
        notify(result, `${name} quedó habilitado para el torneo.`, 'No se pudo habilitar el escenario');
        return result.ok;
    };

    const handleRemoveVenue = async (tournamentVenue: TournamentVenue) => {
        const result = await tournamentVenues.remove(tournamentVenue.id);
        notify(result, `Se retiró ${tournamentVenue.venue.name} de los escenarios del torneo.`, 'No se pudo retirar el escenario');
    };

    const handleEnrollTeams = async (teamIds: number[]) => {
        let successMessage = teamIds.length === 1 ? 'Equipo inscrito correctamente.' : `${teamIds.length} equipos inscritos correctamente.`;
        const result = await tournamentRegistrations.enroll(teamIds, (message) => {
            successMessage = message;
        });
        notify(result, successMessage, 'No se pudo completar la inscripción');
        if (result.ok) reload();
        return result.ok;
    };

    const handleWithdrawRegistration = async (registration: Registration) => {
        let successMessage = `Se retiró la inscripción de ${registration.team.name}.`;
        const result = await tournamentRegistrations.withdraw(registration.id, (message) => {
            successMessage = message;
        });
        notify(result, successMessage, 'No se pudo retirar la inscripción');
        if (result.ok) reload();
    };

    const notify = (result: ActionResult, successText: string, errorSummary = 'No se pudo completar') =>
        toast.current?.show(result.ok ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 } : { severity: 'error', summary: errorSummary, detail: result.error, life: 6000 });

    const handleUpdate = async (values: TournamentFormValues): Promise<TournamentActionResult> => {
        if (!tournament) return { ok: false };
        const result = await update(toUpdatePayload(values, tournament));
        if (result.ok || !result.validation) notify(result, 'Torneo actualizado.');
        return result;
    };

    const handleStatus = async (next: TournamentStatus): Promise<ActionResult> => {
        const result = await changeStatus(next);
        notify(result, `El torneo pasó a ${TOURNAMENT_STATUS_LABELS[next].toLowerCase()}.`, 'No se pudo cambiar el estado');
        return result;
    };

    const actions = (
        <div className="flex flex-wrap gap-2">
            <Button label="Volver al listado" icon="pi pi-arrow-left" text onClick={() => router.push('/torneos')} />
            {tournament && canUpdate && <Button label="Editar" icon="pi pi-pencil" outlined onClick={() => setDialog('form')} />}
            {tournament && canUpdate && allowedTransitions(tournament.status).length > 0 && <Button label="Cambiar estado" icon="pi pi-flag" onClick={() => setDialog('status')} />}
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            <PageHeader
                title={tournament?.name ?? 'Detalle del torneo'}
                subtitle={tournament ? `${tournament.sport.name} · ${formatDay(tournament.startDate)} – ${formatDay(tournament.endDate)}` : 'Información del torneo, sus fases e inscripciones.'}
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Torneos', href: '/torneos' }, { label: tournament?.name ?? 'Detalle' }]}
                actions={actions}
            />

            {loadError && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message severity="error" text={loadError} className="w-full" />
                    <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
                </div>
            )}

            {loading && !tournament && <Skeleton height="18rem" />}

            {tournament && (
                <div className="card">
                    <div className="flex flex-wrap align-items-center gap-2 mb-3">
                        <TournamentStatusTag status={tournament.status} />
                        <TournamentActiveTag active={tournament.active} />
                    </div>
                    <TabView>
                        <TabPanel header="Información">
                            <TournamentInfo tournament={tournament} />
                        </TabPanel>
                        <TabPanel header="Grupos">
                            {canListGroupPhases ? (
                                <GroupPhasesPanel
                                    tournament={tournament}
                                    canCreate={canCreateGroupPhase}
                                    canUpdate={canUpdateGroupPhase}
                                    canDelete={canDeleteGroupPhase}
                                    canListTeams={canListGroupTeams}
                                    canAssignTeam={canAssignGroupTeam}
                                    canRemoveTeam={canRemoveGroupTeam}
                                    canListRegistrations={canListRegistrations}
                                    notify={notify}
                                    onChanged={reload}
                                />
                            ) : (
                                <EmptyState icon="pi-lock" title="No tienes permiso para consultar los grupos del torneo." />
                            )}
                        </TabPanel>
                        <TabPanel header="Fases finales">
                            {canListFinalPhases ? (
                                <FinalPhasesPanel tournament={tournament} canCreate={canCreateFinalPhase} canUpdate={canUpdateFinalPhase} canDelete={canDeleteFinalPhase} notify={notify} onChanged={reload} />
                            ) : (
                                <EmptyState icon="pi-lock" title="No tienes permiso para consultar las fases finales del torneo." />
                            )}
                        </TabPanel>
                        {canViewDevelopment && (
                            <TabPanel header="Desarrollo">
                                <TournamentDevelopmentPanel tournamentId={tournament.id} />
                            </TabPanel>
                        )}
                        <TabPanel header="Inscripciones">
                            {canListRegistrations ? (
                                <TournamentRegistrationsPanel
                                    registrations={tournamentRegistrations.registrations}
                                    teams={tournamentRegistrations.teams}
                                    sportName={tournament.sport.name}
                                    loading={tournamentRegistrations.loading}
                                    error={tournamentRegistrations.error}
                                    canOpenRegistration={tournament.status === 'REGISTRATION_OPEN'}
                                    canCreate={canCreateRegistration}
                                    canWithdraw={canWithdrawRegistration}
                                    canViewTeam={canViewTeam}
                                    onEnroll={handleEnrollTeams}
                                    onWithdraw={handleWithdrawRegistration}
                                />
                            ) : (
                                <EmptyState icon="pi-lock" title="No tienes permiso para consultar las inscripciones del torneo." />
                            )}
                        </TabPanel>
                        <TabPanel header="Escenarios">
                            {canListTournamentVenues ? (
                                <TournamentVenuesPanel
                                    tournamentVenues={tournamentVenues.tournamentVenues}
                                    venues={venues}
                                    loading={tournamentVenues.loading}
                                    error={tournamentVenues.error}
                                    locked={tournament.status === 'FINISHED' || tournament.status === 'CANCELLED'}
                                    canEnable={canEnableVenue}
                                    canRemove={canRemoveVenue}
                                    canViewVenue={canViewVenue}
                                    onEnable={handleEnableVenue}
                                    onRemove={handleRemoveVenue}
                                />
                            ) : (
                                <EmptyState icon="pi-lock" title="No tienes permiso para consultar los escenarios del torneo." />
                            )}
                        </TabPanel>
                    </TabView>
                </div>
            )}

            <TournamentFormDialog visible={dialog === 'form'} tournament={tournament} sports={sports} canListSports={canListSports} onHide={() => setDialog(null)} onSubmit={handleUpdate} />
            <TournamentStatusDialog visible={dialog === 'status'} tournament={tournament} onHide={() => setDialog(null)} onSubmit={handleStatus} />
        </>
    );
}

function TournamentInfo({ tournament }: { tournament: Tournament }) {
    const rows: [string, string | number][] = [
        ['Deporte', tournament.sport.name],
        ['Fecha de inicio', formatDay(tournament.startDate)],
        ['Fecha de fin', formatDay(tournament.endDate)],
        ['Apertura de inscripciones', formatDateTime(tournament.registrationOpensAt)],
        ['Cierre de inscripciones', formatDateTime(tournament.registrationClosesAt)],
        ['Estado', TOURNAMENT_STATUS_LABELS[tournament.status]],
        ['Equipos inscritos', tournament.registrationsCount],
        ['Fases', tournament.phasesCount]
    ];

    return (
        <ul className="list-none p-0 m-0">
            {rows.map(([label, value]) => (
                <li key={label} className="flex flex-column sm:flex-row sm:justify-content-between py-2 border-bottom-1 surface-border">
                    <span className="text-600">{label}</span>
                    <span className="text-900 font-medium">{value}</span>
                </li>
            ))}
        </ul>
    );
}
