'use client';

import { useMemo } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { ProgressBar } from 'primereact/progressbar';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import EmptyState from '@/components/ui/EmptyState';
import StatCard from '@/components/ui/StatCard';
import { MATCH_STATUS_LABELS, MATCH_STATUS_SEVERITY } from '@/lib/match-labels';
import { availabilityTag, canPurchaseTicketForMatch, occupancyPercentage } from '@/lib/ticket-form';
import { formatDateTime } from '@/lib/tournament-labels';
import { LocationAvailability, Match, MatchTicketAvailability } from '@/types/sports';

interface TicketAvailabilityPanelProps {
    matches: Match[];
    selectedMatchId: number | null;
    availability: MatchTicketAvailability | null;
    loading: boolean;
    error: string | null;
    canLoadMatches: boolean;
    canBuy: boolean;
    buyLabel: string;
    onSelectMatch: (matchId: number | null) => void;
    onRefresh: () => void;
    onSelectLocation: (matchId: number, locationId: number) => void;
}

export default function TicketAvailabilityPanel({
    matches,
    selectedMatchId,
    availability,
    loading,
    error,
    canLoadMatches,
    canBuy,
    buyLabel,
    onSelectMatch,
    onRefresh,
    onSelectLocation
}: TicketAvailabilityPanelProps) {
    const matchOptions = useMemo(
        () =>
            matches.map((match) => ({
                label: `${match.homeTeam.name} vs ${match.awayTeam.name} · ${formatDateTime(match.scheduledAt)} (${MATCH_STATUS_LABELS[match.status]})`,
                value: match.id
            })),
        [matches]
    );

    const canBuyThisMatch = availability !== null && canPurchaseTicketForMatch(availability.matchStatus);

    const occupancyBody = (location: LocationAvailability) => {
        const pct = occupancyPercentage(location.sold, location.capacity);
        return (
            <div className="flex flex-column gap-1" style={{ minWidth: '8rem' }}>
                <div className="flex justify-content-between text-sm text-700">
                    <span>
                        {location.sold} / {location.capacity}
                    </span>
                    <span>{pct}%</span>
                </div>
                <ProgressBar value={pct} showValue={false} style={{ height: '0.5rem' }} />
            </div>
        );
    };

    const statusBody = (location: LocationAvailability) => {
        const tag = availabilityTag(location);
        return <Tag value={tag.label} severity={tag.severity} />;
    };

    const actionBody = (location: LocationAvailability) => {
        if (!canBuy || !canBuyThisMatch) return null;
        const disabled = !location.active || location.soldOut || location.available <= 0;
        return (
            <Button
                label={buyLabel}
                icon="pi pi-ticket"
                size="small"
                outlined
                disabled={disabled}
                onClick={() => availability && onSelectLocation(availability.matchId, location.locationId)}
            />
        );
    };

    return (
        <div className="card mb-4">
            <div className="flex flex-column md:flex-row md:align-items-center justify-content-between gap-3 mb-3">
                <div>
                    <h5 className="m-0">Disponibilidad en vivo por localidad</h5>
                    <p className="text-600 text-sm mt-1 mb-0">
                        Consulta el aforo total, cupos vendidos y disponibles antes de emitir o comprar un boleto.
                    </p>
                </div>
                <div className="flex align-items-center gap-2">
                    <Dropdown
                        value={selectedMatchId}
                        options={matchOptions}
                        onChange={(event) => onSelectMatch((event.value as number | null) ?? null)}
                        placeholder={canLoadMatches ? 'Selecciona un partido' : 'Sin permiso para listar partidos'}
                        emptyMessage="No hay partidos registrados"
                        aria-label="Seleccionar partido para ver disponibilidad"
                        disabled={!canLoadMatches}
                        filter={matchOptions.length > 6}
                        showClear
                        className="w-full md:w-25rem"
                    />
                    <Button
                        icon="pi pi-refresh"
                        outlined
                        tooltip="Actualizar disponibilidad"
                        aria-label="Actualizar disponibilidad"
                        onClick={onRefresh}
                        disabled={selectedMatchId === null || loading}
                    />
                </div>
            </div>

            {error && <Message severity="error" text={error} className="w-full mb-3" />}

            {selectedMatchId === null && !loading && (
                <EmptyState
                    icon="pi-ticket"
                    title="Selecciona un partido para ver el aforo por localidad."
                    description={
                        canLoadMatches
                            ? 'Elige un partido programado para revisar cupos en tiempo real.'
                            : 'Requiere permiso de lectura de partidos (GET /gestion-deportiva/matches).'
                    }
                />
            )}

            {loading && <Skeleton height="12rem" className="w-full" />}

            {!loading && availability && (
                <>
                    <div className="flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-building text-primary" aria-hidden="true" />
                            <span className="font-medium text-900">{availability.venueName}</span>
                            <span className="text-600 text-sm">· {formatDateTime(availability.scheduledAt)}</span>
                        </div>
                        <Tag
                            value={MATCH_STATUS_LABELS[availability.matchStatus]}
                            severity={MATCH_STATUS_SEVERITY[availability.matchStatus]}
                        />
                    </div>

                    <div className="grid mb-3">
                        <div className="col-12 md:col-4">
                            <StatCard label="Capacidad total activa" value={availability.totalCapacity.toLocaleString('es-CO')} icon="pi-building" />
                        </div>
                        <div className="col-12 md:col-4">
                            <StatCard label="Boletos vendidos" value={availability.totalSold.toLocaleString('es-CO')} icon="pi-ticket" />
                        </div>
                        <div className="col-12 md:col-4">
                            <StatCard label="Cupos disponibles" value={availability.totalAvailable.toLocaleString('es-CO')} icon="pi-check-circle" />
                        </div>
                    </div>

                    {!canBuyThisMatch && (
                        <Message
                            severity="info"
                            text="Este partido ya no está en estado Programado, por lo que la venta de boletos se encuentra cerrada."
                            className="w-full mb-3"
                        />
                    )}

                    <DataTable
                        value={availability.locations}
                        dataKey="locationId"
                        emptyMessage={<EmptyState icon="pi-building" title="Este escenario no tiene localidades activas configuradas." />}
                    >
                        <Column header="Localidad" body={(loc: LocationAvailability) => <span className="font-medium text-900">{loc.locationName}</span>} />
                        <Column header="Capacidad" body={(loc: LocationAvailability) => loc.capacity.toLocaleString('es-CO')} />
                        <Column header="Vendidos" body={(loc: LocationAvailability) => loc.sold.toLocaleString('es-CO')} />
                        <Column
                            header="Disponibles"
                            body={(loc: LocationAvailability) => (
                                <span className={loc.available === 0 ? 'text-red-600 font-semibold' : 'text-900 font-semibold'}>
                                    {loc.available.toLocaleString('es-CO')}
                                </span>
                            )}
                        />
                        <Column header="Ocupación" body={occupancyBody} />
                        <Column header="Estado" body={statusBody} />
                        {canBuy && canBuyThisMatch && <Column header="Acción" body={actionBody} headerClassName="w-10rem" />}
                    </DataTable>
                </>
            )}
        </div>
    );
}

