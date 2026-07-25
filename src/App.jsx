import { useRef, useEffect, useState, useCallback } from 'react';
import GameEngine from './game/GameEngine.js';

const STORIES = {
  0: {
    title: '序章 · 青竹村之祸',
    content: [
      '晨雾笼罩青竹村，炊烟袅袅，本该安宁的村落却一片慌乱。',
      '少年小帅手握一柄磨得发亮的木剑，站在村口，眼神坚定：',
      '"从小到大，都是村里人护我，如今家乡受难，我定要挺身而出，守护青竹村！"',
      '小帅拱手行礼："前辈，少年当有凌云志，若人人退缩，家乡便无安宁。今日我便从村口做起，击退匪寇，踏入江湖！"',
    ],
  },
  1: {
    title: '黑风岭 · 险途历练',
    content: [
      '穿过青石竹林，走出青竹村边界，小帅踏入真正的江湖野外。',
      '山林幽深、草木丛生，林间风声呼啸，暗藏危机。',
      '商人告知：前方黑风岭山贼盘踞，岭中头目凶悍无比，不少新手侠客皆折戟于此。',
      '小帅握紧手中短剑，毫无惧色：越是凶险之地，越能磨砺自身！',
    ],
  },
  2: {
    title: '高阶秘境 · 终极决战',
    content: [
      '习得门派正统武学，历经多重试炼，小帅已然成为青云门新锐弟子。',
      '黑风岭大当家勾结魔道余孽，占据深山秘境，修炼邪功，残害百姓。',
      '门派授命小帅，前往秘境平乱，根除魔道与匪寇祸根。',
      '身负门派期许、百姓期盼，小帅整装待发，奔赴高阶秘境！',
    ],
  },
};

const ENDING_STORY = {
  title: '绝世大侠 · 平定江湖',
  content: [
    '剑光破邪，长风浩荡。小帅历经苦战，一剑斩杀黑风霸主，破除魔道邪功！',
    '少年小帅之名响彻江湖，正道门派纷纷称赞，万千百姓感念其恩德。',
    '曾经青涩懵懂的青竹村少年，历经层层历练、步步成长，',
    '坚守初心、行侠仗义，终成一代人人敬仰的绝世大侠。',
    '江湖路远，侠义无疆。少年之身，守四海安宁，续写属于自己的江湖传奇！',
  ],
};

