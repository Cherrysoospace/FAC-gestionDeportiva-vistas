'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { describeError } from '@/lib/api-errors';
import { MATCH_STATUS_LABELS, MATCH_STATUS_SEVERITY, formatScore } from '@/lib/match-labels';
import { getMatch } from '@/lib/matches-api';
import { formatDateTime } from '@/lib/tournament-labels';
import { Match } from '@/types/sports';

interface MatchDetailDialogProps {
    matchId: number | null;
    onHide: () => void;
}

// HU-GC-06 #8: información detallada de un partido (GET /matches/:id).
export default function MatchDetailDialog({ matchId, onHide }: MatchDetailDialogProps) {
    const [match, setMatch] = useState<Match | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (matchId === null) return;
        const controller = new AbortController();
        setMatch(null);
        setError(null);
        getMatch(matchId, controller.signal)
            .then(setMatch)
            .catch((cause) => {
                if (!controller.signal.aborted) setError(describeError(cause));
            });
        return () => controller.abort();
    }, [matchId]);

    const row = (label: string, value: ReactNode) => (
        <div className="col-12 md:col-6">
            <div className="text-600 text-sm mb-1">{label}</div>
            <div className="text-900 font-medium">{match ? value : <Skeleton width="8rem" />}</div>
        </div>
    );

    return (
        <Dialog header="Detalle del partido" visible={matchId !== null} onHide={onHide} style={{ width: '40rem' }} breakpoints={{ '640px': '95vw' }} modal>
            {error ? (
                <Message severity="error" text={error} className="w-full" />
            ) : (
                <div className="grid">
                    {row(
                        'Partido',
                        match && (
                            <span>
                                {match.homeTeam.name} <span className="text-600 mx-2">{formatScore(match.homeScore, match.awayScore)}</span> {match.awayTeam.name}
                            </span>
                        )
                    )}
                    {row('Estado', match && <Tag value={MATCH_STATUS_LABELS[match.status]} severity={MATCH_STATUS_SEVERITY[match.status]} />)}
                    {row('Torneo', match?.phase.tournament.name)}
                    {row('Fase', match?.phase.label)}
                    {row('Fecha y hora', match && formatDateTime(match.scheduledAt))}
                    {row('Escenario', match?.venue.name)}
                    {row('Pelota', match && `${match.ball.brand} ${match.ball.model}`)}
                    {row('Apuestas', match && (match.bettingOpen ? 'Abiertas' : 'Cerradas'))}
                </div>
            )}
        </Dialog>
    );
}
