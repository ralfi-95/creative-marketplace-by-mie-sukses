import { describe, expect, it } from 'vitest';
import { orderTimeline } from './orderTimelineModel';

describe('order history timeline', () => {
  it('uses the current order state and payment state', () => {
    expect(orderTimeline('pending', 'awaiting_payment')[0]).toMatchObject({ label: 'Awaiting Payment', state: 'current' });
    expect(orderTimeline('paid')[0].state).toBe('complete');
    expect(orderTimeline('paid')[1].state).toBe('current');
    expect(orderTimeline('paid').at(-1)?.state).toBe('future');
  });

  it('shows terminal outcomes without later normal progress steps', () => {
    for (const status of ['completed', 'cancelled', 'refunded', 'rejected', 'resolved', 'under_dispute']) {
      const steps = orderTimeline(status);
      expect(steps.at(-1)).toMatchObject({ status, state: 'current' });
      if (status !== 'completed') expect(steps.some(step => step.state === 'future')).toBe(false);
    }
    expect(orderTimeline('completed').at(-1)?.state).toBe('current');
    expect(orderTimeline('cancelled', 'simulated').map(step => step.status)).toEqual(['pending', 'paid', 'cancelled']);
    expect(orderTimeline('future_state')).toHaveLength(1);
  });
});
