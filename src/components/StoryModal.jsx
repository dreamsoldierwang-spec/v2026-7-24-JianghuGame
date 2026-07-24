import { useState } from "react";
import { STORIES } from "../data/gameData";

export default function StoryModal({ storyId, onClose }) {
  const [page, setPage] = useState(0);
  const story = STORIES[storyId];
  if (!story) return null;

  const isLastPage = page >= story.content.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-2xl rounded-xl border border-amber-500/30 bg-[#1e2030] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-amber-400">{story.title}</h2>
          <span className="text-sm text-gray-400">
            {page + 1} / {story.content.length}
          </span>
        </div>

        <div className="min-h-[120px] rounded-lg bg-[#161825] p-4 text-lg leading-relaxed text-gray-200">
          {story.content[page]}
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-white transition hover:bg-gray-600 disabled:opacity-30"
          >
            上一页
          </button>

          {isLastPage ? (
            <button
              onClick={onClose}
              className="animate-pulse-glow rounded-lg bg-amber-500 px-6 py-2 text-sm font-bold text-black transition hover:bg-amber-400"
            >
              踏入江湖
            </button>
          ) : (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg bg-amber-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-amber-500"
            >
              下一页
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
