// 关卡类：负责构建平台、收集品、装饰、终点旗杆
// 提供平台列表供物理碰撞使用，提供收集检测与终点检测

import * as THREE from 'three';

// 复用几何体（性能优化）
const GEO_CACHE = {
  // 树
  trunk: new THREE.CylinderGeometry(0.15, 0.2, 1.2, 6),
  cone: new THREE.ConeGeometry(0.9, 1.8, 7),
  coneSmall: new THREE.ConeGeometry(0.7, 1.4, 7),
  // 石头
  rock: new THREE.DodecahedronGeometry(0.6, 0),
  // 竹子
  bamboo: new THREE.CylinderGeometry(0.08, 0.1, 3, 6),
  // 铜币
  coin: new THREE.CylinderGeometry(0.35, 0.35, 0.08, 14),
  // 终点旗杆
  pole: new THREE.CylinderGeometry(0.06, 0.06, 5, 8),
};

// 平台材质缓存
const MAT_CACHE = {
  grass: new THREE.MeshStandardMaterial({ color: 0x4a8a3a, roughness: 0.9 }),
  grassTop: new THREE.MeshStandardMaterial({ color: 0x6ab84a, roughness: 0.85 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x7a7680, roughness: 0.95 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x8a5a2a, roughness: 0.85 }),
  secret: new THREE.MeshStandardMaterial({
    color: 0x6a3aa0,
    emissive: 0x3a1a60,
    emissiveIntensity: 0.4,
    roughness: 0.5,
  }),
  coin: new THREE.MeshStandardMaterial({
    color: 0xffcc33,
    metalness: 0.9,
    roughness: 0.25,
    emissive: 0x553300,
    emissiveIntensity: 0.5,
  }),
  exp: new THREE.MeshStandardMaterial({
    color: 0x44aaff,
    emissive: 0x2288ff,
    emissiveIntensity: 0.9,
    metalness: 0.3,
    roughness: 0.2,
  }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.95 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x2a6a2a, roughness: 0.9 }),
  deadLeaf: new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.95 }),
  rock: new THREE.MeshStandardMaterial({ color: 0x6a6670, roughness: 0.95 }),
  bamboo: new THREE.MeshStandardMaterial({ color: 0x5aa55a, roughness: 0.8 }),
  flag: new THREE.MeshStandardMaterial({
    color: 0xff5544,
    emissive: 0x551111,
    emissiveIntensity: 0.4,
    side: THREE.DoubleSide,
  }),
  pole: new THREE.MeshStandardMaterial({ color: 0xddd0a0, metalness: 0.4 }),
};

export default class Level {
  constructor(scene, levelData) {
    this.scene = scene;
    this.data = levelData;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // 平台列表（用于碰撞）{ mesh, box: {minX,maxX,minY,maxY,minZ,maxZ} }
    this.platforms = [];
    // 收集品列表 { mesh, type, collected, baseY }
    this.collectibles = [];
    // 终点
    this.endFlag = null;
    this.endPosition = new THREE.Vector3(
      levelData.endPoint.x,
      levelData.endPoint.y,
      levelData.endPoint.z
    );
    // 装饰物列表（用于轻微动画）
    this.decorations = [];

    this._build();
  }

  // 构建关卡
  _build() {
    // 平台
    (this.data.platforms || []).forEach((p) => this._addPlatform(p));
    // 收集品
    (this.data.coins || []).forEach((c) => this._addCoin(c));
    (this.data.expOrbs || []).forEach((c) => this._addExpOrb(c));
    // 终点旗杆
    this._addEndFlag(this.data.endPoint);
    // 装饰
    this._addDecorations(this.data.decoration);
  }

  // 添加平台
  _addPlatform(p) {
    const geo = new THREE.BoxGeometry(p.w, p.h, p.d);
    const mat = MAT_CACHE[p.type] || MAT_CACHE.stone;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(p.x, p.y + p.h / 2, p.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);

    // 草地平台顶面贴一层草色
    if (p.type === 'grass') {
      const topGeo = new THREE.BoxGeometry(p.w + 0.02, 0.12, p.d + 0.02);
      const topMesh = new THREE.Mesh(topGeo, MAT_CACHE.grassTop);
      topMesh.position.set(p.x, p.y + p.h + 0.06, p.z);
      topMesh.receiveShadow = true;
      this.group.add(topMesh);
    }

    // 记录碰撞盒（AABB）
    this.platforms.push({
      mesh,
      box: {
        minX: p.x - p.w / 2,
        maxX: p.x + p.w / 2,
        minY: p.y,
        maxY: p.y + p.h,
        minZ: p.z - p.d / 2,
        maxZ: p.z + p.d / 2,
      },
    });
  }

