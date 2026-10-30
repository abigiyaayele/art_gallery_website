/** Numbers for the dashboard's overview page. Money is grouped by currency. */
export interface OverviewData {
  artworks: { draft: number; available: number; sold: number; onSale: number };
  soldThisMonth: { count: number; totals: { currency: string; cents: number }[] };
  revenue30d: { currency: string; cents: number }[];
  orders: { pending: number; toShip: number };
  inquiries: { new: number };
  views: { day: string; views: number }[];
  topPages: { path: string; views: number }[];
  recent: { kind: 'sold' | 'published' | 'order' | 'inquiry'; title: string; at: string }[];
}
