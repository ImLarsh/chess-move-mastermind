
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Move } from "chess.js";
import { cn } from "@/lib/utils";

interface MoveHistoryProps {
  moves: Move[];
  onMoveClick: (index: number) => void;
  currentMoveIndex: number;
}

const MoveHistory: React.FC<MoveHistoryProps> = ({ moves, onMoveClick, currentMoveIndex }) => {
  // Group moves into pairs for display
  const moveGroups: [Move, Move | null][] = [];
  for (let i = 0; i < moves.length; i += 2) {
    moveGroups.push([moves[i], moves[i + 1] || null]);
  }

  // Helper function to format a move in algebraic notation
  const formatMove = (move: Move) => {
    return move.san;
  };

  return (
    <div className="bg-white shadow rounded-md overflow-hidden border">
      <div className="p-3 bg-slate-100 border-b">
        <h3 className="font-semibold text-sm">Move History</h3>
      </div>
      <ScrollArea className="h-[calc(100%-40px)] max-h-[600px]">
        <div className="p-2">
          {moveGroups.length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-500">
              No moves yet
            </div>
          ) : (
            <div className="grid grid-cols-[auto_1fr_1fr] gap-x-2 gap-y-0.5">
              {moveGroups.map((group, groupIndex) => (
                <React.Fragment key={groupIndex}>
                  {/* Move number */}
                  <div className="text-sm font-medium text-gray-500">
                    {groupIndex + 1}.
                  </div>
                  
                  {/* White's move */}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={cn(
                      "h-auto py-1 justify-start font-normal",
                      groupIndex * 2 === currentMoveIndex && "bg-sky-100 text-sky-800"
                    )}
                    onClick={() => onMoveClick(groupIndex * 2)}
                  >
                    {formatMove(group[0])}
                  </Button>
                  
                  {/* Black's move (if exists) */}
                  {group[1] ? (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        "h-auto py-1 justify-start font-normal",
                        groupIndex * 2 + 1 === currentMoveIndex && "bg-sky-100 text-sky-800"
                      )}
                      onClick={() => onMoveClick(groupIndex * 2 + 1)}
                    >
                      {formatMove(group[1])}
                    </Button>
                  ) : (
                    <div></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MoveHistory;
