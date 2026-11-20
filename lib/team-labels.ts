import { TeamModality } from '@/types/sports';

export const TEAM_MODALITY_LABELS: Record<TeamModality, string> = {
    MALE: 'Masculina',
    FEMALE: 'Femenina',
    MIXED: 'Mixta'
};

export const TEAM_MODALITIES: TeamModality[] = ['MALE', 'FEMALE', 'MIXED'];

export const TEAM_MODALITY_OPTIONS = TEAM_MODALITIES.map((modality) => ({ label: TEAM_MODALITY_LABELS[modality], value: modality }));
