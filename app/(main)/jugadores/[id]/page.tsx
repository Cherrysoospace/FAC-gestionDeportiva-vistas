'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { TabPanel, TabView } from 'primereact/tabview';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import ActiveTag from '@/components/ui/ActiveTag';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { useAuth } from '@/layout/context/authcontext';
import ProtectedRoute from '@/layout/ProtectedRoute';
import { formatDay } from '@/lib/tournament-labels';
import { FormActionResult } from '@/lib/form-action';
import { PLAYER_PROFILE_ENDPOINTS, PLAYER_SKILL_CREATE_ENDPOINT, PLAYER_SKILL_DELETE_ENDPOINT, PLAYER_SKILL_UPDATE_ENDPOINT, PLAYER_UPDATE_ENDPOINT, PLAYERS_VIEW_ENDPOINTS, SKILLS_LIST_ENDPOINT } from '@/lib/player-constants';
import { PlayerFormValues, toUpdatePlayerPayload } from '@/lib/player-form';
import { DOMINANT_FOOT_LABELS, formatHeight } from '@/lib/player-labels';
import { TEAM_DETAIL_ENDPOINTS } from '@/lib/team-constants';
import { ActionResult } from '@/types/action';
import { EndpointRequirement } from '@/types/security';
import { Player, PlayerSkill, Skill } from '@/types/sports';
import { usePlayerOptions } from '../../hooks/usePlayerOptions';
import PlayerFormDialog from '../components/PlayerFormDialog';
import PlayerSkillsPanel from '../components/PlayerSkillsPanel';
import PlayerTeamsPanel from '../components/PlayerTeamsPanel';
import { usePlayerProfile } from '../hooks/usePlayerProfile';
import { usePlayerSkills } from '../hooks/usePlayerSkills';

interface PlayerProfilePageProps {
    params: { id: string };
}

// HU-GD-08: perfil deportivo del jugador. También es el lugar donde se gestionan sus habilidades (HU-GD-07).
export default function PlayerProfilePage({ params }: PlayerProfilePageProps) {
    return (
        <ProtectedRoute requiredEndpoints={PLAYER_PROFILE_ENDPOINTS}>
            <PlayerProfileContent playerId={Number(params.id)} />
        </ProtectedRoute>
    );
}

