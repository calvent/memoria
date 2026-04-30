import asyncio
import base64
import json

import numpy as np
import soundfile as sf
import websockets
import soxr

WS_URL = "ws://127.0.0.1:8003/v1/realtime"
AUDIO_FILE = "/Users/liaochui/Downloads/asr_en.wav"
CHUNK_MS = 200  # 200ms chunks


def float32_to_pcm16_bytes(x: np.ndarray) -> bytes:
    x = np.clip(x, -1.0, 1.0)
    return (x * 32767.0).astype(np.int16).tobytes()


async def send_audio(ws, wav: np.ndarray):
    sr = 16000
    step = int(sr * CHUNK_MS / 1000)

    for i in range(0, len(wav), step):
        chunk = wav[i:i + step]
        pcm = float32_to_pcm16_bytes(chunk)

        await ws.send(json.dumps({
            "type": "input_audio_buffer.append",
            "audio": base64.b64encode(pcm).decode("ascii"),
        }))

        # ✅ 关键：不要用 time.sleep（会阻塞事件循环）
        await asyncio.sleep(CHUNK_MS / 1000.0)

    await ws.send(json.dumps({"type": "input_audio_buffer.commit"}))


async def recv_loop(ws):
    while True:
        msg = await ws.recv()
        data = json.loads(msg)
        t = data.get("type")

        if t == "session.created":
            print("✅ session.created")

        elif t == "session.updated":
            print("✅ session.updated")

        elif t == "transcription.delta":
            # delta 逐步打印
            print(data.get("delta", ""), end="", flush=True)

        elif t == "transcription.done":
            print("\n\n🎯 FINAL:", data.get("text", ""))
            break

        elif t == "error":
            print("\n❌ ERROR:", data)
            break


async def main():
    wav, sr = sf.read(AUDIO_FILE, dtype="float32")

    # mono
    if wav.ndim == 2:
        wav = wav.mean(axis=1)

    # resample to 16k
    if sr != 16000:
        wav = soxr.resample(wav, sr, 16000).astype("float32")

    async with websockets.connect(WS_URL, max_size=10 * 1024 * 1024) as ws:
        # optional session.update
        await ws.send(json.dumps({"type": "session.update", "model": "qwen3-asr"}))

        await asyncio.gather(
            recv_loop(ws),
            send_audio(ws, wav),
        )


if __name__ == "__main__":
    asyncio.run(main())