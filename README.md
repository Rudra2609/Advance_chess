# Tactic Flow ♟️

Welcome to **Tactic Flow**, a high-performance, modern web-based chess engine and application.

Play it live here: 👉 **[https://rudra2609.github.io/Tactic_Flow/](https://rudra2609.github.io/Tactic_Flow/)**

![Tactic Flow](https://github.com/user-attachments/assets/1903e52b-59d7-4433-b17e-639462da5ae0)

---

## ✨ Features

- **Blazing Fast AI Engine**: At its core, Tactic Flow runs a custom **C++ Chess Engine** that has been compiled directly into **WebAssembly (WASM)**. This allows the AI to calculate deep variations and evaluate positions at near-native speeds directly in your browser without requiring a backend server.
- **Player vs AI & Player vs Player Modes**: Test your skills against the built-in AI with an adjustable ELO slider (250 to 3200), or play locally against a friend with dedicated chess clocks.
- **Interactive Board Editor**: Set up custom scenarios, puzzles, or historical game positions using the drag-and-drop Board Editor, and then instantly play them out against the AI.
- **Secure Authentication**: Built-in **Firebase Authentication** allows players to securely log in, sign up, and see their personalized Display Names on the player dashboard.
- **Stunning UI/UX**: Built with **React** and `react-chessboard`, featuring a beautiful glassmorphism aesthetic, fully responsive mobile support, smooth move animations, and both Drag & Drop + Click-to-Move support.
- **Full Ruleset Support**: The underlying engine fully validates moves and perfectly understands Castling, En Passant, Pawn Promotion, Checkmates, and Stalemates.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, CSS (Glassmorphism design)
- **Chess Logic & UI**: `chess.js`, `react-chessboard`
- **Core Engine**: C++
- **Compilation**: Emscripten (WebAssembly)
- **Authentication**: Firebase
- **Hosting**: GitHub Pages

---

## 🚀 Running Locally

If you want to clone and run the project locally on your machine:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Rudra2609/Tactic_Flow.git
   cd Tactic_Flow
   ```

2. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

*(Note: The WebAssembly module `chess_module.js` and `chess_module.wasm` are already pre-compiled and included in the `frontend/public` directory, so you do not need to install C++ compilers or Emscripten to run the frontend!)*

---

## 🧠 Engine Compilation (Advanced)

If you modify the core C++ engine files (`Board.cpp`, `AI.cpp`, etc.) and want to recompile the WebAssembly module, you will need the [Emscripten SDK](https://emscripten.org/):

```bash
emcc Board.cpp BoardAI.cpp AI.cpp Square.cpp WasmBindings.cpp -o frontend/public/chess_module.js -s EXPORT_ES6=1 -s MODULARIZE=1 -s ENVIRONMENT=web -O3 --bind
```
