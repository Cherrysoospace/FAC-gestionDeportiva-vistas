import { EndpointRequirement } from '@/types/security';
import { SPORTS_PERMISSION_PREFIX } from './sports-api';

// Permisos de ms-sports, con el mismo formato {id} que registra ms_security.
const TEAMS = `${SPORTS_PERMISSION_PREFIX}/teams`;
const TEAM_SPORTS = `${SPORTS_PERMISSION_PREFIX}/team-sports`;

export const TEAMS_VIEW_ENDPOINTS: EndpointRequirement[] = [{ url: TEAMS, method: 'GET' }];

export const TEAM_DETAIL_ENDPOINTS: EndpointRequirement[] = [{ url: `${TEAMS}/{id}`, method: 'GET' }];

export const TEAM_CREATE_ENDPOINT: EndpointRequirement = { url: TEAMS, method: 'POST' };

// Editar, desactivar y reactivar usan el mismo PATCH
export const TEAM_UPDATE_ENDPOINT: EndpointRequirement = { url: `${TEAMS}/{id}`, method: 'PATCH' };

export const TEAM_DELETE_ENDPOINT: EndpointRequirement = { url: `${TEAMS}/{id}`, method: 'DELETE' };

// HU-GD-03: deportes del equipo
export const TEAM_SPORTS_LIST_ENDPOINT: EndpointRequirement = { url: TEAM_SPORTS, method: 'GET' };

export const TEAM_SPORT_CREATE_ENDPOINT: EndpointRequirement = { url: TEAM_SPORTS, method: 'POST' };

export const TEAM_SPORT_DELETE_ENDPOINT: EndpointRequirement = { url: `${TEAM_SPORTS}/{id}`, method: 'DELETE' };

// Autorrelación Equipo n — n Equipo del diagrama
export const RELATED_TEAMS_LIST_ENDPOINT: EndpointRequirement = { url: `${TEAMS}/{id}/related-teams`, method: 'GET' };

export const RELATED_TEAM_CREATE_ENDPOINT: EndpointRequirement = { url: `${TEAMS}/{id}/related-teams`, method: 'POST' };

export const RELATED_TEAM_DELETE_ENDPOINT: EndpointRequirement = { url: `${TEAMS}/{id}/related-teams/{id}`, method: 'DELETE' };
