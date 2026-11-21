import { EndpointRequirement } from '@/types/security';
import { SPORTS_PERMISSION_PREFIX } from './sports-api';

const BETS = `${SPORTS_PERMISSION_PREFIX}/bets`;
const BETS_AVAILABLE_MATCHES = `${SPORTS_PERMISSION_PREFIX}/bets/available-matches`;
const MY_BETS = `${SPORTS_PERMISSION_PREFIX}/me/bets`;

// Gestión administrativa de apuestas (Administrador deportivo)
export const BETS_VIEW_ENDPOINTS: EndpointRequirement[] = [{ url: BETS, method: 'GET' }];

export const BET_CREATE_ENDPOINT: EndpointRequirement = { url: BETS, method: 'POST' };

export const BET_VOID_ENDPOINT: EndpointRequirement = { url: `${BETS}/{id}/void`, method: 'PATCH' };

// Partidos habilitados para apostar (Administrador deportivo y Aficionado)
export const BET_AVAILABLE_MATCHES_ENDPOINT: EndpointRequirement = { url: BETS_AVAILABLE_MATCHES, method: 'GET' };

// Apuestas propias del aficionado autenticado (Aficionado)
export const MY_BETS_VIEW_ENDPOINTS: EndpointRequirement[] = [{ url: MY_BETS, method: 'GET' }];

export const MY_BET_PLACE_ENDPOINT: EndpointRequirement = { url: MY_BETS, method: 'POST' };

export const MY_BET_UPDATE_ENDPOINT: EndpointRequirement = { url: `${MY_BETS}/{id}`, method: 'PATCH' };

export const MY_BET_CANCEL_ENDPOINT: EndpointRequirement = { url: `${MY_BETS}/{id}/cancel`, method: 'PATCH' };

