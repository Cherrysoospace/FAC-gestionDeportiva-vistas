import { sportsApiFetch, toQueryString } from './sports-api';
import { CreateTournamentVenuePayload, MessageResponse, TournamentVenue, TournamentVenueQuery } from '@/types/sports';

const TOURNAMENT_VENUES = '/tournament-venues';

// ?tournamentId → escenarios habilitados del torneo; ?venueId → torneos del escenario
export function listTournamentVenues(query: TournamentVenueQuery = {}, signal?: AbortSignal): Promise<TournamentVenue[]> {
    return sportsApiFetch<TournamentVenue[]>(`${TOURNAMENT_VENUES}${toQueryString({ ...query })}`, { signal });
}

export function createTournamentVenue(payload: CreateTournamentVenuePayload): Promise<TournamentVenue> {
    return sportsApiFetch<TournamentVenue>(TOURNAMENT_VENUES, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

// Retira solo la asociación: no borra el torneo ni el escenario
export function deleteTournamentVenue(id: number): Promise<MessageResponse> {
    return sportsApiFetch<MessageResponse>(`${TOURNAMENT_VENUES}/${id}`, { method: 'DELETE' });
}
