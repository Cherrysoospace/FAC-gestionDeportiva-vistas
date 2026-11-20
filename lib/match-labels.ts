import { MatchStatus } from '@/types/sports';
import { TagSeverity } from './tournament-labels';

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
    SCHEDULED: 'Programado',
    IN_PROGRESS: 'En curso',
    FINISHED: 'Finalizado',
    CANCELLED: 'Cancelado'
};

export const MATCH_STATUS_SEVERITY: Record<MatchStatus, TagSeverity> = {
    SCHEDULED: 'info',
    IN_PROGRESS: 'warning',
    FINISHED: 'success',
    CANCELLED: 'danger'
};

export const MATCH_STATUS_OPTIONS = (Object.keys(MATCH_STATUS_LABELS) as MatchStatus[]).map((status) => ({ label: MATCH_STATUS_LABELS[status], value: status }));

// Mismas reglas que MatchRulesPolicy en ms-sports
export const canEditMatch = (status: MatchStatus) => status === 'SCHEDULED';
export const canStartMatch = (status: MatchStatus) => status === 'SCHEDULED';
export const canCancelMatch = (status: MatchStatus) => status === 'SCHEDULED' || status === 'IN_PROGRESS';
export const canDeleteMatch = (status: MatchStatus) => status === 'SCHEDULED' || status === 'CANCELLED';

// '3 – 1' o 'vs' si aún no hay resultado
export function formatScore(homeScore: number | null, awayScore: number | null): string {
    return homeScore === null || awayScore === null ? 'vs' : `${homeScore} – ${awayScore}`;
}
