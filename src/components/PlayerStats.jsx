import { LEVEL_CONFIG } from "../data/gameData";

export default function PlayerStats({ state, stats, progressPercent }) {
  const config = LEVEL_CONFIG[state.level - 1];
  const nextConfig = LEVEL_CONFIG[state.level] || null;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-[#1e2030] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-amber-400">
            Lv.{state.level} {config.title}
          </h3>
          <p className="text-xs text-gray-400">{config.chapter}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-amber-300">{state.title}</div>
          <div className="text-xs text-gray-400">铜币: {state.coin}</div>
        </div>
      </div>

      {/* EXP bar */}
      <div className="mb-3">
        <div className="mb-1 flex justify-between text-xs text-gray-400">
          <span>阅历</span>
          <span>
            {state.exp} / {nextConfig ? config.expRequired : "MAX"}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-700">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center justify-between rounded bg-[#161825] px-3 py-2">
          <span className="text-gray-400">气血</span>
          <span className="font-bold text-green-400">{stats.hp}</span>
        </div>
        <div className="flex items-center justify-between rounded bg-[#161825] px-3 py-2">
          <span className="text-gray-400">攻击</span>
          <span className="font-bold text-red-400">{stats.atk}</span>
        </div>
        <div className="flex items-center justify-between rounded bg-[#161825] px-3 py-2">
          <span className="text-gray-400">防御</span>
          <span className="font-bold text-blue-400">{stats.def}</span>
        </div>
        <div className="flex items-center justify-between rounded bg-[#161825] px-3 py-2">
          <span className="text-gray-400">速度</span>
          <span className="font-bold text-yellow-400">{stats.spd}</span>
        </div>
      </div>

      {/* Equipped */}
      <div className="mt-3 space-y-1 text-xs">
        <div className="flex justify-between text-gray-400">
          <span>武器:</span>
          <span className="text-amber-300">
            {state.equipped.weapon ? "已装备" : "无"}
          </span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>防具:</span>
          <span className="text-amber-300">
            {state.equipped.armor ? "已装备" : "无"}
          </span>
        </div>
      </div>

      {/* Passives */}
      {state.passivesUnlocked.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {state.passivesUnlocked.map((pid) => (
            <span
              key={pid}
              className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300"
            >
              {pid === "calmHeart" ? "静心诀" : "青云心法"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
