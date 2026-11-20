import { Tag } from 'primereact/tag';

// Etiqueta Activo / Inactivo de los registros que se desactivan en lugar de borrarse.
export default function ActiveTag({ active }: { active: boolean }) {
    return active ? <Tag value="Activo" severity="success" /> : <Tag value="Inactivo" severity="danger" />;
}
