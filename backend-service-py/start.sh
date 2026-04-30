#!/bin/bash

# Memoria Python 后端启动脚本

set -e

echo "🚀 启动 Memoria Backend Service"

# 检查 uv 是否安装
if ! command -v uv &> /dev/null; then
    echo "❌ uv 未安装，请先安装: https://docs.astral.sh/uv/"
    echo "   快速安装: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# 显示 Python 版本
echo "🐍 Python 版本: $(python --version)"

# 同步依赖
if [ ! -d ".venv" ] || [ "pyproject.toml" -nt ".venv" ]; then
    echo "📦 同步依赖..."
    uv sync --python $(which python)
fi

# 启动服务
echo "✅ 启动服务..."
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8999} --reload
