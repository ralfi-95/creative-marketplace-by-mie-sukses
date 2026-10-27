export function canTransitionOrder(from:string,to:string,actorId:string,buyerId:string,sellerId:string):boolean {
 return (actorId===sellerId&&from==='paid'&&(to==='accepted'||to==='rejected'))||
  (actorId===sellerId&&from==='accepted'&&to==='in_progress')||
  (actorId===buyerId&&from==='work_submitted'&&to==='completed');
}
