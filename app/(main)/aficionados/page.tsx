'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
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
import { FAN_CREATE_ENDPOINT, FAN_DELETE_ENDPOINT, FAN_UPDATE_ENDPOINT, FANS_VIEW_ENDPOINTS } from '@/lib/fan-constants';
import { AdminFanFormValues, toCreateFanPayload, toUpdateFanPayload } from '@/lib/fan-form';
import { FormActionResult } from '@/lib/form-action';
import { ActionResult } from '@/types/action';
import { EndpointRequirement } from '@/types/security';
import { Fan } from '@/types/sports';
import FanFormDialog from './components/FanFormDialog';
import { useFans } from './hooks/useFans';

const SEARCH_DEBOUNCE_MS = 400;

const SKELETON_ROWS = Array.from({ length: 5 }, (_, index) => ({ id: -(index + 1) } as Fan));

const ACTIVE_OPTIONS = [
    { label: 'Todos los estados', value: null },
    { label: 'Activos', value: true },
    { label: 'Inactivos', value: false }
];

type DialogState = { visible: boolean; fan: Fan | null };

export default function FansPage() {
    return (
        <ProtectedRoute requiredEndpoints={FANS_VIEW_ENDPOINTS}>
            <FansContent />
        </ProtectedRoute>
    );
}

function FansContent() {
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl } = useAuth();

    const [searchText, setSearchText] = useState('');
    const [search, setSearch] = useState('');
    const [active, setActive] = useState<boolean | null>(null);
    const [dialog, setDialog] = useState<DialogState>({ visible: false, fan: null });

    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchText), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchText]);

    const can = (...endpoints: EndpointRequirement[]) => endpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    const canCreate = can(FAN_CREATE_ENDPOINT);
    const canUpdate = can(FAN_UPDATE_ENDPOINT);
    const canDelete = can(FAN_DELETE_ENDPOINT);
    const hasActions = canUpdate || canDelete;

    const { fans, loading, error, reload, create, update, remove } = useFans({ search, active });

    const closeDialog = () => setDialog({ visible: false, fan: null });

    const notify = (result: ActionResult, successText: string, errorSummary = 'No se pudo completar') =>
        toast.current?.show(result.ok ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 } : { severity: 'error', summary: errorSummary, detail: result.error, life: 6000 });

    const handleSubmit = async (values: AdminFanFormValues): Promise<FormActionResult> => {
        const editing = dialog.fan;
        const result = editing ? await update(editing.id, toUpdateFanPayload(values, editing)) : await create(toCreateFanPayload(values));
        if (result.ok) notify(result, editing ? 'Aficionado actualizado.' : 'Aficionado registrado.');
        return result;
    };

    const handleDelete = (fan: Fan) => {
        confirmDialog({
            header: 'Eliminar aficionado',
            message: `¿Eliminar a "${fan.fullName}"? Solo es posible si no tiene equipos favoritos, métodos de pago, boletos ni apuestas asociadas; de lo contrario, puedes desactivarlo al editar.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => notify(await remove(fan.id), `"${fan.fullName}" fue eliminado.`, 'No se puede eliminar el aficionado')
        });
    };

    const cell = (render: (fan: Fan) => ReactNode, width = '6rem') =>
        function CellBody(fan: Fan) {
            return loading ? <Skeleton width={width} /> : render(fan);
        };

    const nameBody = cell((fan) => <span className={fan.active ? 'text-900 font-medium' : 'text-500 font-medium'}>{fan.fullName}</span>, '10rem');
    const documentBody = cell((fan) => fan.documentNumber, '7rem');
    const emailBody = cell((fan) => fan.email, '11rem');
    const phoneBody = cell((fan) => fan.phone ?? <span className="text-500">Sin teléfono</span>, '7rem');
    const userBody = cell((fan) => <Tag value={`#${fan.securityUserId}`} severity="info" />, '4rem');
    const favoritesBody = cell((fan) => fan.favoriteTeamsCount, '3rem');
    const activeBody = cell((fan) => <ActiveTag active={fan.active} />, '4rem');

    const actionsBody = (fan: Fan) => {
        if (loading) return <Skeleton width="6rem" height="2rem" />;
        return (
            <div className="flex gap-1">
                {canUpdate && (
                    <Button
                        icon="pi pi-pencil"
                        rounded
                        text
                        tooltip="Editar"
                        tooltipOptions={{ position: 'top' }}
                        aria-label={`Editar a ${fan.fullName}`}
                        onClick={() => setDialog({ visible: true, fan })}
                    />
                )}
                {canDelete && (
                    <Button
                        icon="pi pi-trash"
                        rounded
                        text
                        severity="danger"
                        tooltip="Eliminar"
                        tooltipOptions={{ position: 'top' }}
                        aria-label={`Eliminar a ${fan.fullName}`}
                        onClick={() => handleDelete(fan)}
                    />
                )}
            </div>
        );
    };

    const hasFilters = Boolean(search.trim()) || active !== null;

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            <PageHeader
                title="Aficionados"
                subtitle="Administra los aficionados registrados y sus perfiles vinculados al sistema de seguridad."
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Aficionados' }]}
                actions={canCreate && <Button label="Nuevo aficionado" icon="pi pi-plus" onClick={() => setDialog({ visible: true, fan: null })} />}
            />

            {error && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message severity="error" text={error} className="w-full" />
                    <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
                </div>
            )}

            <div className="card">
                <h5>Lista de aficionados {!loading && <span className="text-600 font-normal">({fans.length})</span>}</h5>
                <div className="grid mb-2">
                    <div className="col-12 md:col-6 lg:col-5">
                        <SearchInput value={searchText} onChange={setSearchText} ariaLabel="Buscar aficionados" placeholder="Nombre, documento o correo" className="w-full" />
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                        <Dropdown
                            value={active}
                            options={ACTIVE_OPTIONS}
                            placeholder="Todos los estados"
                            onChange={(event) => setActive((event.value as boolean | null) ?? null)}
                            aria-label="Filtrar por estado"
                            className="w-full"
                        />
                    </div>
                </div>

                <DataTable
                    value={loading ? SKELETON_ROWS : fans}
                    dataKey="id"
                    paginator={!loading && fans.length > 10}
                    rows={10}
                    emptyMessage={<EmptyState icon="pi-users" title={hasFilters ? 'Ningún aficionado coincide con los filtros.' : 'No hay aficionados registrados.'} />}
                >
                    <Column header="Aficionado" body={nameBody} />
                    <Column header="Documento" body={documentBody} />
                    <Column header="Correo" body={emailBody} />
                    <Column header="Teléfono" body={phoneBody} />
                    <Column header="Usuario" body={userBody} />
                    <Column header="Favoritos" body={favoritesBody} />
                    <Column header="Estado" body={activeBody} />
                    {hasActions && <Column header="Acciones" body={actionsBody} headerClassName="w-8rem" />}
                </DataTable>
            </div>

            <FanFormDialog visible={dialog.visible} fan={dialog.fan} onHide={closeDialog} onSubmit={handleSubmit} />
        </>
    );
}
