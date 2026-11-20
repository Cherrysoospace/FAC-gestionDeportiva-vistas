'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
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
import ActiveTag from '@/components/ui/ActiveTag';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import SearchInput from '@/components/ui/SearchInput';
import { useAuth } from '@/layout/context/authcontext';
import ProtectedRoute from '@/layout/ProtectedRoute';
import { FormActionResult } from '@/lib/form-action';
import { PLAYER_CREATE_ENDPOINT, PLAYER_DELETE_ENDPOINT, PLAYER_PROFILE_ENDPOINTS, PLAYER_UPDATE_ENDPOINT, PLAYERS_VIEW_ENDPOINTS } from '@/lib/player-constants';
import { PlayerFormValues, toCreatePlayerPayload, toUpdatePlayerPayload } from '@/lib/player-form';
import { TEAMS_VIEW_ENDPOINTS } from '@/lib/team-constants';
import { SPORTS_LIST_ENDPOINT } from '@/lib/tournament-constants';
import { ActionResult } from '@/types/action';
import { EndpointRequirement } from '@/types/security';
import { Player } from '@/types/sports';
import { useSportOptions } from '../hooks/useSportOptions';
import { useTeamOptions } from '../hooks/useTeamOptions';
import PlayerFormDialog from './components/PlayerFormDialog';
import { usePlayers } from './hooks/usePlayers';

const SEARCH_DEBOUNCE_MS = 400;

const SKELETON_ROWS: Player[] = Array.from({ length: 5 }, (_, index) => ({
    id: -(index + 1),
    fullName: '',
    documentNumber: '',
    birthDate: '2000-01-01',
    age: 0,
    nationality: '',
    position: '',
    heightCm: 0,
    dominantFoot: null,
    active: true,
    currentTeams: []
}));

const ACTIVE_OPTIONS = [
    { label: 'Todos los estados', value: null },
    { label: 'Activos', value: true },
    { label: 'Inactivos', value: false }
];

type DialogState = { visible: boolean; player: Player | null };

export default function PlayersPage() {
    return (
        <ProtectedRoute requiredEndpoints={PLAYERS_VIEW_ENDPOINTS}>
            <PlayersContent />
        </ProtectedRoute>
    );
}

