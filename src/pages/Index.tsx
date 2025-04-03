
import React from "react";
import ChessUI from "../components/ChessUI";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Chess Best-Move Assistant</h1>
          <p className="text-sm text-gray-600">Get suggestions for your best moves</p>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        <ChessUI />
      </main>
      
      <footer className="bg-white border-t mt-10">
        <div className="container mx-auto px-4 py-4">
          <p className="text-sm text-gray-500 text-center">
            Chess Best-Move Assistant • Powered by Stockfish
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
