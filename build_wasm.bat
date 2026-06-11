@echo off
call .\emsdk\emsdk_env.bat
emcc Board.cpp BoardAI.cpp AI.cpp Square.cpp WasmBindings.cpp -o frontend/public/chess_module.js -s EXPORT_ES6=1 -s MODULARIZE=1 -s EXPORT_NAME="chess_module" -s ENVIRONMENT=web -s ALLOW_MEMORY_GROWTH=1 -O3 --bind
cd frontend
npm run build
git add ..
git commit -m "Build: Recompile Wasm with corrected FEN string output"
git push
