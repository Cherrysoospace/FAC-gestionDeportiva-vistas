import { EndpointRequirement } from '@/types/security';
import { SPORTS_PERMISSION_PREFIX } from './sports-api';

const FANS = `${SPORTS_PERMISSION_PREFIX}/fans`;
const MY_FAN = `${SPORTS_PERMISSION_PREFIX}/me/fan`;
const MY_FAVORITE_TEAMS = `${SPORTS_PERMISSION_PREFIX}/me/favorite-teams`;

// Gestión administrativa de aficionados (Administrador deportivo)
export const FANS_VIEW_ENDPOINTS: EndpointRequirement[] = [{ url: FANS, method: 'GET' }];

export const FAN_CREATE_ENDPOINT: EndpointRequirement = { url: FANS, method: 'POST' };

export const FAN_UPDATE_ENDPOINT: EndpointRequirement = { url: `${FANS}/{id}`, method: 'PATCH' };

export const FAN_DELETE_ENDPOINT: EndpointRequirement = { url: `${FANS}/{id}`, method: 'DELETE' };

// Perfil propio del aficionado autenticado (Aficionado)
export const MY_FAN_VIEW_ENDPOINTS: EndpointRequirement[] = [{ url: MY_FAN, method: 'GET' }];

export const MY_FAN_REGISTER_ENDPOINT: EndpointRequirement = { url: MY_FAN, method: 'POST' };

export const MY_FAN_UPDATE_ENDPOINT: EndpointRequirement = { url: MY_FAN, method: 'PATCH' };

// Equipos favoritos del aficionado autenticado (R18)
export const MY_FAVORITE_TEAMS_VIEW_ENDPOINTS: EndpointRequirement[] = [{ url: MY_FAVORITE_TEAMS, method: 'GET' }];

export const MY_FAVORITE_TEAM_ADD_ENDPOINT: EndpointRequirement = { url: MY_FAVORITE_TEAMS, method: 'POST' };

export const MY_FAVORITE_TEAM_REMOVE_ENDPOINT: EndpointRequirement = { url: `${MY_FAVORITE_TEAMS}/{id}`, method: 'DELETE' };
