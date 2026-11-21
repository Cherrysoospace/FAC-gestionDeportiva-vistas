import { EndpointRequirement } from '@/types/security';
import { SPORTS_PERMISSION_PREFIX } from './sports-api';

// Permisos de ms-sports (SportsPermissionSeeds: crud("/balls", "Pelotas"))
const BALLS = `${SPORTS_PERMISSION_PREFIX}/balls`;

export const BALLS_VIEW_ENDPOINTS: EndpointRequirement[] = [{ url: BALLS, method: 'GET' }];

export const BALL_CREATE_ENDPOINT: EndpointRequirement = { url: BALLS, method: 'POST' };

// Editar, desactivar y reactivar usan el mismo PATCH
export const BALL_UPDATE_ENDPOINT: EndpointRequirement = { url: `${BALLS}/{id}`, method: 'PATCH' };

export const BALL_DELETE_ENDPOINT: EndpointRequirement = { url: `${BALLS}/{id}`, method: 'DELETE' };
