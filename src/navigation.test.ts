import { describe, expect, it } from 'vitest';
import { roleNavItems } from './navigation';

describe('role-specific navigation', () => {
  it('keeps seller tools after shared navigation in the requested order', () => {
    expect(roleNavItems('seller').map(item => item.label)).toEqual(['My Services', 'Projects', 'Sales']);
  });
  it('shows only the approved admin tools inside Administration', () => {
    const items = roleNavItems('admin');
    expect(items.slice(0, 2).map(item => item.label)).toEqual(['Administrative History', 'Issues']);
    expect(items[2].children?.map(item => item.label)).toEqual(['Service Moderation', 'Role Application']);
    expect(roleNavItems('buyer')).toEqual([]);
  });
});
