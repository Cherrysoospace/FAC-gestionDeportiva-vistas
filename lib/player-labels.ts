import { ContractStage, DominantFoot, ReleaseReason, SkillCategory } from '@/types/sports';
import { TagSeverity } from './tournament-labels';

export const DOMINANT_FOOT_LABELS: Record<DominantFoot, string> = {
    RIGHT: 'Derecho',
    LEFT: 'Izquierdo',
    BOTH: 'Ambos'
};

export const DOMINANT_FOOT_OPTIONS = (Object.keys(DOMINANT_FOOT_LABELS) as DominantFoot[]).map((foot) => ({ label: DOMINANT_FOOT_LABELS[foot], value: foot }));

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
    PHYSICAL: 'Física',
    TECHNICAL: 'Técnica',
    TACTICAL: 'Táctica',
    MENTAL: 'Mental'
};

export const SKILL_CATEGORY_SEVERITY: Record<SkillCategory, TagSeverity> = {
    PHYSICAL: 'success',
    TECHNICAL: 'info',
    TACTICAL: 'warning',
    MENTAL: null
};

export const CONTRACT_STAGE_LABELS: Record<ContractStage, string> = {
    CURRENT: 'Vigente',
    UPCOMING: 'Próximo',
    PAST: 'Finalizado'
};

export const CONTRACT_STAGE_SEVERITY: Record<ContractStage, TagSeverity> = {
    CURRENT: 'success',
    UPCOMING: 'info',
    PAST: null
};

// Motivo de salida en el historial de traspasos
export const RELEASE_REASON_LABELS: Record<ReleaseReason, string> = {
    TRANSFERRED: 'Transferido',
    CONTRACT_ENDED: 'Finalizó contrato',
    TERMINATED: 'Contrato rescindido'
};

export const RELEASE_REASON_OPTIONS = (Object.keys(RELEASE_REASON_LABELS) as ReleaseReason[]).map((reason) => ({ label: RELEASE_REASON_LABELS[reason], value: reason }));

// 180 → '1,80 m'
export function formatHeight(heightCm: number): string {
    return `${(heightCm / 100).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;
}

// Mismo formato con que el backend guarda el documento: sin puntos ni espacios, en mayúsculas
export function normalizeDocument(value: string): string {
    return value.replace(/[.\s]/g, '').toUpperCase();
}