function PlayersContent() {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl } = useAuth();

    const [searchText, setSearchText] = useState('');
    const [search, setSearch] = useState('');
    const [teamId, setTeamId] = useState<number | null>(null);
    const [sportId, setSportId] = useState<number | null>(null);
    const [active, setActive] = useState<boolean | null>(null);
    const [dialog, setDialog] = useState<DialogState>({ visible: false, player: null });

    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchText), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchText]);

    const can = (...endpoints: EndpointRequirement[]) => endpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    const canCreate = can(PLAYER_CREATE_ENDPOINT);
    const canUpdate = can(PLAYER_UPDATE_ENDPOINT);
    const canDelete = can(PLAYER_DELETE_ENDPOINT);
    const canViewProfile = can(...PLAYER_PROFILE_ENDPOINTS);
    const canListTeams = can(...TEAMS_VIEW_ENDPOINTS);
    const canListSports = can(SPORTS_LIST_ENDPOINT);
    const hasActions = canUpdate || canDelete || canViewProfile;

    const { players, loading, error, reload, create, update, remove } = usePlayers({ search, teamId, sportId, active });
    const { teams } = useTeamOptions(canListTeams);
    const { sports } = useSportOptions(canListSports);

    const closeDialog = () => setDialog({ visible: false, player: null });

    const notify = (result: ActionResult, successText: string, errorSummary = 'No se pudo completar') =>
        toast.current?.show(result.ok ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 } : { severity: 'error', summary: errorSummary, detail: result.error, life: 6000 });

    const handleSubmit = async (values: PlayerFormValues): Promise<FormActionResult> => {
        const editing = dialog.player;
        const result = editing ? await update(editing.id, toUpdatePlayerPayload(values, editing)) : await create(toCreatePlayerPayload(values));
        // 409 documento repetido y demás reglas: Toast. Errores por campo: el formulario.
        if (result.ok || !result.validation) notify(result, editing ? 'Jugador actualizado.' : 'Jugador registrado.');
        return result;
    };

    const handleDelete = (player: Player) =>
        confirmDialog({
            header: 'Eliminar jugador',
            message: `¿Eliminar a "${player.fullName}"? Solo se puede si no tiene contratos con equipos ni habilidades.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                const result = await remove(player.id);
                notify(result, `"${player.fullName}" fue eliminado.`, 'No se puede eliminar el jugador');
            }
        });

    const cell = (render: (player: Player) => ReactNode, width = '6rem') =>
        function CellBody(player: Player) {
            return loading ? <Skeleton width={width} /> : render(player);
        };

    const nameBody = cell((player) => <span className={player.active ? 'text-900 font-medium' : 'text-500 font-medium'}>{player.fullName}</span>, '10rem');
    const documentBody = cell((player) => player.documentNumber, '7rem');
    const ageBody = cell((player) => player.age, '2rem');
    const positionBody = cell((player) => <Tag value={player.position} severity="info" />, '3rem');
    const teamBody = cell((player) => (player.currentTeams.length === 0 ? <span className="text-500">Sin equipo</span> : player.currentTeams.map((team) => team.name).join(', ')), '8rem');
    const activeBody = cell((player) => <ActiveTag active={player.active} />, '4rem');

    const actionsBody = (player: Player) => {
        if (loading) return <Skeleton width="8rem" height="2rem" />;
        return (
            <div className="flex gap-1">
                {canViewProfile && <Button icon="pi pi-id-card" rounded text tooltip="Perfil deportivo" tooltipOptions={{ position: 'top' }} aria-label={`Perfil de ${player.fullName}`} onClick={() => router.push(`/jugadores/${player.id}`)} />}
                {canUpdate && <Button icon="pi pi-pencil" rounded text tooltip="Editar" tooltipOptions={{ position: 'top' }} aria-label={`Editar ${player.fullName}`} onClick={() => setDialog({ visible: true, player })} />}
                {canDelete && <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Eliminar" tooltipOptions={{ position: 'top' }} aria-label={`Eliminar ${player.fullName}`} onClick={() => handleDelete(player)} />}
            </div>
        );
    };

    const hasFilters = Boolean(search.trim()) || teamId !== null || sportId !== null || active !== null;

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            <PageHeader
                title="Jugadores"
                subtitle="Administra los jugadores registrados. Desde su perfil deportivo se consultan sus equipos y se gestionan sus habilidades."
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Jugadores' }]}
                actions={canCreate && <Button label="Nuevo jugador" icon="pi pi-plus" onClick={() => setDialog({ visible: true, player: null })} />}
            />

            {error && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message severity="error" text={error} className="w-full" />
                    <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
                </div>
            )}

            <div className="card">
                <h5>Lista de jugadores {!loading && <span className="text-600 font-normal">({players.length})</span>}</h5>
                <div className="grid mb-2">
                    <div className="col-12 md:col-6 lg:col-3">
                        <SearchInput value={searchText} onChange={setSearchText} ariaLabel="Buscar jugadores por nombre o documento" placeholder="Buscar por nombre o documento" className="w-full" />
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <Dropdown
                            value={teamId}
                            options={teams.map((team) => ({ label: team.name, value: team.id }))}
                            onChange={(event) => setTeamId((event.value as number | null) ?? null)}
                            placeholder={canListTeams ? 'Todos los equipos' : 'Sin permiso para ver equipos'}
                            aria-label="Filtrar por equipo actual"
                            filter={teams.length > 8}
                            showClear
                            disabled={!canListTeams}
                            className="w-full"
                        />
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <Dropdown
                            value={sportId}
                            options={sports.map((sport) => ({ label: sport.name, value: sport.id }))}
                            onChange={(event) => setSportId((event.value as number | null) ?? null)}
                            placeholder={canListSports ? 'Todos los deportes' : 'Sin permiso para ver deportes'}
                            aria-label="Filtrar por deporte"
                            showClear
                            disabled={!canListSports}
                            className="w-full"
                        />
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <Dropdown value={active} options={ACTIVE_OPTIONS} onChange={(event) => setActive((event.value as boolean | null) ?? null)} aria-label="Filtrar por estado" className="w-full" />
                    </div>
                </div>

                <DataTable
                    value={loading ? SKELETON_ROWS : players}
                    dataKey="id"
                    paginator={!loading && players.length > 10}
                    rows={10}
                    emptyMessage={<EmptyState icon="pi-user" title={hasFilters ? 'Ningún jugador coincide con los filtros.' : 'No hay jugadores registrados.'} />}
                >
                    <Column header="Jugador" body={nameBody} />
                    <Column header="Documento" body={documentBody} />
                    <Column header="Edad" body={ageBody} />
                    <Column header="Posición" body={positionBody} />
                    <Column header="Equipo actual" body={teamBody} />
                    <Column header="Estado" body={activeBody} />
                    {hasActions && <Column header="Acciones" body={actionsBody} headerClassName="w-10rem" />}
                </DataTable>
            </div>

            <PlayerFormDialog visible={dialog.visible} player={dialog.player} onHide={closeDialog} onSubmit={handleSubmit} />
        </>
    );
}
