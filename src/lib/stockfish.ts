
import { Chess, Move } from 'chess.js';

// URL for the Stockfish WebAssembly (WASM) version
const STOCKFISH_URL = 'https://cdn.jsdelivr.net/npm/stockfish.wasm@0.10.0/stockfish.js';

class StockfishService {
  private engine: Worker | null = null;
  private isReady = false;
  private resolveReadyPromise: (() => void) | null = null;
  private readyPromise: Promise<void>;
  private moveCallbacks: ((bestMove: string) => void)[] = [];
  
  constructor() {
    // Create a promise that resolves when the engine is ready
    this.readyPromise = new Promise((resolve) => {
      this.resolveReadyPromise = resolve;
    });
    
    // Initialize the engine
    this.init();
  }
  
  private init() {
    try {
      // Create a new worker with the Stockfish WASM
      this.engine = new Worker(STOCKFISH_URL);
      
      // Set up message handler
      this.engine.onmessage = (event) => {
        const message = event.data;
        
        if (message === 'readyok') {
          // Engine is ready
          this.isReady = true;
          if (this.resolveReadyPromise) {
            this.resolveReadyPromise();
          }
        } else if (message.startsWith('bestmove')) {
          // Extract the best move
          const bestMove = message.split(' ')[1];
          
          // Notify all callbacks
          this.moveCallbacks.forEach(callback => callback(bestMove));
          this.moveCallbacks = [];
        }
      };
      
      // Initialize the engine
      this.sendCommand('uci');
      this.sendCommand('setoption name Threads value 4');
      this.sendCommand('setoption name Hash value 16');
      this.sendCommand('isready');
    } catch (error) {
      console.error('Failed to initialize Stockfish:', error);
    }
  }
  
  private sendCommand(command: string) {
    if (this.engine) {
      this.engine.postMessage(command);
    }
  }
  
  public async waitUntilReady(): Promise<void> {
    return this.readyPromise;
  }
  
  public async getBestMove(game: Chess, depth: number = 15): Promise<string> {
    await this.waitUntilReady();
    
    return new Promise((resolve) => {
      // Add the callback
      this.moveCallbacks.push(resolve);
      
      // Set the position
      this.sendCommand('position fen ' + game.fen());
      
      // Start the calculation
      this.sendCommand('go depth ' + depth);
    });
  }
  
  public stop() {
    this.sendCommand('stop');
  }
  
  public quit() {
    if (this.engine) {
      this.sendCommand('quit');
      this.engine.terminate();
      this.engine = null;
    }
  }
}

// Create a singleton instance
const stockfishService = new StockfishService();

export default stockfishService;

// Utility function to convert a move from chess.js format to UCI format
export function moveToUci(move: Move): string {
  return move.from + move.to + (move.promotion ? move.promotion : '');
}

// Utility function to convert a move from UCI format to chess.js format
export function uciToMove(uci: string): {from: string, to: string, promotion?: string} {
  const from = uci.substring(0, 2);
  const to = uci.substring(2, 4);
  const promotion = uci.length > 4 ? uci.substring(4, 5) : undefined;
  
  return {
    from,
    to,
    promotion
  };
}

// Function to simulate an analysis without the actual engine when it fails
export function simulateBestMove(game: Chess): string {
  // Get all legal moves
  const moves = game.moves({ verbose: true });
  
  if (moves.length === 0) {
    return '';
  }
  
  // For now, just return a random legal move
  const randomIndex = Math.floor(Math.random() * moves.length);
  return moveToUci(moves[randomIndex]);
}
