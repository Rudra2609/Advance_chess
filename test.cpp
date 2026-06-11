#include "AI.h"
#include <iostream>

int main() {
    Board b;
    b.setBoardFromFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    AI ai(250);
    Move m = ai.getBestMove(b);
    std::cout << "Move: " << m.fromX << "," << m.fromY << " -> " << m.toX << "," << m.toY << std::endl;
    return 0;
}
