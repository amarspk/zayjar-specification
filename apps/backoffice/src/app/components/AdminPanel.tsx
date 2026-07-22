'use client';
/* eslint-disable */

import React, { useState } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

const getAuthHeaders = (tenantId: string, branchId?: string): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') || '' : '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }
  if (branchId) {
    headers['X-Branch-ID'] = branchId;
  }
  return headers;
};

const fetchBranches = async (tenantId: string): Promise<Branch[]> => {
  const apiUrl = getApiBaseUrl();
  const response = await fetch(`${apiUrl}/api/v1/branches`, {
    method: 'GET',
    headers: getAuthHeaders(tenantId),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch branches: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.branches || [];
};

const fetchCategories = async (tenantId: string): Promise<Category[]> => {
  const apiUrl = getApiBaseUrl();
  const response = await fetch(`${apiUrl}/api/v1/menu/categories`, {
    method: 'GET',
    headers: getAuthHeaders(tenantId),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.categories || [];
};

const fetchOrders = async (tenantId: string, branchId?: string): Promise<Order[]> => {
  const apiUrl = getApiBaseUrl();
  const url = new URL(`${apiUrl}/api/v1/orders`);
  if (branchId) {
    url.searchParams.set('branchId', branchId);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(tenantId, branchId),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.orders || [];
};

const fetchMetrics = async (tenantId: string): Promise<Metrics> => {
  const apiUrl = getApiBaseUrl();
  const response = await fetch(`${apiUrl}/api/v1/admin/tenants/metrics`, {
    method: 'GET',
    headers: getAuthHeaders(tenantId),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch metrics: ${response.status}`);
  }

  const data = await response.json();
  return data;
};

const AdminPanelContent: React.FC<{ tenantId: string; branchId: string; setBranchId: (id: string) => void }> = ({ tenantId, branchId, setBranchId }) => {
  const [activeTab, setActiveTab] = useState<'branches' | 'menu' | 'orders' | 'metrics' | 'kds'>('branches');

  const branchesQuery = useQuery({
    queryKey: ['branches', tenantId],
    queryFn: () => fetchBranches(tenantId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000,
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories', tenantId],
    queryFn: () => fetchCategories(tenantId),
    staleTime: 5 * 60 * 1000,
  });

  const ordersQuery = useQuery({
    queryKey: ['orders', tenantId, branchId],
    queryFn: () => fetchOrders(tenantId, branchId),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'orders',
  });

  const metricsQuery = useQuery({
    queryKey: ['metrics', tenantId],
    queryFn: () => fetchMetrics(tenantId),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'metrics',
  });

  return (
    <div className="w-full min-h-screen bg-gray-50">
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
            {branchesQuery.isLoading ? <p>Loading...</p> : branchesQuery.isError ? (
              <p className="text-red-500 text-sm">Failed to load branches: {(branchesQuery.error as Error).message}. Ensure API at {getApiBaseUrl()} is running with valid JWT.</p>
            ) : (
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
            {categoriesQuery.isLoading ? <p>Loading...</p> : categoriesQuery.isError ? (
              <p className="text-red-500 text-sm">Failed to load categories: {(categoriesQuery.error as Error).message}</p>
            ) : (
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
            {ordersQuery.isLoading ? <p>Loading...</p> : ordersQuery.isError ? (
              <p className="text-red-500 text-sm">Failed to load orders: {(ordersQuery.error as Error).message}</p>
            ) : (
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
            {metricsQuery.isLoading ? <p>Loading metrics...</p> : metricsQuery.isError ? (
              <p className="text-red-500 text-sm">Failed to load metrics: {(metricsQuery.error as Error).message}. Requires PLATFORM_OWNER role.</p>
            ) : metricsQuery.data ? (
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
              <p className="text-xs">WebSocket Status: Connected (when backend running)</p>
              <p className="text-xs">Room: tenant:{tenantId}:branch:{branchId}</p>
              <p className="text-xs">Events: order.created, order.accepted, order.preparing, order.ready, order.completed</p>
              <p className="text-xs mt-2">API Base: {getApiBaseUrl()}</p>
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
        staleTime: 5 * 60 * 1000,
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
