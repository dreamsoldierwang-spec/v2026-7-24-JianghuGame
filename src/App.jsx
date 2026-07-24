import { useState } from "react";
import { useGameState } from "./hooks/useGameState";
import StoryModal from "./components/StoryModal";
import BattleScene from "./components/BattleScene";
import PlayerStats from "./components/PlayerStats";
import Inventory from "./components/Inventory";
import Shop from "./components/Shop";
import ExplorePanel from "./components/ExplorePanel";

export default function App() {
  const [tab, setTab] = useState("explore");
  const {
    state,
    stats,
    addExp,
    addCoin,
    addItem,
    equipItem,
    useConsumable,
    buyItem,
    startBattle,
    performAttack,
    endBattle,
    toggleAutoBattle,
    changeMap,
    viewStory,
    closeStory,
    startGame,
    talkInTown,
    getAvailableMonsters,
    getCurrentQuest,
    getProgressPercent,
    updateQuestProgress,
    resetGame,
  } = useGameState();

  const handleStartBattle = (monsterId) => {
    startBattle(monsterId);
    setTab("battle");
  };

  const handleEndBattle = () => {
    endBattle();
    setTab("explore");
  };

  const handleSkill = (skillId) => {
    performAttack(skillId);
  };

  const handleAttack = () => {
    performAttack(null);
  };

  const currentQuest = getCurrentQuest();
  const availableMonsters = getAvailableMonsters();
  const progressPercent = getProgressPercent();

  // Title screen
  if (state.gamePhase === "title") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="mb-2 text-5xl font-bold text-amber-400">少年小帅勇闯江湖</h1>
        <p className="mb-8 text-lg text-gray-400">轻量化网页RPG · 回合制战斗 · 等级成长</p>
        <div className="mb-8 space-y-2 text-sm text-gray-500">
          <p>从无名新手少年，一步步成长为威震武林的绝世侠客</p>
          <p>打怪升级 · 解锁剧情 · 习得武学 · 闯荡新地图</p>
        </div>
        <button
          onClick={startGame}
          className="animate-pulse-glow rounded-xl bg-amber-500 px-10 py-3 text-xl font-bold text-black transition hover:bg-amber-400"
        >
          开始游戏
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Story overlay */}
      {state.currentStory && (
        <StoryModal storyId={state.currentStory} onClose={closeStory} />
      )}

      {/* Header */}
      <header className="border-b border-amber-500/20 bg-[#1e2030] px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold text-amber-400">少年小帅勇闯江湖</h1>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">
              Lv.{state.level} {state.title}
            </span>
            <span className="text-amber-300">铜币: {state.coin}</span>
            <button
              onClick={resetGame}
              className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-400 hover:bg-gray-600"
            >
              重置
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 gap-4 p-4">
        {/* Left sidebar - Player stats */}
        <aside className="w-64 shrink-0 space-y-4">
          <PlayerStats state={state} stats={stats} progressPercent={progressPercent} />

          {/* Navigation */}
          <div className="rounded-xl border border-amber-500/20 bg-[#1e2030] p-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "explore", label: "江湖", icon: "🗺️" },
                { id: "battle", label: "战斗", icon: "⚔️" },
                { id: "inventory", label: "背包", icon: "🎒" },
                { id: "shop", label: "商店", icon: "🏪" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                    tab === t.id
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-[#161825] text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick quest */}
          {currentQuest && (
            <div className="rounded-xl border border-amber-500/20 bg-[#1e2030] p-3">
              <div className="mb-1 text-xs font-bold text-amber-400">当前任务</div>
              <div className="text-xs text-gray-300">{currentQuest.name}</div>
              <div className="mt-1 text-[10px] text-gray-500">{currentQuest.description}</div>
            </div>
          )}
        </aside>

        {/* Center panel */}
        <section className="min-w-0 flex-1">
          {tab === "explore" && (
            <ExplorePanel
              currentMap={state.currentMap}
              unlockedMaps={state.unlockedMaps}
              level={state.level}
              availableMonsters={availableMonsters}
              currentQuest={currentQuest}
              talkCount={state.talkCount}
              questsCompleted={state.questsCompleted}
              questProgress={state.questProgress}
              onChangeMap={changeMap}
              onStartBattle={handleStartBattle}
              onTalk={talkInTown}
              onViewStory={viewStory}
            />
          )}

          {tab === "battle" && (
            <BattleScene
              battleState={state.battleState}
              stats={stats}
              skillsUnlocked={state.skillsUnlocked}
              skillCooldowns={state.skillCooldowns}
              battleLog={state.battleLog}
              isAutoBattle={state.isAutoBattle}
              onAttack={handleAttack}
              onSkill={handleSkill}
              onToggleAuto={toggleAutoBattle}
              onEndBattle={handleEndBattle}
            />
          )}

          {tab === "inventory" && (
            <Inventory
              inventory={state.inventory}
              equipped={state.equipped}
              consumables={state.consumables}
              onEquip={equipItem}
              onUseItem={useConsumable}
            />
          )}

          {tab === "shop" && (
            <Shop coin={state.coin} level={state.level} onBuyItem={buyItem} />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#1a1c29] px-4 py-2 text-center text-xs text-gray-600">
        少年小帅勇闯江湖 · 网页RPG游戏 · 回合制战斗 · 等级成长
      </footer>
    </div>
  );
}
