'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { Toast } from 'primereact/toast';
import ActiveTag from '@/components/ui/ActiveTag';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import SearchInput from '@/components/ui/SearchInput';
import { useAuth } from '@/layout/context/authcontext';
import ProtectedRoute from '@/layout/ProtectedRoute';
import { FormActionResult } from '@/lib/form-action';
import { VENUE_CREATE_ENDPOINT, VENUE_DELETE_ENDPOINT, VENUE_DETAIL_ENDPOINTS, VENUE_UPDATE_ENDPOINT, VENUES_VIEW_ENDPOINTS } from '@/lib/venue-constants';
import { toCreateVenuePayload, toUpdateVenuePayload, VenueFormValues } from '@/lib/venue-form';
import { ActionResult } from '@/types/action';
import { EndpointRequirement } from '@/types/security';
import { Venue } from '@/types/sports';
import VenueFormDialog from './components/VenueFormDialog';
import { useVenueOptions } from '../hooks/useVenueOptions';
import { useVenues } from './hooks/useVenues';

const SEARCH_DEBOUNCE_MS = 400;

const SKELETON_ROWS: Venue[] = Array.from({ length: 5 }, (_, index) => ({
    id: -(index + 1),
    name: '',
    address: null,
    active: true,
    parent: null,
    locationsCount: 0,
    totalCapacity: 0
}));

const ACTIVE_OPTIONS = [
    { label: 'Todos los estados', value: null },
    { label: 'Activos', value: true },
    { label: 'Inactivos', value: false }
];

type DialogState = { visible: boolean; venue: Venue | null };

export default function VenuesPage() {
    return (
        <ProtectedRoute requiredEndpoints={VENUES_VIEW_ENDPOINTS}>
            <VenuesContent />
        </ProtectedRoute>
    );
}

