#!/usr/bin/env python3
"""
实时麦克风语音转文字客户端 (SoundDevice 版)
用法: python3 mic_client.py
需安装: pip install sounddevice numpy websockets
"""
import asyncio
import base64
import json
import sys
import websockets
import sounddevice as sd
import numpy as np
import signal

# ASR 服务地址
WS_URL = "ws://localhost:8003/v1/realtime"
MODEL_NAME = "qwen3-asr"

# 音频参数
SAMPLE_RATE = 16000
CHANNELS = 1
BLOCK_SIZE = int(SAMPLE_RATE * 0.1)  # 100ms

stop_event = asyncio.Event()

def signal_handler(sig, frame):
    print("\n🛑 停止录音...")
    stop_event.set()

signal.signal(signal.SIGINT, signal_handler)

async def mic_stream_gen():
    """生成麦克风音频流 (PCM16 bytes)"""
    loop = asyncio.get_event_loop()
    q = asyncio.Queue()

    def callback(indata, frames, time, status):
        if status:
            print(status, file=sys.stderr)
        # float32 -> int16
        audio_data = (indata * 32767).astype(np.int16).tobytes()
        loop.call_soon_threadsafe(q.put_nowait, audio_data)

    stream = sd.InputStream(
        device=None,  # 使用默认设备
        channels=CHANNELS,
        samplerate=SAMPLE_RATE,
        blocksize=BLOCK_SIZE,
        dtype="float32",
        callback=callback
    )

    print(f"🎤 正在录音... (按 Ctrl+C 停止)")
    
    with stream:
        while not stop_event.is_set():
            data = await q.get()
            yield data

async def run_client():
    print(f"🔗 连接服务端: {WS_URL}")
    
    headers = {
        "Authorization": "Bearer vllm",
        "User-Agent": "MicClient/1.0",
        "Origin": "http://localhost:8003",
    }
    
    try:
        async with websockets.connect(WS_URL, additional_headers=headers) as ws:
            # 1. 握手
            msg = json.loads(await ws.recv())
            if msg.get("type") != "session.created":
                print(f"❌ 握手失败: {msg}")
                return
            print("✅ 连接成功")

            # 2. 设置模型
            await ws.send(json.dumps({
                "type": "session.update",
                "model": MODEL_NAME,
            }))

            # 3. 初始 commit
            await ws.send(json.dumps({
                "type": "input_audio_buffer.commit",
            }))

            # 4. 并发运行发送任务和接收任务
            send_task = asyncio.create_task(send_audio_loop(ws))
            recv_task = asyncio.create_task(receive_loop(ws))
            
            await stop_event.wait()
            
            # 5. 停止
            send_task.cancel()
            await ws.send(json.dumps({
                "type": "input_audio_buffer.commit",
                "final": True,
            }))
            # 等待最后的接收处理
            await asyncio.sleep(1.0)
            recv_task.cancel()

    except Exception as e:
        print(f"\n❌ 连接异常: {e}")

async def send_audio_loop(ws):
    try:
        async for data in mic_stream_gen():
            await ws.send(json.dumps({
                "type": "input_audio_buffer.append",
                "audio": base64.b64encode(data).decode(),
            }))
    except asyncio.CancelledError:
        pass

async def receive_loop(ws):
    try:
        async for raw in ws:
            msg = json.loads(raw)
            typ = msg.get("type")
            
            if typ == "transcription.delta":
                delta = msg.get("delta", "")
                if delta:
                    print(delta, end="", flush=True)
            
            elif typ == "transcription.done":
                text = msg.get("text", "")
                print(f"\n✅ [最终] {text}")
                
            elif typ == "error":
                print(f"\n❌ 服务端错误: {msg}")
    except asyncio.CancelledError:
        pass
    except websockets.ConnectionClosed:
        print("\n🔌 连接已关闭")

if __name__ == "__main__":
    asyncio.run(run_client())
