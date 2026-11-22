import { Tag } from 'primereact/tag';
import { classNames } from 'primereact/utils';
import EmptyState from '@/components/ui/EmptyState';
import { formatTieScore, isTieWinner, TIE_STATE_LABELS, TIE_STATE_SEVERITY, tieState, toBracketColumns } from '@/lib/tournament-development-labels';
import { DevelopmentFinalRound, DevelopmentRef, DevelopmentTie } from '@/types/sports';

// Vista eliminatoria (HU-GC-08b): una columna por ronda, cada llave con su marcador
// global y el ganador resaltado. Tercer puesto y final comparten la última columna.
export default function DevelopmentBracket({ rounds }: { rounds: DevelopmentFinalRound[] }) {
    const columns = toBracketColumns(rounds);

    return (
        <div className="flex gap-3 overflow-x-auto pb-2" role="list" aria-label="Cuadro de la fase final">
            {columns.map((column) => (
                <div key={column.sequence} className="flex flex-column gap-3 flex-shrink-0" style={{ minWidth: '15rem' }} role="listitem">
                    {column.rounds.map((round) => (
                        <BracketRound key={round.id} round={round} />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function BracketRound({ round }: { round: DevelopmentFinalRound }) {
    return (
        <section className="flex flex-column gap-2" aria-label={round.label}>
            <span className="text-900 font-semibold text-center">{round.label}</span>
            {round.ties.length === 0 ? <EmptyState icon="pi-sitemap" title="Sin llaves" description="Aún no hay partidos programados en esta ronda." /> : round.ties.map((tie) => <BracketTie key={`${tie.teamA.id}-${tie.teamB.id}`} tie={tie} />)}
        </section>
    );
}

function BracketTie({ tie }: { tie: DevelopmentTie }) {
    const state = tieState(tie);
    return (
        <div className="border-1 surface-border border-round p-2 surface-card">
            <TieTeam tie={tie} team={tie.teamA} score={tie.teamAScore} />
            <TieTeam tie={tie} team={tie.teamB} score={tie.teamBScore} />
            <div className="flex justify-content-between align-items-center mt-2">
                <span className="text-600 text-xs">{tie.matches.length === 1 ? '1 partido' : `${tie.matches.length} partidos`}</span>
                <Tag value={TIE_STATE_LABELS[state]} severity={TIE_STATE_SEVERITY[state]} />
            </div>
        </div>
    );
}

function TieTeam({ tie, team, score }: { tie: DevelopmentTie; team: DevelopmentRef; score: number | null }) {
    const winner = isTieWinner(tie, team);
    return (
        <div
            className={classNames('flex justify-content-between align-items-center gap-2 px-2 py-1 border-left-3', {
                'border-green-500 text-green-600 font-bold': winner,
                'border-transparent text-900': !winner
            })}
        >
            <span className="flex align-items-center gap-2">
                {team.name}
                {winner && <i className="pi pi-trophy" aria-label="Ganador de la llave" title="Ganador de la llave" />}
            </span>
            <span className="font-bold">{formatTieScore(score)}</span>
        </div>
    );
}
