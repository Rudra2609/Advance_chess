import chess_module from './frontend/public/chess_module.js';

async function run() {
    const mod = await chess_module();
    mod.initBoard();
    console.log("FEN:", mod.getBoardState());
    
    // Test setBoardFromFEN
    const success = mod.setBoardFromFEN(mod.getBoardState());
    console.log("setBoardFromFEN success:", success);
    
    // Test making a move
    console.log("Best move:", mod.getBestMove(250));
}

run();
