import { createResourceClient, sportsApiFetch, toQueryString } from './sports-api';
import {
    CreatePaymentMethodPayload,
    FanPaymentMethod,
    FanPaymentMethodQuery,
    MessageResponse,
    PaymentMethod,
    PaymentMethodQuery,
    RegisterFanPaymentMethodPayload,
    UpdateFanPaymentMethodPayload,
    UpdatePaymentMethodPayload
} from '@/types/sports';

const paymentMethodsClient = createResourceClient<
    PaymentMethod,
    CreatePaymentMethodPayload,
    UpdatePaymentMethodPayload,
    PaymentMethodQuery
>('/payment-methods');

export const listPaymentMethods = paymentMethodsClient.list;
export const getPaymentMethod = paymentMethodsClient.getById;
export const createPaymentMethod = paymentMethodsClient.create;
export const updatePaymentMethod = paymentMethodsClient.update;
export const deletePaymentMethod = paymentMethodsClient.remove;

const MY_PAYMENT_METHODS = '/me/payment-methods';

export function listMyPaymentMethods(query: FanPaymentMethodQuery = {}, signal?: AbortSignal): Promise<FanPaymentMethod[]> {
    return sportsApiFetch<FanPaymentMethod[]>(`${MY_PAYMENT_METHODS}${toQueryString({ ...query })}`, { signal });
}

export function getMyPaymentMethod(id: number, signal?: AbortSignal): Promise<FanPaymentMethod> {
    return sportsApiFetch<FanPaymentMethod>(`${MY_PAYMENT_METHODS}/${id}`, { signal });
}

export function registerMyPaymentMethod(payload: RegisterFanPaymentMethodPayload): Promise<FanPaymentMethod> {
    return sportsApiFetch<FanPaymentMethod>(MY_PAYMENT_METHODS, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export function updateMyPaymentMethod(id: number, payload: UpdateFanPaymentMethodPayload): Promise<FanPaymentMethod> {
    return sportsApiFetch<FanPaymentMethod>(`${MY_PAYMENT_METHODS}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
}

export function deleteMyPaymentMethod(id: number): Promise<MessageResponse> {
    return sportsApiFetch<MessageResponse>(`${MY_PAYMENT_METHODS}/${id}`, {
        method: 'DELETE'
    });
}

