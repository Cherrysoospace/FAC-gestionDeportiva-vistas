import { EndpointRequirement } from '@/types/security';
import { SPORTS_PERMISSION_PREFIX } from './sports-api';

// Permisos de ms-sports, con el mismo formato {id} que registra ms_security.
const VENUES = `${SPORTS_PERMISSION_PREFIX}/venues`;
const LOCATIONS = `${SPORTS_PERMISSION_PREFIX}/locations`;

export const VENUES_VIEW_ENDPOINTS: EndpointRequirement[] = [{ url: VENUES, method: 'GET' }];

export const VENUE_DETAIL_ENDPOINTS: EndpointRequirement[] = [{ url: `${VENUES}/{id}`, method: 'GET' }];

export const VENUE_CREATE_ENDPOINT: EndpointRequirement = { url: VENUES, method: 'POST' };

// Editar, mover de escenario padre y desactivar usan el mismo PATCH
export const VENUE_UPDATE_ENDPOINT: EndpointRequirement = { url: `${VENUES}/{id}`, method: 'PATCH' };

export const VENUE_DELETE_ENDPOINT: EndpointRequirement = { url: `${VENUES}/{id}`, method: 'DELETE' };

export const LOCATIONS_LIST_ENDPOINT: EndpointRequirement = { url: LOCATIONS, method: 'GET' };

export const LOCATION_CREATE_ENDPOINT: EndpointRequirement = { url: LOCATIONS, method: 'POST' };

export const LOCATION_UPDATE_ENDPOINT: EndpointRequirement = { url: `${LOCATIONS}/{id}`, method: 'PATCH' };

export const LOCATION_DELETE_ENDPOINT: EndpointRequirement = { url: `${LOCATIONS}/{id}`, method: 'DELETE' };
