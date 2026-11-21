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
import { MY_FAN_VIEW_ENDPOINTS } from '@/lib/fan-constants';
import { FormActionResult } from '@/lib/form-action';
import {
    MY_PAYMENT_METHOD_DELETE_ENDPOINT,
    MY_PAYMENT_METHOD_REGISTER_ENDPOINT,
    MY_PAYMENT_METHOD_UPDATE_ENDPOINT,
    MY_PAYMENT_METHODS_VIEW_ENDPOINTS,
    PAYMENT_METHOD_CREATE_ENDPOINT,
    PAYMENT_METHOD_DELETE_ENDPOINT,
    PAYMENT_METHOD_UPDATE_ENDPOINT,
    PAYMENT_METHODS_VIEW_ENDPOINTS
} from '@/lib/payment-method-constants';
import {
    CatalogPaymentMethodFormValues,
    FanPaymentMethodFormValues,
    formatFanPaymentMethodDetails,
    PAYMENT_METHOD_TYPE_LABELS,
    PAYMENT_METHOD_TYPE_OPTIONS,
    toCreatePaymentMethodPayload,
    toRegisterFanPaymentMethodPayload,
    toUpdateFanPaymentMethodPayload,
    toUpdatePaymentMethodPayload
} from '@/lib/payment-method-form';
import { formatDateTime } from '@/lib/tournament-labels';
import { ActionResult } from '@/types/action';
import { EndpointRequirement } from '@/types/security';
import { FanPaymentMethod, PaymentMethod, PaymentMethodType } from '@/types/sports';
import FanPaymentMethodFormDialog from './components/FanPaymentMethodFormDialog';
import PaymentMethodFormDialog from './components/PaymentMethodFormDialog';
import { usePaymentMethods } from './hooks/usePaymentMethods';

const SEARCH_DEBOUNCE_MS = 400;
const CATALOG_SKELETON_ROWS = Array.from({ length: 4 }, (_, index) => ({ id: -(index + 1) } as PaymentMethod));
const MINE_SKELETON_ROWS = Array.from({ length: 4 }, (_, index) => ({ id: -(index + 1) } as FanPaymentMethod));

const ACTIVE_OPTIONS = [
    { label: 'Todos los estados', value: null },
    { label: 'Activos', value: true },
    { label: 'Inactivos', value: false }
];

type CatalogDialogState = { visible: boolean; method: PaymentMethod | null };
type MineDialogState = { visible: boolean; item: FanPaymentMethod | null };

export default function PaymentMethodsPage() {
    const { hasPermissionUrl } = useAuth();
    const canViewMine = MY_PAYMENT_METHODS_VIEW_ENDPOINTS.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    const requiredEndpoints = canViewMine ? MY_PAYMENT_METHODS_VIEW_ENDPOINTS : PAYMENT_METHODS_VIEW_ENDPOINTS;

    return (
        <ProtectedRoute requiredEndpoints={requiredEndpoints}>
            <PaymentMethodsContent />
        </ProtectedRoute>
    );
}

