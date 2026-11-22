'use client';

import { ReactNode, useMemo } from 'react';
import Link from 'next/link';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import EmptyState from '@/components/ui/EmptyState';
import { formatDateTime } from '@/lib/tournament-labels';
import { Registration, RegistrationStatus } from '@/types/sports';

interface TeamTournamentsPanelProps {
    registrations: Registration[];
    loading: boolean;
    error: string | null;
    canViewTournament: boolean;
}

const STATUS_LABELS: Record<RegistrationStatus, string> = {
    ACTIVE: 'Inscrito',
    WITHDRAWN: 'Retirado'
};

const STATUS_SEVERITY: Record<RegistrationStatus, 'success' | 'warning'> = {
    ACTIVE: 'success',
    WITHDRAWN: 'warning'
};

const SKELETON_ROWS = Array.from({ length: 3 }, (_, index) => ({ id: -(index + 1) } as Registration));

// Torneos del equipo: primero las inscripciones vigentes y luego el historial de retiros.
export default function TeamTournamentsPanel({ registrations, loading, error, canViewTournament }: TeamTournamentsPanelProps) {
    const sorted = useMemo(() => [...registrations].sort((a, b) => Number(b.status === 'ACTIVE') - Number(a.status === 'ACTIVE') || b.registeredAt.localeCompare(a.registeredAt)), [registrations]);

    if (error) return <Message severity="error" text={error} className="w-full" />;

    const cell = (render: (registration: Registration) => ReactNode, width = '8rem') =>
        function CellBody(registration: Registration) {
            return loading ? <Skeleton width={width} /> : render(registration);
        };

    const tournamentBody = cell(
        (registration) =>
            canViewTournament ? (
                <Link href={`/torneos/${registration.tournament.id}`} className="text-900 font-medium">
                    {registration.tournament.name}
                </Link>
            ) : (
                <span className="text-900 font-medium">{registration.tournament.name}</span>
            ),
        '12rem'
    );
    const statusBody = cell((registration) => <Tag value={STATUS_LABELS[registration.status]} severity={STATUS_SEVERITY[registration.status]} />, '5rem');
    const registeredBody = cell((registration) => formatDateTime(registration.registeredAt));
    const withdrawnBody = cell((registration) => (registration.withdrawnAt ? formatDateTime(registration.withdrawnAt) : <span className="text-500">—</span>));

    return (
        <DataTable value={loading ? SKELETON_ROWS : sorted} dataKey="id" paginator={!loading && sorted.length > 10} rows={10} emptyMessage={<EmptyState icon="pi-sitemap" title="El equipo no está inscrito en ningún torneo." />}>
            <Column header="Torneo" body={tournamentBody} />
            <Column header="Estado" body={statusBody} />
            <Column header="Inscrito el" body={registeredBody} />
            <Column header="Retirado el" body={withdrawnBody} />
        </DataTable>
    );
}
