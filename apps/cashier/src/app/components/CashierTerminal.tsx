'use client';
/* eslint-disable */

import React, { useEffect, useState } from 'react';
import { openDB, IDBPDatabase } from 'idb';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OfflineOrder {
  id: string;
  tenantId: string;
  branchId: string;
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  status: 'PENDING_SYNC' | 'SYNCED' | 'FAILED';
  createdAt: string;
  syncedAt?: string;
}

const DB_NAME = 'zayjar-cashier-db';
const STORE_NAME = 'offline-orders';

async function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

export const CashierTerminal: React.FC<{ tenantId: string; branchId: string; apiUrl: string }> = ({ tenantId, branchId, apiUrl }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [offlineOrders, setOfflineOrders] = useState<OfflineOrder[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);

  // Register service worker per DOC-001 1.3 Cashier Terminal PWA Offline-First
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log(`Cashier PWA Service Worker registered for tenant ${tenantId} branch ${branchId}`, reg.scope);
          setServiceWorkerReady(true);
        })
        .catch((err) => console.warn('SW registration failed', err));
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadOfflineOrders();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [tenantId, branchId]);

  // Load offline orders from IndexedDB per DOC-001 1.3
  const loadOfflineOrders = async () => {
    try {
      const db = await getDb();
      const orders = await db.getAll(STORE_NAME);
      setOfflineOrders(orders);
    } catch (err) {
      console.error('Failed to load offline orders', err);
    }
  };

  // Save order to IndexedDB for offline support
  const saveOfflineOrder = async (order: OfflineOrder) => {
    const db = await getDb();
    await db.put(STORE_NAME, order);
    await loadOfflineOrders();
  };

  // Sync offline orders when connection restored per DOC-001 1.3
  useEffect(() => {
    if (isOnline && offlineOrders.some((o) => o.status === 'PENDING_SYNC')) {
      syncOfflineOrders();
    }
  }, [isOnline, offlineOrders]);

  const syncOfflineOrders = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      const db = await getDb();
      const pendingOrders = offlineOrders.filter((o) => o.status === 'PENDING_SYNC');

      for (const order of pendingOrders) {
        try {
          // Attempt to sync with cloud database per DOC-001 1.3
          const token = localStorage.getItem('accessToken') || '';
          const response = await fetch(`${apiUrl}/api/v1/orders/checkout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'X-Tenant-ID': tenantId,
              'X-Branch-ID': branchId,
            },
            body: JSON.stringify({
              branchId: order.branchId,
              type: 'DINE_IN',
              items: order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
              paymentMethod: 'CASH',
            }),
          });

          if (response.ok) {
            const updated: OfflineOrder = { ...order, status: 'SYNCED', syncedAt: new Date().toISOString() };
            await db.put(STORE_NAME, updated);
            console.log(`Offline order ${order.orderNumber} synced successfully for tenant ${tenantId}`);
          } else {
            throw new Error(`Sync failed with status ${response.status}`);
          }
        } catch (err) {
          console.warn(`Failed to sync order ${order.orderNumber}:`, err);
          const failed: OfflineOrder = { ...order, status: 'FAILED' };
          await db.put(STORE_NAME, failed);
        }
      }

      await loadOfflineOrders();
    } finally {
      setIsSyncing(false);
    }
  };

  const addToCart = (productId: string, name: string, price: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.unitPrice } : i));
      }
      return [...prev, { id: `${productId}-${Date.now()}`, productId, name, quantity: 1, unitPrice: price, totalPrice: price }];
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal;

  const handleCheckout = async () => {
    const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const offlineOrder: OfflineOrder = {
      id: `offline-${Date.now()}`,
      tenantId,
      branchId,
      orderNumber,
      items: cart,
      subtotal,
      total,
      status: isOnline ? 'SYNCED' : 'PENDING_SYNC',
      createdAt: new Date().toISOString(),
    };

    if (!isOnline) {
      // Store in IndexedDB for offline support per DOC-001 1.3
      await saveOfflineOrder(offlineOrder);
      setCart([]);
      alert(`Offline: Order ${orderNumber} saved locally. Will sync when online. Tenant isolated: ${tenantId}`);
      return;
    }

    // Online: try to checkout via API with tenant isolation
    try {
      const token = localStorage.getItem('accessToken') || '';
      const response = await fetch(`${apiUrl}/api/v1/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'X-Branch-ID': branchId,
        },
        body: JSON.stringify({
          branchId,
          type: 'DINE_IN',
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          paymentMethod: 'CASH',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Also save to IndexedDB as synced for history
        await saveOfflineOrder({ ...offlineOrder, id: result.id || offlineOrder.id, status: 'SYNCED', syncedAt: new Date().toISOString() });
        setCart([]);
        alert(`Order ${result.orderNumber || orderNumber} placed successfully. Tenant: ${tenantId}`);
      } else {
        throw new Error(`Checkout failed ${response.status}`);
      }
    } catch (err) {
      // On failure, save offline
      await saveOfflineOrder({ ...offlineOrder, status: 'PENDING_SYNC' });
      setCart([]);
      alert(`Network error, order ${orderNumber} saved offline for tenant ${tenantId}. Will sync when online.`);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">Cashier Terminal PWA - Tenant {tenantId.slice(-6)} Branch {branchId.slice(-4)}</h1>
        <div className="flex gap-2 items-center text-xs">
          <span className={`px-2 py-1 rounded ${isOnline ? 'bg-green-600' : 'bg-red-600'}`}>{isOnline ? 'Online' : 'Offline'}</span>
          <span className={`px-2 py-1 rounded ${serviceWorkerReady ? 'bg-blue-600' : 'bg-gray-600'}`}>SW: {serviceWorkerReady ? 'Ready' : 'Loading'}</span>
          <span>Tenant Isolated</span>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Product grid */}
        <main className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { id: 'prod_1', name: 'Truffle Burger', price: 14.5 },
            { id: 'prod_2', name: 'Classic Burger', price: 10.0 },
            { id: 'prod_3', name: 'Margherita Pizza', price: 12.0 },
          ].map((product) => (
            <button key={product.id} onClick={() => addToCart(product.id, product.name, product.price)} className="bg-white p-4 rounded shadow hover:shadow-md text-left">
              <h3 className="font-bold text-sm">{product.name}</h3>
              <p className="text-xs text-gray-500">${product.price.toFixed(2)}</p>
            </button>
          ))}
        </main>

        {/* Cart and offline orders */}
        <aside className="w-80 bg-white shadow-lg p-4 flex flex-col">
          <h2 className="font-bold mb-2">Cart - Tenant {tenantId.slice(-4)}</h2>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {cart.length === 0 ? <p className="text-xs text-gray-500">Cart empty</p> : cart.map((item) => (
              <div key={item.id} className="flex justify-between text-xs">
                <span>{item.quantity}x {item.name}</span>
                <span>${item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-bold"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-lg mt-1"><span>Total</span><span>${total.toFixed(2)}</span></div>
            <button onClick={handleCheckout} disabled={cart.length === 0} className="w-full mt-3 bg-blue-600 text-white py-2 rounded disabled:bg-gray-300">Checkout {isOnline ? '' : '(Offline)'}</button>
          </div>

          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Offline Queue (IndexedDB)</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {offlineOrders.length === 0 ? <p className="text-[10px] text-gray-400">No offline orders</p> : offlineOrders.map((o) => (
                <div key={o.id} className="text-[10px] p-2 bg-gray-50 rounded flex justify-between">
                  <span>{o.orderNumber}</span>
                  <span className={`px-1 rounded ${o.status === 'SYNCED' ? 'bg-green-100 text-green-700' : o.status === 'PENDING_SYNC' ? 'bg-yellow-100' : 'bg-red-100'}`}>{o.status}</span>
                </div>
              ))}
            </div>
            {isOnline && offlineOrders.some((o) => o.status === 'PENDING_SYNC') && (
              <button onClick={syncOfflineOrders} disabled={isSyncing} className="w-full mt-2 text-xs bg-slate-800 text-white py-1 rounded">
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
          </div>
        </aside>
      </div>

      <footer className="p-2 text-center text-[10px] text-gray-400">
        Cashier PWA Offline-First • Service Workers cached • IndexedDB • Tenant {tenantId} Branch {branchId} • Syncs when online • {new Date().getFullYear()}
      </footer>
    </div>
  );
};
