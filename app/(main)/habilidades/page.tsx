'use client';

import { ReactNode, useMemo, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import SearchInput from '@/components/ui/SearchInput';
import { useAuth } from '@/layout/context/authcontext';
import ProtectedRoute from '@/layout/ProtectedRoute';
import { FormActionResult } from '@/lib/form-action';
import { skillsClient } from '@/lib/skill-api';
import {
    SKILL_CATEGORY_LABELS,
    SKILL_CATEGORY_OPTIONS,
    SKILL_CATEGORY_SEVERITY,
    SKILL_CREATE_ENDPOINT,
    SKILL_DELETE_ENDPOINT,
    SKILL_DETAIL_ENDPOINT,
    SKILL_UPDATE_ENDPOINT,
    SKILLS_VIEW_ENDPOINTS
} from '@/lib/skill-constants';
import { PLAYER_SKILLS_LIST_ENDPOINT } from '@/lib/player-constants';
import { SkillFormValues, toCreateSkillPayload, toUpdateSkillPayload } from '@/lib/skill-form';
import { ActionResult } from '@/types/action';
import { EndpointRequirement } from '@/types/security';
import { Skill, SkillCategory } from '@/types/sports';
import { useResourceList } from '../hooks/useResourceList';
import SkillDetailDialog from './components/SkillDetailDialog';
import SkillFormDialog from './components/SkillFormDialog';

const SKELETON_ROWS: Skill[] = Array.from({ length: 5 }, (_, index) => ({ id: -(index + 1), name: '', category: 'PHYSICAL', description: '' }));

const CATEGORY_FILTER_OPTIONS = [{ label: 'Todas las categorías', value: null }, ...SKILL_CATEGORY_OPTIONS];

type DialogState = { visible: boolean; skill: Skill | null };

export default function SkillsPage() {
    return (
        <ProtectedRoute requiredEndpoints={SKILLS_VIEW_ENDPOINTS}>
            <SkillsContent />
        </ProtectedRoute>
    );
}

function SkillsContent() {
    const toast = useRef<Toast>(null);
    const { hasPermissionUrl } = useAuth();

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<SkillCategory | null>(null);
    const [dialog, setDialog] = useState<DialogState>({ visible: false, skill: null });

    const can = (...endpoints: EndpointRequirement[]) => endpoints.every((endpoint) => hasPermissionUrl(endpoint.url, endpoint.method));
    const canCreate = can(SKILL_CREATE_ENDPOINT);
    const canUpdate = can(SKILL_UPDATE_ENDPOINT);
    const canDelete = can(SKILL_DELETE_ENDPOINT);
    const canViewDetail = can(SKILL_DETAIL_ENDPOINT);
    const canListPlayers = can(PLAYER_SKILLS_LIST_ENDPOINT);
    const hasActions = canViewDetail || canUpdate || canDelete;
    const [detailSkillId, setDetailSkillId] = useState<number | null>(null);

    const { items: skills, loading, error, reload, create, update, remove } = useResourceList(skillsClient);

    const filtered = useMemo(() => {
        const text = search.trim().toLowerCase();
        return skills.filter((skill) => {
            if (text && !skill.name.toLowerCase().includes(text)) return false;
            if (category !== null && skill.category !== category) return false;
            return true;
        });
    }, [skills, search, category]);

    const closeDialog = () => setDialog({ visible: false, skill: null });

    const notify = (result: ActionResult, successText: string, errorSummary = 'No se pudo completar') =>
        toast.current?.show(result.ok ? { severity: 'success', summary: 'Listo', detail: successText, life: 3000 } : { severity: 'error', summary: errorSummary, detail: result.error, life: 6000 });

    const handleSubmit = async (values: SkillFormValues): Promise<FormActionResult> => {
        const editing = dialog.skill;
        const result = editing ? await update(editing.id, toUpdateSkillPayload(values, editing)) : await create(toCreateSkillPayload(values));
        if (result.ok || !result.validation) notify(result, editing ? 'Habilidad actualizada.' : 'Habilidad creada.');
        return result;
    };

    const handleDelete = (skill: Skill) =>
        confirmDialog({
            header: 'Eliminar habilidad',
            message: `¿Eliminar "${skill.name}"? Si hay jugadores que la tienen asignada no se puede eliminar: primero retírala de sus perfiles.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                const result = await remove(skill.id);
                // 409: el backend indica qué lo bloquea
                notify(result, `"${skill.name}" fue eliminada.`, 'No se puede eliminar la habilidad');
            }
        });

    const cell = (render: (skill: Skill) => ReactNode, width = '6rem') =>
        function CellBody(skill: Skill) {
            return loading ? <Skeleton width={width} /> : render(skill);
        };

    const nameBody = cell((skill) => <span className="text-900 font-medium">{skill.name}</span>, '8rem');
    const categoryBody = cell((skill) => <Tag value={SKILL_CATEGORY_LABELS[skill.category]} severity={SKILL_CATEGORY_SEVERITY[skill.category]} />, '5rem');
    const descriptionBody = cell((skill) => skill.description, '16rem');

    const actionsBody = (skill: Skill) => {
        if (loading) return <Skeleton width="6rem" height="2rem" />;
        return (
            <div className="flex gap-1">
                {canViewDetail && <Button icon="pi pi-eye" rounded text tooltip="Ver detalle" tooltipOptions={{ position: 'top' }} aria-label={`Ver detalle de ${skill.name}`} onClick={() => setDetailSkillId(skill.id)} />}
                {canUpdate && <Button icon="pi pi-pencil" rounded text tooltip="Editar" tooltipOptions={{ position: 'top' }} aria-label={`Editar ${skill.name}`} onClick={() => setDialog({ visible: true, skill })} />}
                {canDelete && <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Eliminar" tooltipOptions={{ position: 'top' }} aria-label={`Eliminar ${skill.name}`} onClick={() => handleDelete(skill)} />}
            </div>
        );
    };

    const hasFilters = Boolean(search.trim()) || category !== null;

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            <PageHeader
                title="Habilidades"
                subtitle="Administra el catálogo de habilidades (físicas, técnicas, tácticas y mentales) que se asignan a los jugadores."
                breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Habilidades' }]}
                actions={canCreate && <Button label="Nueva habilidad" icon="pi pi-plus" onClick={() => setDialog({ visible: true, skill: null })} />}
            />

            {error && (
                <div className="flex flex-column sm:flex-row sm:align-items-center gap-3 mb-4">
                    <Message severity="error" text={error} className="w-full" />
                    <Button label="Reintentar" icon="pi pi-refresh" outlined onClick={reload} />
                </div>
            )}

            <div className="card">
                <h5>Lista de habilidades {!loading && <span className="text-600 font-normal">({filtered.length})</span>}</h5>
                <div className="grid mb-2">
                    <div className="col-12 md:col-6 lg:col-4">
                        <SearchInput value={search} onChange={setSearch} ariaLabel="Buscar habilidades por nombre" placeholder="Buscar habilidad" className="w-full" />
                    </div>
                    <div className="col-12 md:col-6 lg:col-4">
                        <Dropdown value={category} options={CATEGORY_FILTER_OPTIONS} onChange={(event) => setCategory((event.value as SkillCategory | null) ?? null)} aria-label="Filtrar por categoría" className="w-full" />
                    </div>
                </div>

                <DataTable
                    value={loading ? SKELETON_ROWS : filtered}
                    dataKey="id"
                    paginator={!loading && filtered.length > 10}
                    rows={10}
                    emptyMessage={<EmptyState icon="pi-bolt" title={hasFilters ? 'Ninguna habilidad coincide con los filtros.' : 'No hay habilidades registradas.'} />}
                >
                    <Column header="Habilidad" body={nameBody} />
                    <Column header="Categoría" body={categoryBody} />
                    <Column header="Descripción" body={descriptionBody} />
                    {hasActions && <Column header="Acciones" body={actionsBody} headerClassName="w-10rem" />}
                </DataTable>
            </div>

            <SkillDetailDialog skillId={detailSkillId} canListPlayers={canListPlayers} onHide={() => setDetailSkillId(null)} />

            <SkillFormDialog visible={dialog.visible} skill={dialog.skill} onHide={closeDialog} onSubmit={handleSubmit} />
        </>
    );
}

