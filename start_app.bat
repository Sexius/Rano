@echo off
echo Starting RAG Application...

cd /d %~dp0\backend
start "RAG Backend" cmd /k "mvnw spring-boot:run"

cd /d %~dp0\frontend
start "RAG Frontend" cmd /k "npm run dev"

echo All services starting...
timeout /t 3
