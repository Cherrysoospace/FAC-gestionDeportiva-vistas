'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import ActiveTag from '@/components/ui/ActiveTag';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/layout/context/authcontext';
import ProtectedRoute from '@/layout/ProtectedRoute';
import {
    MY_FAN_REGISTER_ENDPOINT,
    MY_FAN_UPDATE_ENDPOINT,
    MY_FAN_VIEW_ENDPOINTS,
    MY_FAVORITE_TEAM_ADD_ENDPOINT,
    MY_FAVORITE_TEAM_REMOVE_ENDPOINT,
    MY_FAVORITE_TEAMS_VIEW_ENDPOINTS
} from '@/lib/fan-constants';
import {
    MyFanFormValues,
    toMyFanFormValues,
    toRegisterMyFanPayload,
    toUpdateMyFanPayload,
    validateMyFanForm
} from '@/lib/fan-form';
import { TEAM_DETAIL_ENDPOINTS, TEAMS_VIEW_ENDPOINTS } from '@/lib/team-constants';
import { formatDateTime } from '@/lib/tournament-labels';
import { ActionResult } from '@/types/action';
import { EndpointRequirement } from '@/types/security';
import { FavoriteTeam } from '@/types/sports';
import FavoriteTeamsPanel from './components/FavoriteTeamsPanel';
import { useMyFanProfile } from './hooks/useMyFanProfile';

export default function MyFanProfilePage() {
    return (
        <ProtectedRoute requiredEndpoints={MY_FAN_VIEW_ENDPOINTS}>
            <MyFanProfileContent />
        </ProtectedRoute>
    );
}

