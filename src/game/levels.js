// 关卡数据配置
// 每个关卡定义平台、敌人、收集品、起终点和装饰主题

export const LEVELS = [
  // ============== 关卡 1：青竹村 ==============
  {
    id: 1,
    name: '青竹村',
    story: '晨雾笼罩青竹村，少年小帅握紧腰间短剑，踏上闯荡江湖的第一步。村外山贼横行，跳过竹桥，收集散落的铜币，前往村口旗杆处出发吧！',
    sky: '#a8d8a8',
    fog: '#a8d8a8',
    fogNear: 30,
    fogFar: 90,
    ambient: 0.6,
    directional: 0.9,
    decoration: 'village',
    startPoint: { x: 0, y: 5, z: 8 },
    endPoint: { x: 0, y: 5, z: -95 },
    platforms: [
      // 起点草地
      { type: 'grass', x: 0, y: 0, z: 8, w: 12, h: 1, d: 12 },
      // 第一段跳跃
      { type: 'grass', x: 0, y: 0, z: -4, w: 6, h: 1, d: 6 },
      { type: 'wood', x: 0, y: 1.5, z: -11, w: 3, h: 0.4, d: 3 },
      { type: 'grass', x: 0, y: 3, z: -18, w: 6, h: 1, d: 6 },
      // 第二段：分叉
      { type: 'wood', x: -4, y: 4, z: -26, w: 2.5, h: 0.4, d: 2.5 },
      { type: 'wood', x: 4, y: 4, z: -26, w: 2.5, h: 0.4, d: 2.5 },
      { type: 'stone', x: -4, y: 5.5, z: -33, w: 4, h: 1, d: 4 },
      { type: 'stone', x: 4, y: 5.5, z: -33, w: 4, h: 1, d: 4 },
      // 汇合平台
      { type: 'grass', x: 0, y: 7, z: -41, w: 7, h: 1, d: 7 },
      // 第三段：连续小跳
      { type: 'wood', x: 0, y: 7, z: -49, w: 2, h: 0.4, d: 2 },
      { type: 'wood', x: 0, y: 7, z: -55, w: 2, h: 0.4, d: 2 },
      { type: 'wood', x: 0, y: 7, z: -61, w: 2, h: 0.4, d: 2 },
      // 终点草地
      { type: 'grass', x: 0, y: 0, z: -95, w: 14, h: 1, d: 14 },
      { type: 'grass', x: 0, y: 0, z: -75, w: 10, h: 1, d: 10 },
    ],
    enemies: [
      { type: 'bandit', x: 0, y: 1.5, z: -4, patrol: 3 },
      { type: 'bandit', x: -4, y: 7, z: -41, patrol: 2 },
      { type: 'bandit', x: 4, y: 7, z: -41, patrol: 2 },
      { type: 'scout', x: 0, y: 8.5, z: -55, patrol: 2 },
      { type: 'bandit', x: 3, y: 1.5, z: -75, patrol: 3 },
    ],
    coins: [
      { x: 0, y: 2, z: -4 },
      { x: 2, y: 3, z: -11 },
      { x: -2, y: 4.5, z: -26 },
      { x: 2, y: 4.5, z: -26 },
      { x: -4, y: 7, z: -33 },
      { x: 4, y: 7, z: -33 },
      { x: 0, y: 8.5, z: -41 },
      { x: 0, y: 8.5, z: -49 },
      { x: 0, y: 8.5, z: -61 },
      { x: -3, y: 2, z: -75 },
      { x: 3, y: 2, z: -75 },
    ],
    expOrbs: [
      { x: -4, y: 7, z: -33 },
      { x: 0, y: 9, z: -55 },
      { x: -5, y: 2, z: -95 },
    ],
  },

  // ============== 关卡 2：黑风岭 ==============
  {
    id: 2,
    name: '黑风岭',
    story: '黑风岭阴云密布，怪石嶙峋。山贼斥候在崖顶巡逻，稍有不慎便坠入深渊。小帅需借助枯木桥与岩石台，穿越黑风岭的险途。',
    sky: '#3a3548',
    fog: '#3a3548',
    fogNear: 25,
    fogFar: 75,
    ambient: 0.4,
    directional: 0.7,
    decoration: 'mountain',
    startPoint: { x: 0, y: 5, z: 8 },
    endPoint: { x: 0, y: 9, z: -95 },
    platforms: [
      // 起点
      { type: 'stone', x: 0, y: 0, z: 8, w: 10, h: 1, d: 10 },
      // 上升岩石阶梯
      { type: 'stone', x: 0, y: 1.5, z: 0, w: 4, h: 1, d: 4 },
      { type: 'stone', x: 0, y: 3, z: -6, w: 4, h: 1, d: 4 },
      { type: 'stone', x: 0, y: 4.5, z: -12, w: 4, h: 1, d: 4 },
      // 枯木桥窄道
      { type: 'wood', x: 0, y: 5.5, z: -19, w: 1.8, h: 0.4, d: 5 },
      { type: 'stone', x: 0, y: 6, z: -25, w: 5, h: 1, d: 5 },
      // 高低交错
      { type: 'stone', x: -3, y: 7, z: -32, w: 3, h: 1, d: 3 },
      { type: 'stone', x: 3, y: 8, z: -38, w: 3, h: 1, d: 3 },
      { type: 'stone', x: -3, y: 9, z: -44, w: 3, h: 1, d: 3 },
      { type: 'stone', x: 0, y: 9.5, z: -50, w: 6, h: 1, d: 6 },
      // 下降逃险
      { type: 'wood', x: 0, y: 8.5, z: -57, w: 2, h: 0.4, d: 2 },
      { type: 'wood', x: 0, y: 7.5, z: -63, w: 2, h: 0.4, d: 2 },
      { type: 'stone', x: 0, y: 7, z: -69, w: 5, h: 1, d: 5 },
      // 终点
      { type: 'stone', x: 0, y: 8, z: -95, w: 12, h: 1, d: 12 },
      { type: 'stone', x: 0, y: 7.5, z: -80, w: 8, h: 1, d: 8 },
    ],
    enemies: [
      { type: 'scout', x: 0, y: 5, z: 0, patrol: 1.5 },
      { type: 'bandit', x: 0, y: 6.5, z: -25, patrol: 2 },
      { type: 'scout', x: 3, y: 9.5, z: -38, patrol: 1 },
      { type: 'scout', x: -3, y: 10.5, z: -44, patrol: 1 },
      { type: 'bandit', x: 0, y: 11, z: -50, patrol: 2 },
      { type: 'bandit', x: -2, y: 8.5, z: -80, patrol: 2 },
      { type: 'bandit', x: 2, y: 8.5, z: -80, patrol: 2 },
    ],
    coins: [
      { x: 0, y: 3, z: 0 },
      { x: 0, y: 4.5, z: -6 },
      { x: 0, y: 6, z: -12 },
      { x: 0, y: 6.5, z: -19 },
      { x: -3, y: 8, z: -32 },
      { x: 3, y: 9, z: -38 },
      { x: -3, y: 10, z: -44 },
      { x: 0, y: 11, z: -50 },
      { x: 0, y: 9.5, z: -57 },
      { x: 0, y: 8.5, z: -63 },
      { x: -2, y: 8.5, z: -69 },
      { x: 2, y: 8.5, z: -69 },
    ],
    expOrbs: [
      { x: 0, y: 6.5, z: -19 },
      { x: 3, y: 9.5, z: -38 },
      { x: 0, y: 9.5, z: -95 },
    ],
  },

  // ============== 关卡 3：高阶秘境（BOSS战） ==============
  {
    id: 3,
    name: '高阶秘境',
    story: '紫色秘境之中，黑风霸主盘踞于此。击败他，方能扬名江湖。秘境平台悬浮于虚空，小心应战！',
    sky: '#2a1840',
    fog: '#2a1840',
    fogNear: 20,
    fogFar: 70,
    ambient: 0.5,
    directional: 0.6,
    decoration: 'secret',
    startPoint: { x: 0, y: 5, z: 12 },
    endPoint: { x: 0, y: 5, z: -12 },
    platforms: [
      // 主战场（圆形大平台）
      { type: 'secret', x: 0, y: 0, z: 0, w: 20, h: 1, d: 20 },
      // 四角小平台（用于躲避）
      { type: 'secret', x: -10, y: 2, z: -8, w: 3, h: 1, d: 3 },
      { type: 'secret', x: 10, y: 2, z: -8, w: 3, h: 1, d: 3 },
      { type: 'secret', x: -10, y: 2, z: 8, w: 3, h: 1, d: 3 },
      { type: 'secret', x: 10, y: 2, z: 8, w: 3, h: 1, d: 3 },
      // 入场平台
      { type: 'secret', x: 0, y: 0, z: 12, w: 6, h: 1, d: 4 },
      // 终点台（BOSS被击败后到达）
      { type: 'secret', x: 0, y: 0, z: -12, w: 6, h: 1, d: 4 },
    ],
    enemies: [
      // BOSS
      { type: 'boss', x: 0, y: 2, z: -6, hp: 6 },
      // 守门小兵
      { type: 'bandit', x: -3, y: 1.5, z: 4, patrol: 2 },
      { type: 'bandit', x: 3, y: 1.5, z: 4, patrol: 2 },
    ],
    coins: [
      { x: -10, y: 3, z: -8 },
      { x: 10, y: 3, z: -8 },
      { x: -10, y: 3, z: 8 },
      { x: 10, y: 3, z: 8 },
      { x: -5, y: 1.5, z: 0 },
      { x: 5, y: 1.5, z: 0 },
    ],
    expOrbs: [
      { x: -10, y: 3, z: -8 },
      { x: 10, y: 3, z: 8 },
    ],
  },
];

export default LEVELS;
