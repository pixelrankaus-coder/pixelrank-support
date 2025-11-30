"use client";

import { useState } from "react";
import { TrophyIcon } from "@heroicons/react/24/solid";

interface Agent {
  id: string;
  name: string;
  avatar?: string;
  ticketsResolved: number;
  rank: number;
}

interface LeaderboardProps {
  agents: Agent[];
}

const medalColors = {
  1: "bg-yellow-400", // Gold
  2: "bg-gray-300", // Silver
  3: "bg-orange-400", // Bronze
};

export function Leaderboard({ agents }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "achievements">(
    "leaderboard"
  );

  const topAgent = agents[0];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`pb-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "leaderboard"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Leaderboard
        </button>
        <button
          onClick={() => setActiveTab("achievements")}
          className={`pb-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "achievements"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Achievements
        </button>
      </div>

      {activeTab === "leaderboard" ? (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">Across helpdesk this month</p>
            <button className="text-xs text-blue-600 hover:text-blue-800">
              View all
            </button>
          </div>

          {/* Top 3 podium display */}
          <div className="flex justify-center items-end gap-2 mb-4">
            {agents.slice(0, 3).map((agent, index) => {
              const rank = index + 1;
              const size = rank === 1 ? "w-12 h-12" : "w-10 h-10";
              const medalColor =
                medalColors[rank as keyof typeof medalColors] || "bg-gray-200";

              return (
                <div key={agent.id} className="flex flex-col items-center">
                  <div
                    className={`${size} rounded-full ${medalColor} flex items-center justify-center text-white font-bold text-sm relative`}
                  >
                    {agent.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={agent.avatar}
                        alt={agent.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      agent.name.charAt(0).toUpperCase()
                    )}
                    <div
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${medalColor} border-2 border-white flex items-center justify-center text-xs font-bold`}
                    >
                      {rank}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MVP highlight */}
          {topAgent && (
            <div className="text-center py-3 border-t border-gray-100">
              <p className="font-medium text-gray-900">{topAgent.name}</p>
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                <TrophyIcon className="w-3 h-3 text-yellow-500" />
                Most valuable player
              </div>
            </div>
          )}

          {/* Agent list */}
          <div className="space-y-2 mt-3 max-h-32 overflow-y-auto">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between text-sm py-1"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 w-4">{agent.rank}</span>
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                    {agent.name.charAt(0)}
                  </div>
                  <span className="text-gray-700">{agent.name}</span>
                </div>
                <span className="text-gray-500">{agent.ticketsResolved}</span>
              </div>
            ))}
          </div>

          {agents.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No data available yet
            </p>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <TrophyIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Achievements coming soon</p>
        </div>
      )}
    </div>
  );
}
