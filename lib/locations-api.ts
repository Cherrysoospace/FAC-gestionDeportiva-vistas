import { sportsApiFetch, toQueryString } from './sports-api';
import { CreateLocationPayload, Location, LocationQuery, MessageResponse, UpdateLocationPayload } from '@/types/sports';

const LOCATIONS = '/locations';

export function listLocations(query: LocationQuery = {}, signal?: AbortSignal): Promise<Location[]> {
    return sportsApiFetch<Location[]>(`${LOCATIONS}${toQueryString({ ...query })}`, { signal });
}

export function createLocation(payload: CreateLocationPayload): Promise<Location> {
    return sportsApiFetch<Location>(LOCATIONS, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export function updateLocation(id: number, payload: UpdateLocationPayload): Promise<Location> {
    return sportsApiFetch<Location>(`${LOCATIONS}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
}

export function deleteLocation(id: number): Promise<MessageResponse> {
    return sportsApiFetch<MessageResponse>(`${LOCATIONS}/${id}`, { method: 'DELETE' });
}
