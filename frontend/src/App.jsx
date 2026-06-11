import { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import './App.css';

function getPieceAt(fen, x, y) {
  const rows = fen.split(' ')[0].split('/');
  const row = rows[x];
  let col = 0;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (isNaN(char)) {
      if (col === y) return char;
      col++;
    } else {
      col += parseInt(char);
      if (y < col) return '.';
    }
  }
  return '.';
}

function App() {
  const [fen, setFen] = useState("start");
  const [gameMode, setGameMode] = useState("menu");
  const [elo, setElo] = useState(1200);
  const [wasmModule, setWasmModule] = useState(null);
  const [status, setStatus] = useState("Loading engine...");
  const [gameState, setGameState] = useState(0); // 0=Ongoing, 1=Checkmate, 2=Stalemate, 3=Draw50, 4=DrawRep, 5=InsufficientMaterial, 6=Timeout, 7=TimeoutvsInsufficient
  const [pendingPromotion, setPendingPromotion] = useState(null);

  // Time control states
  const [timeControl, setTimeControl] = useState({ minutes: 10, increment: 0 });
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Move history state
  const [chess] = useState(new Chess());
  const [moveHistory, setMoveHistory] = useState([]);
  const historyEndRef = useRef(null);

  useEffect(() => {
    const initWasm = async () => {
      try {
        if (window.chess_module) {
          const mod = await window.chess_module();
          setWasmModule(mod);
          mod.initBoard();
          setFen(mod.getBoardState());
          setStatus("Engine ready");
        } else {
          setTimeout(initWasm, 500);
        }
      } catch (e) {
        console.error("WASM init error", e);
        setStatus("Failed to load engine");
      }
    };
    initWasm();
  }, []);

  // Timer Interval
  useEffect(() => {
    if (gameState !== 0 || !isTimerRunning || timeControl.minutes === 0) return;
    
    const timerId = setInterval(() => {
      const activeColor = wasmModule.getTurn(); // 0 = White, 1 = Black
      if (activeColor === 0) {
        setWhiteTime((prev) => {
          if (prev <= 1) { handleTimeout(0); return 0; }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) { handleTimeout(1); return 0; }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(timerId);
  }, [gameState, isTimerRunning, wasmModule, timeControl]);

  const handleTimeout = (timedOutColor) => {
    setIsTimerRunning(false);
    const opponentColor = timedOutColor === 0 ? 1 : 0;
    const opponentHasMaterial = wasmModule.hasMatingMaterial(opponentColor);
    
    if (opponentHasMaterial) {
      setGameState(6);
      setStatus(`Time Out! ${timedOutColor === 0 ? "Black" : "White"} wins!`);
    } else {
      setGameState(7);
      setStatus("Draw: Timeout vs Insufficient Material");
    }
  };

  const handleStartGame = (mode) => {
    if (!wasmModule) {
      alert("Engine not loaded yet!");
      return;
    }
    wasmModule.initBoard();
    chess.reset();
    setFen(wasmModule.getBoardState());
    setMoveHistory([]);
    setGameMode(mode);
    setGameState(0);
    setPendingPromotion(null);
    setWhiteTime(timeControl.minutes * 60);
    setBlackTime(timeControl.minutes * 60);
    setIsTimerRunning(true);
    setStatus(mode === "ai" ? "Your turn (White)" : "White's turn");
  };

  const processGameState = (mod) => {
    const state = mod.getGameState();
    if (state !== 0) {
      setGameState(state);
      setIsTimerRunning(false);
    }
    if (state === 1) {
      setStatus(`Checkmate! ${mod.getTurn() === 0 ? "Black" : "White"} wins!`);
    } else if (state === 2) {
      setStatus("Stalemate! Game is a draw.");
    } else if (state === 3) {
      setStatus("Draw by 50-move rule.");
    } else if (state === 4) {
      setStatus("Draw by threefold repetition.");
    } else if (state === 5) {
      setStatus("Draw by Insufficient Material.");
    }
    return state !== 0;
  };

  const executeMove = (fromX, fromY, toX, toY, promotionPiece) => {
    const activeColorBefore = wasmModule.getTurn();
    const isLegal = wasmModule.makeMove(fromX, fromY, toX, toY, promotionPiece);
    if (isLegal) {
      setFen(wasmModule.getBoardState());
      
      // Update chess.js shadow board to generate SAN
      const fromStr = String.fromCharCode(fromY + 97) + (8 - fromX);
      const toStr = String.fromCharCode(toY + 97) + (8 - toX);
      const promoChars = ['', 'q', 'b', 'n', 'r'];
      try {
        chess.move({ from: fromStr, to: toStr, promotion: promoChars[promotionPiece] });
        setMoveHistory(chess.history({ verbose: true }));
        // Scroll to bottom
        setTimeout(() => historyEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      } catch (e) {
        console.warn("chess.js failed to mirror move:", e);
      }
      
      // Apply increment
      if (timeControl.increment > 0 && timeControl.minutes > 0) {
        if (activeColorBefore === 0) setWhiteTime(prev => prev + timeControl.increment);
        else setBlackTime(prev => prev + timeControl.increment);
      }

      if (processGameState(wasmModule)) return true;
      
      setStatus(wasmModule.getTurn() === 0 ? "White's turn" : "Black's turn");
      
      if (gameMode === "ai" && wasmModule.getTurn() === 1) {
        setStatus("AI thinking...");
        setTimeout(() => {
          try {
            if (wasmModule.getGameState() !== 0) return;
            const aiMoveStr = wasmModule.getBestMove(elo);
            const parts = aiMoveStr.split(",");
            if (parts.length === 4) {
              const [aiFromX, aiFromY, aiToX, aiToY] = parts.map(Number);
              wasmModule.makeMove(aiFromX, aiFromY, aiToX, aiToY, 1); // AI defaults to Queen
              setFen(wasmModule.getBoardState());
              if (processGameState(wasmModule)) return;
              setStatus("Your turn (White)");
            }
          } catch(e) {
            setStatus("AI Error: " + e.message);
          }
        }, 50);
      }
      return true;
    } else {
      setStatus(`Invalid move.`);
      return false;
    }
  };

  const onDrop = ({ sourceSquare, targetSquare }) => {
    if (!wasmModule || gameState !== 0 || pendingPromotion) return false;

    try {
      const fromY = sourceSquare.charCodeAt(0) - 97;
      const fromX = 8 - parseInt(sourceSquare[1]);
      const toY = targetSquare.charCodeAt(0) - 97;
      const toX = 8 - parseInt(targetSquare[1]);

      const piece = getPieceAt(fen, fromX, fromY);
      
      if ((piece === 'P' && toX === 0) || (piece === 'p' && toX === 7)) {
        setPendingPromotion({ fromX, fromY, toX, toY });
        return true; // Visually keep the piece there until selected
      }

      return executeMove(fromX, fromY, toX, toY, 1); // 1 = Queen default
    } catch (e) {
      setStatus(`Crash: ${e.message}`);
      return false;
    }
  };

  const handlePromotionSelection = (pieceEnum) => {
    if (!pendingPromotion) return;
    executeMove(pendingPromotion.fromX, pendingPromotion.fromY, pendingPromotion.toX, pendingPromotion.toY, pieceEnum);
    setPendingPromotion(null);
  };

  const formatTime = (seconds) => {
    if (timeControl.minutes === 0) return "∞";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatSan = (san, color) => {
    if (san.startsWith('N')) return <><span className={`piece-icon ${color}`}>♞</span>{san.slice(1)}</>;
    if (san.startsWith('B')) return <><span className={`piece-icon ${color}`}>♝</span>{san.slice(1)}</>;
    if (san.startsWith('R')) return <><span className={`piece-icon ${color}`}>♜</span>{san.slice(1)}</>;
    if (san.startsWith('Q')) return <><span className={`piece-icon ${color}`}>♛</span>{san.slice(1)}</>;
    if (san.startsWith('K')) return <><span className={`piece-icon ${color}`}>♚</span>{san.slice(1)}</>;
    return san;
  };

  // Group moves into pairs for display
  const movePairs = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push({
      white: moveHistory[i],
      black: moveHistory[i + 1]
    });
  }

  return (
    <div className="app-background">
      {gameMode === "menu" ? (
        <div className="menu-container">
          <h1 className="title">Advance Chess</h1>
          <div className="menu-card">
            <p className="status-text">{status}</p>
            
            <div className="time-control-section">
              <label>Time Control: </label>
              <select 
                value={`${timeControl.minutes}|${timeControl.increment}`}
                onChange={(e) => {
                  const [m, i] = e.target.value.split('|').map(Number);
                  setTimeControl({ minutes: m, increment: i });
                }}
                className="time-select"
              >
                <option value="0|0">Unlimited</option>
                <option value="3|2">Blitz (3 | 2)</option>
                <option value="5|3">Blitz (5 | 3)</option>
                <option value="10|0">Rapid (10 | 0)</option>
                <option value="15|10">Rapid (15 | 10)</option>
              </select>
            </div>

            <h2>Select Game Mode</h2>
            <button className="btn" onClick={() => handleStartGame("pvp")}>Player vs Player</button>
            <div className="ai-section">
              <label>AI Difficulty (ELO): <strong>{elo}</strong></label>
              <input 
                type="range" 
                min="800" max="3200" step="400"
                value={elo} 
                onChange={(e) => setElo(parseInt(e.target.value))}
                className="slider"
              />
              <button className="btn ai-btn" onClick={() => handleStartGame("ai")}>Start vs AI</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="game-container">
          <div className="sidebar">
            <h2 className="title-small">{gameMode === "ai" ? "Player vs AI" : "Player vs Player"}</h2>
            {gameMode === "ai" && <p className="subtitle">AI ELO: {elo}</p>}
            
            <div className="clocks-container">
              <div className={`clock ${wasmModule && wasmModule.getTurn() === 1 ? 'active' : ''}`}>
                <span className="clock-label">Black</span>
                <span className="clock-time">{formatTime(blackTime)}</span>
              </div>
              <div className={`clock ${wasmModule && wasmModule.getTurn() === 0 ? 'active' : ''}`}>
                <span className="clock-label">White</span>
                <span className="clock-time">{formatTime(whiteTime)}</span>
              </div>
            </div>

            <div className={`status-box ${gameState !== 0 ? 'game-over' : ''}`}>
              {status}
            </div>
            {pendingPromotion && (
              <div className="promotion-modal">
                <h3>Select Promotion Piece</h3>
                <div className="promotion-buttons">
                  <button onClick={() => handlePromotionSelection(1)}>Queen</button>
                  <button onClick={() => handlePromotionSelection(4)}>Rook</button>
                  <button onClick={() => handlePromotionSelection(2)}>Bishop</button>
                  <button onClick={() => handlePromotionSelection(3)}>Knight</button>
                </div>
              </div>
            )}
            <button onClick={() => handleStartGame("menu")} className="btn back-btn">End Game</button>
          </div>
          <div className="board-wrapper" style={{ position: 'relative' }}>
            {gameState !== 0 && (
              <div className="board-overlay">
                <h2>Game Over</h2>
                <p>{status}</p>
                <button onClick={() => handleStartGame("menu")} className="btn">Back to Menu</button>
              </div>
            )}
            <div style={{ width: 600, height: 600 }}>
              <Chessboard 
                options={{
                  position: fen,
                  onPieceDrop: onDrop,
                  darkSquareStyle: { backgroundColor: "#779556" },
                  lightSquareStyle: { backgroundColor: "#ebecd0" },
                  animationDurationInMs: 200,
                  arePiecesDraggable: gameState === 0 && !pendingPromotion
                }}
              />
            </div>
          </div>
          
          <div className="history-sidebar">
            <h3 className="history-title">Move History</h3>
            <div className="history-list">
              {movePairs.map((pair, idx) => (
                <div key={idx} className="history-row">
                  <div className="history-number">{idx + 1}.</div>
                  <div className={`history-move ${moveHistory.length - 1 === idx * 2 ? 'active-move' : ''}`}>
                    {formatSan(pair.white.san, 'white-piece')}
                  </div>
                  <div className={`history-move ${moveHistory.length - 1 === idx * 2 + 1 ? 'active-move' : ''}`}>
                    {pair.black ? formatSan(pair.black.san, 'black-piece') : ''}
                  </div>
                </div>
              ))}
              <div ref={historyEndRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
