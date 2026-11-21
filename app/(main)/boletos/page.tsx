'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
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
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import SearchInput from '@/components/ui/SearchInput';
import { useAuth } from '@/layout/context/authcontext';
import ProtectedRoute from '@/layout/ProtectedRoute';
import { FANS_VIEW_ENDPOINTS, MY_FAN_VIEW_ENDPOINTS } from '@/lib/fan-constants';
import { FormActionResult } from '@/lib/form-action';
import { MATCHES_VIEW_ENDPOINTS } from '@/lib/match-constants';
import { MATCH_STATUS_LABELS, MATCH_STATUS_SEVERITY } from '@/lib/match-labels';
import {
    MY_TICKET_DELETE_ENDPOINT,
    MY_TICKET_PURCHASE_ENDPOINT,
    MY_TICKETS_VIEW_ENDPOINTS,
    TICKET_AVAILABILITY_ENDPOINT,
    TICKET_CREATE_ENDPOINT,
    TICKET_DELETE_ENDPOINT,
    TICKETS_VIEW_ENDPOINTS
} from '@/lib/ticket-constants';
import {
    canCancelTicket,
    canPurchaseTicketForMatch,
    formatCurrencyCop,
    TicketFormValues,
    toCreateTicketPayload,
    toPurchaseTicketPayload
} from '@/lib/ticket-form';
import { TOURNAMENTS_VIEW_ENDPOINTS } from '@/lib/tournament-constants';
import { formatDateTime } from '@/lib/tournament-labels';
import { ActionResult } from '@/types/action';
import { EndpointRequirement } from '@/types/security';
import { Ticket } from '@/types/sports';
import TicketAvailabilityPanel from './components/TicketAvailabilityPanel';
import TicketPurchaseDialog from './components/TicketPurchaseDialog';
import { useTickets } from './hooks/useTickets';

const SEARCH_DEBOUNCE_MS = 400;
const SKELETON_ROWS = Array.from({ length: 4 }, (_, index) => ({ id: -(index + 1) } as Ticket));

type PurchaseDialogState = {
    visible: boolean;
    mode: 'mine' | 'admin';
    matchId: number | null;
    locationId: number | null;
};

export default function TicketsPage() {
    const { hasPermissionUrl } = useAuth();
    const canViewMine = MY_TICKETS_VIEW_ENDPOINTS.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    const requiredEndpoints = canViewMine ? MY_TICKETS_VIEW_ENDPOINTS : TICKETS_VIEW_ENDPOINTS;

    return (
        <ProtectedRoute requiredEndpoints={requiredEndpoints}>
            <TicketsContent />
        </ProtectedRoute>
    );
}