function MyFanProfileContent() {
    const toast = useRef<Toast>(null);
    const { user, hasPermissionUrl } = useAuth();

    const can = (...endpoints: EndpointRequirement[]) => endpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    const canRegister = can(MY_FAN_REGISTER_ENDPOINT);
    const canUpdate = can(MY_FAN_UPDATE_ENDPOINT);
    const canViewFavorites = can(...MY_FAVORITE_TEAMS_VIEW_ENDPOINTS);
    const canAddFavorite = can(MY_FAVORITE_TEAM_ADD_ENDPOINT);
    const canRemoveFavorite = can(MY_FAVORITE_TEAM_REMOVE_ENDPOINT);
    const canLoadTeams = can(...TEAMS_VIEW_ENDPOINTS);
    const canViewTeamDetail = can(...TEAM_DETAIL_ENDPOINTS);

    const {
        fan,
        notRegistered,
        loadingProfile,
        profileError,
        favorites,
        loadingFavorites,
        favoritesError,
        teams,
        reload,
        registerProfile,
        updateProfile,
        addFavorite,
        removeFavorite
    } = useMyFanProfile({
        loadProfile: true,
        loadFavorites: canViewFavorites,
        loadTeamOptions: canViewFavorites && canAddFavorite && canLoadTeams
    });

    const fanFullName = fan?.fullName ?? null;
    const fanDocument = fan?.documentNumber ?? null;
    const fanEmail = fan?.email ?? null;
    const fanPhone = fan?.phone ?? null;
    const userName = user?.name ?? '';
    const userEmail = user?.email ?? '';

    const [values, setValues] = useState<MyFanFormValues>(toMyFanFormValues(null, userName, userEmail));
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    useEffect(() => {
        setValues({
            fullName: fanFullName ?? userName,
            documentNumber: fanDocument ?? '',
            email: fanEmail ?? userEmail,
            phone: fanPhone ?? ''
        });
        setSubmitted(false);
        setServerError(null);
    }, [fanFullName, fanDocument, fanEmail, fanPhone, userName, userEmail]);

    const notify = (result: ActionResult, successText: string, errorSummary = 'No se pudo completar') =>
        toast.current?.show(result.ok ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 } : { severity: 'error', summary: errorSummary, detail: result.error, life: 6000 });

    const errors = validateMyFanForm(values);
    const fieldError = (field: keyof MyFanFormValues) => (submitted ? errors[field] : undefined);
    const invalidClass = (field: keyof MyFanFormValues) => (fieldError(field) ? 'p-invalid' : undefined);

    const profileInactive = fan !== null && !fan.active;
    const canSubmitForm = notRegistered ? canRegister : canUpdate && !profileInactive;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        setServerError(null);
        if (Object.keys(errors).length > 0 || !canSubmitForm) return;

        setSaving(true);
        const result = fan
            ? await updateProfile(toUpdateMyFanPayload(values, fan))
            : await registerProfile(toRegisterMyFanPayload(values));
        setSaving(false);

        if (result.ok) {
            notify(result, fan ? 'Tus datos de aficionado fueron actualizados.' : 'Tu perfil de aficionado quedó registrado.');
        } else {
            setServerError(result.error ?? 'No se pudo guardar tu perfil de aficionado');
        }
    };

    const handleAddFavorite = async (teamId: number) => {
        const result = await addFavorite(teamId);
        const teamName = teams.find((item) => item.id === teamId)?.name ?? 'El equipo';
        notify(result, `${teamName} se agregó a tus favoritos.`, 'No se pudo agregar a favoritos');
        return result.ok;
    };

    const handleRemoveFavorite = async (favorite: FavoriteTeam) => {
        const result = await removeFavorite(favorite.team.id);
        notify(result, `${favorite.team.name} fue retirado de tus favoritos.`, 'No se pudo retirar el equipo');
    };

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            <PageHeader
                title="Mi perfil de aficionado"
                subtitle="Completa o actualiza tu ficha personal de aficionado para comprar boletos, apostar y seguir equipos."
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Mi perfil de aficionado' }]}
            />

            {profileError && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message severity="error" text={profileError} className="w-full" />
                    <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
                </div>
            )}

            {loadingProfile && !fan && !notRegistered && <Skeleton height="18rem" className="mb-4" />}

            {!loadingProfile && !profileError && (
                <div className="card mb-4">
                    <div className="flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                        <h5 className="m-0">{notRegistered ? 'Completar autorregistro de aficionado' : 'Mis datos de aficionado'}</h5>
                        {fan && (
                            <div className="flex flex-wrap align-items-center gap-2">
                                <ActiveTag active={fan.active} />
                                <Tag value={`Registrado ${formatDateTime(fan.createdAt)}`} severity="info" />
                                <Tag value={`${fan.favoriteTeamsCount} favoritos`} severity="success" />
                            </div>
                        )}
                    </div>

                    {notRegistered && (
                        <Message
                            severity="info"
                            text="Aún no tienes una ficha de aficionado vinculada a tu cuenta. Completa este formulario para habilitar boletos, apuestas y favoritos."
                            className="w-full mb-3"
                        />
                    )}

                    {profileInactive && (
                        <Message
                            severity="warn"
                            text="Tu perfil de aficionado se encuentra inactivo. Comunícate con un administrador deportivo para reactivarlo."
                            className="w-full mb-3"
                        />
                    )}

                    {notRegistered && !canRegister ? (
                        <EmptyState icon="pi-lock" title="No tienes permiso para autorregistrar tu perfil de aficionado." />
                    ) : (
                        <form onSubmit={handleSubmit} className="p-fluid" noValidate>
                            {serverError && <Message severity="error" text={serverError} className="w-full mb-3" />}

                            <div className="formgrid grid">
                                <div className="field col-12 md:col-6">
                                    <label htmlFor="my-fan-name">Nombre completo</label>
                                    <InputText
                                        id="my-fan-name"
                                        value={values.fullName}
                                        onChange={(event) => setValues((current) => ({ ...current, fullName: event.target.value }))}
                                        disabled={!canSubmitForm}
                                        className={invalidClass('fullName')}
                                    />
                                    {fieldError('fullName') && <small className="p-error">{fieldError('fullName')}</small>}
                                </div>

                                <div className="field col-12 md:col-6">
                                    <label htmlFor="my-fan-document">Documento de identidad</label>
                                    <InputText
                                        id="my-fan-document"
                                        value={values.documentNumber}
                                        onChange={(event) => setValues((current) => ({ ...current, documentNumber: event.target.value }))}
                                        disabled={!canSubmitForm}
                                        placeholder="Ej. 1053800123"
                                        className={invalidClass('documentNumber')}
                                    />
                                    {fieldError('documentNumber') && <small className="p-error">{fieldError('documentNumber')}</small>}
                                </div>

                                <div className="field col-12 md:col-6">
                                    <label htmlFor="my-fan-email">Correo electrónico</label>
                                    <InputText
                                        id="my-fan-email"
                                        type="email"
                                        value={values.email}
                                        onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
                                        disabled={!canSubmitForm}
                                        className={invalidClass('email')}
                                    />
                                    {fieldError('email') && <small className="p-error">{fieldError('email')}</small>}
                                </div>

                                <div className="field col-12 md:col-6">
                                    <label htmlFor="my-fan-phone">Teléfono (opcional)</label>
                                    <InputText
                                        id="my-fan-phone"
                                        value={values.phone}
                                        onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))}
                                        disabled={!canSubmitForm}
                                        placeholder="Ej. 3001234567"
                                        className={invalidClass('phone')}
                                    />
                                    {fieldError('phone') && <small className="p-error">{fieldError('phone')}</small>}
                                </div>
                            </div>

                            {canSubmitForm && (
                                <div className="flex justify-content-end mt-2">
                                    <Button
                                        type="submit"
                                        label={notRegistered ? 'Registrar perfil' : 'Guardar cambios'}
                                        icon="pi pi-check"
                                        className="w-auto"
                                        loading={saving}
                                    />
                                </div>
                            )}
                        </form>
                    )}
                </div>
            )}

            {canViewFavorites && (
                <div className="card">
                    <h5 className="mt-0">Mis equipos favoritos</h5>
                    <FavoriteTeamsPanel
                        favorites={favorites}
                        teams={teams}
                        loading={loadingFavorites}
                        error={favoritesError}
                        profileMissing={notRegistered}
                        profileInactive={profileInactive}
                        canAdd={canAddFavorite}
                        canRemove={canRemoveFavorite}
                        canLoadTeams={canLoadTeams}
                        canViewTeamDetail={canViewTeamDetail}
                        onAdd={handleAddFavorite}
                        onRemove={handleRemoveFavorite}
                    />
                </div>
            )}
        </>
    );
}