  // 添加铜币
  _addCoin(c) {
    const mesh = new THREE.Mesh(GEO_CACHE.coin, MAT_CACHE.coin);
    mesh.position.set(c.x, c.y, c.z);
    mesh.rotation.x = Math.PI / 2;
    mesh.castShadow = true;
    this.group.add(mesh);
    this.collectibles.push({
      mesh,
      type: 'coin',
      collected: false,
      baseY: c.y,
      radius: 0.6,
    });
  }

  // 添加阅历珠
  _addExpOrb(c) {
    const geo = new THREE.SphereGeometry(0.35, 14, 12);
    const mesh = new THREE.Mesh(geo, MAT_CACHE.exp);
    mesh.position.set(c.x, c.y, c.z);
    mesh.castShadow = true;
    // 发光光晕
    const haloGeo = new THREE.SphereGeometry(0.6, 12, 10);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x44aaff,
      transparent: true,
      opacity: 0.2,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    mesh.add(halo);
    this.group.add(mesh);
    this.collectibles.push({
      mesh,
      type: 'exp',
      collected: false,
      baseY: c.y,
      radius: 0.7,
      halo,
    });
  }

  // 添加终点旗杆
  _addEndFlag(pos) {
    const group = new THREE.Group();
    // 旗杆
    const pole = new THREE.Mesh(GEO_CACHE.pole, MAT_CACHE.pole);
    pole.position.y = 2.5;
    pole.castShadow = true;
    group.add(pole);
    // 旗帜（三角形）
    const flagShape = new THREE.Shape();
    flagShape.moveTo(0, 0);
    flagShape.lineTo(1.2, 0.35);
    flagShape.lineTo(0, 0.7);
    flagShape.closePath();
    const flagGeo = new THREE.ShapeGeometry(flagShape);
    const flag = new THREE.Mesh(flagGeo, MAT_CACHE.flag);
    flag.position.set(0.06, 3.5, 0);
    flag.castShadow = true;
    group.add(flag);
    // 顶端球
    const ballGeo = new THREE.SphereGeometry(0.12, 10, 8);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xffcc55,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x553300,
    });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.y = 5.05;
    group.add(ball);

    group.position.set(pos.x, pos.y, pos.z);
    this.group.add(group);
    this.endFlag = group;
    this.endFlagMesh = flag; // 用于动画
    this.endBall = ball;
  }

  // 添加背景装饰
  _addDecorations(theme) {
    if (theme === 'village') {
      this._addBambooForest();
      this._addTrees(8, 0x2a6a2a);
      this._addRocks(6);
    } else if (theme === 'mountain') {
      this._addDeadTrees(10);
      this._addRocks(12);
    } else if (theme === 'secret') {
      this._addCrystalPillars();
    }
  }

  // 竹林
  _addBambooForest() {
    for (let i = 0; i < 30; i++) {
      const x = (Math.random() - 0.5) * 60 - 20;
      const z = (Math.random() - 0.5) * 120;
      // 避开主路径
      if (Math.abs(x) < 8 && z > -100 && z < 15) continue;
      const h = 2.5 + Math.random() * 2;
      const bamboo = new THREE.Mesh(GEO_CACHE.bamboo, MAT_CACHE.bamboo);
      bamboo.scale.y = h / 3;
      bamboo.position.set(x, h / 2, z);
      bamboo.castShadow = true;
      this.group.add(bamboo);
      // 竹节
      const jointGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 6);
      const jointMat = new THREE.MeshStandardMaterial({ color: 0x3a8a3a });
      for (let j = 0; j < 3; j++) {
        const joint = new THREE.Mesh(jointGeo, jointMat);
        joint.position.set(x, (h / 3) * (j + 0.5), z);
        this.group.add(joint);
      }
    }
  }

  // 树木（圆锥+圆柱）
  _addTrees(count, leafColor) {
    const leafMat =
      leafColor === 0x2a6a2a ? MAT_CACHE.leaf : MAT_CACHE.deadLeaf;
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 50 - 15;
      const z = (Math.random() - 0.5) * 110;
      if (Math.abs(x) < 9 && z > -100 && z < 15) continue;
      const group = new THREE.Group();
      const trunk = new THREE.Mesh(GEO_CACHE.trunk, MAT_CACHE.trunk);
      trunk.position.y = 0.6;
      trunk.castShadow = true;
      group.add(trunk);
      const cone = new THREE.Mesh(GEO_CACHE.cone, leafMat);
      cone.position.y = 2.0;
      cone.castShadow = true;
      group.add(cone);
      const cone2 = new THREE.Mesh(GEO_CACHE.coneSmall, leafMat);
      cone2.position.y = 2.8;
      cone2.castShadow = true;
      group.add(cone2);
      group.position.set(x, 0, z);
      const s = 0.8 + Math.random() * 0.6;
      group.scale.set(s, s, s);
      this.group.add(group);
      this.decorations.push({ mesh: group, type: 'tree', phase: Math.random() * 6 });
    }
  }

  // 枯树
  _addDeadTrees(count) {
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 50 - 15;
      const z = (Math.random() - 0.5) * 110;
      if (Math.abs(x) < 8 && z > -100 && z < 15) continue;
      const group = new THREE.Group();
      const trunk = new THREE.Mesh(GEO_CACHE.trunk, MAT_CACHE.trunk);
      trunk.position.y = 0.8;
      trunk.scale.set(0.8, 1.5, 0.8);
      trunk.castShadow = true;
      group.add(trunk);
      // 几根枯枝
      for (let j = 0; j < 3; j++) {
        const branchGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.8, 5);
        const branch = new THREE.Mesh(branchGeo, MAT_CACHE.trunk);
        branch.position.y = 1.5;
        branch.rotation.z = Math.PI / 3;
        branch.rotation.y = (j / 3) * Math.PI * 2;
        group.add(branch);
      }
      group.position.set(x, 0, z);
      const s = 0.9 + Math.random() * 0.5;
      group.scale.set(s, s, s);
      this.group.add(group);
    }
  }

  // 石头
  _addRocks(count) {
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 50 - 10;
      const z = (Math.random() - 0.5) * 110;
      if (Math.abs(x) < 8 && z > -100 && z < 15) continue;
      const rock = new THREE.Mesh(GEO_CACHE.rock, MAT_CACHE.rock);
      rock.position.set(x, 0.3, z);
      const s = 0.6 + Math.random() * 1.2;
      rock.scale.set(s, s * 0.7, s);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);
    }
  }

  // 秘境水晶柱
  _addCrystalPillars() {
    const crystalGeo = new THREE.OctahedronGeometry(0.5, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xaa66ff,
      emissive: 0x6633aa,
      emissiveIntensity: 0.6,
      metalness: 0.4,
      roughness: 0.2,
    });
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const r = 13;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const h = 1.5 + Math.random() * 2;
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.set(x, h, z);
      crystal.scale.y = h * 2;
      crystal.castShadow = true;
      this.group.add(crystal);
      this.decorations.push({
        mesh: crystal,
        type: 'crystal',
        phase: Math.random() * 6,
        baseY: h,
      });
    }
  }

  // 每帧更新（收集品旋转浮动、装饰动画）
  update(dt, time) {
    for (const c of this.collectibles) {
      if (c.collected) continue;
      c.mesh.rotation.y += dt * 2;
      c.mesh.position.y = c.baseY + Math.sin(time * 2 + c.baseY) * 0.15;
      if (c.halo) {
        c.halo.scale.setScalar(1 + Math.sin(time * 3) * 0.15);
      }
    }
    // 终点旗帜飘动
    if (this.endFlagMesh) {
      this.endFlagMesh.rotation.y = Math.sin(time * 3) * 0.2;
      this.endBall.position.y = 5.05 + Math.sin(time * 2) * 0.08;
    }
    // 装饰动画
    for (const d of this.decorations) {
      if (d.type === 'crystal') {
        d.mesh.rotation.y += dt * 0.5;
        d.mesh.position.y = d.baseY + Math.sin(time * 1.5 + d.phase) * 0.2;
      } else if (d.type === 'tree') {
        d.mesh.rotation.z = Math.sin(time + d.phase) * 0.02;
      }
    }
  }

  // 检测玩家收集物品，返回 {coins, exp} 本次收集数量
  checkCollect(playerCenter) {
    let coins = 0;
    let exp = 0;
    for (const c of this.collectibles) {
      if (c.collected) continue;
      const dx = c.mesh.position.x - playerCenter.x;
      const dy = c.mesh.position.y - playerCenter.y;
      const dz = c.mesh.position.z - playerCenter.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < c.radius + 0.6) {
        c.collected = true;
        c.mesh.visible = false;
        if (c.type === 'coin') coins++;
        else exp++;
      }
    }
    return { coins, exp };
  }

  // 检测是否到达终点
  checkEndReached(playerCenter) {
    const dx = this.endPosition.x - playerCenter.x;
    const dz = this.endPosition.z - playerCenter.z;
    return Math.sqrt(dx * dx + dz * dz) < 2;
  }

  // 获取平台列表（供物理引擎使用）
  getPlatforms() {
    return this.platforms;
  }

  // 获取已收集统计
  getCollectedStats() {
    let coins = 0;
    let exp = 0;
    let totalCoins = 0;
    let totalExp = 0;
    for (const c of this.collectibles) {
      if (c.type === 'coin') {
        totalCoins++;
        if (c.collected) coins++;
      } else {
        totalExp++;
        if (c.collected) exp++;
      }
    }
    return { coins, exp, totalCoins, totalExp };
  }

  // 销毁关卡
  dispose() {
    this.scene.remove(this.group);
    // 释放几何体（缓存的不释放）
    this.group.traverse((obj) => {
      if (obj.isMesh && !Object.values(GEO_CACHE).includes(obj.geometry)) {
        if (obj.geometry && obj.geometry.dispose) obj.geometry.dispose();
      }
    });
    this.platforms = [];
    this.collectibles = [];
    this.decorations = [];
  }
}
