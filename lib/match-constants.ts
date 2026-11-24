import { EndpointRequirement } from '@/types/security';
import { SPORTS_PERMISSION_PREFIX } from './sports-api';

// Permisos de ms-sports, con el mismo formato {id} que registra ms_security.
const MATCHES = `${SPORTS_PERMISSION_PREFIX}/matches`;
const POSITIONS = `${SPORTS_PERMISSION_PREFIX}/match-positions`;

export const MATCHES_VIEW_ENDPOINTS: EndpointRequirement[] = [{ url: MATCHES, method: 'GET' }];

// HU-GC-06 #8: detalle de un partido
export const MATCH_DETAIL_ENDPOINT: EndpointRequirement = { url: `${MATCHES}/{id}`, method: 'GET' };

export const MATCH_CREATE_ENDPOINT: EndpointRequirement = { url: MATCHES, method: 'POST' };

// Editar datos y cambiar estado (iniciar / cancelar) usan el mismo PATCH
export const MATCH_UPDATE_ENDPOINT: EndpointRequirement = { url: `${MATCHES}/{id}`, method: 'PATCH' };

export const MATCH_DELETE_ENDPOINT: EndpointRequirement = { url: `${MATCHES}/{id}`, method: 'DELETE' };

// HU-GC-07: resultado final y anotaciones
export const MATCH_RECORD_RESULT_ENDPOINT: EndpointRequirement = { url: `${MATCHES}/{id}/result`, method: 'PUT' };

const GOALS = `${SPORTS_PERMISSION_PREFIX}/goals`;

export const GOALS_LIST_ENDPOINT: EndpointRequirement = { url: GOALS, method: 'GET' };

export const GOAL_CREATE_ENDPOINT: EndpointRequirement = { url: GOALS, method: 'POST' };

export const GOAL_UPDATE_ENDPOINT: EndpointRequirement = { url: `${GOALS}/{id}`, method: 'PATCH' };

export const GOAL_DELETE_ENDPOINT: EndpointRequirement = { url: `${GOALS}/{id}`, method: 'DELETE' };

// HU-GC-09: la pizarra necesita el partido y sus posiciones
export const BOARD_VIEW_ENDPOINTS: EndpointRequirement[] = [
    { url: `${MATCHES}/{id}`, method: 'GET' },
    { url: POSITIONS, method: 'GET' }
];

// Datos del formulario de partidos
export const MATCH_FORM_ENDPOINTS: EndpointRequirement[] = [
    { url: `${SPORTS_PERMISSION_PREFIX}/tournaments`, method: 'GET' },
    { url: `${SPORTS_PERMISSION_PREFIX}/group-phases`, method: 'GET' },
    { url: `${SPORTS_PERMISSION_PREFIX}/final-phases`, method: 'GET' },
    { url: `${SPORTS_PERMISSION_PREFIX}/group-phases/{id}/teams`, method: 'GET' },
    { url: `${SPORTS_PERMISSION_PREFIX}/registrations`, method: 'GET' },
    { url: `${SPORTS_PERMISSION_PREFIX}/tournament-venues`, method: 'GET' },
    { url: `${SPORTS_PERMISSION_PREFIX}/venues`, method: 'GET' },
    { url: `${SPORTS_PERMISSION_PREFIX}/balls`, method: 'GET' }
];
