import { DevelopmentCurrentPhase, DevelopmentFinalRound, DevelopmentGoal, DevelopmentGroupStage, DevelopmentMatch, DevelopmentPhase, DevelopmentRef, DevelopmentTie, FinalRound } from '@/types/sports';
import { FINAL_ROUND_LABELS } from './phase-labels';
import { TagSeverity } from './tournament-labels';

// Presentación del desarrollo del torneo (HU-GC-08b). Funciones puras: las reglas
// (resultado, posiciones, ganador de la llave) las calcula ms-sports.

// ---- Estado del partido ----

// Mismo criterio que MatchOutcomePolicy en ms-sports: con resultado = finalizado;
// cancelado aparte; todo lo demás (programado o en curso) sigue pendiente.
export type DevelopmentMatchState = 'FINISHED' | 'PENDING' | 'CANCELLED';

export const DEVELOPMENT_MATCH_STATE_LABELS: Record<DevelopmentMatchState, string> = {
    FINISHED: 'Finalizado',
    PENDING: 'Pendiente',
    CANCELLED: 'Cancelado'
};

export const DEVELOPMENT_MATCH_STATE_SEVERITY: Record<DevelopmentMatchState, TagSeverity> = {
    FINISHED: 'success',
    PENDING: 'warning',
    CANCELLED: 'danger'
};

export function developmentMatchState(match: Pick<DevelopmentMatch, 'status' | 'hasResult'>): DevelopmentMatchState {
    if (match.status === 'CANCELLED') return 'CANCELLED';
    return match.hasResult ? 'FINISHED' : 'PENDING';
}

// '2 - 1' si tiene resultado; si no, la etiqueta de su estado ('Pendiente' o 'Cancelado')
export function formatDevelopmentScore(match: Pick<DevelopmentMatch, 'status' | 'hasResult' | 'homeScore' | 'awayScore'>): string {
    const state = developmentMatchState(match);
    // hasResult (ms-sports) garantiza ambos marcadores
    return state === 'FINISHED' ? `${match.homeScore} - ${match.awayScore}` : DEVELOPMENT_MATCH_STATE_LABELS[state];
}

// ---- Filtro de partidos de una fase ----

export type MatchStateFilter = 'ALL' | 'FINISHED' | 'PENDING';

export const MATCH_STATE_FILTER_OPTIONS: { label: string; value: MatchStateFilter }[] = [
    { label: 'Todos', value: 'ALL' },
    { label: 'Finalizados', value: 'FINISHED' },
    { label: 'Pendientes', value: 'PENDING' }
];

export function filterMatchesByState<T extends Pick<DevelopmentMatch, 'status' | 'hasResult'>>(matches: readonly T[], filter: MatchStateFilter): T[] {
    if (filter === 'ALL') return [...matches];
    return matches.filter((match) => developmentMatchState(match) === filter);
}

// Mensaje del estado vacío de la tabla de partidos
export function emptyMatchesMessage(totalMatches: number, filter: MatchStateFilter): string {
    if (totalMatches === 0) return 'Sin partidos programados';
    if (filter === 'FINISHED') return 'Sin partidos finalizados';
    if (filter === 'PENDING') return 'Sin partidos pendientes';
    return 'Sin partidos programados';
}

// ---- Partidos de una fase (filas de la tabla) ----

export interface DevelopmentMatchRow extends DevelopmentMatch {
    // Grupo ('Grupo A') o ronda ('Semifinal') al que pertenece el partido
    context: string;
}

function byScheduleThenId(a: DevelopmentMatch, b: DevelopmentMatch): number {
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime() || a.id - b.id;
}

// Partidos de todos los grupos de la fase, en orden cronológico
export function groupStageMatches(stage: DevelopmentGroupStage): DevelopmentMatchRow[] {
    return stage.groups.flatMap((group) => group.matches.map((match) => ({ ...match, context: group.label }))).sort(byScheduleThenId);
}

// Partidos de todas las llaves de la ronda, en orden cronológico
export function finalRoundMatches(round: DevelopmentFinalRound): DevelopmentMatchRow[] {
    return round.ties.flatMap((tie) => tie.matches.map((match) => ({ ...match, context: `${tie.teamA.name} vs ${tie.teamB.name}` }))).sort(byScheduleThenId);
}

// ---- Anotaciones ----

export function sortGoalsByMinute(goals: readonly DevelopmentGoal[]): DevelopmentGoal[] {
    return [...goals].sort((a, b) => a.minute - b.minute || a.id - b.id);
}

export function formatGoalMinute(minute: number): string {
    return `${minute}'`;
}

// "23' · Juan Pérez (Atlético Manizales)"; sin equipo si el backend no lo pudo deducir
export function formatGoal(goal: DevelopmentGoal): string {
    const team = goal.team ? ` (${goal.team.name})` : '';
    return `${formatGoalMinute(goal.minute)} · ${goal.player.fullName}${team}`;
}

