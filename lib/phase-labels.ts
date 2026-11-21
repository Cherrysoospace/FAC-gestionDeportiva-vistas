import { FinalRound } from '@/types/sports';

export const FINAL_ROUND_LABELS: Record<FinalRound, string> = {
    ROUND_OF_16: 'Octavos de final',
    QUARTER_FINAL: 'Cuartos de final',
    SEMI_FINAL: 'Semifinal',
    THIRD_PLACE: 'Tercer puesto',
    FINAL: 'Final'
};

export const FINAL_ROUND_OPTIONS = (Object.keys(FINAL_ROUND_LABELS) as FinalRound[]).map((round) => ({ label: FINAL_ROUND_LABELS[round], value: round }));

