#!/bin/bash
# Auto-restart wrapper for the quiz-game websocket service
cd /home/z/my-project/mini-services/quiz-game
while true; do
  echo "[$(date)] Starting quiz-game service..."
  node index.ts
  EXIT_CODE=$?
  echo "[$(date)] Service exited with code $EXIT_CODE, restarting in 2s..."
  sleep 2
done
