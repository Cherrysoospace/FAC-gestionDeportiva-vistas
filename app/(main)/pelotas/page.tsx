'use client';

import { ReactNode, useMemo, useRef, useState } from 'react';
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
import { ballsClient } from '@/lib/ball-api';
import { BALL_CREATE_ENDPOINT, BALL_DELETE_ENDPOINT, BALL_UPDATE_ENDPOINT, BALLS_VIEW_ENDPOINTS } from '@/lib/ball-constants';
import { BallFormValues, toCreateBallPayload, toUpdateBallPayload } from '@/lib/ball-form';
import { FormActionResult } from '@/lib/form-action';
import { ActionResult } from '@/types/action';
import { EndpointRequirement } from '@/types/security';
import { Ball } from '@/types/sports';
import { useResourceList } from '../hooks/useResourceList';
import BallFormDialog from './components/BallFormDialog';

const SKELETON_ROWS: Ball[] = Array.from({ length: 5 }, (_, index) => ({ id: -(index + 1), brand: '', model: '', size: null, active: true, matchId: null }));

const ACTIVE_OPTIONS = [
    { label: 'Todos los estados', value: null },
    { label: 'Activas', value: true },
    { label: 'Inactivas', value: false }
];

const ASSIGNMENT_OPTIONS = [
    { label: 'Todas', value: null },
    { label: 'Disponibles (sin partido)', value: 'FREE' },
    { label: 'Asignadas a un partido', value: 'ASSIGNED' }
];

type DialogState = { visible: boolean; ball: Ball | null };

export default function BallsPage() {
    return (
        <ProtectedRoute requiredEndpoints={BALLS_VIEW_ENDPOINTS}>
            <BallsContent />
        </ProtectedRoute>
    );
}

