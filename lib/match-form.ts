import { CreateMatchPayload, Match, TournamentVenue, UpdateMatchPayload, Venue } from '@/types/sports';

export interface MatchFormValues {
    tournamentId: number | null;
    phaseId: number | null;
    homeTeamId: number | null;
    awayTeamId: number | null;
    venueId: number | null;
    ballId: number | null;
    scheduledAt: Date | null;
}

export type MatchFormErrors = Partial<Record<keyof MatchFormValues, string>>;

export const EMPTY_MATCH_FORM: MatchFormValues = { tournamentId: null, phaseId: null, homeTeamId: null, awayTeamId: null, venueId: null, ballId: null, scheduledAt: null };

const REQUIRED: [keyof MatchFormValues, string][] = [
    ['tournamentId', 'Selecciona el torneo'],
    ['phaseId', 'Selecciona la fase'],
    ['homeTeamId', 'Selecciona el equipo local'],
    ['awayTeamId', 'Selecciona el equipo visitante'],
    ['venueId', 'Selecciona el escenario'],
    ['ballId', 'Selecciona la pelota'],
    ['scheduledAt', 'Indica la fecha y hora del partido']
];

// Lo demás (inscritos, grupo, fechas de la fase, pelota libre) lo valida el backend.
export function validateMatchForm(values: MatchFormValues): MatchFormErrors {
    const errors: MatchFormErrors = {};
    for (const [field, message] of REQUIRED) {
        if (values[field] === null) errors[field] = message;
    }
    if (values.homeTeamId !== null && values.homeTeamId === values.awayTeamId) {
        errors.awayTeamId = 'Un equipo no puede jugar contra sí mismo';
    }
    return errors;
}

export function toMatchFormValues(match: Match | null): MatchFormValues {
    if (!match) return EMPTY_MATCH_FORM;
    return {
        tournamentId: match.phase.tournament.id,
        phaseId: match.phase.id,
        homeTeamId: match.homeTeam.id,
        awayTeamId: match.awayTeam.id,
        venueId: match.venue.id,
        ballId: match.ball.id,
        scheduledAt: new Date(match.scheduledAt)
    };
}

// Se llama después de validar: todos los campos tienen valor.
export function toCreateMatchPayload(values: MatchFormValues): CreateMatchPayload {
    return {
        phaseId: values.phaseId ?? 0,
        homeTeamId: values.homeTeamId ?? 0,
        awayTeamId: values.awayTeamId ?? 0,
        venueId: values.venueId ?? 0,
        ballId: values.ballId ?? 0,
        scheduledAt: values.scheduledAt?.toISOString() ?? ''
    };
}

// Solo envía lo que cambió (la fase no se edita).
export function toUpdateMatchPayload(values: MatchFormValues, original: Match): UpdateMatchPayload {
    const next = toCreateMatchPayload(values);
    const payload: UpdateMatchPayload = {};
    if (next.homeTeamId !== original.homeTeam.id) payload.homeTeamId = next.homeTeamId;
    if (next.awayTeamId !== original.awayTeam.id) payload.awayTeamId = next.awayTeamId;
    if (next.venueId !== original.venue.id) payload.venueId = next.venueId;
    if (next.ballId !== original.ball.id) payload.ballId = next.ballId;
    if (new Date(next.scheduledAt).getTime() !== new Date(original.scheduledAt).getTime()) payload.scheduledAt = next.scheduledAt;
    return payload;
}

/**
 * Escenarios donde se puede jugar: los habilitados para el torneo y sus
 * espacios internos (misma regla que isVenueEnabledForTournament en ms-sports).
 */
export function playableVenues(venues: Venue[], enabled: TournamentVenue[]): Venue[] {
    const enabledIds = new Set(enabled.map((tournamentVenue) => tournamentVenue.venue.id));
    const byId = new Map(venues.map((venue) => [venue.id, venue]));
    const isEnabled = (venue: Venue | undefined, depth = 0): boolean => {
        if (!venue || depth > 10) return false;
        return enabledIds.has(venue.id) || isEnabled(venue.parent ? byId.get(venue.parent.id) : undefined, depth + 1);
    };
    return venues.filter((venue) => venue.active && isEnabled(venue));
}
