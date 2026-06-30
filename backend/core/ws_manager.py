"""
WebSocket Manager — stub for Render free tier.
Render free tier does not support persistent WebSocket connections.
Frontend uses HTTP polling (every 15s) instead.
"""

class ConnectionManager:
    def __init__(self):
        pass

    async def connect_order(self, websocket, order_id):
        await websocket.accept()
        await websocket.close(code=1001, reason="WebSocket not supported on this tier. Use HTTP polling.")

    async def connect_admin(self, websocket):
        await websocket.accept()
        await websocket.close(code=1001, reason="WebSocket not supported on this tier. Use HTTP polling.")

    def disconnect_order(self, websocket, order_id):
        pass

    def disconnect_admin(self, websocket):
        pass

    async def broadcast_order_update(self, order_id, data):
        pass  # no-op

    async def broadcast_admin(self, data):
        pass  # no-op

    def stats(self):
        return {"order_rooms": 0, "admin_connections": 0, "mode": "polling"}


manager = ConnectionManager()
