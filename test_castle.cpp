#include <iostream>
#include "Board.h"

int main() {
    Board b;
    b.setBoard();
    
    // e2-e4
    b.makeMoveAI(Move(6, 4, 4, 4, EMPTY));
    // e7-e5
    b.makeMoveAI(Move(1, 4, 3, 4, EMPTY));
    // g1-f3
    b.makeMoveAI(Move(7, 6, 5, 5, EMPTY));
    // b8-c6
    b.makeMoveAI(Move(0, 1, 2, 2, EMPTY));
    // f1-c4
    b.makeMoveAI(Move(7, 5, 4, 2, EMPTY));
    // d7-d6
    b.makeMoveAI(Move(1, 3, 2, 3, EMPTY));
    
    std::cout << "FEN before castling: " << b.generatePositionString() << std::endl;
    std::cout << "White king hasMoved: " << b.board[7][4].getHasMoved() << std::endl;
    std::cout << "White rook hasMoved: " << b.board[7][7].getHasMoved() << std::endl;
    
    // Castle Kingside: e1-g1 (7, 4 to 7, 6)
    bool success = b.makeMoveAI(Move(7, 4, 7, 6, EMPTY));
    std::cout << "Castle success: " << success << std::endl;
    std::cout << "FEN after castling: " << b.generatePositionString() << std::endl;
    
    return 0;
}
