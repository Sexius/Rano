@echo off
echo Starting RAG Application...

cd /d %~dp0\rano-spring-backend
start "RAG Backend" cmd /k "mvnw spring-boot:run"

cd /d %~dp0\rano-frontend
start "RAG Frontend" cmd /k "npm run dev"

echo All services starting...
timeout /t 3
