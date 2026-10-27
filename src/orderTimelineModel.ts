import { orderStatusLabel } from './format';

const progress = ['pending', 'paid', 'accepted', 'in_progress', 'work_submitted', 'completed'];
const outcomes = ['cancelled', 'refunded', 'rejected', 'resolved', 'under_dispute'];

export function orderTimeline(status: string, paymentStatus?: string | null) {
  if (!progress.includes(status) && !outcomes.includes(status)) {
    return [{ status, label: orderStatusLabel(status), state: 'current' }];
  }
  if (outcomes.includes(status)) {
    return [
      { status: 'pending', label: 'Order Placed', state: 'complete' },
      ...(paymentStatus === 'simulated' ? [{ status: 'paid', label: 'Paid', state: 'complete' }] : []),
      { status, label: orderStatusLabel(status), state: 'current' },
    ];
  }
  const index = Math.max(progress.indexOf(status), 0);
  return progress.map((step, i) => ({
    status: step,
    label: step === 'pending' ? (status === 'pending' && paymentStatus === 'awaiting_payment' ? 'Awaiting Payment' : 'Order Placed') : orderStatusLabel(step),
    state: i < index ? 'complete' : i === index ? 'current' : 'future',
  }));
}
