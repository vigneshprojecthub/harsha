"""
WebSocket Connection Manager
----------------------------
Maintains a registry of active WebSocket connections grouped by order_id.
Supports:
  - Per-order rooms (customer + admin both subscribe to same room)
  - Global admin room (receives all order updates)
  - Graceful disconnect handling
  - JSON message broadcast
"""

import json
import asyncio
from typing import Dict, Set
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # order_id → set of WebSocket connections
        self._order_rooms: Dict[int, Set[WebSocket]] = {}
        # Admin connections that receive ALL updates
        self._admin_sockets: Set[WebSocket] = set()

    # ── Connection lifecycle ──────────────────────────────────────────────────

    async def connect_order(self, websocket: WebSocket, order_id: int):
        await websocket.accept()
        if order_id not in self._order_rooms:
            self._order_rooms[order_id] = set()
        self._order_rooms[order_id].add(websocket)
        logger.info(f"[WS] Client connected → order {order_id} "
                    f"(room size: {len(self._order_rooms[order_id])})")

    async def connect_admin(self, websocket: WebSocket):
        await websocket.accept()
        self._admin_sockets.add(websocket)
        logger.info(f"[WS] Admin connected (total admins: {len(self._admin_sockets)})")

    def disconnect_order(self, websocket: WebSocket, order_id: int):
        room = self._order_rooms.get(order_id, set())
        room.discard(websocket)
        if not room:
            self._order_rooms.pop(order_id, None)
        logger.info(f"[WS] Client disconnected ← order {order_id}")

    def disconnect_admin(self, websocket: WebSocket):
        self._admin_sockets.discard(websocket)
        logger.info(f"[WS] Admin disconnected (remaining: {len(self._admin_sockets)})")

    # ── Broadcast helpers ────────────────────────────────────────────────────

    async def _safe_send(self, websocket: WebSocket, data: str):
        """Send with error catching to handle stale connections."""
        try:
            await websocket.send_text(data)
        except Exception as e:
            logger.warning(f"[WS] Send failed (stale socket): {e}")

    async def broadcast_to_order(self, order_id: int, message: dict):
        """Send a message to all clients watching a specific order."""
        data = json.dumps(message)
        room = self._order_rooms.get(order_id, set())
        if room:
            await asyncio.gather(*[self._safe_send(ws, data) for ws in room.copy()])

    async def broadcast_to_admins(self, message: dict):
        """Send a message to all connected admin panels."""
        data = json.dumps(message)
        if self._admin_sockets:
            await asyncio.gather(*[self._safe_send(ws, data) for ws in self._admin_sockets.copy()])

    async def broadcast_order_update(self, order_id: int, message: dict):
        """
        Convenience: broadcast to both the order's room AND all admins.
        Used when an order status changes.
        """
        await asyncio.gather(
            self.broadcast_to_order(order_id, message),
            self.broadcast_to_admins(message),
        )

    # ── Stats ────────────────────────────────────────────────────────────────

    def stats(self) -> dict:
        return {
            "active_order_rooms": len(self._order_rooms),
            "total_order_clients": sum(len(v) for v in self._order_rooms.values()),
            "admin_clients": len(self._admin_sockets),
        }


# Singleton — imported by routers
manager = ConnectionManager()