function BallsContent() {
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl } = useAuth();

    const [search, setSearch] = useState('');
    const [active, setActive] = useState<boolean | null>(null);
    const [assignment, setAssignment] = useState<string | null>(null);
    const [dialog, setDialog] = useState<DialogState>({ visible: false, ball: null });

    const can = (...endpoints: EndpointRequirement[]) => endpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    const canCreate = can(BALL_CREATE_ENDPOINT);
    const canUpdate = can(BALL_UPDATE_ENDPOINT);
    const canDelete = can(BALL_DELETE_ENDPOINT);
    const hasActions = canUpdate || canDelete;

    const { items: balls, loading, error, reload, create, update, remove } = useResourceList(ballsClient);

    const filtered = useMemo(() => {
        const text = search.trim().toLowerCase();
        return balls.filter((ball) => {
            if (text && !`${ball.brand} ${ball.model}`.toLowerCase().includes(text)) return false;
            if (active !== null && ball.active !== active) return false;
            // Misma regla de "disponible" del backend: activa y sin partido
            if (assignment === 'FREE' && (!ball.active || ball.matchId !== null)) return false;
            if (assignment === 'ASSIGNED' && ball.matchId === null) return false;
            return true;
        });
    }, [balls, search, active, assignment]);

    const closeDialog = () => setDialog({ visible: false, ball: null });

    const notify = (result: ActionResult, successText: string, errorSummary = 'No se pudo completar') =>
        toast.current?.show(result.ok ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 } : { severity: 'error', summary: errorSummary, detail: result.error, life: 6000 });

    const handleSubmit = async (values: BallFormValues): Promise<FormActionResult> => {
        const editing = dialog.ball;
        const result = editing ? await update(editing.id, toUpdateBallPayload(values, editing)) : await create(toCreateBallPayload(values));
        if (result.ok || !result.validation) notify(result, editing ? 'Pelota actualizada.' : 'Pelota registrada.');
        return result;
    };

    const handleDelete = (ball: Ball) =>
        confirmDialog({
            header: 'Eliminar pelota',
            message: `¿Eliminar "${ball.brand} ${ball.model}"? Si está asignada a un partido no se puede eliminar; en ese caso desactívala.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                const result = await remove(ball.id);
                // 409: el backend indica qué lo bloquea
                notify(result, `"${ball.brand} ${ball.model}" fue eliminada.`, 'No se puede eliminar la pelota');
            }
        });

    const cell = (render: (ball: Ball) => ReactNode, width = '6rem') =>
        function CellBody(ball: Ball) {
            return loading ? <Skeleton width={width} /> : render(ball);
        };

    const nameBody = cell((ball) => <span className={ball.active ? 'text-900 font-medium' : 'text-500 font-medium'}>{`${ball.brand} ${ball.model}`}</span>, '10rem');
    const brandBody = cell((ball) => ball.brand, '7rem');
    const modelBody = cell((ball) => ball.model, '7rem');
    const sizeBody = cell((ball) => ball.size ?? <span className="text-500">Sin talla</span>, '4rem');
    const assignmentBody = cell((ball) => (ball.matchId !== null ? <Tag value={`Partido #${ball.matchId}`} severity="warning" /> : <Tag value="Libre" severity="success" />), '6rem');
    const activeBody = cell((ball) => <ActiveTag active={ball.active} />, '4rem');

    const actionsBody = (ball: Ball) => {
        if (loading) return <Skeleton width="6rem" height="2rem" />;
        return (
            <div className="flex gap-1">
                {canUpdate && <Button icon="pi pi-pencil" rounded text tooltip="Editar" tooltipOptions={{ position: 'top' }} aria-label={`Editar ${ball.brand} ${ball.model}`} onClick={() => setDialog({ visible: true, ball })} />}
                {canDelete && <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Eliminar" tooltipOptions={{ position: 'top' }} aria-label={`Eliminar ${ball.brand} ${ball.model}`} onClick={() => handleDelete(ball)} />}
            </div>
        );
    };

    const hasFilters = Boolean(search.trim()) || active !== null || assignment !== null;

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            <PageHeader
                title="Pelotas"
                subtitle="Administra el catálogo de pelotas y consulta cuáles están asignadas a un partido."
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Pelotas' }]}
                actions={canCreate && <Button label="Nueva pelota" icon="pi pi-plus" onClick={() => setDialog({ visible: true, ball: null })} />}
            />

            {error && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message severity="error" text={error} className="w-full" />
                    <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
                </div>
            )}

            <div className="card">
                <h5>Lista de pelotas {!loading && <span className="text-600 font-normal">({filtered.length})</span>}</h5>
                <div className="grid mb-2">
                    <div className="col-12 md:col-6 lg:col-4">
                        <SearchInput value={search} onChange={setSearch} ariaLabel="Buscar pelotas por marca o modelo" placeholder="Buscar por marca o modelo" className="w-full" />
                    </div>
                    <div className="col-12 md:col-6 lg:col-4">
                        <Dropdown value={assignment} options={ASSIGNMENT_OPTIONS} onChange={(event) => setAssignment((event.value as string | null) ?? null)} aria-label="Filtrar por asignación" className="w-full" />
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
                    emptyMessage={<EmptyState icon="pi-circle" title={hasFilters ? 'Ninguna pelota coincide con los filtros.' : 'No hay pelotas registradas.'} />}
                >
                    <Column header="Pelota" body={nameBody} />
                    <Column header="Marca" body={brandBody} />
                    <Column header="Modelo" body={modelBody} />
                    <Column header="Talla" body={sizeBody} />
                    <Column header="Asignación" body={assignmentBody} />
                    <Column header="Estado" body={activeBody} />
                    {hasActions && <Column header="Acciones" body={actionsBody} headerClassName="w-8rem" />}
                </DataTable>
            </div>

            <BallFormDialog visible={dialog.visible} ball={dialog.ball} onHide={closeDialog} onSubmit={handleSubmit} />
        </>
    );
}

