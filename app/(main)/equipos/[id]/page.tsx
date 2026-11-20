'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { TabPanel, TabView } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import ActiveTag from '@/components/ui/ActiveTag';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { useAuth } from '@/layout/context/authcontext';
import ProtectedRoute from '@/layout/ProtectedRoute';
import { FormActionResult } from '@/lib/form-action';
import {
    RELATED_TEAM_CREATE_ENDPOINT,
    RELATED_TEAM_DELETE_ENDPOINT,
    RELATED_TEAMS_LIST_ENDPOINT,
    TEAM_DETAIL_ENDPOINTS,
    TEAM_SPORT_CREATE_ENDPOINT,
    TEAM_SPORT_DELETE_ENDPOINT,
    TEAM_SPORTS_LIST_ENDPOINT,
    TEAM_UPDATE_ENDPOINT,
    TEAMS_VIEW_ENDPOINTS
} from '@/lib/team-constants';
import { TeamFormValues, toUpdateTeamPayload } from '@/lib/team-form';
import { TEAM_MODALITY_LABELS } from '@/lib/team-labels';
import { SPORTS_LIST_ENDPOINT } from '@/lib/tournament-constants';
import { ActionResult } from '@/types/action';
import { EndpointRequirement } from '@/types/security';
import { RelatedTeam, Sport, Team, TeamSportAssociation } from '@/types/sports';
import { useSportOptions } from '../../hooks/useSportOptions';
import RelatedTeamsPanel from '../components/RelatedTeamsPanel';
import TeamFormDialog from '../components/TeamFormDialog';
import TeamSportsPanel from '../components/TeamSportsPanel';
import { useRelatedTeams } from '../hooks/useRelatedTeams';
import { useTeamDetail } from '../hooks/useTeamDetail';
import { useTeamOptions } from '../hooks/useTeamOptions';
import { useTeamSports } from '../hooks/useTeamSports';

interface TeamDetailPageProps {
    params: { id: string };
}

export default function TeamDetailPage({ params }: TeamDetailPageProps) {
    return (
        <ProtectedRoute requiredEndpoints={TEAM_DETAIL_ENDPOINTS}>
            <TeamDetailContent teamId={Number(params.id)} />
        </ProtectedRoute>
    );
}

