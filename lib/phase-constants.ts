import { EndpointRequirement } from '@/types/security';
import { SPORTS_PERMISSION_PREFIX } from './sports-api';

// Permisos de ms-sports (SportsPermissionSeeds: crud("/group-phases") + equipos del grupo, crud("/final-phases"))
const GROUP_PHASES = `${SPORTS_PERMISSION_PREFIX}/group-phases`;
const FINAL_PHASES = `${SPORTS_PERMISSION_PREFIX}/final-phases`;

// ---- Fases de grupos ----
export const GROUP_PHASES_LIST_ENDPOINT: EndpointRequirement = { url: GROUP_PHASES, method: 'GET' };

export const GROUP_PHASE_CREATE_ENDPOINT: EndpointRequirement = { url: GROUP_PHASES, method: 'POST' };

export const GROUP_PHASE_UPDATE_ENDPOINT: EndpointRequirement = { url: `${GROUP_PHASES}/{id}`, method: 'PATCH' };

export const GROUP_PHASE_DELETE_ENDPOINT: EndpointRequirement = { url: `${GROUP_PHASES}/{id}`, method: 'DELETE' };

// Equipos del grupo (Grupo 1 — n Equipo)
export const GROUP_TEAMS_LIST_ENDPOINT: EndpointRequirement = { url: `${GROUP_PHASES}/{id}/teams`, method: 'GET' };

export const GROUP_TEAM_ASSIGN_ENDPOINT: EndpointRequirement = { url: `${GROUP_PHASES}/{id}/teams`, method: 'POST' };

export const GROUP_TEAM_REMOVE_ENDPOINT: EndpointRequirement = { url: `${GROUP_PHASES}/{id}/teams/{id}`, method: 'DELETE' };

// ---- Fases finales ----
export const FINAL_PHASES_LIST_ENDPOINT: EndpointRequirement = { url: FINAL_PHASES, method: 'GET' };

export const FINAL_PHASE_CREATE_ENDPOINT: EndpointRequirement = { url: FINAL_PHASES, method: 'POST' };

export const FINAL_PHASE_UPDATE_ENDPOINT: EndpointRequirement = { url: `${FINAL_PHASES}/{id}`, method: 'PATCH' };

export const FINAL_PHASE_DELETE_ENDPOINT: EndpointRequirement = { url: `${FINAL_PHASES}/{id}`, method: 'DELETE' };
