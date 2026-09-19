import json
from typing import Dict, Set
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, Set[WebSocket]] = {
            "ASHA_WORKER": set(),
            "PCW": set(),
            "DOCTOR": set(),
            "ADMIN": set(),
            "PATIENT": set(),
        }
        self.all_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, role: str):
        await websocket.accept()
        role_key = role if role in self.active else "ASHA_WORKER"
        if role == "PCW":
            role_key = "PCW"
        self.active.setdefault(role_key, set()).add(websocket)
        self.all_connections.add(websocket)

    def disconnect(self, websocket: WebSocket, role: str):
        role_key = role if role in self.active else "ASHA_WORKER"
        self.active.get(role_key, set()).discard(websocket)
        self.all_connections.discard(websocket)

    async def broadcast_alert(self, message: dict, roles: list[str] | None = None):
        targets = roles or ["DOCTOR", "ADMIN", "ASHA_WORKER", "PCW"]
        payload = json.dumps(message)
        for role in targets:
            for ws in list(self.active.get(role, set())):
                try:
                    await ws.send_text(payload)
                except Exception:
                    self.active.get(role, set()).discard(ws)


manager = ConnectionManager()
