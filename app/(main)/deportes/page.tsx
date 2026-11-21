'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
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
import { SPORT_CREATE_ENDPOINT, SPORT_DELETE_ENDPOINT, SPORT_UPDATE_ENDPOINT, SPORTS_VIEW_ENDPOINTS } from '@/lib/sport-constants';
import { sportsClient } from '@/lib/sport-api';
import { SportFormValues, toCreateSportPayload, toUpdateSportPayload } from '@/lib/sport-form';
import { ActionResult } from '@/types/action';
import { EndpointRequirement } from '@/types/security';
import { Sport } from '@/types/sports';
import { useResourceList } from '../hooks/useResourceList';
import SportFormDialog from './components/SportFormDialog';

const SKELETON_ROWS: Sport[] = Array.from({ length: 5 }, (_, index) => ({ id: -(index + 1), name: '', description: null, active: true, parent: null }));

const ACTIVE_OPTIONS = [
    { label: 'Todos los estados', value: null },
    { label: 'Activos', value: true },
    { label: 'Inactivos', value: false }
];

const LEVEL_OPTIONS = [
    { label: 'Todos los niveles', value: null },
    { label: 'Solo deportes raíz', value: 'ROOT' },
    { label: 'Solo subdeportes', value: 'SUB' }
];

type DialogState = { visible: boolean; sport: Sport | null };

export default function SportsPage() {
    return (
        <ProtectedRoute requiredEndpoints={SPORTS_VIEW_ENDPOINTS}>
            <SportsContent />
        </ProtectedRoute>
    );
}