function PaymentMethodsContent() {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl } = useAuth();

    const [searchText, setSearchText] = useState('');
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<PaymentMethodType | null>(null);
    const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
    const [mineActiveFilter, setMineActiveFilter] = useState<boolean | null>(null);

    const [catalogDialog, setCatalogDialog] = useState<CatalogDialogState>({ visible: false, method: null });
    const [mineDialog, setMineDialog] = useState<MineDialogState>({ visible: false, item: null });

    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchText), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchText]);

    const can = (...endpoints: EndpointRequirement[]) => endpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));

    const canViewCatalog = can(...PAYMENT_METHODS_VIEW_ENDPOINTS);
    const canCreateCatalog = can(PAYMENT_METHOD_CREATE_ENDPOINT);
    const canUpdateCatalog = can(PAYMENT_METHOD_UPDATE_ENDPOINT);
    const canDeleteCatalog = can(PAYMENT_METHOD_DELETE_ENDPOINT);
    const hasCatalogAdminActions = canCreateCatalog || canUpdateCatalog || canDeleteCatalog;

    const canViewMine = can(...MY_PAYMENT_METHODS_VIEW_ENDPOINTS);
    const canRegisterMine = can(MY_PAYMENT_METHOD_REGISTER_ENDPOINT);
    const canUpdateMine = can(MY_PAYMENT_METHOD_UPDATE_ENDPOINT);
    const canDeleteMine = can(MY_PAYMENT_METHOD_DELETE_ENDPOINT);
    const canViewMyFan = can(...MY_FAN_VIEW_ENDPOINTS);

    const showCatalogSection = canViewCatalog && (hasCatalogAdminActions || !canViewMine);

    const {
        catalog,
        loadingCatalog,
        catalogError,
        catalogOptions,
        myMethods,
        loadingMine,
        mineError,
        profileMissing,
        reload,
        createCatalog,
        updateCatalog,
        removeCatalog,
        registerMine,
        updateMine,
        removeMine
    } = usePaymentMethods({
        loadCatalog: showCatalogSection,
        loadCatalogOptions: canViewCatalog && canViewMine && canRegisterMine,
        search,
        type: typeFilter,
        active: activeFilter,
        loadMine: canViewMine,
        mineActive: mineActiveFilter
    });

    const notify = (result: ActionResult, successText: string, errorSummary = 'No se pudo completar') =>
        toast.current?.show(result.ok ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 } : { severity: 'error', summary: errorSummary, detail: result.error, life: 6000 });

    const handleCatalogSubmit = async (values: CatalogPaymentMethodFormValues): Promise<FormActionResult> => {
        const editing = catalogDialog.method;
        const result = editing
            ? await updateCatalog(editing.id, toUpdatePaymentMethodPayload(values, editing))
            : await createCatalog(toCreatePaymentMethodPayload(values));
        if (result.ok) notify(result, editing ? 'Método de pago actualizado.' : 'Método de pago creado.');
        return result;
    };

    const handleCatalogDelete = (method: PaymentMethod) => {
        confirmDialog({
            header: 'Eliminar método de pago',
            message: `¿Eliminar "${method.name}" del catálogo? Solo es posible si ningún aficionado lo tiene registrado.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => notify(await removeCatalog(method.id), `"${method.name}" fue eliminado.`, 'No se puede eliminar')
        });
    };

    const handleMineSubmit = async (values: FanPaymentMethodFormValues, resolvedType: PaymentMethodType): Promise<FormActionResult> => {
        const editing = mineDialog.item;
        const result = editing
            ? await updateMine(editing.id, toUpdateFanPaymentMethodPayload(values, editing))
            : await registerMine(toRegisterFanPaymentMethodPayload(values, resolvedType));
        if (result.ok) notify(result, editing ? 'Tu método de pago fue actualizado.' : 'Método de pago registrado en tu billetera.');
        return result;
    };

    const handleMineDelete = (item: FanPaymentMethod) => {
        confirmDialog({
            header: 'Eliminar método de pago propio',
            message: `¿Eliminar "${item.alias}"? Si ya tiene apuestas asociadas no podrá eliminarse; puedes desactivarlo al editar.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => notify(await removeMine(item.id), `"${item.alias}" fue eliminado de tu billetera.`, 'No se puede eliminar')
        });
    };

    const catalogCell = (render: (method: PaymentMethod) => ReactNode, width = '6rem') =>
        function CatalogCell(method: PaymentMethod) {
            return loadingCatalog ? <Skeleton width={width} /> : render(method);
        };

    const mineCell = (render: (item: FanPaymentMethod) => ReactNode, width = '6rem') =>
        function MineCell(item: FanPaymentMethod) {
            return loadingMine ? <Skeleton width={width} /> : render(item);
        };

    const catalogActionsBody = (method: PaymentMethod) => {
        if (loadingCatalog) return <Skeleton width="6rem" height="2rem" />;
        return (
            <div className="flex gap-1">
                {canUpdateCatalog && (
                    <Button
                        icon="pi pi-pencil"
                        rounded
                        text
                        tooltip="Editar"
                        tooltipOptions={{ position: 'top' }}
                        aria-label={`Editar ${method.name}`}
                        onClick={() => setCatalogDialog({ visible: true, method })}
                    />
                )}
                {canDeleteCatalog && (
                    <Button
                        icon="pi pi-trash"
                        rounded
                        text
                        severity="danger"
                        tooltip="Eliminar"
                        tooltipOptions={{ position: 'top' }}
                        aria-label={`Eliminar ${method.name}`}
                        onClick={() => handleCatalogDelete(method)}
                    />
                )}
            </div>
        );
    };

    const mineActionsBody = (item: FanPaymentMethod) => {
        if (loadingMine) return <Skeleton width="6rem" height="2rem" />;
        return (
            <div className="flex gap-1">
                {canUpdateMine && (
                    <Button
                        icon="pi pi-pencil"
                        rounded
                        text
                        tooltip="Editar"
                        tooltipOptions={{ position: 'top' }}
                        aria-label={`Editar ${item.alias}`}
                        onClick={() => setMineDialog({ visible: true, item })}
                    />
                )}
                {canDeleteMine && (
                    <Button
                        icon="pi pi-trash"
                        rounded
                        text
                        severity="danger"
                        tooltip="Eliminar"
                        tooltipOptions={{ position: 'top' }}
                        aria-label={`Eliminar ${item.alias}`}
                        onClick={() => handleMineDelete(item)}
                    />
                )}
            </div>
        );
    };

    const hasCatalogFilters = Boolean(search.trim()) || typeFilter !== null || activeFilter !== null;
    const hasCatalogActionColumn = canUpdateCatalog || canDeleteCatalog;
    const hasMineActionColumn = canUpdateMine || canDeleteMine;

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            <PageHeader
                title="Métodos de pago"
                subtitle={
                    showCatalogSection && canViewMine
                        ? 'Administra el catálogo del sistema y los medios de pago de tu billetera.'
                        : showCatalogSection
                          ? 'Administra el catálogo de medios de pago habilitados en el sistema.'
                          : 'Registra y gestiona tus medios de pago para realizar apuestas.'
                }
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Métodos de pago' }]}
                actions={
                    <div className="flex flex-wrap gap-2">
                        {canViewMine && canRegisterMine && !profileMissing && (
                            <Button
                                label="Registrar método de pago"
                                icon="pi pi-wallet"
                                onClick={() => setMineDialog({ visible: true, item: null })}
                                disabled={!canViewCatalog || catalogOptions.length === 0}
                            />
                        )}
                        {showCatalogSection && canCreateCatalog && (
                            <Button label="Nuevo método de catálogo" icon="pi pi-plus" onClick={() => setCatalogDialog({ visible: true, method: null })} />
                        )}
                    </div>
                }
            />

            {canViewMine && (
                <div className="card mb-4">
                    <div className="flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                        <h5 className="m-0">Mis métodos de pago {!loadingMine && !profileMissing && <span className="text-600 font-normal">({myMethods.length})</span>}</h5>
                        <div className="flex align-items-center gap-2">
                            <Dropdown
                                value={mineActiveFilter}
                                options={ACTIVE_OPTIONS}
                                placeholder="Todos los estados"
                                onChange={(event) => setMineActiveFilter((event.value as boolean | null) ?? null)}
                                aria-label="Filtrar mis métodos por estado"
                            />
                            <Button icon="pi pi-refresh" outlined tooltip="Actualizar" aria-label="Actualizar mis métodos" onClick={reload} />
                        </div>
                    </div>

                    {mineError && <Message severity="error" text={mineError} className="w-full mb-3" />}

                    {!loadingMine && canRegisterMine && !canViewCatalog && (
                        <Message
                            severity="info"
                            text="Para registrar un método nuevo necesitas permiso de lectura sobre el catálogo (GET /gestion-deportiva/payment-methods)."
                            className="w-full mb-3"
                        />
                    )}

                    {profileMissing ? (
                        <EmptyState
                            icon="pi-id-card"
                            title="Primero completa tu perfil de aficionado."
                            description="Debes autorregistrar tu ficha de aficionado antes de guardar métodos de pago en tu billetera."
                            action={
                                canViewMyFan ? (
                                    <Button label="Ir a Mi perfil de aficionado" icon="pi pi-user-plus" onClick={() => router.push('/mi-aficionado')} />
                                ) : undefined
                            }
                        />
                    ) : (
                        <DataTable
                            value={loadingMine ? MINE_SKELETON_ROWS : myMethods}
                            dataKey="id"
                            paginator={!loadingMine && myMethods.length > 10}
                            rows={10}
                            emptyMessage={
                                <EmptyState
                                    icon="pi-wallet"
                                    title={mineActiveFilter !== null ? 'Ningún método coincide con el filtro.' : 'No tienes métodos de pago registrados.'}
                                    description="Registra una tarjeta, cuenta PSE, billetera digital o cuenta bancaria para empezar a apostar."
                                />
                            }
                        >
                            <Column header="Alias" body={mineCell((item) => <span className="font-medium text-900">{item.alias}</span>, '8rem')} />
                            <Column
                                header="Tipo / Catálogo"
                                body={mineCell(
                                    (item) => (
                                        <div className="flex flex-column">
                                            <span className="text-900">{item.paymentMethod.name}</span>
                                            <span className="text-600 text-sm">{PAYMENT_METHOD_TYPE_LABELS[item.paymentMethod.type]}</span>
                                        </div>
                                    ),
                                    '10rem'
                                )}
                            />
                            <Column header="Referencia" body={mineCell((item) => <Tag value={item.reference} severity="info" />, '6rem')} />
                            <Column header="Detalles" body={mineCell((item) => formatFanPaymentMethodDetails(item) || '—', '12rem')} />
                            <Column header="Registrado el" body={mineCell((item) => formatDateTime(item.createdAt), '8rem')} />
                            <Column header="Estado" body={mineCell((item) => <ActiveTag active={item.active} />, '4rem')} />
                            {hasMineActionColumn && <Column header="Acciones" body={mineActionsBody} headerClassName="w-8rem" />}
                        </DataTable>
                    )}
                </div>
            )}

            {showCatalogSection && (
                <div className="card">
                    <h5>Catálogo de métodos de pago {!loadingCatalog && <span className="text-600 font-normal">({catalog.length})</span>}</h5>

                    {catalogError && (
                        <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-3">
                            <Message severity="error" text={catalogError} className="w-full" />
                            <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
                        </div>
                    )}

                    <div className="grid mb-2">
                        <div className="col-12 md:col-5 lg:col-4">
                            <SearchInput
                                value={searchText}
                                onChange={setSearchText}
                                ariaLabel="Buscar método de pago"
                                placeholder="Nombre o descripción"
                                className="w-full"
                            />
                        </div>
                        <div className="col-12 md:col-4 lg:col-4">
                            <Dropdown
                                value={typeFilter}
                                options={PAYMENT_METHOD_TYPE_OPTIONS}
                                placeholder="Todos los tipos"
                                onChange={(event) => setTypeFilter((event.value as PaymentMethodType | null) ?? null)}
                                aria-label="Filtrar por tipo"
                                showClear
                                className="w-full"
                            />
                        </div>
                        <div className="col-12 md:col-3 lg:col-4">
                            <Dropdown
                                value={activeFilter}
                                options={ACTIVE_OPTIONS}
                                placeholder="Todos los estados"
                                onChange={(event) => setActiveFilter((event.value as boolean | null) ?? null)}
                                aria-label="Filtrar por estado"
                                className="w-full"
                            />
                        </div>
                    </div>

                    <DataTable
                        value={loadingCatalog ? CATALOG_SKELETON_ROWS : catalog}
                        dataKey="id"
                        paginator={!loadingCatalog && catalog.length > 10}
                        rows={10}
                        emptyMessage={
                            <EmptyState
                                icon="pi-credit-card"
                                title={hasCatalogFilters ? 'Ningún método de pago coincide con los filtros.' : 'No hay métodos de pago registrados.'}
                            />
                        }
                    >
                        <Column
                            header="Nombre"
                            body={catalogCell((method) => <span className={method.active ? 'text-900 font-medium' : 'text-500 font-medium'}>{method.name}</span>, '10rem')}
                        />
                        <Column header="Tipo" body={catalogCell((method) => <Tag value={PAYMENT_METHOD_TYPE_LABELS[method.type]} severity="info" />, '8rem')} />
                        <Column
                            header="Descripción"
                            body={catalogCell((method) => method.description ?? <span className="text-500">Sin descripción</span>, '12rem')}
                        />
                        <Column header="Aficionados" body={catalogCell((method) => method.fanPaymentMethodsCount, '3rem')} />
                        <Column header="Estado" body={catalogCell((method) => <ActiveTag active={method.active} />, '4rem')} />
                        {hasCatalogActionColumn && <Column header="Acciones" body={catalogActionsBody} headerClassName="w-8rem" />}
                    </DataTable>
                </div>
            )}

            <PaymentMethodFormDialog
                visible={catalogDialog.visible}
                paymentMethod={catalogDialog.method}
                onHide={() => setCatalogDialog({ visible: false, method: null })}
                onSubmit={handleCatalogSubmit}
            />

            <FanPaymentMethodFormDialog
                visible={mineDialog.visible}
                item={mineDialog.item}
                catalogOptions={catalogOptions}
                onHide={() => setMineDialog({ visible: false, item: null })}
                onSubmit={handleMineSubmit}
            />
        </>
    );
}

