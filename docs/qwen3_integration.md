# Qwen3 ASR 集成文档

## 概述

实时流式语音识别(ASR)，通过 WebSocket 实现边说边转写。两种后端均使用 **OpenAI Realtime 兼容协议**：

| Provider | 端点 | 说明 |
|----------|------|------|
| `vllm` | `ws://host/v1/realtime` | 自部署 vLLM + Qwen3-ASR-1.7B |
| `dashscope` | `wss://dashscope.aliyuncs.com/api-ws/v1/realtime` | 阿里云 qwen3-asr-flash-realtime |

## 架构

```
前端 ──100ms音频──▶ 后端 ──base64音频──▶ ASR (vLLM / DashScope)
前端 ◀──实时文字── 后端 ◀──实时文字── ASR
```

## 文件结构

```
app/services/asr.py     → ASR 统一接口 (OpenAI Realtime 协议)
  ├── ASRProvider         (抽象: connect/send_audio/finish/close/receive_transcripts)
  ├── VllmASRProvider     (vLLM)
  └── DashScopeASRProvider(DashScope Qwen3-ASR)

app/services/speech.py  → 会话管理 + 录音保存
app/api/v1/speech.py    → WebSocket 端点 (双向实时转发)
```

## 配置

### 方式一：vLLM 自部署（默认）

```bash
ASR_PROVIDER=vllm
ASR_VLLM_URL=http://localhost:8000
ASR_VLLM_MODEL=Qwen/Qwen3-ASR-1.7B
```

启动 vLLM：
```bash
vllm serve Qwen/Qwen3-ASR-1.7B --host 0.0.0.0 --port 8000
```

### 方式二：阿里云 DashScope

```bash
ASR_PROVIDER=dashscope
DASHSCOPE_API_KEY=sk-xxxxxxxx
```

## 协议对照

两种后端使用同一套 OpenAI Realtime 协议，差异对照：

| 操作 | vLLM | DashScope |
|------|------|-----------|
| 握手 | `session.created` | `session.created` |
| 配置 | `session.update` (model) | `session.update` (session) |
| 发音频 | `input_audio_buffer.append` | `input_audio_buffer.append` |
| 中间结果 | `transcription.delta` | `conversation.item.input_audio_transcription.text` |
| 最终结果 | `transcription.done` | `conversation.item.input_audio_transcription.completed` |
| 结束 | `input_audio_buffer.commit(final=True)` | `input_audio_buffer.commit` + `session.finish` |

## WebSocket API (前端)

**端点**: `ws://localhost:8999/api/v1/speech/realtime?token=<JWT>`

**客户端发送**:
- 二进制音频 (PCM16, 16kHz, 单声道)，建议每 100ms 发一次
- `{"type": "end"}` 结束录音

**服务端返回**:
- `{"type": "transcript", "text": "...", "is_final": false}` 中间结果
- `{"type": "transcript", "text": "...", "is_final": true}` 句子确认
- `{"type": "info", "message": "已保存", "recordingId": "123"}`

## 后续迭代

- [ ] TTS 语音合成
- [ ] 方言识别
- [ ] 音频降噪
