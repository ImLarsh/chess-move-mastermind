
import React, { useState, useEffect, useCallback } from "react";
import { Chess, Move } from "chess.js";
import Chessboard from "./Chessboard";
import MoveHistory from "./MoveHistory";
import ControlPanel from "./ControlPanel";
import stockfishService, { uciToMove, simulateBestMove } from "@/lib/stockfish";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChessUIProps {
  initialPosition?: string;
}

const ChessUI: React.FC<ChessUIProps> = ({ initialPosition = "start" }) => {
  const [game, setGame] = useState<Chess>(new Chess(initialPosition));
  const [history, setHistory] = useState<Move[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [flipped, setFlipped] = useState(false);
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [suggestedMove, setSuggestedMove] = useState<{ from: string, to: string } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Function to start the game with the selected color
  const startGame = (color: "w" | "b") => {
    setPlayerColor(color);
    setFlipped(color === "b");
    setGameStarted(true);
    // Reset the game
    const newGame = new Chess();
    setGame(newGame);
    setHistory([]);
    setCurrentMoveIndex(-1);
    setSuggestedMove(null);
  };

  // Function to get a suggested move
  const getSuggestedMove = useCallback(async () => {
    if (!game || !showSuggestions || game.isGameOver()) return;
    
    if (game.turn() === playerColor) {
      setIsAnalyzing(true);
      
      try {
        // Get best move from Stockfish
        const bestMove = await stockfishService.getBestMove(game)
          .catch(() => {
            // If Stockfish fails, use simulation as fallback
            console.warn("Stockfish failed, using simulation instead");
            return simulateBestMove(game);
          });
        
        if (bestMove && bestMove.length >= 4) {
          const move = uciToMove(bestMove);
          setSuggestedMove(move);
        } else {
          setSuggestedMove(null);
        }
      } catch (error) {
        console.error("Error getting suggested move:", error);
        setSuggestedMove(null);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      setSuggestedMove(null);
    }
  }, [game, playerColor, showSuggestions]);

  // Update the suggested move whenever it's the player's turn
  useEffect(() => {
    if (gameStarted && game.turn() === playerColor && showSuggestions) {
      getSuggestedMove();
    } else {
      setSuggestedMove(null);
    }
  }, [gameStarted, game, playerColor, showSuggestions, getSuggestedMove]);

  // Handle a move being made on the board
  const handleMove = (move: Move) => {
    // Create a new game instance to avoid mutation
    const newGame = new Chess(game.fen());
    
    // Make the move
    try {
      newGame.move(move);
      
      // Update the game state
      setGame(newGame);
      
      // Update history
      const newHistory = [...history.slice(0, currentMoveIndex + 1), move];
      setHistory(newHistory);
      setCurrentMoveIndex(newHistory.length - 1);
      
      // Clear suggested move after player makes their move
      if (move.color === playerColor) {
        setSuggestedMove(null);
      }
    } catch (error) {
      console.error("Invalid move:", error);
    }
  };

  // Handle going to a specific move in the history
  const handleMoveClick = (index: number) => {
    const newGame = new Chess();
    
    // Replay all moves up to the clicked index
    for (let i = 0; i <= index; i++) {
      newGame.move(history[i]);
    }
    
    setGame(newGame);
    setCurrentMoveIndex(index);
  };

  // Handle flipping the board
  const handleFlipBoard = () => {
    setFlipped(!flipped);
  };

  // Handle undoing the last move
  const handleUndo = () => {
    if (currentMoveIndex < 0) return;
    
    const newGame = new Chess();
    
    // Replay all moves up to one before the current index
    for (let i = 0; i < currentMoveIndex; i++) {
      newGame.move(history[i]);
    }
    
    setGame(newGame);
    setCurrentMoveIndex(currentMoveIndex - 1);
    setSuggestedMove(null);
  };

  // Handle resetting the board
  const handleReset = () => {
    setGame(new Chess());
    setHistory([]);
    setCurrentMoveIndex(-1);
    setSuggestedMove(null);
  };

  // Handle exporting PGN
  const handleExportPGN = () => {
    const pgn = game.pgn();
    navigator.clipboard.writeText(pgn).catch(() => {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = pgn;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand("copy");
      } catch (err) {
        console.error("Failed to copy PGN:", err);
      }
      
      document.body.removeChild(textArea);
    });
  };

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-4 text-center">Choose Your Side</h2>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              Select which color you want to play as. The assistant will suggest moves for your side only.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button 
                className="flex-1 h-20 text-lg gap-3"
                onClick={() => startGame("w")}
              >
                <div className="text-3xl">♔</div>
                Play as White
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 h-20 text-lg gap-3"
                onClick={() => startGame("b")}
              >
                <div className="text-3xl">♚</div>
                Play as Black
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      {/* Chessboard Container */}
      <div className="flex flex-col gap-4">
        <div className="aspect-square w-full max-w-[600px] mx-auto">
          <Chessboard
            flipped={flipped}
            onMove={handleMove}
            position={game}
            suggestedMove={suggestedMove}
            showSuggestions={showSuggestions}
          />
        </div>
        
        <div className="w-full max-w-[600px] mx-auto">
          <ControlPanel
            onFlipBoard={handleFlipBoard}
            onReset={handleReset}
            onUndo={handleUndo}
            onExportPGN={handleExportPGN}
            showSuggestions={showSuggestions}
            onToggleSuggestions={setShowSuggestions}
          />
        </div>
      </div>
      
      {/* Move History and Status */}
      <div className={isMobile ? "order-first lg:order-last" : ""}>
        <div className="flex flex-col gap-4">
          {isAnalyzing && showSuggestions && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800">Analyzing position...</p>
            </div>
          )}
          
          {game.isGameOver() && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm font-medium">Game Over</p>
              {game.isCheckmate() && <p className="text-sm">Checkmate!</p>}
              {game.isDraw() && <p className="text-sm">Draw</p>}
              {game.isStalemate() && <p className="text-sm">Stalemate</p>}
              {game.isInsufficientMaterial() && <p className="text-sm">Insufficient Material</p>}
              {game.isThreefoldRepetition() && <p className="text-sm">Threefold Repetition</p>}
            </div>
          )}
          
          <MoveHistory
            moves={history}
            onMoveClick={handleMoveClick}
            currentMoveIndex={currentMoveIndex}
          />
          
          <div className="bg-white shadow rounded-md overflow-hidden border p-3">
            <div className="font-semibold text-sm mb-2">Game Status</div>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Turn:</span>
                <span className="font-medium">
                  {game.turn() === 'w' ? 'White' : 'Black'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Check:</span>
                <span className="font-medium">
                  {game.inCheck() ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Half-moves:</span>
                <span className="font-medium">
                  {game.fen().split(' ')[4]}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Full-moves:</span>
                <span className="font-medium">
                  {game.fen().split(' ')[5]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessUI;
