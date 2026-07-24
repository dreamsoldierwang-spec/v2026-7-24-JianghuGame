import { useState, useCallback, useEffect, useRef } from "react";
import {
  LEVEL_CONFIG,
  BASE_STATS,
  SKILLS,
  PASSIVES,
  MONSTERS,
  EQUIPMENT,
  STORIES,
  QUESTS,
  MAPS,
  SHOP_ITEMS,
} from "../data/gameData";

function getInitialState() {
  return {
    level: 1,
    exp: 0,
    hp: BASE_STATS.hp,
    maxHp: BASE_STATS.hp,
    atk: BASE_STATS.atk,
    def: BASE_STATS.def,
    spd: BASE_STATS.spd,
    coin: 0,
    currentMap: "village",
    unlockedMaps: ["village"],
    inventory: [],
    equipped: { weapon: null, armor: null },
    skillsUnlocked: [],
    passivesUnlocked: [],
    questsCompleted: [],
    questProgress: {},
    currentStory: "intro",
    storyViewed: [],
    battleState: null,
    isAutoBattle: false,
    battleLog: [],
    consumables: {},
    tempBuffs: {},
    totalKills: {},
    title: "萌新侠客",
    gamePhase: "story",
    talkCount: 0,
    skillCooldowns: {},
  };
}

function calculateStats(state) {
  const config = LEVEL_CONFIG[state.level - 1];
  let hp = BASE_STATS.hp + config.hpBonus;
  let atk = BASE_STATS.atk + config.atkBonus;
  let def = BASE_STATS.def + config.defBonus;
  let spd = BASE_STATS.spd + config.spdBonus;

  if (state.equipped.weapon) {
    const w = EQUIPMENT[state.equipped.weapon];
    if (w) {
      atk += w.atkBonus || 0;
      spd += w.spdBonus || 0;
    }
  }
  if (state.equipped.armor) {
    const a = EQUIPMENT[state.equipped.armor];
    if (a) {
      hp += a.hpBonus || 0;
      def += a.defBonus || 0;
      atk += a.atkBonus || 0;
      spd += a.spdBonus || 0;
    }
  }

  if (state.passivesUnlocked.includes("qingyunHeart")) {
    hp = Math.floor(hp * 1.1);
    atk = Math.floor(atk * 1.1);
    def = Math.floor(def * 1.1);
    spd = Math.floor(spd * 1.1);
  }

  if (state.tempBuffs.atk) atk += state.tempBuffs.atk;
  if (state.tempBuffs.def) def += state.tempBuffs.def;

  return { hp, atk, def, spd };
}

function getExpRequired(level) {
  if (level >= LEVEL_CONFIG.length) return 999999;
  return LEVEL_CONFIG[level - 1].expRequired;
}

