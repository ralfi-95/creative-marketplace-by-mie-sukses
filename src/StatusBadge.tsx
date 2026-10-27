import { statusLabel, statusTone } from './format';

export function StatusBadge({status,label}:{status:string;label?:string}){
 return <span className={`status status-${statusTone(status)}`}>{label||statusLabel(status)}</span>;
}
