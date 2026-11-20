import { sportsApiFetch, toQueryString } from './sports-api';
import { CreateVenuePayload, MessageResponse, UpdateVenuePayload, Venue, VenueQuery } from '@/types/sports';

const VENUES = '/venues';

export function listVenues(query: VenueQuery = {}, signal?: AbortSignal): Promise<Venue[]> {
    return sportsApiFetch<Venue[]>(`${VENUES}${toQueryString({ ...query })}`, { signal });
}

// Incluye `children` (espacios internos)
export function getVenue(id: number, signal?: AbortSignal): Promise<Venue> {
    return sportsApiFetch<Venue>(`${VENUES}/${id}`, { signal });
}

export function createVenue(payload: CreateVenuePayload): Promise<Venue> {
    return sportsApiFetch<Venue>(VENUES, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export function updateVenue(id: number, payload: UpdateVenuePayload): Promise<Venue> {
    return sportsApiFetch<Venue>(`${VENUES}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
}

export function deleteVenue(id: number): Promise<MessageResponse> {
    return sportsApiFetch<MessageResponse>(`${VENUES}/${id}`, { method: 'DELETE' });
}
