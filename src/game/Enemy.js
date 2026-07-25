// 敌人类：支持三种类型
// - bandit 山贼小兵：红色方块身体，巡逻移动，碰到玩家造成伤害，被踩或被攻击消灭
// - scout 山贼斥候：紫色身体，会跳跃移动
// - boss BOSS黑风霸主：大型黑色身体，有血条，会冲撞攻击

import * as THREE from 'three';

// 复用几何体
const ENEMY_GEO = {
  cube: new THREE.BoxGeometry(1, 1, 1),
  head: new THREE.SphereGeometry(0.4, 12, 10),
  bossBody: new THREE.BoxGeometry(2.2, 2.2, 2.2),
  bossHead: new THREE.SphereGeometry(0.7, 14, 12),
  horn: new THREE.ConeGeometry(0.18, 0.6, 6),
  weapon: new THREE.BoxGeometry(0.12, 1.6, 0.12),
};

const ENEMY_MAT = {
  banditBody: new THREE.MeshStandardMaterial({ color: 0xc4463a, roughness: 0.7 }),
  banditHead: new THREE.MeshStandardMaterial({ color: 0xe8b890, roughness: 0.8 }),
  scoutBody: new THREE.MeshStandardMaterial({
    color: 0x8a4ac4,
    emissive: 0x2a1040,
    emissiveIntensity: 0.3,
    roughness: 0.6,
  }),
  scoutHead: new THREE.MeshStandardMaterial({ color: 0xc8a8e0, roughness: 0.7 }),
  bossBody: new THREE.MeshStandardMaterial({
    color: 0x1a1525,
    emissive: 0x660000,
    emissiveIntensity: 0.5,
    metalness: 0.4,
    roughness: 0.5,
  }),
  bossHead: new THREE.MeshStandardMaterial({
    color: 0x2a1525,
    emissive: 0xaa0000,
    emissiveIntensity: 0.4,
  }),
  horn: new THREE.MeshStandardMaterial({
    color: 0x552222,
    metalness: 0.6,
    roughness: 0.4,
  }),
  weapon: new THREE.MeshStandardMaterial({
    color: 0x444444,
    metalness: 0.8,
    roughness: 0.3,
  }),
  eye: new THREE.MeshBasicMaterial({ color: 0xff3300 }),
};

// 敌人配置
const ENEMY_CONFIG = {
  bandit: {
    maxHp: 1,
    speed: 2.5,
    damage: 1,
    bodySize: { w: 0.9, h: 1.2, d: 0.9 },
    attackRange: 1.2,
    detectRange: 6,
  },
  scout: {
    maxHp: 1,
    speed: 3.5,
    damage: 1,
    bodySize: { w: 0.85, h: 1.1, d: 0.85 },
    attackRange: 1.2,
    detectRange: 7,
    jumpInterval: 1.5,
  },
  boss: {
    maxHp: 6,
    speed: 3,
    damage: 1,
    bodySize: { w: 2.0, h: 2.4, d: 2.0 },
    attackRange: 2.5,
    detectRange: 12,
    chargeRange: 8,
    chargeSpeed: 8,
    chargeCooldown: 3,
  },
};

export default class Enemy {
  constructor(scene, config) {
    this.scene = scene;
    this.type = config.type;
    this.config = ENEMY_CONFIG[config.type];
    this.position = new THREE.Vector3(config.x, config.y, config.z);
    this.velocity = new THREE.Vector3();
    this.patrolRange = config.patrol || 0;
    this.maxHp = config.hp || this.config.maxHp;
    this.hp = this.maxHp;

    // 状态
    this.dead = false;
    this.removed = false;
    this.facing = 1; // 朝向 1=正z方向，-1=反
    this.onGround = false;
    this.gravity = -25;

    // AI 状态
    this.patrolOrigin = this.position.x;
    this.state = 'patrol'; // patrol / chase / charge / dead
    this.stateTimer = 0;
    this.jumpTimer = 0;
    this.chargeTimer = 0;
    this.chargeDir = new THREE.Vector3();
    this.hitFlash = 0;

    // 受伤冒泡回调（由引擎接管做粒子）
    this.onDeath = null;
    this.onHit = null;

    this._build();
  }

