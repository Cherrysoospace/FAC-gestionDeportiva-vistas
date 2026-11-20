'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import EmptyState from '@/components/ui/EmptyState';
import { TournamentVenue, Venue } from '@/types/sports';

interface TournamentVenuesPanelProps {
    tournamentVenues: TournamentVenue[];
    /** Escenarios activos (GET /venues?active=true) */
    venues: Venue[];
    loading: boolean;
    error: string | null;
    /** Finalizado o cancelado: ya no se cambian los escenarios (misma regla del backend) */
    locked: boolean;
    canEnable: boolean;
    canRemove: boolean;
    canViewVenue: boolean;
    onEnable: (venueId: number) => Promise<boolean>;
    onRemove: (tournamentVenue: TournamentVenue) => Promise<void>;
}

// Escenarios habilitados para el torneo (clase Escenario-Torneo del diagrama).
export default function TournamentVenuesPanel({ tournamentVenues, venues, loading, error, locked, canEnable, canRemove, canViewVenue, onEnable, onRemove }: TournamentVenuesPanelProps) {
    const [selected, setSelected] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);

    // Solo los escenarios activos que aún no están habilitados
    const options = useMemo(() => {
        const enabledIds = new Set(tournamentVenues.map((tournamentVenue) => tournamentVenue.venue.id));
        return venues.filter((venue) => !enabledIds.has(venue.id)).map((venue) => ({ label: venue.parent ? `${venue.name} (en ${venue.parent.name})` : venue.name, value: venue.id }));
    }, [venues, tournamentVenues]);

    const handleEnable = async () => {
        if (selected === null) return;
        setBusy(true);
        const ok = await onEnable(selected);
        setBusy(false);
        if (ok) setSelected(null);
    };

    const handleRemove = async (tournamentVenue: TournamentVenue) => {
        setBusy(true);
        await onRemove(tournamentVenue);
        setBusy(false);
    };

    if (error) return <Message severity="error" text={error} className="w-full" />;

    const nameBody = (tournamentVenue: TournamentVenue) =>
        canViewVenue ? (
            <Link href={`/escenarios/${tournamentVenue.venue.id}`} className="text-900 font-medium">
                {tournamentVenue.venue.name}
            </Link>
        ) : (
            <span className="text-900 font-medium">{tournamentVenue.venue.name}</span>
        );

    const actionsBody = (tournamentVenue: TournamentVenue) => {
        const hasMatches = tournamentVenue.scheduledMatchesCount > 0;
        return (
            <Button
                label="Retirar"
                icon="pi pi-times"
                size="small"
                text
                severity="danger"
                disabled={busy || hasMatches}
                tooltip={hasMatches ? 'Tiene partidos del torneo programados en este escenario' : undefined}
                tooltipOptions={{ position: 'top', showOnDisabled: true }}
                onClick={() => handleRemove(tournamentVenue)}
            />
        );
    };

    return (
        <div>
            {locked && <Message severity="info" text="El torneo está finalizado o cancelado: ya no se pueden cambiar sus escenarios." className="w-full mb-3" />}

            {canEnable && !locked && (
                <div className="flex flex-column md:flex-row gap-2 mb-3">
                    <Dropdown
                        value={selected}
                        options={options}
                        onChange={(event) => setSelected((event.value as number | null) ?? null)}
                        placeholder="Selecciona un escenario para habilitar"
                        emptyMessage="No hay más escenarios activos"
                        aria-label="Escenario a habilitar"
                        filter={options.length > 8}
                        showClear
                        className="w-full md:w-30rem"
                    />
                    <Button label="Habilitar" icon="pi pi-plus" onClick={handleEnable} disabled={selected === null || busy} loading={busy && selected !== null} />
                </div>
            )}

            <DataTable
                value={tournamentVenues}
                dataKey="id"
                loading={loading}
                emptyMessage={<EmptyState icon="pi-building" title="El torneo no tiene escenarios habilitados." description="Habilita los escenarios donde se podrán programar sus partidos." />}
            >
                <Column header="Escenario" body={nameBody} />
                <Column header="Pertenece a" body={(tournamentVenue: TournamentVenue) => tournamentVenue.venue.parent?.name ?? <span className="text-500">Escenario principal</span>} />
                <Column header="Dirección" body={(tournamentVenue: TournamentVenue) => tournamentVenue.venue.address ?? <span className="text-500">Sin dirección</span>} />
                <Column header="Partidos programados" body={(tournamentVenue: TournamentVenue) => tournamentVenue.scheduledMatchesCount} />
                {canRemove && !locked && <Column header="Acciones" body={actionsBody} headerClassName="w-8rem" />}
            </DataTable>
        </div>
    );
}