// ---- Tabla de posiciones ----

// '+3', '0', '-2'
export function formatGoalDifference(goalDifference: number): string {
    return goalDifference > 0 ? `+${goalDifference}` : String(goalDifference);
}

// Las primeras qualifiersCount posiciones clasifican; sin cupo definido no se marca nadie
export function isQualifying(position: number, qualifiersCount: number | null): boolean {
    return qualifiersCount !== null && qualifiersCount > 0 && position <= qualifiersCount;
}

// ---- Resumen ----

// 68 -> '68%'; 66.7 -> '66,7%'
export function formatPercentage(value: number): string {
    return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1).replace('.', ',')}%`;
}

// 'Fase de grupos · Grupo A' | 'Semifinal' | 'Sin fases'
export function formatCurrentPhase(phase: DevelopmentCurrentPhase | null): string {
    if (!phase) return 'Sin fases';
    if (phase.type === 'FINAL') return FINAL_ROUND_LABELS[phase.round];
    return `${phase.name} · Grupo ${phase.groupName}`;
}

// 'Águilas, Búhos' | 'Ningún equipo eliminado'
export function formatEliminatedTeams(teams: readonly DevelopmentRef[]): string {
    return teams.length === 0 ? 'Ningún equipo eliminado' : teams.map((team) => team.name).join(', ');
}

// ---- Fases y llaves ----

export function splitPhases(phases: readonly DevelopmentPhase[]): { groupStages: DevelopmentGroupStage[]; finalRounds: DevelopmentFinalRound[] } {
    const groupStages: DevelopmentGroupStage[] = [];
    const finalRounds: DevelopmentFinalRound[] = [];
    phases.forEach((phase) => (phase.type === 'GROUP' ? groupStages.push(phase) : finalRounds.push(phase)));
    return { groupStages, finalRounds };
}

// Pestaña de cada fase: 'Fase de grupos' (nombre de la fase) o 'Semifinal' (ronda)
export function phaseTabLabel(phase: DevelopmentPhase): string {
    return phase.type === 'GROUP' ? phase.name : phase.label;
}

// Posición de cada ronda en el cuadro; mismo orden que ROUND_SEQUENCE en ms-sports
// (tercer puesto y final comparten columna).
export const FINAL_ROUND_SEQUENCE: Record<FinalRound, number> = {
    ROUND_OF_16: 1,
    QUARTER_FINAL: 2,
    SEMI_FINAL: 3,
    THIRD_PLACE: 4,
    FINAL: 4
};

export interface BracketColumn {
    sequence: number;
    // Ordenadas por orden de fase; en la última columna: tercer puesto y final
    rounds: DevelopmentFinalRound[];
}

// Agrupa las rondas en columnas del cuadro eliminatorio, de izquierda a derecha
export function toBracketColumns(rounds: readonly DevelopmentFinalRound[]): BracketColumn[] {
    const sorted = [...rounds].sort((a, b) => FINAL_ROUND_SEQUENCE[a.round] - FINAL_ROUND_SEQUENCE[b.round] || a.order - b.order || a.id - b.id);
    const columns: BracketColumn[] = [];
    sorted.forEach((round) => {
        const sequence = FINAL_ROUND_SEQUENCE[round.round];
        const last = columns[columns.length - 1];
        if (last && last.sequence === sequence) last.rounds.push(round);
        else columns.push({ sequence, rounds: [round] });
    });
    return columns;
}

export function isTieWinner(tie: Pick<DevelopmentTie, 'winner'>, team: DevelopmentRef): boolean {
    return tie.winner !== null && tie.winner.id === team.id;
}

// Marcador global de un equipo en la llave; '-' mientras no haya resultados
export function formatTieScore(score: number | null): string {
    return score === null ? '-' : String(score);
}

// Estado de la llave: con ganador = finalizada; si quedan partidos, pendiente;
// todos cancelados = cancelada; jugada sin ganador = empate global.
export type TieState = DevelopmentMatchState | 'DRAW';

export const TIE_STATE_LABELS: Record<TieState, string> = {
    ...DEVELOPMENT_MATCH_STATE_LABELS,
    DRAW: 'Empate global'
};

export const TIE_STATE_SEVERITY: Record<TieState, TagSeverity> = {
    ...DEVELOPMENT_MATCH_STATE_SEVERITY,
    DRAW: 'info'
};

export function tieState(tie: Pick<DevelopmentTie, 'winner' | 'matches'>): TieState {
    if (tie.winner) return 'FINISHED';
    const states = tie.matches.map(developmentMatchState);
    if (states.includes('PENDING')) return 'PENDING';
    if (states.length > 0 && states.every((state) => state === 'CANCELLED')) return 'CANCELLED';
    return states.includes('FINISHED') ? 'DRAW' : 'PENDING';
}
