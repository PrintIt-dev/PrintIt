/**
 * Server-Sent Events (SSE) service for real-time shop queue updates.
 * Shops subscribe via GET /api/shop/queue/stream and receive events
 * whenever a new order arrives or an order status changes.
 */

// Map of shop_id -> Set of SSE response objects
const shopClients = new Map();

/**
 * Register an SSE client for a given shop.
 * @param {string} shopId
 * @param {object} res - Express response object (SSE stream)
 */
function addClient(shopId, res) {
    if (!shopClients.has(shopId)) {
        shopClients.set(shopId, new Set());
    }
    shopClients.get(shopId).add(res);
}

/**
 * Remove an SSE client when the connection closes.
 * @param {string} shopId
 * @param {object} res
 */
function removeClient(shopId, res) {
    if (shopClients.has(shopId)) {
        shopClients.get(shopId).delete(res);
        if (shopClients.get(shopId).size === 0) {
            shopClients.delete(shopId);
        }
    }
}

/**
 * Broadcast a queue update event to all connected clients of a shop.
 * @param {string} shopId
 * @param {object} data - Payload to send
 */
function broadcastShopQueueUpdate(shopId, data) {
    if (!shopId || !shopClients.has(shopId)) return;
    const message = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of shopClients.get(shopId)) {
        try {
            client.write(message);
        } catch (_) {
            // Dead connection — will be cleaned up on close
        }
    }
}

module.exports = { addClient, removeClient, broadcastShopQueueUpdate };