  // 构建敌人模型
  _build() {
    this.group = new THREE.Group();
    if (this.type === 'bandit') this._buildBandit();
    else if (this.type === 'scout') this._buildScout();
    else if (this.type === 'boss') this._buildBoss();

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  // 山贼小兵
  _buildBandit() {
    const s = this.config.bodySize;
    // 身体（红色方块）
    const body = new THREE.Mesh(ENEMY_GEO.cube, ENEMY_MAT.banditBody);
    body.scale.set(s.w, s.h, s.d);
    body.position.y = s.h / 2;
    body.castShadow = true;
    this.bodyMesh = body;
    this.group.add(body);
    // 头
    const head = new THREE.Mesh(ENEMY_GEO.head, ENEMY_MAT.banditHead);
    head.position.y = s.h + 0.25;
    head.castShadow = true;
    this.headMesh = head;
    this.group.add(head);
    // 眼睛
    const eyeGeo = new THREE.SphereGeometry(0.06, 6, 5);
    const eye1 = new THREE.Mesh(eyeGeo, ENEMY_MAT.eye);
    eye1.position.set(-0.12, s.h + 0.28, 0.32);
    const eye2 = new THREE.Mesh(eyeGeo, ENEMY_MAT.eye);
    eye2.position.set(0.12, s.h + 0.28, 0.32);
    this.group.add(eye1, eye2);
    // 头巾（黑色条）
    const bandGeo = new THREE.BoxGeometry(0.7, 0.12, 0.7);
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.y = s.h + 0.45;
    this.group.add(band);
    this.height = s.h + 0.5;
    this.halfWidth = s.w / 2;
  }

  // 山贼斥候
  _buildScout() {
    const s = this.config.bodySize;
    const body = new THREE.Mesh(ENEMY_GEO.cube, ENEMY_MAT.scoutBody);
    body.scale.set(s.w, s.h, s.d);
    body.position.y = s.h / 2;
    body.castShadow = true;
    this.bodyMesh = body;
    this.group.add(body);
    const head = new THREE.Mesh(ENEMY_GEO.head, ENEMY_MAT.scoutHead);
    head.position.y = s.h + 0.2;
    head.castShadow = true;
    this.headMesh = head;
    this.group.add(head);
    // 眼睛
    const eyeGeo = new THREE.SphereGeometry(0.07, 6, 5);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff66ff });
    const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
    eye1.position.set(-0.13, s.h + 0.23, 0.3);
    const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
    eye2.position.set(0.13, s.h + 0.23, 0.3);
    this.group.add(eye1, eye2);
    // 斗篷
    const cloakGeo = new THREE.ConeGeometry(0.7, 1.0, 6);
    const cloakMat = new THREE.MeshStandardMaterial({
      color: 0x4a2a6a,
      side: THREE.DoubleSide,
    });
    const cloak = new THREE.Mesh(cloakGeo, cloakMat);
    cloak.position.y = s.h / 2;
    this.group.add(cloak);
    this.height = s.h + 0.45;
    this.halfWidth = s.w / 2;
  }

  // BOSS黑风霸主
  _buildBoss() {
    const s = this.config.bodySize;
    // 身体
    const body = new THREE.Mesh(ENEMY_GEO.bossBody, ENEMY_MAT.bossBody);
    body.scale.set(s.w / 2.2, s.h / 2.2, s.d / 2.2);
    body.position.y = s.h / 2;
    body.castShadow = true;
    this.bodyMesh = body;
    this.group.add(body);
    // 头
    const head = new THREE.Mesh(ENEMY_GEO.bossHead, ENEMY_MAT.bossHead);
    head.position.y = s.h + 0.3;
    head.castShadow = true;
    this.headMesh = head;
    this.group.add(head);
    // 双角
    const horn1 = new THREE.Mesh(ENEMY_GEO.horn, ENEMY_MAT.horn);
    horn1.position.set(-0.3, s.h + 0.8, 0);
    horn1.rotation.z = -0.4;
    const horn2 = new THREE.Mesh(ENEMY_GEO.horn, ENEMY_MAT.horn);
    horn2.position.set(0.3, s.h + 0.8, 0);
    horn2.rotation.z = 0.4;
    this.group.add(horn1, horn2);
    // 眼睛（发光）
    const eyeGeo = new THREE.SphereGeometry(0.12, 8, 6);
    const eye1 = new THREE.Mesh(eyeGeo, ENEMY_MAT.eye);
    eye1.position.set(-0.22, s.h + 0.35, 0.55);
    const eye2 = new THREE.Mesh(eyeGeo, ENEMY_MAT.eye);
    eye2.position.set(0.22, s.h + 0.35, 0.55);
    this.group.add(eye1, eye2);
    // 眼睛点光
    const eyeLight = new THREE.PointLight(0xff3300, 0.6, 5);
    eyeLight.position.set(0, s.h + 0.4, 0.5);
    this.group.add(eyeLight);
    // 巨剑
    const sword = new THREE.Mesh(ENEMY_GEO.weapon, ENEMY_MAT.weapon);
    sword.position.set(0.9, s.h * 0.6, 0.2);
    sword.rotation.z = -0.3;
    sword.scale.set(1.2, 1.5, 1.2);
    sword.castShadow = true;
    this.group.add(sword);
    this.swordMesh = sword;
    // BOSS血条（始终面向相机）
    this._buildBossBar();
    this.height = s.h + 1.0;
    this.halfWidth = s.w / 2;
  }

  // BOSS血条
  _buildBossBar() {
    const barGroup = new THREE.Group();
    // 背景
    const bgGeo = new THREE.PlaneGeometry(3, 0.3);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x330000 });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    barGroup.add(bg);
    // 前景
    const fgGeo = new THREE.PlaneGeometry(2.9, 0.22);
    const fgMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
    const fg = new THREE.Mesh(fgGeo, fgMat);
    fg.position.z = 0.01;
    barGroup.add(fg);
    barGroup.position.y = this.config.bodySize.h + 1.6;
    this.group.add(barGroup);
    this.bossBar = barGroup;
    this.bossBarFg = fg;
    this.bossBarBgGeo = fgGeo;
  }

  // 获取中心点（用于碰撞）
  getCenter() {
    return {
      x: this.position.x,
      y: this.position.y + this.height / 2,
      z: this.position.z,
      // AABB
      minX: this.position.x - this.halfWidth,
      maxX: this.position.x + this.halfWidth,
      minY: this.position.y,
      maxY: this.position.y + this.height,
      minZ: this.position.z - this.halfWidth,
      maxZ: this.position.z + this.halfWidth,
    };
  }

  // 受到攻击（来自玩家攻击或被踩）
  // 返回是否真的受伤
  takeDamage(amount = 1) {
    if (this.dead) return false;
    this.hp -= amount;
    this.hitFlash = 0.25;
    if (this.onHit) this.onHit(this.position);
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
      return true;
    }
    // BOSS受伤后加速进入冲撞
    if (this.type === 'boss') {
      this.chargeTimer = Math.min(this.chargeTimer, 0.5);
    }
    return true;
  }

  // 死亡
  die() {
    this.dead = true;
    this.state = 'dead';
    if (this.onDeath) this.onDeath(this.position, this.type);
  }

  // 更新
  // player: { position: Vector3, center: {minY, maxY, ...}, velocity }
  // platforms: 平台碰撞盒列表
  // dt: 时间步长
  update(dt, player, platforms) {
    if (this.removed) return;
    if (this.dead) {
      // 死亡下落并淡出
      this.position.y -= dt * 8;
      this.group.position.copy(this.position);
      this.group.rotation.z += dt * 4;
      this.stateTimer += dt;
      if (this.stateTimer > 0.6) {
        this.group.visible = false;
        this.removed = true;
      }
      return;
    }

    this.stateTimer += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt);

    // 闪白效果
    if (this.bodyMesh) {
      if (this.hitFlash > 0) {
        this.bodyMesh.material.emissive = new THREE.Color(0xffffff);
        this.bodyMesh.material.emissiveIntensity = 0.8;
      } else {
        // 恢复
        this.bodyMesh.material.emissive = new THREE.Color(
          this._origEmissive() || 0x000000
        );
        this.bodyMesh.material.emissiveIntensity = this._origEmissiveIntensity();
      }
    }

    // 重力
    this.velocity.y += this.gravity * dt;

    // AI
    const playerDist = this.position.distanceTo(player.position);
    const playerHorizDist = Math.hypot(
      player.position.x - this.position.x,
      player.position.z - this.position.z
    );

    if (this.type === 'boss') {
      this._updateBoss(dt, player, playerDist, playerHorizDist);
    } else if (this.type === 'scout') {
      this._updateScout(dt, player, playerDist, playerHorizDist);
    } else {
      this._updateBandit(dt, player, playerDist, playerHorizDist);
    }

    // 朝向玩家（追击时）
    if (this.state === 'chase' || this.state === 'charge') {
      const dx = player.position.x - this.position.x;
      this.facing = dx >= 0 ? 1 : -1;
    }
    // 用旋转控制朝向，避免镜像缩放导致法线翻转
    this.group.rotation.y = this.facing >= 0 ? 0 : Math.PI;

    // 应用速度
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    // 简单平台碰撞（仅垂直方向落地）
    this.onGround = false;
    for (const p of platforms) {
      const b = p.box;
      if (
        this.position.x > b.minX - this.halfWidth &&
        this.position.x < b.maxX + this.halfWidth &&
        this.position.z > b.minZ - this.halfWidth &&
        this.position.z < b.maxZ + this.halfWidth
      ) {
        // 从上方落到平台上
        if (
          this.velocity.y <= 0 &&
          this.position.y >= b.maxY - 0.1 &&
          this.position.y - b.maxY < 0.5
        ) {
          this.position.y = b.maxY;
          this.velocity.y = 0;
          this.onGround = true;
          break;
        }
      }
    }

    // 掉出世界
    if (this.position.y < -20) {
      this.die();
    }

    // 更新mesh位置
    this.group.position.copy(this.position);

    // 行走时身体微动
    if (this.onGround && (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.z) > 0.1)) {
      this.bodyMesh.rotation.z = Math.sin(this.stateTimer * 10) * 0.1;
    } else {
      this.bodyMesh.rotation.z *= 0.8;
    }

    // BOSS血条朝向相机与更新
    if (this.bossBar) {
      this.bossBarFg.scale.x = Math.max(0, this.hp / this.maxHp);
      this.bossBarFg.position.x = -(1 - this.hp / this.maxHp) * 1.45;
    }
  }

  _origEmissive() {
    if (this.type === 'bandit') return 0x000000;
    if (this.type === 'scout') return 0x2a1040;
    if (this.type === 'boss') return 0x660000;
    return 0x000000;
  }
  _origEmissiveIntensity() {
    if (this.type === 'scout') return 0.3;
    if (this.type === 'boss') return 0.5;
    return 0;
  }

  // 山贼小兵AI：巡逻 + 追击
  _updateBandit(dt, player, dist, horizDist) {
    if (horizDist < this.config.detectRange && Math.abs(player.position.y - this.position.y) < 3) {
      this.state = 'chase';
    } else if (horizDist > this.config.detectRange * 1.5) {
      this.state = 'patrol';
    }

    if (this.state === 'chase') {
      // 追击玩家
      const dx = player.position.x - this.position.x;
      const dz = player.position.z - this.position.z;
      const len = Math.hypot(dx, dz) || 1;
      this.velocity.x = (dx / len) * this.config.speed;
      this.velocity.z = (dz / len) * this.config.speed;
    } else {
      // 巡逻
      this.velocity.x = this.facing * this.config.speed * 0.5;
      this.velocity.z = 0;
      if (Math.abs(this.position.x - this.patrolOrigin) > this.patrolRange) {
        this.facing *= -1;
      }
    }
  }

  // 斥候AI：跳跃移动追击
  _updateScout(dt, player, dist, horizDist) {
    this.jumpTimer += dt;
    if (horizDist < this.config.detectRange) {
      this.state = 'chase';
    } else {
      this.state = 'patrol';
    }

    if (this.state === 'chase') {
      const dx = player.position.x - this.position.x;
      const dz = player.position.z - this.position.z;
      const len = Math.hypot(dx, dz) || 1;
      this.velocity.x = (dx / len) * this.config.speed;
      this.velocity.z = (dz / len) * this.config.speed;
    } else {
      this.velocity.x = this.facing * this.config.speed * 0.5;
      this.velocity.z = 0;
      if (Math.abs(this.position.x - this.patrolOrigin) > this.patrolRange) {
        this.facing *= -1;
      }
    }
    // 周期跳跃
    if (this.onGround && this.jumpTimer > this.config.jumpInterval) {
      this.velocity.y = 8;
      this.jumpTimer = 0;
    }
  }

  // BOSS AI：巡逻/追击/冲撞
  _updateBoss(dt, player, dist, horizDist) {
    this.chargeTimer += dt;
    // BOSS始终追击
    if (this.state !== 'charge') {
      if (horizDist < this.config.chargeRange && this.chargeTimer > this.config.chargeCooldown) {
        // 发动冲撞
        this.state = 'charge';
        this.stateTimer = 0;
        const dx = player.position.x - this.position.x;
        const dz = player.position.z - this.position.z;
        const len = Math.hypot(dx, dz) || 1;
        this.chargeDir.set(dx / len, 0, dz / len);
      } else if (horizDist < this.config.detectRange) {
        this.state = 'chase';
      } else {
        this.state = 'patrol';
      }
    }

    if (this.state === 'charge') {
      this.velocity.x = this.chargeDir.x * this.config.chargeSpeed;
      this.velocity.z = this.chargeDir.z * this.config.chargeSpeed;
      // 冲撞持续0.8秒
      if (this.stateTimer > 0.8) {
        this.state = 'chase';
        this.chargeTimer = 0;
      }
      // 冲撞时挥剑
      if (this.swordMesh) {
        this.swordMesh.rotation.z = -0.3 + Math.sin(this.stateTimer * 20) * 0.6;
      }
    } else if (this.state === 'chase') {
      const dx = player.position.x - this.position.x;
      const dz = player.position.z - this.position.z;
      const len = Math.hypot(dx, dz) || 1;
      this.velocity.x = (dx / len) * this.config.speed;
      this.velocity.z = (dz / len) * this.config.speed;
      if (this.swordMesh) {
        this.swordMesh.rotation.z = -0.3;
      }
    } else {
      // 巡逻
      this.velocity.x = this.facing * this.config.speed * 0.4;
      this.velocity.z = 0;
      if (Math.abs(this.position.x - this.patrolOrigin) > 4) {
        this.facing *= -1;
      }
    }
  }

  // 判断玩家是否在攻击范围内（用于敌人接触伤害判定，引擎也会用玩家攻击范围判定）
  canHitPlayer(playerCenter) {
    const c = this.getCenter();
    return (
      playerCenter.x > c.minX - 0.3 &&
      playerCenter.x < c.maxX + 0.3 &&
      playerCenter.z > c.minZ - 0.3 &&
      playerCenter.z < c.maxZ + 0.3 &&
      playerCenter.y > c.minY - 0.3 &&
      playerCenter.y < c.maxY + 0.5
    );
  }

  // 判断玩家是否踩到敌人头顶（从上方落下）
  isStomped(playerPrevY, playerCenter, playerVy) {
    const c = this.getCenter();
    return (
      playerVy < 0 &&
      playerPrevY >= c.maxY - 0.2 &&
      playerCenter.y < c.maxY + 0.3 &&
      playerCenter.x > c.minX - 0.3 &&
      playerCenter.x < c.maxX + 0.3 &&
      playerCenter.z > c.minZ - 0.3 &&
      playerCenter.z < c.maxZ + 0.3
    );
  }

  // 销毁
  dispose() {
    this.scene.remove(this.group);
  }
}
