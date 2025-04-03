
import React, { useState, useRef, useEffect } from "react";
import { Chess, Move, Square } from "chess.js";
import { cn } from "@/lib/utils";

interface ChessboardProps {
  flipped: boolean;
  onMove: (move: Move) => void;
  position: Chess;
  suggestedMove: { from: string, to: string } | null;
  showSuggestions: boolean;
}

const Chessboard: React.FC<ChessboardProps> = ({
  flipped,
  onMove,
  position,
  suggestedMove,
  showSuggestions,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ square: string, x: number, y: number } | null>(null);
  const [boardSize, setBoardSize] = useState(0);
  const dragRef = useRef<HTMLDivElement>(null);

  // Resize handler to keep the board responsive
  useEffect(() => {
    const handleResize = () => {
      if (boardRef.current) {
        const width = boardRef.current.clientWidth;
        setBoardSize(width);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Update legal moves when selected square changes
  useEffect(() => {
    if (selectedSquare) {
      const moves = position.moves({
        square: selectedSquare as Square,
        verbose: true,
      });
      setLegalMoves(moves.map((move) => move.to));
    } else {
      setLegalMoves([]);
    }
  }, [selectedSquare, position]);

  // Handle click on a square
  const handleSquareClick = (square: string) => {
    if (dragging) return;

    // If we already have a selected square
    if (selectedSquare) {
      // Try to make a move from the selected square to the clicked square
      try {
        const move = position.move({
          from: selectedSquare,
          to: square,
          promotion: "q", // Always promote to queen for simplicity
        });
        onMove(move);
      } catch (e) {
        // If the move is invalid and we clicked on a different square
        if (square !== selectedSquare) {
          // Check if the clicked square has a piece that can be selected
          const piece = position.get(square as Square);
          if (piece && piece.color === position.turn()) {
            setSelectedSquare(square);
          } else {
            setSelectedSquare(null);
          }
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      // No square is selected yet
      const piece = position.get(square as Square);
      if (piece && piece.color === position.turn()) {
        setSelectedSquare(square);
      }
    }
  };

  // Handle drag start
  const handleDragStart = (square: string, e: React.MouseEvent | React.TouchEvent) => {
    const piece = position.get(square as Square);
    if (!piece || piece.color !== position.turn()) return;

    setSelectedSquare(square);

    // Get the client position
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Set dragging state
    setDragging({
      square,
      x: clientX,
      y: clientY,
    });

    // Update drag image position
    if (dragRef.current && boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      dragRef.current.style.left = `${clientX - rect.left}px`;
      dragRef.current.style.top = `${clientY - rect.top}px`;
      dragRef.current.style.transform = "translate(-50%, -50%)";
    }
  };

  // Handle drag move
  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!dragging || !dragRef.current || !boardRef.current) return;

    // Get the client position
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Update drag image position
    const rect = boardRef.current.getBoundingClientRect();
    dragRef.current.style.left = `${clientX - rect.left}px`;
    dragRef.current.style.top = `${clientY - rect.top}px`;
  };

  // Handle drag end
  const handleDragEnd = (e: MouseEvent | TouchEvent) => {
    if (!dragging || !boardRef.current) {
      setDragging(null);
      return;
    }

    // Get the client position
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Calculate which square was dropped on
    const rect = boardRef.current.getBoundingClientRect();
    const squareSize = rect.width / 8;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      // Dropped outside the board
      setDragging(null);
      setSelectedSquare(null);
      return;
    }
    
    let file = Math.floor(x / squareSize);
    let rank = 7 - Math.floor(y / squareSize);
    
    if (flipped) {
      file = 7 - file;
      rank = 7 - rank;
    }
    
    const targetSquare = String.fromCharCode(97 + file) + (rank + 1);
    
    // Try to make the move
    try {
      const move = position.move({
        from: dragging.square,
        to: targetSquare,
        promotion: "q", // Always promote to queen for simplicity
      });
      onMove(move);
    } catch (e) {
      // Invalid move
      console.log("Invalid move:", e);
    }
    
    // Reset dragging state
    setDragging(null);
    setSelectedSquare(null);
  };

  // Set up event listeners for drag and touch
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e);
    const handleMouseUp = (e: MouseEvent) => handleDragEnd(e);
    const handleTouchMove = (e: TouchEvent) => handleDragMove(e);
    const handleTouchEnd = (e: TouchEvent) => handleDragEnd(e);
    
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
    }
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [dragging]);

  // Render the chess board
  const renderBoard = () => {
    const ranks = flipped ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
    const files = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    
    return (
      <div 
        className="grid grid-cols-8 aspect-square border-2 border-gray-800 relative select-none"
        ref={boardRef}
      >
        {ranks.map((rank) => (
          files.map((file) => {
            const square = String.fromCharCode(97 + file) + (rank + 1);
            const piece = position.get(square as Square);
            const isLight = (file + rank) % 2 === 0;
            const isSelected = selectedSquare === square;
            const isLegal = legalMoves.includes(square);
            
            // Determine if this square is part of the suggested move
            const isSuggestedFrom = suggestedMove && suggestedMove.from === square && showSuggestions;
            const isSuggestedTo = suggestedMove && suggestedMove.to === square && showSuggestions;
            
            // Don't show the piece on its original square if it's being dragged
            const showPiece = !(dragging && dragging.square === square);
            
            return (
              <div
                key={square}
                className={cn(
                  "relative flex items-center justify-center",
                  isLight ? "bg-chess-light-square" : "bg-chess-dark-square",
                  isSelected && "after:absolute after:inset-0 after:bg-chess-selected",
                  isLegal && "after:absolute after:rounded-full after:bg-chess-highlight after:w-1/4 after:h-1/4 after:opacity-70",
                  isSuggestedFrom && "ring-2 ring-inset ring-green-500",
                  isSuggestedTo && "ring-2 ring-inset ring-green-500",
                )}
                onClick={() => handleSquareClick(square)}
                onMouseDown={(e) => piece && handleDragStart(square, e)}
                onTouchStart={(e) => piece && handleDragStart(square, e)}
              >
                {/* Rendering square coordinates in corners */}
                {(file === (flipped ? 7 : 0) || rank === (flipped ? 0 : 7)) && (
                  <div className="absolute text-xs opacity-70">
                    {file === (flipped ? 7 : 0) && (
                      <span className={cn(
                        "absolute bottom-0 left-1",
                        isLight ? "text-chess-dark-square" : "text-chess-light-square"
                      )}>
                        {rank + 1}
                      </span>
                    )}
                    {rank === (flipped ? 0 : 7) && (
                      <span className={cn(
                        "absolute top-0 right-1",
                        isLight ? "text-chess-dark-square" : "text-chess-light-square"
                      )}>
                        {String.fromCharCode(97 + file)}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Rendering the chess piece */}
                {piece && showPiece && (
                  <div 
                    className={cn(
                      "w-full h-full flex items-center justify-center transition-transform",
                      "hover:cursor-grab active:cursor-grabbing",
                      isSelected && !dragging && "animate-piece-move"
                    )}
                  >
                    <div className="w-4/5 h-4/5 flex items-center justify-center">
                      {renderPiece(piece)}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ))}
        
        {/* Dragging piece overlay */}
        {dragging && (
          <div 
            ref={dragRef}
            className="absolute w-1/8 h-1/8 pointer-events-none z-10"
            style={{
              width: `${boardSize ? boardSize / 8 : 0}px`,
              height: `${boardSize ? boardSize / 8 : 0}px`,
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              {renderPiece(position.get(dragging.square as Square)!)}
            </div>
          </div>
        )}
        
        {/* Show arrow for suggested move */}
        {suggestedMove && showSuggestions && (
          <div className="absolute inset-0 pointer-events-none">
            <svg width="100%" height="100%" className="absolute inset-0">
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="4"
                  markerHeight="4"
                  refX="2"
                  refY="2"
                  orient="auto"
                >
                  <polygon points="0 0, 4 2, 0 4" fill="green" />
                </marker>
              </defs>
              {renderMoveArrow(suggestedMove.from, suggestedMove.to, flipped)}
            </svg>
          </div>
        )}
      </div>
    );
  };
  
  // Helper function to render move arrows
  const renderMoveArrow = (from: string, to: string, flipped: boolean) => {
    if (!boardRef.current) return null;
    
    const board = boardRef.current;
    const squareSize = board.clientWidth / 8;
    
    // Calculate the coordinates of the center of the squares
    const fromFile = from.charCodeAt(0) - 97;
    const fromRank = parseInt(from[1]) - 1;
    const toFile = to.charCodeAt(0) - 97;
    const toRank = parseInt(to[1]) - 1;
    
    let x1, y1, x2, y2;
    
    if (flipped) {
      x1 = (7 - fromFile) * squareSize + squareSize / 2;
      y1 = (7 - fromRank) * squareSize + squareSize / 2;
      x2 = (7 - toFile) * squareSize + squareSize / 2;
      y2 = (7 - toRank) * squareSize + squareSize / 2;
    } else {
      x1 = fromFile * squareSize + squareSize / 2;
      y1 = (7 - fromRank) * squareSize + squareSize / 2;
      x2 = toFile * squareSize + squareSize / 2;
      y2 = (7 - toRank) * squareSize + squareSize / 2;
    }
    
    // Adjust start and end points to not cover the pieces
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const offset = squareSize * 0.3;
    
    const nx = dx / length;
    const ny = dy / length;
    
    x1 = x1 + nx * offset;
    y1 = y1 + ny * offset;
    x2 = x2 - nx * offset;
    y2 = y2 - ny * offset;
    
    return (
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="green"
        strokeWidth={squareSize / 12}
        strokeOpacity={0.8}
        markerEnd="url(#arrowhead)"
      />
    );
  };

  // Helper function to render chess pieces
  const renderPiece = (piece: { type: string, color: string }) => {
    const pieceType = piece.type.toLowerCase();
    const pieceColor = piece.color;
    
    // Using Unicode chess symbols
    const pieceMap: Record<string, string> = {
      "p": pieceColor === "w" ? "♙" : "♟",
      "r": pieceColor === "w" ? "♖" : "♜",
      "n": pieceColor === "w" ? "♘" : "♞",
      "b": pieceColor === "w" ? "♗" : "♝",
      "q": pieceColor === "w" ? "♕" : "♛",
      "k": pieceColor === "w" ? "♔" : "♚",
    };
    
    return (
      <div className="w-full h-full flex items-center justify-center text-4xl md:text-5xl">
        {pieceMap[pieceType]}
      </div>
    );
  };

  return renderBoard();
};

export default Chessboard;
