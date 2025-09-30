#!/bin/bash
cd /DATA/LLM_Projs/TestArea/DataForge-Reader
source .venv/bin/activate
pkill -f uvicorn
sleep 1
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000