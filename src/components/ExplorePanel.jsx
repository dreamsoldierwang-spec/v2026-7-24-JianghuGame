import { MAPS, QUESTS, LEVEL_CONFIG } from "../data/gameData";

export default function ExplorePanel({
  currentMap,
  unlockedMaps,
  level,
  availableMonsters,
  currentQuest,
  talkCount,
  questsCompleted,
  questProgress,
  onChangeMap,
  onStartBattle,
  onTalk,
  onViewStory,
}) {
  const map = MAPS.find((m) => m.id === currentMap);
  const mapName = map ? map.name : "未知区域";

  const questProg = currentQuest
    ? questProgress[currentQuest.id] || 0
    : 0;
  const questTarget = currentQuest?.target?.count || 1;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Map selection */}
      <div className="rounded-xl border border-amber-500/20 bg-[#1e2030] p-4">
        <h3 className="mb-3 text-lg font-bold text-amber-400">江湖地图</h3>
        <div className="grid grid-cols-3 gap-2">
          {MAPS.map((m) => {
            const unlocked = unlockedMaps.includes(m.id);
            const isCurrent = currentMap === m.id;
            return (
              <button
                key={m.id}
                onClick={() => unlocked && onChangeMap(m.id)}
                disabled={!unlocked}
                className={`rounded-lg border px-2 py-2 text-xs font-bold transition ${
                  isCurrent
                    ? "border-amber-500 bg-amber-500/20 text-amber-400"
                    : unlocked
                    ? "border-gray-600 bg-[#161825] text-gray-300 hover:border-gray-500"
                    : "border-gray-800 bg-[#0f1018] text-gray-600"
                }`}
              >
                <div>{m.name}</div>
                {!unlocked && <div className="text-[10px]">Lv.{m.levelRequired}解锁</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current location info */}
      <div className="flex-1 rounded-xl border border-amber-500/20 bg-[#1e2030] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-amber-400">{mapName}</h3>
          {map?.isTown && (
            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
              安全区
            </span>
          )}
        </div>

        {/* Monsters */}
        {!map?.isTown && availableMonsters.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 text-sm font-bold text-gray-300">附近敌人</h4>
            <div className="space-y-2">
              {availableMonsters.map((monster) => (
                <div
                  key={monster.id}
                  className="flex items-center justify-between rounded-lg border border-red-900/30 bg-[#161825] px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-bold text-gray-200">
                      {monster.name}
                      {monster.isBoss && (
                        <span className="ml-2 rounded bg-red-600 px-1 py-0.5 text-[10px] text-white">
                          BOSS
                        </span>
                      )}
                      {monster.isElite && (
                        <span className="ml-2 rounded bg-purple-600 px-1 py-0.5 text-[10px] text-white">
                          精英
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      血{monster.hp} 攻{monster.atk} 防{monster.def}
                    </div>
                  </div>
                  <button
                    onClick={() => onStartBattle(monster.id)}
                    className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-red-500"
                  >
                    出战
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Town actions */}
        {map?.isTown && (
          <div className="space-y-2">
            <div className="rounded-lg bg-[#161825] p-3 text-sm text-gray-300">
              <p className="mb-2">云溪镇热闹非凡，侠客云集。</p>
              <p className="text-xs text-gray-500">
                已完成问询: {talkCount}/3
              </p>
            </div>
            <button
              onClick={onTalk}
              disabled={talkCount >= 3}
              className="w-full rounded-lg bg-amber-600 py-2 text-sm font-bold text-white transition hover:bg-amber-500 disabled:opacity-30"
            >
              {talkCount >= 3 ? "已打探完毕" : "打探情报"}
            </button>
          </div>
        )}

        {/* Quest info */}
        {currentQuest && (
          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="mb-1 text-sm font-bold text-amber-400">
              当前任务: {currentQuest.name}
            </div>
            <div className="text-xs text-gray-400">{currentQuest.description}</div>
            {currentQuest.target.monster && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>进度</span>
                  <span>
                    {questProg} / {questTarget}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-gray-700">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{
                      width: `${Math.min(100, (questProg / questTarget) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Story replay */}
      <div className="rounded-xl border border-gray-700 bg-[#1e2030] p-3">
        <h4 className="mb-2 text-xs font-bold text-gray-400">剧情回顾</h4>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: level }, (_, i) => i + 1).map((lv) => {
            const storyId = lv === 1 ? "intro" : `level${lv}`;
            const config = LEVEL_CONFIG[lv - 1];
            return (
              <button
                key={lv}
                onClick={() => onViewStory(storyId)}
                className="rounded bg-gray-700 px-2 py-1 text-[10px] text-gray-300 transition hover:bg-gray-600"
              >
                {config.chapter}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
