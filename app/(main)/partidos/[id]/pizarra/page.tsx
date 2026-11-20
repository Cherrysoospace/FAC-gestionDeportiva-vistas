'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { InputSwitch } from 'primereact/inputswitch';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import ProtectedRoute from '@/layout/ProtectedRoute';
import { BOARD_VIEW_ENDPOINTS } from '@/lib/match-constants';
import { formatScore, MATCH_STATUS_LABELS, MATCH_STATUS_SEVERITY } from '@/lib/match-labels';
import { formatDateTime } from '@/lib/tournament-labels';
import { Board, BoardTeam } from '@/types/sports';
import BoardField, { SIDE_COLORS } from '../../components/BoardField';
import { BOARD_REFRESH_MS, useBoard } from '../../hooks/useBoard';

interface BoardPageProps {
    params: { id: string };
}

// HU-GC-09: seguimiento espacial de un partido en la pizarra.
export default function BoardPage({ params }: BoardPageProps) {
    return (
        <ProtectedRoute requiredEndpoints={BOARD_VIEW_ENDPOINTS}>
            <BoardContent matchId={Number(params.id)} />
        </ProtectedRoute>
    );
}

function BoardContent({ matchId }: { matchId: number }) {
    const router = useRouter();
    const [autoRefresh, setAutoRefresh] = useState(true);
    const { match, board, loading, error, lastUpdate, live, refresh } = useBoard(matchId, autoRefresh);

    const title = match ? `${match.homeTeam.name} vs ${match.awayTeam.name}` : 'Pizarra del partido';

    const actions = (
        <div className="flex flex-wrap align-items-center gap-3">
            <Button label="Volver a partidos" icon="pi pi-arrow-left" text onClick={() => router.push('/partidos')} />
            <div className="flex align-items-center gap-2">
                <InputSwitch inputId="board-auto" checked={autoRefresh} onChange={(event) => setAutoRefresh(Boolean(event.value))} disabled={!live} />
                <label htmlFor="board-auto">Actualizar cada {BOARD_REFRESH_MS / 1000} s</label>
            </div>
            <Button label="Actualizar" icon="pi pi-refresh" outlined onClick={() => void refresh()} />
        </div>
    );

    return (
        <>
            <PageHeader
                title={title}
                subtitle={match ? `${match.phase.tournament.name} · ${match.phase.label} · ${match.venue.name} · ${formatDateTime(match.scheduledAt)}` : 'Posición de los jugadores y de la pelota en el campo.'}
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Partidos', href: '/partidos' }, { label: 'Pizarra' }]}
                actions={actions}
            />

            {error && <Message severity="error" text={error} className="w-full mb-3" />}
            {loading && !board && <Skeleton height="28rem" />}

            {board && (
                <div className="grid">
                    <div className="col-12 xl:col-9">
                        <div className="card">
                            <div className="flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                                <div className="flex align-items-center gap-3 text-xl font-bold">
                                    <TeamBadge team={board.homeTeam} />
                                    <span className="text-600">{formatScore(match?.homeScore ?? null, match?.awayScore ?? null)}</span>
                                    <TeamBadge team={board.awayTeam} />
                                </div>
                                <div className="flex align-items-center gap-2">
                                    <Tag value={MATCH_STATUS_LABELS[board.status]} severity={MATCH_STATUS_SEVERITY[board.status]} />
                                    {lastUpdate && <span className="text-600 text-sm">Actualizado {lastUpdate.toLocaleTimeString('es-CO')}</span>}
                                </div>
                            </div>

                            {!live && (
                                <Message
                                    severity="info"
                                    text={board.status === 'SCHEDULED' ? 'El partido aún no ha empezado: el seguimiento comienza cuando se inicia.' : 'El partido ya no está en curso: se muestran las últimas posiciones registradas.'}
                                    className="w-full mb-3"
                                />
                            )}
                            {live && !board.ball.location && board.players.every((player) => !player.location) && (
                                <Message severity="warn" text="Aún no hay posiciones registradas. Inicia el simulador: npm run simulate:positions -- <id del partido>" className="w-full mb-3" />
                            )}

                            <BoardField board={board} />
                            <div className="flex flex-wrap gap-4 mt-3 text-sm text-600">
                                <span>
                                    <i className="pi pi-circle-fill mr-1" style={{ color: SIDE_COLORS.HOME.fill }} /> Local
                                </span>
                                <span>
                                    <i className="pi pi-circle-fill mr-1" style={{ color: SIDE_COLORS.AWAY.fill }} /> Visitante
                                </span>
                                <span>
                                    <i className="pi pi-circle mr-1" /> Pelota {board.ball.brand} {board.ball.model}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 xl:col-3">
                        <TeamList board={board} team={board.homeTeam} />
                        <TeamList board={board} team={board.awayTeam} />
                    </div>
                </div>
            )}
        </>
    );
}

function TeamBadge({ team }: { team: BoardTeam }) {
    return (
        <span className="flex align-items-center gap-2">
            <i className="pi pi-circle-fill" style={{ color: SIDE_COLORS[team.side].fill }} />
            {team.name}
        </span>
    );
}

// Solo los jugadores que participan (plantilla vigente de cada equipo)
function TeamList({ board, team }: { board: Board; team: BoardTeam }) {
    const players = board.players.filter((player) => player.team.id === team.id);
    return (
        <div className="card mb-3">
            <h6 className="mt-0 flex align-items-center gap-2">
                <TeamBadge team={team} /> <span className="text-600 font-normal">({players.length})</span>
            </h6>
            {players.length === 0 ? (
                <EmptyState icon="pi-users" title="Sin jugadores con contrato vigente." />
            ) : (
                <ul className="list-none p-0 m-0">
                    {players.map((player) => (
                        <li key={player.id} className="flex justify-content-between py-1 border-bottom-1 surface-border text-sm">
                            <span className="text-900">{player.fullName}</span>
                            <span className="text-600">{player.location ? `${player.position} · ${Math.round(player.location.x)}, ${Math.round(player.location.y)}` : 'Sin posición'}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
