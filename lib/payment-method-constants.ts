import { EndpointRequirement } from '@/types/security';
import { SPORTS_PERMISSION_PREFIX } from './sports-api';

const PAYMENT_METHODS = `${SPORTS_PERMISSION_PREFIX}/payment-methods`;
const MY_PAYMENT_METHODS = `${SPORTS_PERMISSION_PREFIX}/me/payment-methods`;

// Catálogo administrativo de métodos de pago (HU-GC-10)
export const PAYMENT_METHODS_VIEW_ENDPOINTS: EndpointRequirement[] = [{ url: PAYMENT_METHODS, method: 'GET' }];

export const PAYMENT_METHOD_CREATE_ENDPOINT: EndpointRequirement = { url: PAYMENT_METHODS, method: 'POST' };

export const PAYMENT_METHOD_UPDATE_ENDPOINT: EndpointRequirement = { url: `${PAYMENT_METHODS}/{id}`, method: 'PATCH' };

export const PAYMENT_METHOD_DELETE_ENDPOINT: EndpointRequirement = { url: `${PAYMENT_METHODS}/{id}`, method: 'DELETE' };

// Billetera de métodos de pago del aficionado autenticado (HU-GC-10)
export const MY_PAYMENT_METHODS_VIEW_ENDPOINTS: EndpointRequirement[] = [{ url: MY_PAYMENT_METHODS, method: 'GET' }];

export const MY_PAYMENT_METHOD_REGISTER_ENDPOINT: EndpointRequirement = { url: MY_PAYMENT_METHODS, method: 'POST' };

export const MY_PAYMENT_METHOD_UPDATE_ENDPOINT: EndpointRequirement = { url: `${MY_PAYMENT_METHODS}/{id}`, method: 'PATCH' };

export const MY_PAYMENT_METHOD_DELETE_ENDPOINT: EndpointRequirement = { url: `${MY_PAYMENT_METHODS}/{id}`, method: 'DELETE' };

