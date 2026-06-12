const Module = require('./chess_module.js');

Module().then(wasmModule => {
    wasmModule.initBoard();
    // e2e4
    console.log("e2e4: ", wasmModule.makeMove(6, 4, 4, 4, 0));
    // e7e5
    console.log("e7e5: ", wasmModule.makeMove(1, 4, 3, 4, 0));
    // g1f3
    console.log("g1f3: ", wasmModule.makeMove(7, 6, 5, 5, 0));
    // b8c6
    console.log("b8c6: ", wasmModule.makeMove(0, 1, 2, 2, 0));
    // f1c4
    console.log("f1c4: ", wasmModule.makeMove(7, 5, 4, 2, 0));
    // d7d6
    console.log("d7d6: ", wasmModule.makeMove(1, 3, 2, 3, 0));
    
    // Now try to castle: e1g1 (fromX=7, fromY=4, toX=7, toY=6)
    const canCastle = wasmModule.makeMove(7, 4, 7, 6, 0);
    console.log("Castle e1g1: ", canCastle);
    console.log("FEN after: ", wasmModule.getBoardState());
});
