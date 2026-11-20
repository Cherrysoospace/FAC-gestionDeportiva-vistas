'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { TabPanel, TabView } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import ActiveTag from '@/components/ui/ActiveTag';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { useAuth } from '@/layout/context/authcontext';
import ProtectedRoute from '@/layout/ProtectedRoute';
import { FormActionResult } from '@/lib/form-action';
import { LocationFormValues, toCreateLocationPayload, toUpdateLocationPayload } from '@/lib/location-form';
import { LOCATION_CREATE_ENDPOINT, LOCATION_DELETE_ENDPOINT, LOCATION_UPDATE_ENDPOINT, LOCATIONS_LIST_ENDPOINT, VENUE_CREATE_ENDPOINT, VENUE_DETAIL_ENDPOINTS, VENUE_UPDATE_ENDPOINT } from '@/lib/venue-constants';
import { toCreateVenuePayload, toUpdateVenuePayload, VenueFormValues } from '@/lib/venue-form';
import { ActionResult } from '@/types/action';
import { EndpointRequirement } from '@/types/security';
import { Location, Venue, VenueChild, VenueParent } from '@/types/sports';
import LocationFormDialog from '../components/LocationFormDialog';
import LocationsPanel from '../components/LocationsPanel';
import VenueFormDialog from '../components/VenueFormDialog';
import { useLocations } from '../hooks/useLocations';
import { useVenueDetail } from '../hooks/useVenueDetail';
import { useVenueOptions } from '../../hooks/useVenueOptions';

interface VenueDetailPageProps {
    params: { id: string };
}

export default function VenueDetailPage({ params }: VenueDetailPageProps) {
    return (
        <ProtectedRoute requiredEndpoints={VENUE_DETAIL_ENDPOINTS}>
            <VenueDetailContent venueId={Number(params.id)} />
        </ProtectedRoute>
    );
}

type VenueDialog = 'edit' | 'child' | null;
type LocationDialog = { visible: boolean; location: Location | null };

