import { createResourceClient, sportsApiFetch } from './sports-api';
import {
    CreateRegistrationPayload,
    CreateRegistrationsResult,
    Registration,
    RegistrationQuery,
    WithdrawRegistrationResult
} from '@/types/sports';

const REGISTRATIONS = '/registrations';

const registrationsClient = createResourceClient<Registration, never, never, RegistrationQuery>(REGISTRATIONS);

export function listRegistrations(query: RegistrationQuery = {}, signal?: AbortSignal): Promise<Registration[]> {
    return registrationsClient.list(query, signal);
}

export function getRegistration(id: number, signal?: AbortSignal): Promise<Registration> {
    return registrationsClient.getById(id, signal);
}

export function createRegistrations(payload: CreateRegistrationPayload): Promise<CreateRegistrationsResult> {
    return sportsApiFetch<CreateRegistrationsResult>(REGISTRATIONS, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export function withdrawRegistration(id: number): Promise<WithdrawRegistrationResult> {
    return sportsApiFetch<WithdrawRegistrationResult>(`${REGISTRATIONS}/${id}/withdraw`, {
        method: 'PATCH'
    });
}

