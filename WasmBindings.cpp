#include <emscripten/bind.h>
#include "AI.h"
#include <string>
#include <cstdlib>
#include <ctime>

using namespace emscripten;

Board globalBoard;
AI globalAI;

void initBoard() {
    static bool seeded = false;
    if (!seeded) {
        srand(time(NULL));
        seeded = true;
    }
    globalBoard.setBoard();
}

bool setBoardFromFEN(std::string fen) {
    return globalBoard.setBoardFromFEN(fen);
}

bool makeMove(int fromX, int fromY, int toX, int toY, int promotion) {
    Move m(fromX, fromY, toX, toY, static_cast<Piece>(promotion));
    return globalBoard.makeMoveAI(m);
}

std::string getBoardState() {
    std::string fen = globalBoard.generatePositionString();
    
    // generatePositionString already outputs board, turn, castling, and en passant (4 parts)
    // We just need to append the halfmove and fullmove clocks
    fen += " " + std::to_string(globalBoard.getHalfMoveClock()) + " " + 
           std::to_string(globalBoard.getFullMoveNumber());
           
    return fen;
}

int getGameState() {
    return globalBoard.getGameState();
}

std::string getBestMove(int elo) {
    globalAI.setElo(elo);
    Move m = globalAI.getBestMove(globalBoard);
    return std::to_string(m.fromX) + "," + std::to_string(m.fromY) + "," + 
           std::to_string(m.toX) + "," + std::to_string(m.toY);
}

int getTurn() {
    return globalBoard.getTurn() == WHITE ? 0 : 1;
}

bool hasMatingMaterial(int color) {
    return globalBoard.hasMatingMaterial(color == 0 ? WHITE : BLACK);
}

EMSCRIPTEN_BINDINGS(chess_module) {
    function("initBoard", &initBoard);
    function("setBoardFromFEN", &setBoardFromFEN);
    function("makeMove", &makeMove);
    function("getBoardState", &getBoardState);
    function("getBestMove", &getBestMove);
    function("getTurn", &getTurn);
    function("getGameState", &getGameState);
    function("hasMatingMaterial", &hasMatingMaterial);
}