function TicketsContent() {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl } = useAuth();

    const can = (...endpoints: EndpointRequirement[]) => endpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));

    const canViewAdmin = can(...TICKETS_VIEW_ENDPOINTS);
    const canCreateAdmin = can(TICKET_CREATE_ENDPOINT);
    const canDeleteAdmin = can(TICKET_DELETE_ENDPOINT);

    const canViewMine = can(...MY_TICKETS_VIEW_ENDPOINTS);
    const canPurchaseMine = can(MY_TICKET_PURCHASE_ENDPOINT);
    const canDeleteMine = can(MY_TICKET_DELETE_ENDPOINT);

    const canLoadAvailability = can(TICKET_AVAILABILITY_ENDPOINT);
    const canLoadMatches = can(...MATCHES_VIEW_ENDPOINTS);
    const canLoadTournaments = can(...TOURNAMENTS_VIEW_ENDPOINTS);
    const canLoadFans = can(...FANS_VIEW_ENDPOINTS);
    const canViewMyFan = can(...MY_FAN_VIEW_ENDPOINTS);

    const [availabilityMatchId, setAvailabilityMatchId] = useState<number | null>(null);

    const [myTournamentId, setMyTournamentId] = useState<number | null>(null);
    const [myMatchId, setMyMatchId] = useState<number | null>(null);

    const [adminCodeText, setAdminCodeText] = useState('');
    const [adminCode, setAdminCode] = useState('');
    const [adminTournamentId, setAdminTournamentId] = useState<number | null>(null);
    const [adminMatchId, setAdminMatchId] = useState<number | null>(null);
    const [adminFanId, setAdminFanId] = useState<number | null>(null);

    const [dialog, setDialog] = useState<PurchaseDialogState>({
        visible: false,
        mode: 'mine',
        matchId: null,
        locationId: null
    });

    useEffect(() => {
        const timer = setTimeout(() => setAdminCode(adminCodeText), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [adminCodeText]);

    const {
        myTickets,
        loadingMine,
        mineError,
        profileMissing,
        adminTickets,
        loadingAdmin,
        adminError,
        availability,
        loadingAvailability,
        availabilityError,
        matches,
        tournaments,
        fans,
        reload,
        purchaseMine,
        createAdmin,
        removeMine,
        removeAdmin
    } = useTickets({
        canViewAdmin,
        canViewMine,
        canLoadAvailability,
        canLoadMatches,
        canLoadTournaments,
        canLoadFans: canLoadFans && (canViewAdmin || canCreateAdmin),
        availabilityMatchId,
        adminFilters: {
            matchId: adminMatchId,
            fanId: adminFanId,
            tournamentId: adminTournamentId,
            code: adminCode
        },
        myFilters: {
            matchId: myMatchId,
            tournamentId: myTournamentId
        }
    });

    useEffect(() => {
        if (availabilityMatchId !== null || matches.length === 0) return;
        const firstScheduled = matches.find((match) => canPurchaseTicketForMatch(match.status)) ?? matches[0];
        if (firstScheduled) setAvailabilityMatchId(firstScheduled.id);
    }, [availabilityMatchId, matches]);

    const notify = (result: ActionResult, successText: string, errorSummary = 'No se pudo completar') =>
        toast.current?.show(result.ok ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 } : { severity: 'error', summary: errorSummary, detail: result.error, life: 6000 });

    const tournamentOptions = useMemo(
        () => tournaments.map((tournament) => ({ label: tournament.name, value: tournament.id })),
        [tournaments]
    );

    const matchOptions = useMemo(
        () =>
            matches.map((match) => ({
                label: `${match.homeTeam.name} vs ${match.awayTeam.name} · ${formatDateTime(match.scheduledAt)}`,
                value: match.id
            })),
        [matches]
    );

    const fanOptions = useMemo(
        () => fans.map((fan) => ({ label: `${fan.fullName} (${fan.documentNumber})`, value: fan.id })),
        [fans]
    );

    const openPurchaseDialog = (mode: 'mine' | 'admin', matchId: number | null = availabilityMatchId, locationId: number | null = null) => {
        setDialog({ visible: true, mode, matchId, locationId });
    };

    const handleDialogSubmit = async (values: TicketFormValues): Promise<FormActionResult> => {
        const result =
            dialog.mode === 'admin'
                ? await createAdmin(toCreateTicketPayload(values))
                : await purchaseMine(toPurchaseTicketPayload(values));

        if (result.ok) {
            notify(result, dialog.mode === 'admin' ? 'Boleto emitido correctamente.' : 'Boleto comprado correctamente.');
        }
        return result;
    };

    const confirmRemove = (ticket: Ticket, mode: 'mine' | 'admin') => {
        confirmDialog({
            header: mode === 'mine' ? 'Anular boleto' : 'Eliminar boleto',
            message: `¿${mode === 'mine' ? 'Anular' : 'Eliminar'} el boleto ${ticket.code} para ${ticket.match.homeTeamName} vs ${ticket.match.awayTeamName}? Se liberará el cupo en ${ticket.location.name}.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: mode === 'mine' ? 'Anular boleto' : 'Eliminar',
            rejectLabel: 'Volver',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                const result = mode === 'mine' ? await removeMine(ticket.id) : await removeAdmin(ticket.id);
                notify(result, `Boleto ${ticket.code} eliminado.`, 'No se pudo eliminar el boleto');
            }
        });
    };

    const mineCell = (render: (ticket: Ticket) => ReactNode, width = '6rem') =>
        function MineCell(ticket: Ticket) {
            return loadingMine ? <Skeleton width={width} /> : render(ticket);
        };

    const adminCell = (render: (ticket: Ticket) => ReactNode, width = '6rem') =>
        function AdminCell(ticket: Ticket) {
            return loadingAdmin ? <Skeleton width={width} /> : render(ticket);
        };

    const renderMatchCell = (ticket: Ticket) => (
        <div className="flex flex-column">
            <span className="font-medium text-900">
                {ticket.match.homeTeamName} vs {ticket.match.awayTeamName}
            </span>
            <span className="text-600 text-sm">
                {ticket.match.venueName} · {formatDateTime(ticket.match.scheduledAt)}
            </span>
        </div>
    );

    const renderStatusCell = (ticket: Ticket) => (
        <Tag value={MATCH_STATUS_LABELS[ticket.match.status]} severity={MATCH_STATUS_SEVERITY[ticket.match.status]} />
    );

    const quickBuyMode: 'mine' | 'admin' = canViewMine && canPurchaseMine && !profileMissing ? 'mine' : 'admin';
    const canQuickBuy = (canViewMine && canPurchaseMine && !profileMissing) || canCreateAdmin;

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            <PageHeader
                title="Boletos y localidades"
                subtitle="Consulta la disponibilidad en vivo por localidad y gestiona la compra o emisión de boletos."
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Boletos' }]}
                actions={
                    <div className="flex flex-wrap gap-2">
                        {canViewMine && canPurchaseMine && !profileMissing && (
                            <Button label="Comprar boleto" icon="pi pi-ticket" onClick={() => openPurchaseDialog('mine')} />
                        )}
                        {canViewAdmin && canCreateAdmin && (
                            <Button
                                label="Emitir boleto"
                                icon="pi pi-plus"
                                outlined={canViewMine && canPurchaseMine && !profileMissing}
                                onClick={() => openPurchaseDialog('admin')}
                            />
                        )}
                    </div>
                }
            />

            {canLoadAvailability && (
                <TicketAvailabilityPanel
                    matches={matches}
                    selectedMatchId={availabilityMatchId}
                    availability={availability}
                    loading={loadingAvailability}
                    error={availabilityError}
                    canLoadMatches={canLoadMatches}
                    canBuy={canQuickBuy}
                    buyLabel={quickBuyMode === 'mine' ? 'Comprar aquí' : 'Emitir aquí'}
                    onSelectMatch={setAvailabilityMatchId}
                    onRefresh={reload}
                    onSelectLocation={(matchId, locationId) => openPurchaseDialog(quickBuyMode, matchId, locationId)}
                />
            )}

            {canViewMine && (
                <div className="card mb-4">
                    <div className="flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                        <h5 className="m-0">Mis boletos {!loadingMine && !profileMissing && <span className="text-600 font-normal">({myTickets.length})</span>}</h5>
                        <Button icon="pi pi-refresh" outlined tooltip="Actualizar" aria-label="Actualizar mis boletos" onClick={reload} />
                    </div>

                    {mineError && <Message severity="error" text={mineError} className="w-full mb-3" />}

                    {profileMissing ? (
                        <EmptyState
                            icon="pi-id-card"
                            title="Primero completa tu perfil de aficionado."
                            description="Necesitas registrar tu ficha personal de aficionado antes de comprar y consultar tus boletos."
                            action={
                                canViewMyFan ? (
                                    <Button label="Ir a Mi perfil de aficionado" icon="pi pi-user-plus" onClick={() => router.push('/mi-aficionado')} />
                                ) : undefined
                            }
                        />
                    ) : (
                        <>
                            <div className="grid mb-2">
                                <div className="col-12 md:col-6">
                                    <Dropdown
                                        value={myTournamentId}
                                        options={tournamentOptions}
                                        onChange={(event) => setMyTournamentId((event.value as number | null) ?? null)}
                                        placeholder={canLoadTournaments ? 'Todos los torneos' : 'Sin permiso para listar torneos'}
                                        disabled={!canLoadTournaments}
                                        showClear
                                        className="w-full"
                                    />
                                </div>
                                <div className="col-12 md:col-6">
                                    <Dropdown
                                        value={myMatchId}
                                        options={matchOptions}
                                        onChange={(event) => setMyMatchId((event.value as number | null) ?? null)}
                                        placeholder={canLoadMatches ? 'Todos los partidos' : 'Sin permiso para listar partidos'}
                                        disabled={!canLoadMatches}
                                        filter={matchOptions.length > 6}
                                        showClear
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <DataTable
                                value={loadingMine ? SKELETON_ROWS : myTickets}
                                dataKey="id"
                                paginator={!loadingMine && myTickets.length > 10}
                                rows={10}
                                emptyMessage={
                                    <EmptyState
                                        icon="pi-ticket"
                                        title={myTournamentId || myMatchId ? 'Ningún boleto coincide con los filtros.' : 'Aún no tienes boletos comprados.'}
                                    />
                                }
                            >
                                <Column header="Código" body={mineCell((ticket) => <Tag value={ticket.code} severity="info" />, '9rem')} />
                                <Column header="Partido / Escenario" body={mineCell(renderMatchCell, '14rem')} />
                                <Column header="Localidad" body={mineCell((ticket) => ticket.location.name, '7rem')} />
                                <Column header="Precio" body={mineCell((ticket) => formatCurrencyCop(ticket.price), '5rem')} />
                                <Column header="Comprado el" body={mineCell((ticket) => formatDateTime(ticket.purchasedAt), '8rem')} />
                                <Column header="Estado partido" body={mineCell(renderStatusCell, '6rem')} />
                                {canDeleteMine && (
                                    <Column
                                        header="Acciones"
                                        headerClassName="w-7rem"
                                        body={(ticket: Ticket) =>
                                            loadingMine ? (
                                                <Skeleton width="4rem" height="2rem" />
                                            ) : (
                                                <Button
                                                    icon="pi pi-trash"
                                                    rounded
                                                    text
                                                    severity="danger"
                                                    tooltip={
                                                        canCancelTicket(ticket.match.status)
                                                            ? 'Anular boleto'
                                                            : 'Solo se anulan boletos de partidos programados'
                                                    }
                                                    tooltipOptions={{ position: 'top' }}
                                                    aria-label={`Anular boleto ${ticket.code}`}
                                                    disabled={!canCancelTicket(ticket.match.status)}
                                                    onClick={() => confirmRemove(ticket, 'mine')}
                                                />
                                            )
                                        }
                                    />
                                )}
                            </DataTable>
                        </>
                    )}
                </div>
            )}

            {canViewAdmin && (
                <div className="card">
                    <h5>Gestión administrativa de boletos {!loadingAdmin && <span className="text-600 font-normal">({adminTickets.length})</span>}</h5>

                    {adminError && (
                        <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-3">
                            <Message severity="error" text={adminError} className="w-full" />
                            <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
                        </div>
                    )}

                    <div className="grid mb-2">
                        <div className="col-12 md:col-6 lg:col-3">
                            <SearchInput
                                value={adminCodeText}
                                onChange={setAdminCodeText}
                                ariaLabel="Buscar boleto por código"
                                placeholder="Código (ej. TKT-...)"
                                className="w-full"
                            />
                        </div>
                        <div className="col-12 md:col-6 lg:col-3">
                            <Dropdown
                                value={adminTournamentId}
                                options={tournamentOptions}
                                onChange={(event) => setAdminTournamentId((event.value as number | null) ?? null)}
                                placeholder={canLoadTournaments ? 'Todos los torneos' : 'Sin permiso para torneos'}
                                disabled={!canLoadTournaments}
                                showClear
                                className="w-full"
                            />
                        </div>
                        <div className="col-12 md:col-6 lg:col-3">
                            <Dropdown
                                value={adminMatchId}
                                options={matchOptions}
                                onChange={(event) => setAdminMatchId((event.value as number | null) ?? null)}
                                placeholder={canLoadMatches ? 'Todos los partidos' : 'Sin permiso para partidos'}
                                disabled={!canLoadMatches}
                                filter={matchOptions.length > 6}
                                showClear
                                className="w-full"
                            />
                        </div>
                        <div className="col-12 md:col-6 lg:col-3">
                            <Dropdown
                                value={adminFanId}
                                options={fanOptions}
                                onChange={(event) => setAdminFanId((event.value as number | null) ?? null)}
                                placeholder={canLoadFans ? 'Todos los aficionados' : 'Sin permiso para aficionados'}
                                disabled={!canLoadFans}
                                filter={fanOptions.length > 6}
                                showClear
                                className="w-full"
                            />
                        </div>
                    </div>

                    <DataTable
                        value={loadingAdmin ? SKELETON_ROWS : adminTickets}
                        dataKey="id"
                        paginator={!loadingAdmin && adminTickets.length > 10}
                        rows={10}
                        emptyMessage={<EmptyState icon="pi-ticket" title="No hay boletos registrados con los filtros actuales." />}
                    >
                        <Column header="Código" body={adminCell((ticket) => <Tag value={ticket.code} severity="info" />, '9rem')} />
                        <Column
                            header="Aficionado"
                            body={adminCell(
                                (ticket) => (
                                    <div className="flex flex-column">
                                        <span className="font-medium text-900">{ticket.fan.fullName}</span>
                                        <span className="text-600 text-sm">{ticket.fan.documentNumber}</span>
                                    </div>
                                ),
                                '10rem'
                            )}
                        />
                        <Column header="Partido / Escenario" body={adminCell(renderMatchCell, '14rem')} />
                        <Column header="Localidad" body={adminCell((ticket) => ticket.location.name, '7rem')} />
                        <Column header="Precio" body={adminCell((ticket) => formatCurrencyCop(ticket.price), '5rem')} />
                        <Column header="Emitido el" body={adminCell((ticket) => formatDateTime(ticket.purchasedAt), '8rem')} />
                        <Column header="Estado partido" body={adminCell(renderStatusCell, '6rem')} />
                        {canDeleteAdmin && (
                            <Column
                                header="Acciones"
                                headerClassName="w-6rem"
                                body={(ticket: Ticket) =>
                                    loadingAdmin ? (
                                        <Skeleton width="3rem" height="2rem" />
                                    ) : (
                                        <Button
                                            icon="pi pi-trash"
                                            rounded
                                            text
                                            severity="danger"
                                            tooltip={
                                                canCancelTicket(ticket.match.status)
                                                    ? 'Eliminar boleto'
                                                    : 'Solo se eliminan boletos de partidos programados'
                                            }
                                            tooltipOptions={{ position: 'top' }}
                                            aria-label={`Eliminar boleto ${ticket.code}`}
                                            disabled={!canCancelTicket(ticket.match.status)}
                                            onClick={() => confirmRemove(ticket, 'admin')}
                                        />
                                    )
                                }
                            />
                        )}
                    </DataTable>
                </div>
            )}

            <TicketPurchaseDialog
                visible={dialog.visible}
                mode={dialog.mode}
                initialMatchId={dialog.matchId}
                initialLocationId={dialog.locationId}
                matches={matches}
                fans={fans}
                canLoadAvailability={canLoadAvailability}
                onHide={() => setDialog((current) => ({ ...current, visible: false }))}
                onSubmit={handleDialogSubmit}
            />
        </>
    );
}

