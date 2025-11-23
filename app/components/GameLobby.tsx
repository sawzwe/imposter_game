"use client";

import { useState } from "react";
import { GameRoom } from "../types";

interface GameLobbyProps {
  gameRoom: GameRoom;
  playerId: string;
  playerName: string;
  onAddPlayer: (name: string) => void;
  onStartGame: () => void;
}

export default function GameLobby({
  gameRoom,
  playerId,
  playerName,
  onAddPlayer,
  onStartGame,
}: GameLobbyProps) {
  const [newPlayerName, setNewPlayerName] = useState("");
  const [copied, setCopied] = useState(false);

  const isHost = gameRoom.players[0]?.id === playerId;
  const roomUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}?room=${gameRoom.id}`
      : "";

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      onAddPlayer(newPlayerName.trim());
      setNewPlayerName("");
    }
  };

  const copyRoomLink = async () => {
    if (roomUrl) {
      try {
        await navigator.clipboard.writeText(roomUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900">
        <h1 className="mb-6 text-3xl font-bold text-center text-black dark:text-zinc-50">
          Game Lobby
        </h1>

        <div className="mb-6">
          <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
            Room ID:{" "}
            <span className="font-mono font-semibold">{gameRoom.id}</span>
          </p>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Players: {gameRoom.players.length} / 10
          </p>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Share this link to invite players:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomUrl}
                readOnly
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-black focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
              />
              <button
                onClick={copyRoomLink}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
            Players
          </h2>
          <div className="space-y-2">
            {gameRoom.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <span className="text-black dark:text-zinc-50">
                  {player.name}
                  {player.id === playerId && (
                    <span className="ml-2 text-sm text-blue-600 dark:text-blue-400">
                      (You)
                    </span>
                  )}
                  {player.id === gameRoom.players[0]?.id && (
                    <span className="ml-2 text-sm text-green-600 dark:text-green-400">
                      (Host)
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <div className="mb-6">
            <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
              Add Player
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Enter player name"
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-black focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleAddPlayer();
                }}
              />
              <button
                onClick={handleAddPlayer}
                className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-green-700"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {isHost && (
          <button
            onClick={onStartGame}
            disabled={gameRoom.players.length < 3}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start Game ({gameRoom.players.length} players)
          </button>
        )}

        {!isHost && (
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            Waiting for host to start the game...
          </p>
        )}
      </div>
    </div>
  );
}
