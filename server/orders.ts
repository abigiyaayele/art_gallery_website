import fs from 'fs';
import path from 'path';

export interface Order {
  txRef: string;
  kind: 'artwork' | 'deposit';
  artworkId?: number;
  amount: number;
  currency: 'USD';
  email: string;
  name: string;
  phone?: string;
  shipping?: Record<string, string>;
  note?: string;
  status: 'pending' | 'paid' | 'failed';
  createdAt: string;
  paidAt?: string;
}

const file = process.env.ORDERS_FILE || path.resolve('server/data/orders.json');

function load(): Order[] {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function save(orders: Order[]) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(orders, null, 2));
}

/** Small JSON-file order store. Fine for one server; swap for a database when traffic grows. */
export const orders = {
  add(order: Order) {
    const all = load();
    all.push(order);
    save(all);
  },
  get(txRef: string): Order | undefined {
    return load().find(o => o.txRef === txRef);
  },
  update(txRef: string, changes: Partial<Order>): Order | undefined {
    const all = load();
    const order = all.find(o => o.txRef === txRef);
    if (!order) return undefined;
    Object.assign(order, changes);
    save(all);
    return order;
  },
  soldArtworkIds(): number[] {
    return load()
      .filter(o => o.kind === 'artwork' && o.status === 'paid' && o.artworkId !== undefined)
      .map(o => o.artworkId!);
  },
};
