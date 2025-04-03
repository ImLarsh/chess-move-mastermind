
import React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Download, RotateCcw, SquareX } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ControlPanelProps {
  onFlipBoard: () => void;
  onReset: () => void;
  onUndo: () => void;
  onExportPGN: () => void;
  showSuggestions: boolean;
  onToggleSuggestions: (value: boolean) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onFlipBoard,
  onReset,
  onUndo,
  onExportPGN,
  showSuggestions,
  onToggleSuggestions,
}) => {
  const { toast } = useToast();

  const handleExport = () => {
    onExportPGN();
    toast({
      title: "PGN Exported",
      description: "The PGN has been copied to your clipboard",
      duration: 3000,
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:justify-between">
      <div className="flex items-center space-x-2">
        <Switch
          id="suggestions"
          checked={showSuggestions}
          onCheckedChange={onToggleSuggestions}
        />
        <Label htmlFor="suggestions" className="text-sm">
          Show Suggestions
        </Label>
      </div>
      
      <Button variant="outline" size="sm" onClick={onFlipBoard}>
        Flip Board
      </Button>
      
      <Button variant="outline" size="sm" onClick={onUndo}>
        <RotateCcw className="h-4 w-4 mr-2" />
        Undo
      </Button>
      
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="h-4 w-4 mr-2" />
        Export PGN
      </Button>
      
      <Button variant="destructive" size="sm" onClick={onReset} className="col-span-2 sm:col-span-1">
        <SquareX className="h-4 w-4 mr-2" />
        Reset Board
      </Button>
    </div>
  );
};

export default ControlPanel;
