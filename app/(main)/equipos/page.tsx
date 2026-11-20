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
import { TEAM_CREATE_ENDPOINT, TEAM_DELETE_ENDPOINT, TEAM_DETAIL_ENDPOINTS, TEAM_UPDATE_ENDPOINT, TEAMS_VIEW_ENDPOINTS } from '@/lib/team-constants';
import { TeamFormValues, toCreateTeamPayload, toUpdateTeamPayload } from '@/lib/team-form';
import { TEAM_MODALITY_LABELS, TEAM_MODALITY_OPTIONS } from '@/lib/team-labels';
import { SPORTS_LIST_ENDPOINT } from '@/lib/tournament-constants';
import { ActionResult } from '@/types/action';
import { EndpointRequirement } from '@/types/security';
import { Team, TeamModality } from '@/types/sports';
import { useSportOptions } from '../hooks/useSportOptions';
import TeamFormDialog from './components/TeamFormDialog';
import { useTeams } from './hooks/useTeams';

const SEARCH_DEBOUNCE_MS = 400;

const SKELETON_ROWS: Team[] = Array.from({ length: 5 }, (_, index) => ({
    id: -(index + 1),
    name: '',
    city: '',
    modality: 'MIXED',
    active: true,
    sports: [],
    group: null,
    activeRegistrationsCount: 0,
    playersCount: 0
}));

const ACTIVE_OPTIONS = [
    { label: 'Todos los estados', value: null },
    { label: 'Activos', value: true },
    { label: 'Inactivos', value: false }
];

type DialogState = { visible: boolean; team: Team | null };

export default function TeamsPage() {
    return (
        <ProtectedRoute requiredEndpoints={TEAMS_VIEW_ENDPOINTS}>
            <TeamsContent />
        </ProtectedRoute>
    );
}

