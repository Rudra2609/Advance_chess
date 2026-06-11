const chess_module = require('./frontend/public/chess_module.js');

async function run() {
    console.log("Loading module...");
    const mod = await chess_module();
    console.log("Module loaded!");
    mod.initBoard();
    console.log("FEN:", mod.getBoardState());
}

run();
