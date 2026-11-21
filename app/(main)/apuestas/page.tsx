'use client';

import { ReactNode, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { useAuth } from '@/layout/context/authcontext';
import ProtectedRoute from '@/layout/ProtectedRoute';
import {
    BET_AVAILABLE_MATCHES_ENDPOINT,
    BET_CREATE_ENDPOINT,
    BET_VOID_ENDPOINT,
    BETS_VIEW_ENDPOINTS,
    MY_BET_CANCEL_ENDPOINT,
    MY_BET_PLACE_ENDPOINT,
    MY_BET_UPDATE_ENDPOINT,
    MY_BETS_VIEW_ENDPOINTS
} from '@/lib/bet-constants';
import {
    BET_SELECTION_LABELS,
    BET_STATUS_LABELS,
    BET_STATUS_OPTIONS,
    BET_STATUS_SEVERITY,
    BetFormValues,
    canModifyOrCancelMyBet,
    canVoidBetByAdmin,
    shouldUseMyBetsSummary,
    toCancelBetPayload,
    toCreateBetPayload,
    toPlaceBetPayload,
    toUpdateMyBetPayload
} from '@/lib/bet-form';
import { FANS_VIEW_ENDPOINTS, MY_FAN_VIEW_ENDPOINTS } from '@/lib/fan-constants';
import { FormActionResult } from '@/lib/form-action';
import { MATCHES_VIEW_ENDPOINTS } from '@/lib/match-constants';
import { formatScore } from '@/lib/match-labels';
import { MY_PAYMENT_METHODS_VIEW_ENDPOINTS } from '@/lib/payment-method-constants';
import { formatCurrencyCop } from '@/lib/ticket-form';
import { TOURNAMENTS_VIEW_ENDPOINTS } from '@/lib/tournament-constants';
import { formatDateTime } from '@/lib/tournament-labels';
import { ActionResult } from '@/types/action';
import { EndpointRequirement } from '@/types/security';
import { Bet, BetStatus, Match } from '@/types/sports';
import BetCancelDialog from './components/BetCancelDialog';
import BetFormDialog from './components/BetFormDialog';
import { useBets } from './hooks/useBets';

const SKELETON_ROWS = Array.from({ length: 4 }, (_, index) => ({ id: -(index + 1) } as Bet));

type FormDialogState = {
    visible: boolean;
    mode: 'mine' | 'admin';
    bet: Bet | null;
    initialMatchId: number | null;
};

type CancelDialogState = {
    visible: boolean;
    mode: 'cancel-mine' | 'void-admin';
    bet: Bet | null;
};

export default function BetsPage() {
    const { hasPermissionUrl } = useAuth();
    const canViewMine = MY_BETS_VIEW_ENDPOINTS.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    const requiredEndpoints = canViewMine ? MY_BETS_VIEW_ENDPOINTS : BETS_VIEW_ENDPOINTS;

    return (
        <ProtectedRoute requiredEndpoints={requiredEndpoints}>
            <BetsContent />
        </ProtectedRoute>
    );
}

function BetsContent() {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl } = useAuth();

    const can = (...endpoints: EndpointRequirement[]) => endpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));

    const canViewAdmin = can(...BETS_VIEW_ENDPOINTS);
    const canCreateAdmin = can(BET_CREATE_ENDPOINT);
    const canVoidAdmin = can(BET_VOID_ENDPOINT);

    const canViewMine = can(...MY_BETS_VIEW_ENDPOINTS);
    const canPlaceMine = can(MY_BET_PLACE_ENDPOINT);
    const canUpdateMine = can(MY_BET_UPDATE_ENDPOINT);
    const canCancelMine = can(MY_BET_CANCEL_ENDPOINT);

    const canLoadAvailableMatches = can(BET_AVAILABLE_MATCHES_ENDPOINT);
    const canLoadMyPaymentMethods = can(...MY_PAYMENT_METHODS_VIEW_ENDPOINTS);
    const canLoadMatches = can(...MATCHES_VIEW_ENDPOINTS);
    const canLoadTournaments = can(...TOURNAMENTS_VIEW_ENDPOINTS);
    const canLoadFans = can(...FANS_VIEW_ENDPOINTS);
    const canViewMyFan = can(...MY_FAN_VIEW_ENDPOINTS);

    const [myStatus, setMyStatus] = useState<BetStatus | null>(null);
    const [myTournamentId, setMyTournamentId] = useState<number | null>(null);

    const [adminStatus, setAdminStatus] = useState<BetStatus | null>(null);
    const [adminTournamentId, setAdminTournamentId] = useState<number | null>(null);
    const [adminMatchId, setAdminMatchId] = useState<number | null>(null);
    const [adminFanId, setAdminFanId] = useState<number | null>(null);

    const [formDialog, setFormDialog] = useState<FormDialogState>({
        visible: false,
        mode: 'mine',
        bet: null,
        initialMatchId: null
    });

    const [cancelDialog, setCancelDialog] = useState<CancelDialogState>({
        visible: false,
        mode: 'cancel-mine',
        bet: null
    });

    const {
        myBets,
        loadingMine,
        mineError,
        profileMissing,
        adminBets,
        loadingAdmin,
        adminError,
        availableMatches,
        loadingAvailableMatches,
        myPaymentMethods,
        matches,
        tournaments,
        fans,
        reload,
        placeMine,
        updateMine,
        cancelMine,
        createAdmin,
        voidByAdmin
    } = useBets({
        canViewAdmin,
        canViewMine,
        canLoadAvailableMatches,
        canLoadMyPaymentMethods: canLoadMyPaymentMethods && (canPlaceMine || canUpdateMine),
        canLoadMatches: canLoadMatches && canViewAdmin,
        canLoadTournaments,
        canLoadFans: canLoadFans && (canViewAdmin || canCreateAdmin),
        myFilters: { status: myStatus, tournamentId: myTournamentId },
        adminFilters: {
            status: adminStatus,
            tournamentId: adminTournamentId,
            matchId: adminMatchId,
            fanId: adminFanId
        }
    });

    const notify = (result: ActionResult, successText: string, errorSummary = 'No se pudo completar') =>
        toast.current?.show(result.ok ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 } : { severity: 'error', summary: errorSummary, detail: result.error, life: 6000 });

    const useMySummary = shouldUseMyBetsSummary(canViewMine, canViewAdmin, profileMissing);
    const summarySource = useMySummary ? myBets : adminBets;
    const summaryLoading = useMySummary ? loadingMine : loadingAdmin;

    const summary = useMemo(() => {
        const total = summarySource.length;
        const pending = summarySource.filter((bet) => bet.status === 'PENDING').length;
        const won = summarySource.filter((bet) => bet.status === 'WON').length;
        const settledPayout = summarySource.reduce((acc, bet) => acc + (bet.payout ?? 0), 0);
        return { total, pending, won, settledPayout };
    }, [summarySource]);

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

    const handleFormSubmit = async (values: BetFormValues): Promise<FormActionResult> => {
        if (formDialog.bet) {
            const result = await updateMine(formDialog.bet.id, toUpdateMyBetPayload(values, formDialog.bet));
            if (result.ok) notify(result, 'Tu apuesta pendiente fue actualizada.');
            return result;
        }

        const result =
            formDialog.mode === 'admin'
                ? await createAdmin(toCreateBetPayload(values))
                : await placeMine(toPlaceBetPayload(values));

        if (result.ok) {
            notify(result, formDialog.mode === 'admin' ? 'Apuesta registrada correctamente.' : '¡Apuesta registrada con cuota fija!');
        }
        return result;
    };

    const handleCancelSubmit = async (betId: number, reason: string): Promise<FormActionResult> => {
        const payload = toCancelBetPayload(reason);
        const result =
            cancelDialog.mode === 'void-admin' ? await voidByAdmin(betId, payload) : await cancelMine(betId, payload);
        if (result.ok) {
            notify(
                result,
                cancelDialog.mode === 'void-admin'
                    ? 'Apuesta anulada y valor devuelto al aficionado.'
                    : 'Tu apuesta fue cancelada y el valor fue devuelto.'
            );
        }
        return result;
    };

    const mineCell = (render: (bet: Bet) => ReactNode, width = '6rem') =>
        function MineCell(bet: Bet) {
            return loadingMine ? <Skeleton width={width} /> : render(bet);
        };

    const adminCell = (render: (bet: Bet) => ReactNode, width = '6rem') =>
        function AdminCell(bet: Bet) {
            return loadingAdmin ? <Skeleton width={width} /> : render(bet);
        };

    const renderMatchCell = (bet: Bet) => (
        <div className="flex flex-column">
            <span className="font-medium text-900">
                {bet.match.homeTeamName} <span className="text-600 mx-1">{formatScore(bet.match.homeScore, bet.match.awayScore)}</span>{' '}
                {bet.match.awayTeamName}
            </span>
            <span className="text-600 text-sm">
                {bet.match.tournamentName} · {formatDateTime(bet.match.scheduledAt)}
            </span>
        </div>
    );

    const renderStatusCell = (bet: Bet) => <Tag value={BET_STATUS_LABELS[bet.status]} severity={BET_STATUS_SEVERITY[bet.status]} />;

    const renderSettlementCell = (bet: Bet) => {
        if (bet.payout === null) {
            return <span className="text-500">Pendiente de liquidación</span>;
        }
        return (
            <div className="flex flex-column">
                <span className={bet.status === 'WON' ? 'font-bold text-green-600' : 'font-medium text-900'}>
                    {formatCurrencyCop(bet.payout)}
                </span>
                {bet.settledAt && <span className="text-600 text-xs">{formatDateTime(bet.settledAt)}</span>}
                {bet.settlementNote && <span className="text-600 text-xs">{bet.settlementNote}</span>}
            </div>
        );
    };

    const renderPaymentCell = (bet: Bet) => (
        <div className="flex flex-column">
            <span className="text-900">{bet.paymentMethod.alias}</span>
            <span className="text-600 text-xs">
                {bet.paymentMethod.paymentMethodName} · {bet.paymentMethod.reference}
            </span>
        </div>
    );

    const quickMode: 'mine' | 'admin' = canViewMine && canPlaceMine && !profileMissing ? 'mine' : 'admin';
    const canQuickBet = (canViewMine && canPlaceMine && !profileMissing) || canCreateAdmin;
    const hasMineActions = canUpdateMine || canCancelMine;

    return (
        <>
            <Toast ref={toast} />
            <PageHeader
                title="Apuestas y liquidación"
                subtitle="Registra apuestas con cuota fija inmutable antes del inicio de cada partido y consulta su liquidación automática."
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Apuestas' }]}
                actions={
                    <div className="flex flex-wrap gap-2">
                        {canViewMine && canPlaceMine && !profileMissing && (
                            <Button
                                label="Nueva apuesta"
                                icon="pi pi-dollar"
                                onClick={() => setFormDialog({ visible: true, mode: 'mine', bet: null, initialMatchId: null })}
                            />
                        )}
                        {canViewAdmin && canCreateAdmin && (
                            <Button
                                label="Registrar apuesta"
                                icon="pi pi-plus"
                                outlined={canViewMine && canPlaceMine && !profileMissing}
                                onClick={() => setFormDialog({ visible: true, mode: 'admin', bet: null, initialMatchId: null })}
                            />
                        )}
                    </div>
                }
            />

            <div className="grid mb-3">
                <div className="col-12 sm:col-6 lg:col-3">
                    <StatCard label="Total apuestas" value={summary.total} icon="pi-dollar" loading={summaryLoading} />
                </div>
                <div className="col-12 sm:col-6 lg:col-3">
                    <StatCard label="Pendientes" value={summary.pending} icon="pi-clock" loading={summaryLoading} />
                </div>
                <div className="col-12 sm:col-6 lg:col-3">
                    <StatCard label="Ganadas" value={summary.won} icon="pi-check-circle" loading={summaryLoading} />
                </div>
                <div className="col-12 sm:col-6 lg:col-3">
                    <StatCard
                        label="Total liquidado"
                        value={formatCurrencyCop(summary.settledPayout)}
                        icon="pi-wallet"
                        loading={summaryLoading}
                    />
                </div>
            </div>

            {canLoadAvailableMatches && (
                <div className="card mb-4">
                    <div className="flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                        <div>
                            <h5 className="m-0">
                                Partidos con apuestas abiertas{' '}
                                {!loadingAvailableMatches && <span className="text-600 font-normal">({availableMatches.length})</span>}
                            </h5>
                            <p className="text-600 text-sm mt-1 mb-0">
                                Solo se permite apostar antes de que el partido inicie y con 1 apuesta por aficionado y partido.
                            </p>
                        </div>
                        <Button icon="pi pi-refresh" outlined tooltip="Actualizar" aria-label="Actualizar partidos disponibles" onClick={reload} />
                    </div>

                    <DataTable
                        value={availableMatches}
                        dataKey="id"
                        loading={loadingAvailableMatches}
                        paginator={!loadingAvailableMatches && availableMatches.length > 5}
                        rows={5}
                        emptyMessage={
                            <EmptyState
                                icon="pi-calendar"
                                title="No hay partidos disponibles para apostar en este momento."
                                description="Los partidos deben estar en estado Programado, con torneo abierto y apuestas habilitadas."
                            />
                        }
                    >
                        <Column header="Fecha" body={(match: Match) => formatDateTime(match.scheduledAt)} />
                        <Column
                            header="Torneo / Fase"
                            body={(match: Match) => (
                                <div className="flex flex-column">
                                    <span className="text-900">{match.phase.tournament.name}</span>
                                    <span className="text-600 text-sm">{match.phase.label}</span>
                                </div>
                            )}
                        />
                        <Column
                            header="Partido"
                            body={(match: Match) => (
                                <span className="font-medium text-900">
                                    {match.homeTeam.name} vs {match.awayTeam.name}
                                </span>
                            )}
                        />
                        <Column header="Escenario" body={(match: Match) => match.venue.name} />
                        {canQuickBet && (
                            <Column
                                header="Acción"
                                headerClassName="w-9rem"
                                body={(match: Match) => (
                                    <Button
                                        label="Apostar"
                                        icon="pi pi-dollar"
                                        size="small"
                                        outlined
                                        onClick={() =>
                                            setFormDialog({ visible: true, mode: quickMode, bet: null, initialMatchId: match.id })
                                        }
                                    />
                                )}
                            />
                        )}
                    </DataTable>
                </div>
            )}

            {canViewMine && (
                <div className="card mb-4">
                    <div className="flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                        <h5 className="m-0">
                            Mis apuestas y liquidación {!loadingMine && !profileMissing && <span className="text-600 font-normal">({myBets.length})</span>}
                        </h5>
                        <Button icon="pi pi-refresh" outlined tooltip="Actualizar" aria-label="Actualizar mis apuestas" onClick={reload} />
                    </div>

                    {mineError && <Message severity="error" text={mineError} className="w-full mb-3" />}

                    {!loadingMine && !profileMissing && canPlaceMine && canLoadMyPaymentMethods && myPaymentMethods.length === 0 && (
                        <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-3">
                            <Message
                                severity="warn"
                                text="No tienes métodos de pago activos registrados en tu billetera. Registra uno para poder apostar."
                                className="w-full"
                            />
                            <Button
                                label="Ir a Métodos de pago"
                                icon="pi pi-credit-card"
                                outlined
                                onClick={() => router.push('/metodos-pago')}
                            />
                        </div>
                    )}

                    {profileMissing ? (
                        <EmptyState
                            icon="pi-id-card"
                            title="Primero completa tu perfil de aficionado."
                            description="Debes autorregistrar tu ficha personal de aficionado antes de realizar y consultar tus apuestas."
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
                                        value={myStatus}
                                        options={BET_STATUS_OPTIONS}
                                        onChange={(event) => setMyStatus((event.value as BetStatus | null) ?? null)}
                                        placeholder="Todos los estados"
                                        showClear
                                        className="w-full"
                                    />
                                </div>
                                <div className="col-12 md:col-6">
                                    <Dropdown
                                        value={myTournamentId}
                                        options={tournamentOptions}
                                        onChange={(event) => setMyTournamentId((event.value as number | null) ?? null)}
                                        placeholder={canLoadTournaments ? 'Todos los torneos' : 'Sin permiso para torneos'}
                                        disabled={!canLoadTournaments}
                                        showClear
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <DataTable
                                value={loadingMine ? SKELETON_ROWS : myBets}
                                dataKey="id"
                                paginator={!loadingMine && myBets.length > 10}
                                rows={10}
                                emptyMessage={
                                    <EmptyState
                                        icon="pi-dollar"
                                        title={myStatus || myTournamentId ? 'Ninguna apuesta coincide con los filtros.' : 'Aún no tienes apuestas registradas.'}
                                    />
                                }
                            >
                                <Column header="Partido" body={mineCell(renderMatchCell, '13rem')} />
                                <Column header="Pronóstico" body={mineCell((bet) => BET_SELECTION_LABELS[bet.selection], '8rem')} />
                                <Column header="Monto" body={mineCell((bet) => formatCurrencyCop(bet.amount), '6rem')} />
                                <Column header="Cuota fija" body={mineCell((bet) => <Tag value={`${bet.odds.toFixed(2)}x`} severity="info" />, '4rem')} />
                                <Column header="Potencial" body={mineCell((bet) => formatCurrencyCop(bet.potentialPayout), '6rem')} />
                                <Column header="Estado" body={mineCell(renderStatusCell, '5rem')} />
                                <Column header="Liquidación" body={mineCell(renderSettlementCell, '10rem')} />
                                <Column header="Método de pago" body={mineCell(renderPaymentCell, '9rem')} />
                                {hasMineActions && (
                                    <Column
                                        header="Acciones"
                                        headerClassName="w-8rem"
                                        body={(bet: Bet) => {
                                            if (loadingMine) return <Skeleton width="5rem" height="2rem" />;
                                            const editable = canModifyOrCancelMyBet(bet);
                                            return (
                                                <div className="flex gap-1">
                                                    {canUpdateMine && (
                                                        <Button
                                                            icon="pi pi-pencil"
                                                            rounded
                                                            text
                                                            tooltip={editable ? 'Editar apuesta' : 'Solo editable antes de iniciar el partido'}
                                                            tooltipOptions={{ position: 'top' }}
                                                            aria-label={`Editar apuesta #${bet.id}`}
                                                            disabled={!editable}
                                                            onClick={() =>
                                                                setFormDialog({ visible: true, mode: 'mine', bet, initialMatchId: null })
                                                            }
                                                        />
                                                    )}
                                                    {canCancelMine && (
                                                        <Button
                                                            icon="pi pi-ban"
                                                            rounded
                                                            text
                                                            severity="danger"
                                                            tooltip={editable ? 'Cancelar apuesta' : 'Solo cancelable antes de iniciar el partido'}
                                                            tooltipOptions={{ position: 'top' }}
                                                            aria-label={`Cancelar apuesta #${bet.id}`}
                                                            disabled={!editable}
                                                            onClick={() =>
                                                                setCancelDialog({ visible: true, mode: 'cancel-mine', bet })
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            );
                                        }}
                                    />
                                )}
                            </DataTable>
                        </>
                    )}
                </div>
            )}

            {canViewAdmin && (
                <div className="card">
                    <h5>Gestión administrativa de apuestas {!loadingAdmin && <span className="text-600 font-normal">({adminBets.length})</span>}</h5>

                    {adminError && (
                        <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-3">
                            <Message severity="error" text={adminError} className="w-full" />
                            <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
                        </div>
                    )}

                    <div className="grid mb-2">
                        <div className="col-12 md:col-6 lg:col-3">
                            <Dropdown
                                value={adminStatus}
                                options={BET_STATUS_OPTIONS}
                                onChange={(event) => setAdminStatus((event.value as BetStatus | null) ?? null)}
                                placeholder="Todos los estados"
                                showClear
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
                        value={loadingAdmin ? SKELETON_ROWS : adminBets}
                        dataKey="id"
                        paginator={!loadingAdmin && adminBets.length > 10}
                        rows={10}
                        emptyMessage={<EmptyState icon="pi-dollar" title="No hay apuestas registradas con los filtros actuales." />}
                    >
                        <Column
                            header="Aficionado"
                            body={adminCell(
                                (bet) => (
                                    <div className="flex flex-column">
                                        <span className="font-medium text-900">{bet.fan.fullName}</span>
                                        <span className="text-600 text-sm">{bet.fan.documentNumber}</span>
                                    </div>
                                ),
                                '10rem'
                            )}
                        />
                        <Column header="Partido" body={adminCell(renderMatchCell, '13rem')} />
                        <Column header="Pronóstico" body={adminCell((bet) => BET_SELECTION_LABELS[bet.selection], '8rem')} />
                        <Column header="Monto" body={adminCell((bet) => formatCurrencyCop(bet.amount), '6rem')} />
                        <Column header="Cuota fija" body={adminCell((bet) => <Tag value={`${bet.odds.toFixed(2)}x`} severity="info" />, '4rem')} />
                        <Column header="Potencial" body={adminCell((bet) => formatCurrencyCop(bet.potentialPayout), '6rem')} />
                        <Column header="Estado" body={adminCell(renderStatusCell, '5rem')} />
                        <Column header="Liquidación" body={adminCell(renderSettlementCell, '10rem')} />
                        <Column header="Método de pago" body={adminCell(renderPaymentCell, '9rem')} />
                        {canVoidAdmin && (
                            <Column
                                header="Acciones"
                                headerClassName="w-6rem"
                                body={(bet: Bet) =>
                                    loadingAdmin ? (
                                        <Skeleton width="3rem" height="2rem" />
                                    ) : (
                                        <Button
                                            icon="pi pi-ban"
                                            rounded
                                            text
                                            severity="danger"
                                            tooltip={canVoidBetByAdmin(bet) ? 'Anular apuesta pendiente' : 'Ya fue liquidada o cancelada'}
                                            tooltipOptions={{ position: 'top' }}
                                            aria-label={`Anular apuesta #${bet.id}`}
                                            disabled={!canVoidBetByAdmin(bet)}
                                            onClick={() => setCancelDialog({ visible: true, mode: 'void-admin', bet })}
                                        />
                                    )
                                }
                            />
                        )}
                    </DataTable>
                </div>
            )}

            <BetFormDialog
                visible={formDialog.visible}
                mode={formDialog.mode}
                bet={formDialog.bet}
                initialMatchId={formDialog.initialMatchId}
                availableMatches={availableMatches}
                myPaymentMethods={myPaymentMethods}
                fans={fans}
                onHide={() => setFormDialog((current) => ({ ...current, visible: false }))}
                onSubmit={handleFormSubmit}
            />

            <BetCancelDialog
                visible={cancelDialog.visible}
                mode={cancelDialog.mode}
                bet={cancelDialog.bet}
                onHide={() => setCancelDialog((current) => ({ ...current, visible: false }))}
                onSubmit={handleCancelSubmit}
            />
        </>
    );
}