function TeamDetailContent({ teamId }: { teamId: number }) {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl } = useAuth();
    const [editing, setEditing] = useState(false);

    const can = (...endpoints: EndpointRequirement[]) => endpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    const canUpdate = can(TEAM_UPDATE_ENDPOINT);
    const canListTeamSports = can(TEAM_SPORTS_LIST_ENDPOINT);
    const canAssociate = can(TEAM_SPORT_CREATE_ENDPOINT, SPORTS_LIST_ENDPOINT);
    const canRemoveSport = can(TEAM_SPORT_DELETE_ENDPOINT);
    const canListRelated = can(RELATED_TEAMS_LIST_ENDPOINT);
    const canRelate = can(RELATED_TEAM_CREATE_ENDPOINT, ...TEAMS_VIEW_ENDPOINTS);
    const canUnrelate = can(RELATED_TEAM_DELETE_ENDPOINT);

    const { team, loading, loadError, update, reload } = useTeamDetail(teamId);
    const teamSports = useTeamSports(teamId, canListTeamSports);
    const related = useRelatedTeams(teamId, canListRelated);
    const { sports } = useSportOptions(canAssociate);
    const { teams: candidates } = useTeamOptions(canRelate);

    const notify = (result: ActionResult, successText: string, errorSummary = 'No se pudo completar') =>
        toast.current?.show(result.ok ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 } : { severity: 'error', summary: errorSummary, detail: result.error, life: 6000 });

    const handleUpdate = async (values: TeamFormValues): Promise<FormActionResult> => {
        if (!team) return { ok: false };
        const result = await update(toUpdateTeamPayload(values, team));
        if (result.ok || !result.validation) notify(result, 'Equipo actualizado.');
        return result;
    };

    // Los deportes también aparecen en la ficha del equipo: se recarga al cambiarlos
    const handleAssociate = async (sport: Sport) => {
        const result = await teamSports.associate(sport.id);
        notify(result, `${sport.name} asociado correctamente.`, 'No se pudo asociar el deporte');
        if (result.ok) reload();
    };

    const handleRemoveSport = async (association: TeamSportAssociation) => {
        const result = await teamSports.remove(association.id);
        notify(result, `Se retiró ${association.sport.name} de los deportes del equipo.`, 'No se pudo retirar el deporte');
        if (result.ok) reload();
    };

    const handleRelate = async (relatedTeamId: number) => {
        const result = await related.relate(relatedTeamId);
        const name = candidates.find((candidate) => candidate.id === relatedTeamId)?.name ?? 'El equipo';
        notify(result, `${name} quedó relacionado.`, 'No se pudo relacionar');
        return result.ok;
    };

    const handleUnrelate = async (relatedTeam: RelatedTeam) => {
        const result = await related.unrelate(relatedTeam.id);
        notify(result, `Se quitó la relación con ${relatedTeam.name}.`, 'No se pudo quitar la relación');
    };

    const actions = (
        <div className="flex flex-wrap gap-2">
            <Button label="Volver al listado" icon="pi pi-arrow-left" text onClick={() => router.push('/equipos')} />
            {team && canUpdate && <Button label="Editar" icon="pi pi-pencil" outlined onClick={() => setEditing(true)} />}
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <PageHeader
                title={team?.name ?? 'Detalle del equipo'}
                subtitle={team ? `${team.city} · Modalidad ${TEAM_MODALITY_LABELS[team.modality].toLowerCase()}` : 'Información del equipo, sus deportes y equipos relacionados.'}
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Equipos', href: '/equipos' }, { label: team?.name ?? 'Detalle' }]}
                actions={actions}
            />

            {loadError && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message severity="error" text={loadError} className="w-full" />
                    <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
                </div>
            )}

            {loading && !team && <Skeleton height="18rem" />}

            {team && (
                <>
                    <TeamStats team={team} relatedCount={related.relatedTeams.length} showRelated={canListRelated} />
                    <div className="card">
                        <div className="flex flex-wrap align-items-center gap-2 mb-3">
                            <ActiveTag active={team.active} />
                        </div>
                        <TabView>
                            <TabPanel header="Información">
                                <TeamInfo team={team} />
                            </TabPanel>
                            {canListTeamSports && (
                                <TabPanel header="Deportes">
                                    <TeamSportsPanel
                                        associations={teamSports.associations}
                                        sports={sports}
                                        loading={teamSports.loading}
                                        error={teamSports.error}
                                        canAssociate={canAssociate && team.active}
                                        canRemove={canRemoveSport}
                                        onAssociate={handleAssociate}
                                        onRemove={handleRemoveSport}
                                    />
                                </TabPanel>
                            )}
                            {canListRelated && (
                                <TabPanel header="Equipos relacionados">
                                    <RelatedTeamsPanel
                                        teamId={team.id}
                                        relatedTeams={related.relatedTeams}
                                        candidates={candidates}
                                        loading={related.loading}
                                        error={related.error}
                                        canRelate={canRelate && team.active}
                                        canUnrelate={canUnrelate}
                                        onRelate={handleRelate}
                                        onUnrelate={handleUnrelate}
                                    />
                                </TabPanel>
                            )}
                            <TabPanel header="Plantilla">
                                <EmptyState icon="pi-clock" title="Disponible próximamente" description="La plantilla y el historial de traspasos se gestionan en la siguiente entrega de vistas." />
                            </TabPanel>
                        </TabView>
                        {!team.active && <Message severity="info" text="El equipo está inactivo: no se le pueden asociar deportes ni equipos hasta reactivarlo desde Editar." className="w-full mt-3" />}
                    </div>
                </>
            )}

            <TeamFormDialog visible={editing} team={team} onHide={() => setEditing(false)} onSubmit={handleUpdate} />
        </>
    );
}

function TeamStats({ team, relatedCount, showRelated }: { team: Team; relatedCount: number; showRelated: boolean }) {
    return (
        <div className="grid">
            <div className="col-12 md:col-6 xl:col-3">
                <StatCard label="Deportes asociados" value={team.sports.length} icon="pi-link" />
            </div>
            <div className="col-12 md:col-6 xl:col-3">
                <StatCard label="Jugadores en plantilla" value={team.playersCount} icon="pi-users" />
            </div>
            <div className="col-12 md:col-6 xl:col-3">
                <StatCard label="Inscripciones activas" value={team.activeRegistrationsCount} icon="pi-trophy" />
            </div>
            {showRelated && (
                <div className="col-12 md:col-6 xl:col-3">
                    <StatCard label="Equipos relacionados" value={relatedCount} icon="pi-sitemap" />
                </div>
            )}
        </div>
    );
}

function TeamInfo({ team }: { team: Team }) {
    const rows: [string, string | number][] = [
        ['Nombre', team.name],
        ['Ciudad', team.city],
        ['Modalidad', TEAM_MODALITY_LABELS[team.modality]],
        ['Deportes', team.sports.map((sport) => sport.name).join(', ') || 'Sin deportes'],
        ['Grupo actual', team.group ? `Grupo ${team.group.groupName}` : 'Sin grupo'],
        ['Jugadores con contrato vigente', team.playersCount],
        ['Inscripciones activas', team.activeRegistrationsCount]
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