function PlayerProfileContent({ playerId }: { playerId: number }) {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl } = useAuth();
    const [editing, setEditing] = useState(false);

    const can = (...endpoints: EndpointRequirement[]) => endpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    const canUpdate = can(PLAYER_UPDATE_ENDPOINT);
    const canListPlayers = can(...PLAYERS_VIEW_ENDPOINTS);
    const canListSkills = can(SKILLS_LIST_ENDPOINT);
    const canAssignSkill = can(PLAYER_SKILL_CREATE_ENDPOINT, SKILLS_LIST_ENDPOINT);
    const canChangeLevel = can(PLAYER_SKILL_UPDATE_ENDPOINT);
    const canRemoveSkill = can(PLAYER_SKILL_DELETE_ENDPOINT);
    const canViewTeam = can(...TEAM_DETAIL_ENDPOINTS);

    const { profile, loading, loadError, reload, update } = usePlayerProfile(playerId);
    const skills = usePlayerSkills(playerId, canListSkills && canAssignSkill, reload);
    const { players: playerOptions } = usePlayerOptions(canListPlayers);
    const player = profile?.player ?? null;

    const notify = (result: ActionResult, successText: string, errorSummary = 'No se pudo completar') =>
        toast.current?.show(result.ok ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 } : { severity: 'error', summary: errorSummary, detail: result.error, life: 6000 });

    const handleUpdate = async (values: PlayerFormValues): Promise<FormActionResult> => {
        if (!player) return { ok: false };
        const result = await update(toUpdatePlayerPayload(values, player));
        if (result.ok || !result.validation) notify(result, 'Jugador actualizado.');
        return result;
    };

    const handleAssign = async (skill: Skill, level: number) => {
        const result = await skills.assign(skill.id, level);
        notify(result, `${skill.name} asignada correctamente.`, 'No se pudo asignar la habilidad');
        return result.ok;
    };

    const handleChangeLevel = async (playerSkill: PlayerSkill, level: number) => {
        const result = await skills.changeLevel(playerSkill.id, level);
        notify(result, `Nivel de ${playerSkill.skill.name} actualizado a ${level}.`, 'No se pudo cambiar el nivel');
        return result.ok;
    };

    const handleRemoveSkill = async (playerSkill: PlayerSkill) => {
        const result = await skills.remove(playerSkill.id);
        notify(result, `Se retiró ${playerSkill.skill.name} de las habilidades del jugador.`, 'No se pudo retirar la habilidad');
    };

    // "Buscar jugador" del mockup: cambia de perfil sin volver al listado
    const switcher = canListPlayers && (
        <Dropdown
            value={playerId}
            options={playerOptions.map((option) => ({ label: `${option.fullName} · ${option.documentNumber}`, value: option.id }))}
            onChange={(event) => event.value && router.push(`/jugadores/${event.value as number}`)}
            placeholder="Buscar jugador"
            aria-label="Buscar jugador"
            filter
            filterBy="label"
            className="w-full md:w-20rem"
        />
    );

    const actions = (
        <div className="flex flex-wrap gap-2 align-items-center">
            {switcher}
            <Button label="Volver al listado" icon="pi pi-arrow-left" text onClick={() => router.push('/jugadores')} />
            {player && canUpdate && <Button label="Editar" icon="pi pi-pencil" outlined onClick={() => setEditing(true)} />}
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <PageHeader
                title={player?.fullName ?? 'Perfil deportivo'}
                subtitle={player ? `${player.position} · ${player.nationality} · ${player.age} años` : 'Información del jugador, sus equipos y sus habilidades.'}
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Jugadores', href: '/jugadores' }, { label: player?.fullName ?? 'Perfil' }]}
                actions={actions}
            />

            {loadError && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message severity="error" text={loadError} className="w-full" />
                    <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
                </div>
            )}

            {loading && !profile && <Skeleton height="18rem" />}

            {profile && player && (
                <>
                    <div className="grid">
                        <div className="col-12 md:col-6 xl:col-3">
                            <StatCard label="Edad" value={`${player.age} años`} icon="pi-calendar" />
                        </div>
                        <div className="col-12 md:col-6 xl:col-3">
                            <StatCard label="Altura" value={formatHeight(player.heightCm)} icon="pi-arrows-v" />
                        </div>
                        <div className="col-12 md:col-6 xl:col-3">
                            <StatCard label="Equipo actual" value={profile.currentTeams.map((contract) => contract.team.name).join(', ') || 'Sin equipo'} icon="pi-flag" />
                        </div>
                        <div className="col-12 md:col-6 xl:col-3">
                            <StatCard label="Habilidades" value={profile.skills.length} icon="pi-star" />
                        </div>
                    </div>
                    <div className="card">
                        <div className="flex flex-wrap align-items-center gap-2 mb-3">
                            <Tag value={player.position} severity="info" />
                            <ActiveTag active={player.active} />
                        </div>
                        <TabView>
                            <TabPanel header="Información básica">
                                <PlayerInfo player={player} />
                            </TabPanel>
                            <TabPanel header="Equipos">
                                <PlayerTeamsPanel profile={profile} canViewTeam={canViewTeam} />
                            </TabPanel>
                            <TabPanel header="Habilidades">
                                <PlayerSkillsPanel
                                    skills={profile.skills}
                                    catalog={skills.catalog}
                                    catalogError={skills.catalogError}
                                    canAssign={canAssignSkill && player.active}
                                    canChangeLevel={canChangeLevel}
                                    canRemove={canRemoveSkill}
                                    onAssign={handleAssign}
                                    onChangeLevel={handleChangeLevel}
                                    onRemove={handleRemoveSkill}
                                />
                            </TabPanel>
                        </TabView>
                        {!player.active && <Message severity="info" text="El jugador está inactivo: no se le pueden asignar habilidades ni equipos hasta reactivarlo desde Editar." className="w-full mt-3" />}
                    </div>
                </>
            )}

            <PlayerFormDialog visible={editing} player={player} onHide={() => setEditing(false)} onSubmit={handleUpdate} />
        </>
    );
}

function PlayerInfo({ player }: { player: Player }) {
    const rows: [string, string][] = [
        ['Nombre completo', player.fullName],
        ['Documento', player.documentNumber],
        ['Fecha de nacimiento', `${formatDay(player.birthDate)} (${player.age} años)`],
        ['Nacionalidad', player.nationality],
        ['Posición', player.position],
        ['Altura', formatHeight(player.heightCm)],
        ['Pie dominante', player.dominantFoot ? DOMINANT_FOOT_LABELS[player.dominantFoot] : 'No aplica']
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