function SportsContent() {
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl } = useAuth();

    const [search, setSearch] = useState('');
    const [active, setActive] = useState<boolean | null>(null);
    const [level, setLevel] = useState<string | null>(null);
    const [dialog, setDialog] = useState<DialogState>({ visible: false, sport: null });

    const can = (...endpoints: EndpointRequirement[]) => endpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    const canCreate = can(SPORT_CREATE_ENDPOINT);
    const canUpdate = can(SPORT_UPDATE_ENDPOINT);
    const canDelete = can(SPORT_DELETE_ENDPOINT);
    const hasActions = canUpdate || canDelete;

    // Se carga el catálogo completo una vez: también sirve de opciones para el deporte padre
    const { items: sports, loading, error, reload, create, update, remove } = useResourceList(sportsClient);

    const filtered = useMemo(() => {
        const text = search.trim().toLowerCase();
        return sports.filter((sport) => {
            if (text && !sport.name.toLowerCase().includes(text)) return false;
            if (active !== null && sport.active !== active) return false;
            if (level === 'ROOT' && sport.parent) return false;
            if (level === 'SUB' && !sport.parent) return false;
            return true;
        });
    }, [sports, search, active, level]);

    // Subdeportes por padre (Map en memoria, sin consultas adicionales)
    const subSportsByParent = useMemo(() => {
        const map = new Map<number, Sport[]>();
        sports.forEach((sport) => {
            if (sport.parent) map.set(sport.parent.id, [...(map.get(sport.parent.id) ?? []), sport]);
        });
        return map;
    }, [sports]);

    useEffect(() => {
        if (!dialog.visible) return;
        // Si la lista se recarga, la fila abierta se mantiene actualizada
        setDialog((current) => (current.sport ? { ...current, sport: sports.find((sport) => sport.id === current.sport?.id) ?? current.sport } : current));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sports]);

    const closeDialog = () => setDialog({ visible: false, sport: null });

    const notify = (result: ActionResult, successText: string, errorSummary = 'No se pudo completar') =>
        toast.current?.show(result.ok ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 } : { severity: 'error', summary: errorSummary, detail: result.error, life: 6000 });

    const handleSubmit = async (values: SportFormValues): Promise<FormActionResult> => {
        const editing = dialog.sport;
        const result = editing ? await update(editing.id, toUpdateSportPayload(values, editing)) : await create(toCreateSportPayload(values));
        if (result.ok || !result.validation) notify(result, editing ? 'Deporte actualizado.' : 'Deporte creado.');
        return result;
    };

    const handleDelete = (sport: Sport) =>
        confirmDialog({
            header: 'Eliminar deporte',
            message: `¿Eliminar "${sport.name}"? Solo se puede eliminar si no tiene subdeportes, equipos, torneos ni jugadores asociados; si no, desactívalo.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                const result = await remove(sport.id);
                // 409: el backend indica qué lo bloquea
                notify(result, `"${sport.name}" fue eliminado.`, 'No se puede eliminar el deporte');
            }
        });

    const cell = (render: (sport: Sport) => ReactNode, width = '6rem') =>
        function CellBody(sport: Sport) {
            return loading ? <Skeleton width={width} /> : render(sport);
        };

    const nameBody = cell((sport) => <span className={sport.active ? 'text-900 font-medium' : 'text-500 font-medium'}>{sport.name}</span>, '10rem');
    const descriptionBody = cell((sport) => sport.description ?? <span className="text-500">Sin descripción</span>, '12rem');
    const parentBody = cell((sport) => (sport.parent ? <Tag value={sport.parent.name} severity="info" /> : <span className="text-500">Deporte raíz</span>), '7rem');
    const subSportsBody = cell((sport) => {
        const subs = subSportsByParent.get(sport.id) ?? [];
        if (subs.length === 0) return <span className="text-500">—</span>;
        return (
            <div className="flex flex-wrap gap-1">
                {subs.map((sub) => (
                    <Tag key={sub.id} value={sub.name} severity={sub.active ? 'success' : 'danger'} />
                ))}
            </div>
        );
    }, '8rem');
    const activeBody = cell((sport) => <ActiveTag active={sport.active} />, '4rem');

    const actionsBody = (sport: Sport) => {
        if (loading) return <Skeleton width="6rem" height="2rem" />;
        return (
            <div className="flex gap-1">
                {canUpdate && <Button icon="pi pi-pencil" rounded text tooltip="Editar" tooltipOptions={{ position: 'top' }} aria-label={`Editar ${sport.name}`} onClick={() => setDialog({ visible: true, sport })} />}
                {canDelete && <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Eliminar" tooltipOptions={{ position: 'top' }} aria-label={`Eliminar ${sport.name}`} onClick={() => handleDelete(sport)} />}
            </div>
        );
    };

    const hasFilters = Boolean(search.trim()) || active !== null || level !== null;

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            <PageHeader
                title="Deportes"
                subtitle="Administra el catálogo de deportes y sus subdeportes (por ejemplo, Fútbol sala dentro de Fútbol)."
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Deportes' }]}
                actions={canCreate && <Button label="Nuevo deporte" icon="pi pi-plus" onClick={() => setDialog({ visible: true, sport: null })} />}
            />

            {error && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message severity="error" text={error} className="w-full" />
                    <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
                </div>
            )}

            <div className="card">
                <h5>Lista de deportes {!loading && <span className="text-600 font-normal">({filtered.length})</span>}</h5>
                <div className="grid mb-2">
                    <div className="col-12 md:col-6 lg:col-4">
                        <SearchInput value={search} onChange={setSearch} ariaLabel="Buscar deportes por nombre" placeholder="Buscar deporte" className="w-full" />
                    </div>
                    <div className="col-12 md:col-6 lg:col-4">
                        <Dropdown value={level} options={LEVEL_OPTIONS} onChange={(event) => setLevel((event.value as string | null) ?? null)} aria-label="Filtrar por nivel" className="w-full" />
                    </div>
                    <div className="col-12 md:col-6 lg:col-4">
                        <Dropdown value={active} options={ACTIVE_OPTIONS} onChange={(event) => setActive((event.value as boolean | null) ?? null)} aria-label="Filtrar por estado" className="w-full" />
                    </div>
                </div>

                <DataTable
                    value={loading ? SKELETON_ROWS : filtered}
                    dataKey="id"
                    paginator={!loading && filtered.length > 10}
                    rows={10}
                    emptyMessage={<EmptyState icon="pi-star" title={hasFilters ? 'Ningún deporte coincide con los filtros.' : 'No hay deportes registrados.'} />}
                >
                    <Column header="Deporte" body={nameBody} />
                    <Column header="Descripción" body={descriptionBody} />
                    <Column header="Deporte padre" body={parentBody} />
                    <Column header="Subdeportes" body={subSportsBody} />
                    <Column header="Estado" body={activeBody} />
                    {hasActions && <Column header="Acciones" body={actionsBody} headerClassName="w-8rem" />}
                </DataTable>
            </div>

            <SportFormDialog visible={dialog.visible} sport={dialog.sport} sports={sports} onHide={closeDialog} onSubmit={handleSubmit} />
        </>
    );
}