function VenuesContent() {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl } = useAuth();

    const [searchText, setSearchText] = useState('');
    const [search, setSearch] = useState('');
    const [roots, setRoots] = useState(false);
    const [active, setActive] = useState<boolean | null>(null);
    const [dialog, setDialog] = useState<DialogState>({ visible: false, venue: null });

    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchText), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchText]);

    const can = (...endpoints: EndpointRequirement[]) => endpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    const canCreate = can(VENUE_CREATE_ENDPOINT);
    const canUpdate = can(VENUE_UPDATE_ENDPOINT);
    const canDelete = can(VENUE_DELETE_ENDPOINT);
    const canViewDetail = can(...VENUE_DETAIL_ENDPOINTS);
    const hasActions = canUpdate || canDelete || canViewDetail;

    const { venues, loading, error, reload, create, update, remove } = useVenues({ search, roots, active });
    // Opciones de escenario padre solo si el formulario se puede abrir
    const { venues: parentOptions } = useVenueOptions(canCreate || canUpdate);

    const closeDialog = () => setDialog({ visible: false, venue: null });

    const notify = (result: ActionResult, successText: string, errorSummary = 'No se pudo completar') =>
        toast.current?.show(result.ok ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 } : { severity: 'error', summary: errorSummary, detail: result.error, life: 6000 });

    const handleSubmit = async (values: VenueFormValues): Promise<FormActionResult> => {
        const editing = dialog.venue;
        const result = editing ? await update(editing.id, toUpdateVenuePayload(values, editing)) : await create(toCreateVenuePayload(values));
        if (result.ok || !result.validation) notify(result, editing ? 'Escenario actualizado.' : 'Escenario creado.');
        return result;
    };

    const handleDelete = (venue: Venue) =>
        confirmDialog({
            header: 'Eliminar escenario',
            message: `¿Eliminar "${venue.name}"? Solo se puede eliminar si no tiene espacios internos, localidades, torneos ni partidos.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                const result = await remove(venue.id);
                notify(result, `"${venue.name}" fue eliminado.`, 'No se puede eliminar el escenario');
            }
        });

    const cell = (render: (venue: Venue) => ReactNode, width = '6rem') =>
        function CellBody(venue: Venue) {
            return loading ? <Skeleton width={width} /> : render(venue);
        };

    const nameBody = cell((venue) => <span className={venue.active ? 'text-900 font-medium' : 'text-500 font-medium'}>{venue.name}</span>, '10rem');
    const addressBody = cell((venue) => venue.address ?? <span className="text-500">Sin dirección</span>, '10rem');
    const parentBody = cell((venue) => (venue.parent ? venue.parent.name : <span className="text-500">Escenario principal</span>), '8rem');
    const locationsBody = cell((venue) => venue.locationsCount, '2rem');
    const capacityBody = cell((venue) => venue.totalCapacity.toLocaleString('es-CO'), '4rem');
    const activeBody = cell((venue) => <ActiveTag active={venue.active} />, '4rem');

    const actionsBody = (venue: Venue) => {
        if (loading) return <Skeleton width="8rem" height="2rem" />;
        return (
            <div className="flex gap-1">
                {canViewDetail && <Button icon="pi pi-eye" rounded text tooltip="Ver detalle" tooltipOptions={{ position: 'top' }} aria-label={`Ver detalle de ${venue.name}`} onClick={() => router.push(`/escenarios/${venue.id}`)} />}
                {canUpdate && <Button icon="pi pi-pencil" rounded text tooltip="Editar" tooltipOptions={{ position: 'top' }} aria-label={`Editar ${venue.name}`} onClick={() => setDialog({ visible: true, venue })} />}
                {canDelete && <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Eliminar" tooltipOptions={{ position: 'top' }} aria-label={`Eliminar ${venue.name}`} onClick={() => handleDelete(venue)} />}
            </div>
        );
    };

    const hasFilters = Boolean(search.trim()) || roots || active !== null;

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            <PageHeader
                title="Escenarios"
                subtitle="Registra los escenarios deportivos y sus espacios internos. Desde el detalle se gestionan sus localidades y su capacidad."
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Escenarios' }]}
                actions={canCreate && <Button label="Nuevo escenario" icon="pi pi-plus" onClick={() => setDialog({ visible: true, venue: null })} />}
            />

            {error && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message severity="error" text={error} className="w-full" />
                    <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
                </div>
            )}

            <div className="card">
                <h5>Listado de escenarios</h5>
                <div className="grid mb-2 align-items-center">
                    <div className="col-12 md:col-6 lg:col-4">
                        <SearchInput value={searchText} onChange={setSearchText} ariaLabel="Buscar escenarios por nombre" placeholder="Buscar escenario" className="w-full" />
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <Dropdown value={active} options={ACTIVE_OPTIONS} placeholder="Todos los estados" onChange={(event) => setActive((event.value as boolean | null) ?? null)} aria-label="Filtrar por estado" className="w-full" />
                    </div>
                    <div className="col-12 lg:col-5 flex align-items-center gap-2">
                        <Checkbox inputId="venues-roots" checked={roots} onChange={(event) => setRoots(Boolean(event.checked))} />
                        <label htmlFor="venues-roots">Solo escenarios principales</label>
                    </div>
                </div>

                <DataTable
                    value={loading ? SKELETON_ROWS : venues}
                    dataKey="id"
                    paginator={!loading && venues.length > 10}
                    rows={10}
                    emptyMessage={<EmptyState icon="pi-building" title={hasFilters ? 'Ningún escenario coincide con los filtros.' : 'No hay escenarios registrados.'} />}
                >
                    <Column header="Escenario" body={nameBody} />
                    <Column header="Dirección" body={addressBody} />
                    <Column header="Pertenece a" body={parentBody} />
                    <Column header="Localidades" body={locationsBody} />
                    <Column header="Capacidad" body={capacityBody} />
                    <Column header="Estado" body={activeBody} />
                    {hasActions && <Column header="Acciones" body={actionsBody} headerClassName="w-10rem" />}
                </DataTable>
            </div>

            <VenueFormDialog visible={dialog.visible} venue={dialog.venue} parentOptions={parentOptions} onHide={closeDialog} onSubmit={handleSubmit} />
        </>
    );
}