function TeamsContent() {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl } = useAuth();

    const [searchText, setSearchText] = useState('');
    const [search, setSearch] = useState('');
    const [sportId, setSportId] = useState<number | null>(null);
    const [modality, setModality] = useState<TeamModality | null>(null);
    const [active, setActive] = useState<boolean | null>(null);
    const [dialog, setDialog] = useState<DialogState>({ visible: false, team: null });

    // Búsqueda por nombre con espera de 400 ms para no consultar en cada tecla
    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchText), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchText]);

    const can = (...endpoints: EndpointRequirement[]) => endpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    const canCreate = can(TEAM_CREATE_ENDPOINT);
    const canUpdate = can(TEAM_UPDATE_ENDPOINT);
    const canDelete = can(TEAM_DELETE_ENDPOINT);
    const canViewDetail = can(...TEAM_DETAIL_ENDPOINTS);
    const canListSports = can(SPORTS_LIST_ENDPOINT);
    const hasActions = canUpdate || canDelete || canViewDetail;

    const { teams, loading, error, reload, create, update, remove } = useTeams({ search, sportId, modality, active });
    const { sports } = useSportOptions(canListSports);
    const sportFilterOptions = sports.map((sport) => ({ label: sport.name, value: sport.id }));

    const closeDialog = () => setDialog({ visible: false, team: null });

    const notify = (result: ActionResult, successText: string, errorSummary = 'No se pudo completar') =>
        toast.current?.show(result.ok ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 } : { severity: 'error', summary: errorSummary, detail: result.error, life: 6000 });

    const handleSubmit = async (values: TeamFormValues): Promise<FormActionResult> => {
        const editing = dialog.team;
        const result = editing ? await update(editing.id, toUpdateTeamPayload(values, editing)) : await create(toCreateTeamPayload(values));
        // Los errores por campo los muestra el formulario; el resto (409 nombre repetido...), un Toast
        if (result.ok || !result.validation) notify(result, editing ? 'Equipo actualizado.' : 'Equipo creado.');
        return result;
    };

    const handleDelete = (team: Team) =>
        confirmDialog({
            header: 'Eliminar equipo',
            message: `¿Eliminar "${team.name}"? Solo se puede eliminar si no tiene deportes, jugadores, inscripciones, partidos ni equipos relacionados.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                const result = await remove(team.id);
                // 409: el backend explica qué tiene asociado y sugiere desactivarlo
                notify(result, `"${team.name}" fue eliminado.`, 'No se puede eliminar el equipo');
            }
        });

    // Cuerpo de columna que muestra un Skeleton mientras carga
    const cell = (render: (team: Team) => ReactNode, width = '6rem') =>
        function CellBody(team: Team) {
            return loading ? <Skeleton width={width} /> : render(team);
        };

    const nameBody = cell((team) => <span className={team.active ? 'text-900 font-medium' : 'text-500 font-medium'}>{team.name}</span>, '10rem');
    const cityBody = cell((team) => (
        <span>
            <i className="pi pi-map-marker text-500 mr-1" />
            {team.city}
        </span>
    ));
    const modalityBody = cell((team) => TEAM_MODALITY_LABELS[team.modality]);
    const sportsBody = cell(
        (team) =>
            team.sports.length === 0 ? (
                <span className="text-500">Sin deportes</span>
            ) : (
                <div className="flex flex-wrap gap-1">
                    {team.sports.map((sport) => (
                        <Tag key={sport.id} value={sport.name} severity="info" />
                    ))}
                </div>
            ),
        '8rem'
    );
    const playersBody = cell(
        (team) => (
            <span>
                <i className="pi pi-users text-500 mr-1" />
                {team.playersCount}
            </span>
        ),
        '2rem'
    );
    const activeBody = cell((team) => <ActiveTag active={team.active} />, '4rem');

    const actionsBody = (team: Team) => {
        if (loading) return <Skeleton width="8rem" height="2rem" />;
        return (
            <div className="flex gap-1">
                {canViewDetail && <Button icon="pi pi-eye" rounded text tooltip="Ver detalle" tooltipOptions={{ position: 'top' }} aria-label={`Ver detalle de ${team.name}`} onClick={() => router.push(`/equipos/${team.id}`)} />}
                {canUpdate && <Button icon="pi pi-pencil" rounded text tooltip="Editar" tooltipOptions={{ position: 'top' }} aria-label={`Editar ${team.name}`} onClick={() => setDialog({ visible: true, team })} />}
                {canDelete && <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Eliminar" tooltipOptions={{ position: 'top' }} aria-label={`Eliminar ${team.name}`} onClick={() => handleDelete(team)} />}
            </div>
        );
    };

    const hasFilters = Boolean(search.trim()) || sportId !== null || modality !== null || active !== null;

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            <PageHeader
                title="Equipos"
                subtitle="Administra los equipos que pueden participar en las competencias. Desde el detalle se gestionan sus deportes y equipos relacionados."
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Equipos' }]}
                actions={canCreate && <Button label="Nuevo equipo" icon="pi pi-plus" onClick={() => setDialog({ visible: true, team: null })} />}
            />

            {error && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message severity="error" text={error} className="w-full" />
                    <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
                </div>
            )}

            <div className="card">
                <h5>Lista de equipos {!loading && <span className="text-600 font-normal">({teams.length})</span>}</h5>
                <div className="grid mb-2">
                    <div className="col-12 md:col-6 lg:col-3">
                        <SearchInput value={searchText} onChange={setSearchText} ariaLabel="Buscar equipos por nombre" placeholder="Buscar equipo" className="w-full" />
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <Dropdown
                            value={sportId}
                            options={sportFilterOptions}
                            onChange={(event) => setSportId((event.value as number | null) ?? null)}
                            placeholder={canListSports ? 'Todos los deportes' : 'Sin permiso para ver deportes'}
                            aria-label="Filtrar por deporte"
                            showClear
                            disabled={!canListSports}
                            className="w-full"
                        />
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <Dropdown
                            value={modality}
                            options={TEAM_MODALITY_OPTIONS}
                            onChange={(event) => setModality((event.value as TeamModality | null) ?? null)}
                            placeholder="Todas las modalidades"
                            aria-label="Filtrar por modalidad"
                            showClear
                            className="w-full"
                        />
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <Dropdown value={active} options={ACTIVE_OPTIONS} onChange={(event) => setActive((event.value as boolean | null) ?? null)} aria-label="Filtrar por estado" className="w-full" />
                    </div>
                </div>

                <DataTable
                    value={loading ? SKELETON_ROWS : teams}
                    dataKey="id"
                    paginator={!loading && teams.length > 10}
                    rows={10}
                    emptyMessage={<EmptyState icon="pi-flag" title={hasFilters ? 'Ningún equipo coincide con los filtros.' : 'No hay equipos registrados.'} />}
                >
                    <Column header="Equipo" body={nameBody} />
                    <Column header="Ciudad" body={cityBody} />
                    <Column header="Modalidad" body={modalityBody} />
                    <Column header="Deportes" body={sportsBody} />
                    <Column header="Jugadores" body={playersBody} />
                    <Column header="Estado" body={activeBody} />
                    {hasActions && <Column header="Acciones" body={actionsBody} headerClassName="w-10rem" />}
                </DataTable>
            </div>

            <TeamFormDialog visible={dialog.visible} team={dialog.team} onHide={closeDialog} onSubmit={handleSubmit} />
        </>
    );
}
