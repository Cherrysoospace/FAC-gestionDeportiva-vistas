'use client';

import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { parseIsoDate } from '@/lib/dates';
import { PhaseBaseErrors, PhaseBaseValues, PhaseDateRange } from '@/lib/phase-form';

interface PhaseCommonFieldsProps {
    idPrefix: string;
    values: PhaseBaseValues;
    errors: PhaseBaseErrors;
    /** Fechas del torneo: acotan el calendario de la fase */
    range: PhaseDateRange;
    onChange: (patch: Partial<PhaseBaseValues>) => void;
}

// Nombre, orden y fechas: campos que comparten las fases de grupos y las fases finales.
export default function PhaseCommonFields({ idPrefix, values, errors, range, onChange }: PhaseCommonFieldsProps) {
    const invalidClass = (field: keyof PhaseBaseValues) => (errors[field] ? 'p-invalid' : undefined);
    const minDate = parseIsoDate(range.startDate) ?? undefined;
    const maxDate = parseIsoDate(range.endDate) ?? undefined;

    return (
        <>
            <div className="field">
                <label htmlFor={`${idPrefix}-name`}>Nombre de la fase</label>
                <InputText id={`${idPrefix}-name`} value={values.name} onChange={(event) => onChange({ name: event.target.value })} className={invalidClass('name')} autoFocus />
                {errors.name && <small className="p-error">{errors.name}</small>}
            </div>

            <div className="field">
                <label htmlFor={`${idPrefix}-order`}>Orden</label>
                <InputNumber inputId={`${idPrefix}-order`} value={values.order} onValueChange={(event) => onChange({ order: event.value ?? null })} min={1} useGrouping={false} showButtons className={invalidClass('order')} />
                {errors.order ? <small className="p-error">{errors.order}</small> : <small className="text-600">Posición de la fase dentro del torneo. Un mismo orden no puede mezclar grupos y fases finales.</small>}
            </div>

            <div className="formgrid grid">
                <div className="field col-12 md:col-6">
                    <label htmlFor={`${idPrefix}-start`}>Fecha de inicio (opcional)</label>
                    <Calendar inputId={`${idPrefix}-start`} value={values.startDate} onChange={(event) => onChange({ startDate: (event.value as Date | null) ?? null })} dateFormat="dd/mm/yy" placeholder="dd/mm/aaaa" minDate={minDate} maxDate={maxDate} showIcon showButtonBar className={invalidClass('startDate')} />
                    {errors.startDate && <small className="p-error">{errors.startDate}</small>}
                </div>
                <div className="field col-12 md:col-6">
                    <label htmlFor={`${idPrefix}-end`}>Fecha de fin (opcional)</label>
                    <Calendar inputId={`${idPrefix}-end`} value={values.endDate} onChange={(event) => onChange({ endDate: (event.value as Date | null) ?? null })} dateFormat="dd/mm/yy" placeholder="dd/mm/aaaa" minDate={values.startDate ?? minDate} maxDate={maxDate} showIcon showButtonBar className={invalidClass('endDate')} />
                    {errors.endDate && <small className="p-error">{errors.endDate}</small>}
                </div>
            </div>
        </>
    );
}