export default function App() {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const [gameState, setGameState] = useState('title'); // title | story | playing | levelComplete | gameOver | ending
  const [hud, setHud] = useState({
    hp: 3, maxHp: 3, levelIndex: 0, levelName: '', coins: 0, exp: 0,
    totalCoins: 0, totalExp: 0, bossActive: false, bossHp: null,
  });
  const [storyPage, setStoryPage] = useState(0);
  const [currentStory, setCurrentStory] = useState(null);
  const [levelStats, setLevelStats] = useState(null);
  const levelLoadCountRef = useRef(0);

  // 初始化引擎（仅在首次进入游戏时）
  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'story') return;
    if (engineRef.current) return;
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current, {
      onHud: (data) => setHud(data),
      onLevelLoad: (data) => {
        levelLoadCountRef.current++;
        // 第一次加载（关卡0）的剧情已由 startGame 设置，跳过
        if (levelLoadCountRef.current > 1) {
          const storyIdx = data.id - 1;
          const story = STORIES[storyIdx];
          if (story) {
            setCurrentStory(story);
            setStoryPage(0);
            setGameState('story');
          }
        }
      },
      onLevelComplete: (index, stats) => {
        setLevelStats(stats);
        setGameState('levelComplete');
      },
      onAllComplete: () => {
        setCurrentStory(ENDING_STORY);
        setGameState('ending');
      },
    });

    engineRef.current = engine;
    engine.loadLevel(0);
    engine.start();

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [gameState === 'playing' || gameState === 'story']);

  const startGame = useCallback(() => {
    levelLoadCountRef.current = 0;
    setGameState('story');
    setCurrentStory(STORIES[0]);
    setStoryPage(0);
  }, []);

  const closeStory = useCallback(() => {
    setCurrentStory(null);
    setStoryPage(0);
    setGameState('playing');
  }, []);

  const nextLevel = useCallback(() => {
    if (engineRef.current) {
      const ok = engineRef.current.nextLevel();
      if (ok) {
        setGameState('playing');
      }
    }
  }, []);

  const restartLevel = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.restartLevel();
      setGameState('playing');
    }
  }, []);

  const backToTitle = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
    setGameState('title');
  }, []);

  // 标题画面
  if (gameState === 'title') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 p-4 text-center">
        <div className="mb-2 text-6xl">⚔️</div>
        <h1 className="mb-2 bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-5xl font-black text-transparent">
          少年小帅勇闯江湖
        </h1>
        <p className="mb-1 text-lg text-amber-200/70">3D 动作平台游戏</p>
        <p className="mb-8 text-sm text-gray-500">少年执剑踏山河 · 一腔热血赴江湖</p>

        <div className="mb-8 grid grid-cols-2 gap-3 text-sm text-gray-400">
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2">
            <span className="font-bold text-amber-400">WASD</span> 移动
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2">
            <span className="font-bold text-amber-400">空格</span> 跳跃（可二段跳）
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2">
            <span className="font-bold text-amber-400">J</span> 挥剑攻击
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2">
            <span className="font-bold text-amber-400">ESC</span> 暂停
          </div>
        </div>

        <button
          onClick={startGame}
          className="animate-pulse rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-12 py-4 text-xl font-black text-black shadow-lg shadow-amber-500/30 transition hover:scale-105 hover:shadow-amber-500/50"
        >
          开始闯荡江湖
        </button>

        <p className="mt-6 text-xs text-gray-600">
          跳跃平台 · 击败山贼 · 收集铜币 · 闯过三关 · 击败BOSS
        </p>
      </div>
    );
  }

  // 结局画面
  if (gameState === 'ending') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-950 via-slate-900 to-black p-4 text-center">
        <div className="mb-4 text-6xl">🏆</div>
        <h1 className="mb-6 text-4xl font-black text-amber-400">通关 · 绝世大侠</h1>
        <div className="mb-6 max-w-lg space-y-3 text-gray-300">
          {ENDING_STORY.content.map((line, i) => (
            <p key={i} className="text-sm leading-relaxed">{line}</p>
          ))}
        </div>
        <div className="mb-6 flex gap-4 text-sm text-gray-400">
          <span>收集铜币: <span className="font-bold text-amber-400">{hud.coins}</span></span>
          <span>阅历珠: <span className="font-bold text-blue-400">{hud.exp}</span></span>
        </div>
        <button
          onClick={backToTitle}
          className="rounded-xl bg-amber-500 px-8 py-3 font-bold text-black transition hover:bg-amber-400"
        >
          重新开始
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* 3D 游戏画布 */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* HUD 叠加层 */}
      {gameState === 'playing' && (
        <>
          {/* 顶部信息栏 */}
          <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-center justify-between p-4">
            {/* 左：生命值 */}
            <div className="flex items-center gap-1">
              {Array.from({ length: hud.maxHp }).map((_, i) => (
                <span
                  key={i}
                  className={`text-2xl transition-all ${
                    i < hud.hp ? 'scale-100 opacity-100' : 'scale-75 opacity-30'
                  }`}
                >
                  ❤️
                </span>
              ))}
            </div>

            {/* 中：关卡名 */}
            <div className="rounded-full bg-black/50 px-4 py-1 text-center backdrop-blur">
              <span className="text-sm font-bold text-amber-400">
                第 {hud.levelIndex + 1} 关 · {hud.levelName}
              </span>
            </div>

            {/* 右：收集计数 */}
            <div className="flex items-center gap-3 text-sm">
              <span className="rounded-lg bg-black/50 px-3 py-1 backdrop-blur">
                🪙 <span className="font-bold text-amber-400">{hud.coins}</span>
                <span className="text-gray-500">/{hud.totalCoins}</span>
              </span>
              <span className="rounded-lg bg-black/50 px-3 py-1 backdrop-blur">
                🔮 <span className="font-bold text-blue-400">{hud.exp}</span>
                <span className="text-gray-500">/{hud.totalExp}</span>
              </span>
            </div>
          </div>

          {/* BOSS 血条 */}
          {hud.bossActive && hud.bossHp && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 w-96 -translate-x-1/2">
              <div className="mb-1 text-center text-sm font-bold text-red-400">
                ⚔️ 黑风霸主
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full border border-red-900 bg-black/60">
                <div
                  className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-300"
                  style={{
                    width: `${Math.max(0, (hud.bossHp.hp / hud.bossHp.maxHp) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* 底部操作提示 */}
          <div className="pointer-events-none absolute bottom-4 left-4 z-20 hidden text-xs text-white/40 sm:block">
            <div>WASD 移动 · 空格 跳跃 · J 攻击 · ESC 暂停</div>
          </div>

          {/* 暂停按钮 */}
          <button
            onClick={() => {
              if (engineRef.current) engineRef.current.paused = !engineRef.current.paused;
            }}
            className="absolute right-4 top-16 z-20 rounded-lg bg-black/50 px-3 py-1 text-xs text-white/60 backdrop-blur hover:bg-black/70"
          >
            ⏸ 暂停
          </button>
        </>
      )}

      {/* 剧情弹窗 */}
      {gameState === 'story' && currentStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-amber-500/30 bg-gradient-to-b from-slate-800 to-slate-900 p-8 shadow-2xl">
            <h2 className="mb-4 text-center text-2xl font-bold text-amber-400">
              {currentStory.title}
            </h2>
            <div className="min-h-[100px] space-y-3 text-center text-base leading-relaxed text-gray-200">
              {currentStory.content.slice(0, storyPage + 1).map((line, i) => (
                <p key={i} className="animate-[fadeIn_0.5s_ease-in]">{line}</p>
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              {storyPage < currentStory.content.length - 1 ? (
                <button
                  onClick={() => setStoryPage((p) => p + 1)}
                  className="rounded-lg bg-gray-700 px-6 py-2 text-sm font-bold text-white transition hover:bg-gray-600"
                >
                  继续 ▸
                </button>
              ) : (
                <button
                  onClick={closeStory}
                  className="animate-pulse rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-8 py-3 font-black text-black transition hover:scale-105"
                >
                  出发！
                </button>
              )}
            </div>
            {/* 跳过 */}
            {storyPage < currentStory.content.length - 1 && (
              <button
                onClick={closeStory}
                className="absolute right-4 top-4 text-xs text-gray-600 hover:text-gray-400"
              >
                跳过 »
              </button>
            )}
          </div>
        </div>
      )}

      {/* 关卡完成弹窗 */}
      {gameState === 'levelComplete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-gradient-to-b from-slate-800 to-slate-900 p-8 text-center shadow-2xl">
            <div className="mb-2 text-5xl">🎉</div>
            <h2 className="mb-4 text-2xl font-bold text-amber-400">关卡完成！</h2>
            <div className="mb-6 space-y-2 text-sm text-gray-300">
              <div>🪙 收集铜币: <span className="font-bold text-amber-400">{levelStats?.coins || 0}</span> / {levelStats?.totalCoins || 0}</div>
              <div>🔮 阅历珠: <span className="font-bold text-blue-400">{levelStats?.exp || 0}</span> / {levelStats?.totalExp || 0}</div>
              <div>⚔️ 击败敌人: <span className="font-bold text-red-400">{levelStats?.enemies || 0}</span></div>
            </div>
            {hud.levelIndex < 2 ? (
              <button
                onClick={nextLevel}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-8 py-3 font-black text-black transition hover:scale-105"
              >
                进入下一关 ▸
              </button>
            ) : (
              <button
                onClick={() => {
                  setCurrentStory(ENDING_STORY);
                  setGameState('ending');
                }}
                className="rounded-xl bg-gradient-to-r from-purple-500 to-amber-500 px-8 py-3 font-black text-black transition hover:scale-105"
              >
                查看结局 ✨
              </button>
            )}
            <div className="mt-3">
              <button
                onClick={restartLevel}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                重玩本关
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
