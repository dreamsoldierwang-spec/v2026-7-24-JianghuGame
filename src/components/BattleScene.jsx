import { useEffect } from "react";
import { SKILLS } from "../data/gameData";

export default function BattleScene({
  battleState,
  stats,
  skillsUnlocked,
  skillCooldowns,
  battleLog,
  isAutoBattle,
  onAttack,
  onSkill,
  onToggleAuto,
  onEndBattle,
}) {
  if (!battleState) return null;

  const { monster, playerHp, maxPlayerHp, battleEnded, victory } = battleState;
  const playerHpPercent = Math.max(0, Math.min(100, (playerHp / maxPlayerHp) * 100));
  const monsterHpPercent = Math.max(0, Math.min(100, (monster.currentHp / monster.hp) * 100));

  const availableSkills = skillsUnlocked
    .map((id) => SKILLS[id])
    .filter(Boolean);

  useEffect(() => {
    const el = document.getElementById("battle-log");
    if (el) el.scrollTop = el.scrollHeight;
  }, [battleLog]);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Battle arena */}
      <div className="relative flex flex-1 items-center justify-between rounded-xl border border-red-900/30 bg-[#1a1c2e] p-6">
        {/* Player */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-500 bg-amber-500/10 text-3xl">
              侠
            </div>
            {isAutoBattle && !battleEnded && (
              <span className="absolute -right-2 -top-2 rounded-full bg-green-500 px-2 py-0.5 text-xs text-white">
                自动
              </span>
            )}
          </div>
          <div className="w-32">
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-amber-400">小帅</span>
              <span className="text-gray-400">{playerHp}/{maxPlayerHp}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-700">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-300"
                style={{ width: `${playerHpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* VS */}
        <div className="text-4xl font-bold text-red-500/50">VS</div>

        {/* Monster */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-red-500 bg-red-500/10 text-3xl">
            {monster.isBoss ? "BOSS" : "敌"}
          </div>
          <div className="w-32">
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-red-400">{monster.name}</span>
              <span className="text-gray-400">{monster.currentHp}/{monster.hp}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-700">
              <div
                className="h-full rounded-full bg-red-500 transition-all duration-300"
                style={{ width: `${monsterHpPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Battle log */}
      <div
        id="battle-log"
        className="h-32 overflow-y-auto rounded-lg border border-gray-700 bg-[#161825] p-3 text-sm text-gray-300 scrollbar-thin"
      >
        {battleLog.map((log, i) => (
          <div key={i} className="py-0.5">
            {log.includes("被击败") ? (
              <span className="font-bold text-amber-400">{log}</span>
            ) : log.includes("使用") ? (
              <span className="text-cyan-400">{log}</span>
            ) : log.includes("反击") ? (
              <span className="text-red-400">{log}</span>
            ) : (
              <span className="text-gray-400">{log}</span>
            )}
          </div>
        ))}
      </div>

      {/* Controls */}
      {battleEnded ? (
        <div className="flex flex-col items-center gap-3 py-2">
          <div className={`text-xl font-bold ${victory ? "text-amber-400" : "text-red-400"}`}>
            {victory ? "战斗胜利！" : "战斗失败..."}
          </div>
          <button
            onClick={onEndBattle}
            className="rounded-lg bg-amber-500 px-8 py-2 font-bold text-black transition hover:bg-amber-400"
          >
            {victory ? "继续江湖" : "重整旗鼓"}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => onAttack(null)}
            className="rounded-lg bg-red-600 px-5 py-2 font-bold text-white transition hover:bg-red-500"
          >
            普通攻击
          </button>

          {availableSkills.map((skill) => {
            const cd = skillCooldowns[skill.id] || 0;
            return (
              <button
                key={skill.id}
                onClick={() => onSkill(skill.id)}
                disabled={cd > 0}
                className="relative rounded-lg bg-cyan-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-600 disabled:opacity-40"
              >
                {skill.name}
                {cd > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs">
                    {cd}
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={onToggleAuto}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
              isAutoBattle
                ? "bg-green-600 text-white hover:bg-green-500"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {isAutoBattle ? "停止挂机" : "自动战斗"}
          </button>

          <button
            onClick={onEndBattle}
            className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-600"
          >
            撤退
          </button>
        </div>
      )}
    </div>
  );
}