export function useGameState() {
  const [state, setState] = useState(getInitialState);
  const [damageNumbers, setDamageNumbers] = useState([]);
  const autoBattleRef = useRef(null);

  const stats = calculateStats(state);

  const addBattleLog = useCallback((msg) => {
    setState((prev) => ({
      ...prev,
      battleLog: [...prev.battleLog.slice(-49), msg],
    }));
  }, []);

  const checkLevelUp = useCallback(
    (newState) => {
      let s = { ...newState };
      while (s.level < 10 && s.exp >= getExpRequired(s.level)) {
        s.exp -= getExpRequired(s.level);
        s.level += 1;
        const cfg = LEVEL_CONFIG[s.level - 1];
        s.maxHp = calculateStats(s).hp;
        s.hp = s.maxHp;
        s.storyViewed = [...s.storyViewed, `level${s.level}`];
        s.currentStory = `level${s.level}`;
        s.gamePhase = "story";

        const newSkills = Object.values(SKILLS).filter(
          (sk) => sk.levelRequired === s.level && !s.skillsUnlocked.includes(sk.id)
        );
        newSkills.forEach((sk) => s.skillsUnlocked.push(sk.id));

        const newPassives = Object.values(PASSIVES).filter(
          (p) => p.levelRequired === s.level && !s.passivesUnlocked.includes(p.id)
        );
        newPassives.forEach((p) => s.passivesUnlocked.push(p.id));

        const newMaps = MAPS.filter(
          (m) => m.levelRequired === s.level && !s.unlockedMaps.includes(m.id)
        );
        newMaps.forEach((m) => s.unlockedMaps.push(m.id));
      }
      return s;
    },
    []
  );

  const addExp = useCallback(
    (amount) => {
      setState((prev) => {
        let next = { ...prev, exp: prev.exp + amount };
        return checkLevelUp(next);
      });
    },
    [checkLevelUp]
  );

  const addCoin = useCallback((amount) => {
    setState((prev) => ({ ...prev, coin: prev.coin + amount }));
  }, []);

  const addItem = useCallback((itemId) => {
    setState((prev) => {
      const item = EQUIPMENT[itemId];
      if (!item) return prev;
      return { ...prev, inventory: [...prev.inventory, itemId] };
    });
  }, []);

  const equipItem = useCallback((itemId) => {
    setState((prev) => {
      const item = EQUIPMENT[itemId];
      if (!item) return prev;
      const equipped = { ...prev.equipped };
      equipped[item.type] = itemId;
      const newStats = calculateStats({ ...prev, equipped });
      return {
        ...prev,
        equipped,
        maxHp: newStats.hp,
        hp: Math.min(prev.hp, newStats.hp),
      };
    });
  }, []);

  const useConsumable = useCallback((itemId) => {
    setState((prev) => {
      const item = SHOP_ITEMS.find((i) => i.id === itemId);
      if (!item || (prev.consumables[itemId] || 0) <= 0) return prev;
      const consumables = { ...prev.consumables, [itemId]: (prev.consumables[itemId] || 0) - 1 };
      const tempBuffs = { ...prev.tempBuffs };
      let hp = prev.hp;
      if (item.effect.hp) {
        const newStats = calculateStats(prev);
        hp = Math.min(prev.hp + item.effect.hp, newStats.hp);
      }
      if (item.effect.atk) tempBuffs.atk = (tempBuffs.atk || 0) + item.effect.atk;
      if (item.effect.def) tempBuffs.def = (tempBuffs.def || 0) + item.effect.def;
      return { ...prev, consumables, tempBuffs, hp };
    });
  }, []);

  const buyItem = useCallback((itemId) => {
    setState((prev) => {
      const item = SHOP_ITEMS.find((i) => i.id === itemId);
      if (!item || prev.coin < item.price) return prev;
      return {
        ...prev,
        coin: prev.coin - item.price,
        consumables: {
          ...prev.consumables,
          [itemId]: (prev.consumables[itemId] || 0) + 1,
        },
      };
    });
  }, []);

  const updateQuestProgress = useCallback(
    (monsterId) => {
      setState((prev) => {
        const questProgress = { ...prev.questProgress };
        const totalKills = { ...prev.totalKills, [monsterId]: (prev.totalKills[monsterId] || 0) + 1 };

        Object.values(QUESTS).forEach((quest) => {
          if (quest.levelRequired > prev.level) return;
          if (prev.questsCompleted.includes(quest.id)) return;
          if (quest.target.monster === monsterId) {
            questProgress[quest.id] = (questProgress[quest.id] || 0) + 1;
          }
        });

        let coin = prev.coin;
        let exp = prev.exp;
        let inventory = [...prev.inventory];
        let questsCompleted = [...prev.questsCompleted];

        Object.values(QUESTS).forEach((quest) => {
          if (questsCompleted.includes(quest.id)) return;
          if (quest.target.monster && questProgress[quest.id] >= quest.target.count) {
            questsCompleted.push(quest.id);
            coin += quest.reward.coin;
            exp += quest.reward.exp;
            if (quest.reward.equipment) inventory.push(quest.reward.equipment);
          }
        });

        let next = {
          ...prev,
          questProgress,
          totalKills,
          coin,
          exp,
          inventory,
          questsCompleted,
        };
        return checkLevelUp(next);
      });
    },
    [checkLevelUp]
  );

  const startBattle = useCallback(
    (monsterId) => {
      const monsterTemplate = MONSTERS[monsterId];
      if (!monsterTemplate) return;
      const monster = { ...monsterTemplate, currentHp: monsterTemplate.hp };
      const currentStats = calculateStats(state);
      setState((prev) => ({
        ...prev,
        battleState: {
          monster,
          turn: 1,
          isPlayerTurn: currentStats.spd >= monster.spd,
          playerHp: prev.hp,
          maxPlayerHp: currentStats.hp,
          battleEnded: false,
          victory: false,
          autoAttack: false,
        },
        battleLog: [`遭遇 ${monster.name}！`],
        skillCooldowns: {},
      }));
    },
    [state]
  );

  const performAttack = useCallback(
    (skillId) => {
      setState((prev) => {
        if (!prev.battleState || prev.battleState.battleEnded) return prev;
        const bs = { ...prev.battleState };
        const currentStats = calculateStats(prev);
        let log = [...prev.battleLog];
        let skillCooldowns = { ...prev.skillCooldowns };

        if (skillId) {
          if (skillCooldowns[skillId] > 0) return prev;
          const skill = SKILLS[skillId];
          if (skill) skillCooldowns[skillId] = skill.cooldown + 1;
        }

        // Player attack
        let totalDamage = 0;
        let monster = { ...bs.monster };

        if (skillId && SKILLS[skillId]) {
          const skill = SKILLS[skillId];
          if (skill.hits) {
            skill.damageMultiplier.forEach((mult) => {
              const dmg = Math.max(1, Math.floor(currentStats.atk * mult));
              totalDamage += dmg;
            });
          } else {
            totalDamage = skill.damage || Math.max(1, currentStats.atk - monster.def);
            if (skill.pierceChance && Math.random() < skill.pierceChance) {
              totalDamage = Math.floor(totalDamage * 1.5);
              log.push("破防！伤害提升！");
            }
          }
          log.push(`使用【${skill.name}】造成 ${totalDamage} 点伤害！`);
        } else {
          totalDamage = Math.max(1, currentStats.atk - monster.def);
          log.push(`普攻造成 ${totalDamage} 点伤害！`);
        }

        monster.currentHp = Math.max(0, monster.currentHp - totalDamage);
        setDamageNumbers((dn) => [
          ...dn,
          { id: Date.now(), value: totalDamage, type: "player", x: 60, y: 30 },
        ]);

        if (monster.currentHp <= 0) {
          log.push(`${monster.name} 被击败了！`);
          const coinReward = monster.coin;
          const expReward = monster.exp;
          log.push(`获得 ${expReward} 阅历，${coinReward} 铜币！`);

          const totalKills = { ...prev.totalKills, [monster.id]: (prev.totalKills[monster.id] || 0) + 1 };
          let next = {
            ...prev,
            battleState: { ...bs, monster, battleEnded: true, victory: true },
            battleLog: log,
            coin: prev.coin + coinReward,
            exp: prev.exp + expReward,
            totalKills,
            hp: bs.playerHp,
            skillCooldowns,
          };
          return checkLevelUp(next);
        }

        // Monster attack
        let monsterDamage = Math.max(1, monster.atk - currentStats.def);
        let playerHp = bs.playerHp - monsterDamage;
        log.push(`${monster.name} 反击，造成 ${monsterDamage} 点伤害！`);

        if (monster.lifesteal && monster.currentHp < monster.hp) {
          const heal = Math.floor(monsterDamage * monster.lifesteal);
          monster.currentHp = Math.min(monster.hp, monster.currentHp + heal);
          log.push(`${monster.name} 吸血恢复 ${heal} 点气血！`);
        }

        // Passive heal
        if (prev.passivesUnlocked.includes("calmHeart")) {
          const heal = PASSIVES.calmHeart.healPerTurn;
          playerHp = Math.min(currentStats.hp, playerHp + heal);
          log.push("【静心诀】恢复 5 点气血");
        }

        // Cooldown tick
        Object.keys(skillCooldowns).forEach((k) => {
          if (skillCooldowns[k] > 0) skillCooldowns[k] -= 1;
        });

        if (playerHp <= 0) {
          log.push("你重伤倒地，战斗失败...");
          return {
            ...prev,
            battleState: { ...bs, monster, playerHp: 0, battleEnded: true, victory: false },
            battleLog: log,
            hp: Math.max(1, Math.floor(currentStats.hp * 0.3)),
            skillCooldowns,
          };
        }

        return {
          ...prev,
          battleState: { ...bs, monster, playerHp, turn: bs.turn + 1 },
          battleLog: log,
          skillCooldowns,
        };
      });
    },
    [checkLevelUp, state]
  );

  const endBattle = useCallback(() => {
    setState((prev) => {
      if (!prev.battleState) return prev;
      return {
        ...prev,
        battleState: null,
        battleLog: [],
        isAutoBattle: false,
      };
    });
    if (autoBattleRef.current) {
      clearInterval(autoBattleRef.current);
      autoBattleRef.current = null;
    }
  }, []);

  const toggleAutoBattle = useCallback(() => {
    setState((prev) => {
      const next = { ...prev, isAutoBattle: !prev.isAutoBattle };
      return next;
    });
  }, []);

  useEffect(() => {
    if (state.isAutoBattle && state.battleState && !state.battleState.battleEnded) {
      autoBattleRef.current = setInterval(() => {
        performAttack(null);
      }, 800);
    } else {
      if (autoBattleRef.current) {
        clearInterval(autoBattleRef.current);
        autoBattleRef.current = null;
      }
    }
    return () => {
      if (autoBattleRef.current) {
        clearInterval(autoBattleRef.current);
        autoBattleRef.current = null;
      }
    };
  }, [state.isAutoBattle, state.battleState, performAttack]);

  const changeMap = useCallback((mapId) => {
    setState((prev) => {
      if (!prev.unlockedMaps.includes(mapId)) return prev;
      return { ...prev, currentMap: mapId };
    });
  }, []);

  const viewStory = useCallback((storyId) => {
    setState((prev) => ({
      ...prev,
      currentStory: storyId,
      storyViewed: prev.storyViewed.includes(storyId) ? prev.storyViewed : [...prev.storyViewed, storyId],
    }));
  }, []);

  const closeStory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStory: null,
      gamePhase: "explore",
    }));
  }, []);

  const startGame = useCallback(() => {
    setState((prev) => ({ ...prev, gamePhase: "story", currentStory: "intro" }));
  }, []);

  const talkInTown = useCallback(() => {
    setState((prev) => {
      if (prev.talkCount >= 3) return prev;
      const talkCount = prev.talkCount + 1;
      let questsCompleted = [...prev.questsCompleted];
      let coin = prev.coin;
      let exp = prev.exp;

      if (talkCount >= 3 && !questsCompleted.includes("main6")) {
        questsCompleted.push("main6");
        coin += QUESTS.main6.reward.coin;
        exp += QUESTS.main6.reward.exp;
      }

      let next = { ...prev, talkCount, questsCompleted, coin, exp };
      return checkLevelUp(next);
    });
  }, [checkLevelUp]);

  const getAvailableMonsters = useCallback(() => {
    const map = MAPS.find((m) => m.id === state.currentMap);
    if (!map) return [];
    return map.monsters
      .map((m) => MONSTERS[m])
      .filter((m) => m && m.levelRequired <= state.level);
  }, [state.currentMap, state.level]);

  const getCurrentQuest = useCallback(() => {
    const quests = Object.values(QUESTS)
      .filter((q) => q.levelRequired <= state.level && !state.questsCompleted.includes(q.id))
      .sort((a, b) => a.levelRequired - b.levelRequired);
    return quests[0] || null;
  }, [state.level, state.questsCompleted]);

  const getProgressPercent = useCallback(() => {
    if (state.level >= 10) return 100;
    const required = getExpRequired(state.level);
    return Math.min(100, Math.floor((state.exp / required) * 100));
  }, [state.level, state.exp]);

  const resetGame = useCallback(() => {
    setState(getInitialState());
  }, []);

  return {
    state,
    stats,
    damageNumbers,
    setDamageNumbers,
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
  };
}
