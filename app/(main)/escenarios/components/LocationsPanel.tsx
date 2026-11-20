'use client';

import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import EmptyState from '@/components/ui/EmptyState';
import { Location } from '@/types/sports';

interface LocationsPanelProps {
    locations: Location[];
    loading: boolean;
    error: string | null;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    onCreate: () => void;
    onEdit: (location: Location) => void;
    onDelete: (location: Location) => void;
}

const formatCapacity = (capacity: number) => capacity.toLocaleString('es-CO');

// Localidades (tribunas o sectores) de un escenario con su capacidad.
export default function LocationsPanel({ locations, loading, error, canCreate, canUpdate, canDelete, onCreate, onEdit, onDelete }: LocationsPanelProps) {
    if (error) return <Message severity="error" text={error} className="w-full" />;

    const activeCapacity = locations.filter((location) => location.active).reduce((total, location) => total + location.capacity, 0);

    const actionsBody = (location: Location) => (
        <div className="flex gap-1">
            {canUpdate && <Button icon="pi pi-pencil" rounded text tooltip="Editar" tooltipOptions={{ position: 'top' }} aria-label={`Editar ${location.name}`} onClick={() => onEdit(location)} />}
            {canDelete && <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Eliminar" tooltipOptions={{ position: 'top' }} aria-label={`Eliminar ${location.name}`} onClick={() => onDelete(location)} />}
        </div>
    );

    return (
        <div>
            <div className="flex flex-column sm:flex-row sm:align-items-center justify-content-between gap-2 mb-3">
                <span className="text-600">
                    Capacidad habilitada: <span className="text-900 font-medium">{formatCapacity(activeCapacity)} personas</span> (solo localidades activas)
                </span>
                {canCreate && <Button label="Nueva localidad" icon="pi pi-plus" onClick={onCreate} />}
            </div>
            <DataTable value={locations} dataKey="id" loading={loading} emptyMessage={<EmptyState icon="pi-ticket" title="El escenario no tiene localidades." description="Crea localidades (Norte, Sur, VIP...) para vender boletos por sector." />}>
                <Column field="name" header="Localidad" body={(location: Location) => <span className={location.active ? 'text-900 font-medium' : 'text-500 font-medium'}>{location.name}</span>} />
                <Column header="Capacidad" body={(location: Location) => formatCapacity(location.capacity)} />
                <Column header="Estado" body={(location: Location) => (location.active ? <Tag value="Activa" severity="success" /> : <Tag value="Inactiva" severity="danger" />)} />
                {(canUpdate || canDelete) && <Column header="Acciones" body={actionsBody} headerClassName="w-8rem" />}
            </DataTable>
        </div>
    );
}
