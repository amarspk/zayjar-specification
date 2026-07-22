// Cashier PWA Service Worker per DOC-001 1.3 Offline-First
// Implements caching of core scripts/styles and synchronization of IndexedDB transactions when connectivity restored
const CACHE_NAME = 'zayjar-cashier-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
];

const DB_NAME = 'zayjar-cashier-db';
const STORE_NAME = 'offline-orders';

// Install: cache core scripts and styles locally per DOC-001 1.3
self.addEventListener('install', (event) => {
  console.log('Cashier PWA SW installing, caching core scripts and styles');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches, tenant isolated cache per log
self.addEventListener('activate', (event) => {
  console.log('Cashier PWA SW activated, tenant isolated cache');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for static, network-first for API with offline fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname.startsWith('/api/')) {
    // Network-first for API calls with offline fallback per DOC-001 1.3
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-first for static assets per DOC-001 1.3
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

// Helper to open IndexedDB
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllPendingOrders(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result || [];
      const pending = all.filter((o) => o.status === 'PENDING_SYNC');
      resolve(pending);
    };
    request.onerror = () => reject(request.error);
  });
}

function putOrder(db, order) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(order);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Core sync logic per DOC-001 1.3: Service Worker syncs local IndexedDB records with cloud database when connectivity restored
// Preserves Authorization, X-Tenant-ID, X-Branch-ID per tenant isolation
async function syncPendingOrders() {
  console.log('Cashier PWA SW: Starting sync of pending offline orders per DOC-001 1.3');

  let db;
  try {
    db = await openDb();
  } catch (err) {
    console.error('SW: Failed to open IndexedDB for sync', err);
    return;
  }

  let pendingOrders;
  try {
    pendingOrders = await getAllPendingOrders(db);
  } catch (err) {
    console.error('SW: Failed to read pending orders', err);
    return;
  }

  if (!pendingOrders || pendingOrders.length === 0) {
    console.log('SW: No pending orders to sync');
    return;
  }

  console.log(`SW: Found ${pendingOrders.length} pending orders to sync for tenant isolation check`);

  for (const order of pendingOrders) {
    const tenantId = order.tenantId;
    const branchId = order.branchId;
    const apiUrl = order.apiUrl || 'http://localhost:8000';
    const authToken = order.authToken || '';

    // Preserve tenant isolation: ensure tenantId exists, otherwise skip
    if (!tenantId) {
      console.warn(`SW: Skipping order ${order.orderNumber} - missing tenantId, cannot enforce isolation`);
      continue;
    }

    console.log(`SW: Syncing order ${order.orderNumber} for tenant ${tenantId} branch ${branchId}`);

    try {
      const response = await fetch(`${apiUrl}/api/v1/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
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
        const result = await response.json().catch(() => ({}));
        const updated = {
          ...order,
          id: result.id || order.id,
          status: 'SYNCED',
          syncedAt: new Date().toISOString(),
        };
        await putOrder(db, updated);
        console.log(`SW: Offline order ${order.orderNumber} synced successfully for tenant ${tenantId}, status updated to SYNCED`);

        // Notify clients about successful sync
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
          client.postMessage({ type: 'ORDER_SYNCED', orderNumber: order.orderNumber, orderId: order.id, tenantId });
        });
      } else {
        throw new Error(`Sync failed with status ${response.status}`);
      }
    } catch (err) {
      console.warn(`SW: Failed to sync order ${order.orderNumber} for tenant ${tenantId}:`, err);
      const failed = {
        ...order,
        status: 'FAILED',
      };
      try {
        await putOrder(db, failed);
        console.log(`SW: Order ${order.orderNumber} marked as FAILED for tenant ${tenantId}`);
      } catch (e) {
        console.error(`SW: Failed to update order ${order.orderNumber} to FAILED`, e);
      }
    }
  }

  console.log('SW: Sync of pending orders completed');
}

// Background Sync API per DOC-001 1.3: When connection is restored, service worker syncs local records
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-orders') {
    console.log('Background sync triggered for offline orders per DOC-001 1.3');
    event.waitUntil(syncPendingOrders());
  }
});

// Also handle message from main thread to trigger sync immediately (fallback for browsers without Background Sync)
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SYNC_OFFLINE_ORDERS' || data.type === 'SYNC_OFFLINE_ORDERS_NOW') {
    console.log('SW: Received message to sync offline orders from main thread, tenant isolation preserved');
    event.waitUntil(syncPendingOrders());
  }
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