function VenueDetailContent({ venueId }: { venueId: number }) {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl } = useAuth();
    const [venueDialog, setVenueDialog] = useState<VenueDialog>(null);
    const [locationDialog, setLocationDialog] = useState<LocationDialog>({ visible: false, location: null });

    const can = (...endpoints: EndpointRequirement[]) => endpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    const canUpdate = can(VENUE_UPDATE_ENDPOINT);
    const canCreateChild = can(VENUE_CREATE_ENDPOINT);
    const canListLocations = can(LOCATIONS_LIST_ENDPOINT);
    const canCreateLocation = can(LOCATION_CREATE_ENDPOINT);
    const canUpdateLocation = can(LOCATION_UPDATE_ENDPOINT);
    const canDeleteLocation = can(LOCATION_DELETE_ENDPOINT);

    const { venue, loading, loadError, reload, update, createChild } = useVenueDetail(venueId);
    const locations = useLocations(venueId, canListLocations, reload);
    const { venues: parentOptions } = useVenueOptions(canUpdate);

    // Objeto estable: el formulario se reinicia cuando cambia el padre fijo
    const fixedParent = useMemo<VenueParent | null>(() => (venueDialog === 'child' && venue ? { id: venue.id, name: venue.name } : null), [venueDialog, venue]);

    const notify = (result: ActionResult, successText: string, errorSummary = 'No se pudo completar') =>
        toast.current?.show(result.ok ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 } : { severity: 'error', summary: errorSummary, detail: result.error, life: 6000 });

    const handleVenueSubmit = async (values: VenueFormValues): Promise<FormActionResult> => {
        if (!venue) return { ok: false };
        const creatingChild = venueDialog === 'child';
        const result = creatingChild ? await createChild(toCreateVenuePayload(values)) : await update(toUpdateVenuePayload(values, venue));
        if (result.ok || !result.validation) notify(result, creatingChild ? 'Espacio interno creado.' : 'Escenario actualizado.');
        return result;
    };

    const handleLocationSubmit = async (values: LocationFormValues): Promise<FormActionResult> => {
        const editing = locationDialog.location;
        const result = editing ? await locations.update(editing.id, toUpdateLocationPayload(values, editing)) : await locations.create(toCreateLocationPayload(values, venueId));
        if (result.ok || !result.validation) notify(result, editing ? 'Localidad actualizada.' : 'Localidad creada.');
        return result;
    };

    const handleDeleteLocation = (location: Location) =>
        confirmDialog({
            header: 'Eliminar localidad',
            message: `¿Eliminar la localidad "${location.name}"? Si ya no se usa, también puedes desactivarla desde Editar.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                const result = await locations.remove(location.id);
                notify(result, `La localidad "${location.name}" fue eliminada.`, 'No se puede eliminar la localidad');
            }
        });

    const actions = (
        <div className="flex flex-wrap gap-2">
            <Button label="Volver al listado" icon="pi pi-arrow-left" text onClick={() => router.push('/escenarios')} />
            {venue && canUpdate && <Button label="Editar" icon="pi pi-pencil" outlined onClick={() => setVenueDialog('edit')} />}
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            <PageHeader
                title={venue?.name ?? 'Detalle del escenario'}
                subtitle={venue ? (venue.parent ? `Espacio interno de ${venue.parent.name}` : venue.address ?? 'Escenario principal') : 'Información del escenario, sus localidades y espacios internos.'}
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Escenarios', href: '/escenarios' }, ...(venue?.parent ? [{ label: venue.parent.name, href: `/escenarios/${venue.parent.id}` }] : []), { label: venue?.name ?? 'Detalle' }]}
                actions={actions}
            />

            {loadError && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message severity="error" text={loadError} className="w-full" />
                    <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
                </div>
            )}

            {loading && !venue && <Skeleton height="18rem" />}

            {venue && (
                <>
                    <div className="grid">
                        <div className="col-12 md:col-4">
                            <StatCard label="Localidades" value={venue.locationsCount} icon="pi-ticket" />
                        </div>
                        <div className="col-12 md:col-4">
                            <StatCard label="Capacidad habilitada" value={venue.totalCapacity.toLocaleString('es-CO')} icon="pi-users" />
                        </div>
                        <div className="col-12 md:col-4">
                            <StatCard label="Espacios internos" value={venue.children?.length ?? 0} icon="pi-sitemap" />
                        </div>
                    </div>
                    <div className="card">
                        <div className="flex flex-wrap align-items-center gap-2 mb-3">
                            <ActiveTag active={venue.active} />
                        </div>
                        <TabView>
                            <TabPanel header="Información">
                                <VenueInfo venue={venue} />
                            </TabPanel>
                            {canListLocations && (
                                <TabPanel header="Localidades">
                                    <LocationsPanel
                                        locations={locations.locations}
                                        loading={locations.loading}
                                        error={locations.error}
                                        canCreate={canCreateLocation && venue.active}
                                        canUpdate={canUpdateLocation}
                                        canDelete={canDeleteLocation}
                                        onCreate={() => setLocationDialog({ visible: true, location: null })}
                                        onEdit={(location) => setLocationDialog({ visible: true, location })}
                                        onDelete={handleDeleteLocation}
                                    />
                                </TabPanel>
                            )}
                            <TabPanel header="Espacios internos">
                                <ChildVenues items={venue.children ?? []} canCreate={canCreateChild && venue.active} onCreate={() => setVenueDialog('child')} />
                            </TabPanel>
                        </TabView>
                        {!venue.active && <Message severity="info" text="El escenario está inactivo: no se le pueden crear localidades ni espacios internos hasta reactivarlo desde Editar." className="w-full mt-3" />}
                    </div>
                </>
            )}

            <VenueFormDialog visible={venueDialog !== null} venue={venueDialog === 'edit' ? venue : null} fixedParent={fixedParent} parentOptions={parentOptions} onHide={() => setVenueDialog(null)} onSubmit={handleVenueSubmit} />
            <LocationFormDialog visible={locationDialog.visible} location={locationDialog.location} venueName={venue?.name ?? ''} onHide={() => setLocationDialog({ visible: false, location: null })} onSubmit={handleLocationSubmit} />
        </>
    );
}

function VenueInfo({ venue }: { venue: Venue }) {
    const rows: [string, string | number][] = [
        ['Nombre', venue.name],
        ['Dirección', venue.address ?? 'Sin dirección'],
        ['Pertenece a', venue.parent?.name ?? 'Escenario principal'],
        ['Localidades', venue.locationsCount],
        ['Capacidad habilitada (localidades activas)', `${venue.totalCapacity.toLocaleString('es-CO')} personas`]
    ];

    return (
        <ul className="list-none p-0 m-0">
            {rows.map(([label, value]) => (
                <li key={label} className="flex flex-column sm:flex-row sm:justify-content-between py-2 border-bottom-1 surface-border">
                    <span className="text-600">{label}</span>
                    <span className="text-900 font-medium">{value}</span>
                </li>
            ))}
        </ul>
    );
}

function ChildVenues({ items, canCreate, onCreate }: { items: VenueChild[]; canCreate: boolean; onCreate: () => void }) {
    return (
        <div>
            {canCreate && (
                <div className="flex justify-content-end mb-3">
                    <Button label="Nuevo espacio interno" icon="pi pi-plus" onClick={onCreate} />
                </div>
            )}
            {items.length === 0 ? (
                <EmptyState icon="pi-sitemap" title="El escenario no tiene espacios internos." description="Por ejemplo, las canchas o coliseos dentro de un complejo deportivo." />
            ) : (
                <ul className="list-none p-0 m-0">
                    {items.map((child) => (
                        <li key={child.id} className="flex align-items-center justify-content-between py-2 border-bottom-1 surface-border">
                            <Link href={`/escenarios/${child.id}`} className="text-900 font-medium">
                                {child.name}
                            </Link>
                            <ActiveTag active={child.active} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
