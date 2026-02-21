import asyncio
import json
import redis.asyncio as aioredis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from config import settings

router = APIRouter()


@router.websocket("/ws/{task_id}")
async def websocket_logs(websocket: WebSocket, task_id: str):
    """Stream training logs from Redis pub/sub to the WebSocket client."""
    await websocket.accept()
    channel = f"task:{task_id}:logs"

    try:
        redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        pubsub = redis_client.pubsub()
        await pubsub.subscribe(channel)

        async for message in pubsub.listen():
            if message["type"] == "message":
                data = message["data"]
                await websocket.send_text(data)
                try:
                    parsed = json.loads(data)
                    if parsed.get("type") in ("DONE", "ERROR"):
                        break
                except json.JSONDecodeError:
                    pass

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(json.dumps({"type": "ERROR", "message": str(e)}))
        except Exception:
            pass
    finally:
        try:
            await pubsub.unsubscribe(channel)
            await redis_client.aclose()
        except Exception:
            pass
        try:
            await websocket.close()
        except Exception:
            pass
