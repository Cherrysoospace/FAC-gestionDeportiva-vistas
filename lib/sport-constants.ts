import { EndpointRequirement } from '@/types/security';
import { SPORTS_PERMISSION_PREFIX } from './sports-api';

// Permisos de ms-sports (SportsPermissionSeeds: crud("/sports", "Deportes"))
const SPORTS = `${SPORTS_PERMISSION_PREFIX}/sports`;

export const SPORTS_VIEW_ENDPOINTS: EndpointRequirement[] = [{ url: SPORTS, method: 'GET' }];

export const SPORT_CREATE_ENDPOINT: EndpointRequirement = { url: SPORTS, method: 'POST' };

// Editar, desactivar y reactivar usan el mismo PATCH
export const SPORT_UPDATE_ENDPOINT: EndpointRequirement = { url: `${SPORTS}/{id}`, method: 'PATCH' };

export const SPORT_DELETE_ENDPOINT: EndpointRequirement = { url: `${SPORTS}/{id}`, method: 'DELETE' };


// HU-GD-01 #5: detalle de un deporte (GET /sports/:id)
export const SPORT_DETAIL_ENDPOINT: EndpointRequirement = { url: `${SPORTS}/{id}`, method: 'GET' };
