import { EndpointRequirement } from '@/types/security';
import { SPORTS_PERMISSION_PREFIX } from './sports-api';

// Permisos de ms-sports, con el mismo formato {id} que registra ms_security.
const PLAYERS = `${SPORTS_PERMISSION_PREFIX}/players`;
const TEAM_PLAYERS = `${SPORTS_PERMISSION_PREFIX}/team-players`;
const PLAYER_SKILLS = `${SPORTS_PERMISSION_PREFIX}/player-skills`;

export const PLAYERS_VIEW_ENDPOINTS: EndpointRequirement[] = [{ url: PLAYERS, method: 'GET' }];

// HU-GD-08: el detalle del jugador es su perfil deportivo
export const PLAYER_PROFILE_ENDPOINTS: EndpointRequirement[] = [{ url: `${PLAYERS}/{id}/profile`, method: 'GET' }];

export const PLAYER_CREATE_ENDPOINT: EndpointRequirement = { url: PLAYERS, method: 'POST' };

// Editar, desactivar y reactivar usan el mismo PATCH
export const PLAYER_UPDATE_ENDPOINT: EndpointRequirement = { url: `${PLAYERS}/{id}`, method: 'PATCH' };

export const PLAYER_DELETE_ENDPOINT: EndpointRequirement = { url: `${PLAYERS}/{id}`, method: 'DELETE' };

// HU-GD-05: plantilla del equipo
export const TEAM_PLAYERS_LIST_ENDPOINT: EndpointRequirement = { url: TEAM_PLAYERS, method: 'GET' };

export const TEAM_PLAYER_CREATE_ENDPOINT: EndpointRequirement = { url: TEAM_PLAYERS, method: 'POST' };

export const TEAM_PLAYER_UPDATE_ENDPOINT: EndpointRequirement = { url: `${TEAM_PLAYERS}/{id}`, method: 'PATCH' };

export const TEAM_PLAYER_RELEASE_ENDPOINT: EndpointRequirement = { url: `${TEAM_PLAYERS}/{id}/release`, method: 'PATCH' };

// HU-GD-06 (catálogo, solo para elegir) y HU-GD-07
export const SKILLS_LIST_ENDPOINT: EndpointRequirement = { url: `${SPORTS_PERMISSION_PREFIX}/skills`, method: 'GET' };

export const PLAYER_SKILL_CREATE_ENDPOINT: EndpointRequirement = { url: PLAYER_SKILLS, method: 'POST' };

// Cambia el nivel
export const PLAYER_SKILL_UPDATE_ENDPOINT: EndpointRequirement = { url: `${PLAYER_SKILLS}/{id}`, method: 'PATCH' };

export const PLAYER_SKILL_DELETE_ENDPOINT: EndpointRequirement = { url: `${PLAYER_SKILLS}/{id}`, method: 'DELETE' };
