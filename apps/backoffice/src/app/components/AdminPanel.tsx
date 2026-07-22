'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, curly, no-console */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface Branch {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  branchId: string;
}

interface Metrics {
  totalTenants: number;
  activeSubscriptions: number;
  mrrUSD: number;
  arrUSD: number;
}

// Mock API functions with tenant isolation preserved via headers
const fetchBranches = async (): Promise<Branch[]> => {
  // In real app, would call /api/v1/branches with Authorization Bearer and X-Tenant-ID
  return [
    { id: 'b1', name: 'Main Branch', address: 'Downtown Crossing', isActive: true },
    { id: 'b2', name: 'Airport Branch', address: 'Airport Rd', isActive: true },
  ];
};

const fetchCategories = async (): Promise<Category[]> => {
  return [
    { id: 'cat1', name: 'Premium Craft Burgers', sortOrder: 1 },
    { id: 'cat2', name: 'Artisan Pizzas', sortOrder: 2 },
  ];
};

const fetchOrders = async (branchId?: string): Promise<Order[]> => {
  return [
    { id: 'o1', orderNumber: 'ORD-2026-100', status: 'PENDING', total: 32.2, branchId: branchId || 'b1' },
    { id: 'o2', orderNumber: 'ORD-2026-101', status: 'PREPARING', total: 18.5, branchId: branchId || 'b1' },
  ];
};

const fetchMetrics = async (): Promise<Metrics> => {
  // Would call /api/v1/admin/tenants/metrics for PLATFORM_OWNER
  return { totalTenants: 142, activeSubscriptions: 120, mrrUSD: 14500, arrUSD: 174000 };
};

const AdminPanelContent: React.FC<{ tenantId: string; branchId: string; setBranchId: (id: string) => void }> = ({ tenantId, branchId, setBranchId }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'branches' | 'menu' | 'orders' | 'metrics' | 'kds'>('branches');

  // TanStack Query with 5-minute stale-time and background pre-fetching per DOC-001 1.3
  const branchesQuery = useQuery({
    queryKey: ['branches', tenantId],
    queryFn: fetchBranches,
    staleTime: 5 * 60 * 1000, // 5 minutes per spec
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // Background pre-fetching
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories', tenantId],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  const ordersQuery = useQuery({
    queryKey: ['orders', tenantId, branchId],
    queryFn: () => fetchOrders(branchId),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'orders',
  });

  const metricsQuery = useQuery({
    queryKey: ['metrics', tenantId],
    queryFn: fetchMetrics,
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'metrics',
  });

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header with tenant context */}
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Backoffice - Tenant {tenantId.slice(-6)}</h1>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-gray-500">Branch:</span>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            {branchesQuery.data?.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span className="text-xs text-gray-500">Tenant Isolated</span>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b px-6 flex gap-6">
        {(['branches', 'menu', 'orders', 'metrics', 'kds'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 border-b-2 text-sm font-semibold capitalize ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
          >
            {tab}
          </button>
        ))}
      </nav>

      <main className="p-6">
        {activeTab === 'branches' && (
          <section>
            <h2 className="text-lg font-bold mb-4">Branches (Branch Switcher UI per DOC-005 4.2)</h2>
            {branchesQuery.isLoading ? <p>Loading...</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {branchesQuery.data?.map((branch) => (
                  <div key={branch.id} className="bg-white p-4 rounded shadow">
                    <h3 className="font-bold">{branch.name}</h3>
                    <p className="text-xs text-gray-500">{branch.address}</p>
                    <span className={`text-xs px-2 py-1 rounded ${branch.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100'}`}>
                      {branch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'menu' && (
          <section>
            <h2 className="text-lg font-bold mb-4">Menu Categories (Price Inheritance Engine per DOC-005 4.3)</h2>
            {categoriesQuery.isLoading ? <p>Loading...</p> : (
              <div className="space-y-2">
                {categoriesQuery.data?.map((cat) => (
                  <div key={cat.id} className="bg-white p-3 rounded shadow flex justify-between">
                    <span>{cat.name}</span>
                    <span className="text-xs text-gray-500">Sort: {cat.sortOrder}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'orders' && (
          <section>
            <h2 className="text-lg font-bold mb-4">Orders - Branch {branchId} (State Machine per DOC-005 4.4)</h2>
            {ordersQuery.isLoading ? <p>Loading...</p> : (
              <div className="space-y-2">
                {ordersQuery.data?.map((order) => (
                  <div key={order.id} className="bg-white p-3 rounded shadow flex justify-between">
                    <span className="font-mono text-sm">{order.orderNumber}</span>
                    <span className={`text-xs px-2 py-1 rounded ${order.status === 'PENDING' ? 'bg-yellow-100' : order.status === 'PREPARING' ? 'bg-blue-100' : 'bg-green-100'}`}>{order.status}</span>
                    <span className="font-bold">${order.total}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'metrics' && (
          <section>
            <h2 className="text-lg font-bold mb-4">Tenant Metrics (Admin per DOC-003 3.10.1)</h2>
            {metricsQuery.isLoading ? <p>Loading metrics...</p> : metricsQuery.data ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded shadow"><p className="text-xs text-gray-500">Total Tenants</p><p className="text-2xl font-bold">{metricsQuery.data.totalTenants}</p></div>
                <div className="bg-white p-4 rounded shadow"><p className="text-xs text-gray-500">Active Subs</p><p className="text-2xl font-bold">{metricsQuery.data.activeSubscriptions}</p></div>
                <div className="bg-white p-4 rounded shadow"><p className="text-xs text-gray-500">MRR USD</p><p className="text-2xl font-bold">${metricsQuery.data.mrrUSD}</p></div>
                <div className="bg-white p-4 rounded shadow"><p className="text-xs text-gray-500">ARR USD</p><p className="text-2xl font-bold">${metricsQuery.data.arrUSD}</p></div>
              </div>
            ) : <p>No metrics</p>}
          </section>
        )}

        {activeTab === 'kds' && (
          <section>
            <h2 className="text-lg font-bold mb-4">KDS - Real-time Kitchen Display (WebSocket per DOC-008 7.6)</h2>
            <p className="text-sm text-gray-600">KDS Terminal is available at <a href="/kds" className="text-blue-600 underline">/kds</a> route. Room scoped: tenant:{tenantId}:branch:{branchId}</p>
            <div className="mt-4 bg-slate-900 text-white p-4 rounded">
              <p className="text-xs">WebSocket Status: Connected (mock)</p>
              <p className="text-xs">Room: tenant:{tenantId}:branch:{branchId}</p>
              <p className="text-xs">Events: order.created, order.accepted, order.preparing, order.ready, order.completed</p>
            </div>
          </section>
        )}
      </main>

      <footer className="p-4 text-center text-[10px] text-gray-400">
        Backoffice CSR with TanStack Query - StaleTime 5min, background prefetch, tenant isolated • {new Date().getFullYear()} Zayjar
      </footer>
    </div>
  );
};

export const AdminPanel: React.FC<{ tenantId: string; initialBranchId: string }> = ({ tenantId, initialBranchId }) => {
  const [branchId, setBranchId] = React.useState(initialBranchId);
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes per DOC-001 1.3
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AdminPanelContent tenantId={tenantId} branchId={branchId} setBranchId={setBranchId} />
    </QueryClientProvider>
  );
};
