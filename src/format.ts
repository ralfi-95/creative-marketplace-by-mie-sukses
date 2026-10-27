export const formatRupiah=(value:number|string|bigint)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(typeof value==='bigint'?value:typeof value==='string'&&/^-?\d+$/.test(value)?BigInt(value):Number(value));

export function orderStatusLabel(status:string){
 return ({pending:'Pending',paid:'Paid',accepted:'Accepted',in_progress:'Work In Progress',work_submitted:'Work Submitted',under_dispute:'Under Dispute',completed:'Completed',resolved:'Resolved',cancelled:'Cancelled',rejected:'Rejected',refunded:'Refunded'} as Record<string,string>)[status]||'Order update';
}

export function roleLabel(role:string){return role==='buyer'?'Customer':role==='seller'?'Freelancer':role==='admin'?'Admin':'Account';}

const labels:Record<string,string>={bank_transfer:'Bank Transfer',e_wallet:'E-Wallet',qris:'QRIS',me_wallet:'Me-Wallet',marketplace:'Marketplace',legacy_untracked:'Historical Payment',payout_reserved:'Payout Reserved',payout_release:'Payout Released',top_up:'Top Up',order_payment:'Order Payment',order_earning:'Order Earning',refund:'Refund',withdrawal:'Withdrawal',awaiting_payment:'Awaiting Payment',simulated:'Simulated',completed:'Completed',resolved:'Resolved',rejected:'Rejected',pending:'Pending',approved:'Approved',refunded:'Refunded',reversed:'Reversed',open:'Open'};
const titleCase=(value:string)=>value.replaceAll('_',' ').replace(/\b\w/g,letter=>letter.toUpperCase());

export function statusTone(status:string){
 if(['paid','accepted','work_submitted','completed','resolved','approved','released','simulated'].includes(status))return 'success';
 if(['pending','awaiting_payment','in_progress','payout_reserved','open'].includes(status))return 'warning';
 if(['under_dispute','cancelled','rejected','refunded','reversed','failed'].includes(status))return 'danger';
 return 'neutral';
}
export function statusLabel(status:string){return labels[status]||titleCase(status);}

export function paymentMethodLabel(method:string|null|undefined,provider?:string|null){
 const label=method?statusLabel(method):'Payment';
 return provider?`${label} · ${provider}`:label;
}

export function transactionTypeLabel(type:string){return statusLabel(type);}

export function transactionStatusLabel(status:string,transactionType?:string){
 const state=statusLabel(status);
 return transactionType==='refund'?`Refunded · ${state}`:transactionType==='order_payment'?`Payment · ${state}`:state;
}

export function simulatedPaymentReference(method:string,provider:string|null|undefined,phone:string|undefined,reference:string){
 const providerToken=(provider||'PAYMENT').toUpperCase().replace(/[^A-Z0-9]/g,'');
 const transaction=reference.replaceAll('-','').slice(-10).toUpperCase();
 return method==='e_wallet'?`DEMO-${providerToken}-${phone?.replace(/\D/g,'')||transaction}`:method==='bank_transfer'?`DEMO-${providerToken}-${transaction}`:`DEMO-QRIS-${transaction}`;
}

export function signedRupiah(amount:number|string){const value=Number(amount);return `${value<0?'−':'+'}${formatRupiah(Math.abs(value))}`;}

export function signedTransactionRupiah(_type:string,amount:number|string){return signedRupiah(amount);}

export const contactEmailPlaceholder='hello@example.com';
