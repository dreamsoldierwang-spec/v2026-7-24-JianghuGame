// 玩家类：少年小帅
// 角色由几何体拼装：身体（蓝色圆柱武侠服）、头（肤色球）、头发（黑色半球）、腰间短剑
// 包含移动、跳跃（二段跳）、攻击、生命、无敌闪烁、死亡重生

import * as THREE from 'three';

// 复用几何体
const PLAYER_GEO = {
  body: new THREE.CylinderGeometry(0.32, 0.38, 0.9, 12),
  head: new THREE.SphereGeometry(0.32, 16, 14),
  hair: new THREE.SphereGeometry(0.34, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
  arm: new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8),
  leg: new THREE.CylinderGeometry(0.12, 0.1, 0.55, 8),
  sword: new THREE.BoxGeometry(0.06, 1.1, 0.06),
  swordGuard: new THREE.BoxGeometry(0.3, 0.06, 0.1),
  swordHandle: new THREE.BoxGeometry(0.06, 0.2, 0.08),
  sash: new THREE.CylinderGeometry(0.39, 0.39, 0.12, 12),
};

const PLAYER_MAT = {
  body: new THREE.MeshStandardMaterial({ color: 0x3a6aa0, roughness: 0.7 }),
  bodyTrim: new THREE.MeshStandardMaterial({ color: 0xdab96e, roughness: 0.5, metalness: 0.4 }),
  head: new THREE.MeshStandardMaterial({ color: 0xf0c8a0, roughness: 0.8 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 }),
  arm: new THREE.MeshStandardMaterial({ color: 0x3a6aa0, roughness: 0.7 }),
  hand: new THREE.MeshStandardMaterial({ color: 0xf0c8a0, roughness: 0.8 }),
  leg: new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.8 }),
  shoe: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 }),
  sash: new THREE.MeshStandardMaterial({ color: 0xc4463a, roughness: 0.6 }),
  sword: new THREE.MeshStandardMaterial({
    color: 0xe0e0e8,
    metalness: 0.9,
    roughness: 0.15,
  }),
  swordGuard: new THREE.MeshStandardMaterial({
    color: 0xdab96e,
    metalness: 0.8,
    roughness: 0.3,
  }),
  swordHandle: new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.7 }),
};

export default class Player {
  constructor(scene) {
    this.scene = scene;
    this.position = new THREE.Vector3(0, 5, 8);
    this.velocity = new THREE.Vector3();
    this.facing = 0; // 朝向角度（绕Y）
    this.onGround = false;
    this.gravity = -30;

    // 生命
    this.maxHp = 3;
    this.hp = 3;

    // 跳跃
    this.jumpCount = 0;
    this.maxJumps = 2; // 二段跳

    // 攻击
    this.attacking = false;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.attackRange = 1.8;
    this.attackArc = Math.PI * 0.7; // 攻击扇形角度

    // 无敌
    this.invincible = false;
    this.invincibleTimer = 0;
    this.invDuration = 1.2;

    // 死亡/重生
    this.dead = false;
    this.respawnTimer = 0;
    this.respawnPoint = new THREE.Vector3(0, 5, 8);

    // 动画状态
    this.walkPhase = 0;
    this.prevY = this.position.y;

    // 回调（由引擎设置）
    this.onAttack = null; // 攻击时回调，引擎处理伤害判定与粒子
    this.onJump = null; // 跳跃时回调（生成灰尘粒子）
    this.onLand = null; // 落地回调
    this.onHit = null; // 受伤回调
    this.onDeath = null; // 死亡回调
    this.onStomp = null; // 踩中敌人回调（用于反弹）

    this._build();
  }

  // 构建角色模型
  _build() {
    this.group = new THREE.Group();

    // 身体（蓝色武侠服）
    this.body = new THREE.Mesh(PLAYER_GEO.body, PLAYER_MAT.body);
    this.body.position.y = 0.45;
    this.body.castShadow = true;
    this.group.add(this.body);

    // 衣襟装饰（金色边）
    const trimGeo = new THREE.BoxGeometry(0.1, 0.9, 0.05);
    const trim = new THREE.Mesh(trimGeo, PLAYER_MAT.bodyTrim);
    trim.position.set(0, 0.45, 0.32);
    this.group.add(trim);

    // 腰带（红色）
    const sash = new THREE.Mesh(PLAYER_GEO.sash, PLAYER_MAT.sash);
    sash.position.y = 0.15;
    this.group.add(sash);

    // 头
    this.head = new THREE.Mesh(PLAYER_GEO.head, PLAYER_MAT.head);
    this.head.position.y = 1.1;
    this.head.castShadow = true;
    this.group.add(this.head);

    // 头发（黑色半球）
    const hair = new THREE.Mesh(PLAYER_GEO.hair, PLAYER_MAT.hair);
    hair.position.y = 1.12;
    hair.castShadow = true;
    this.group.add(hair);

    // 发髻
    const bunGeo = new THREE.SphereGeometry(0.12, 10, 8);
    const bun = new THREE.Mesh(bunGeo, PLAYER_MAT.hair);
    bun.position.set(0, 1.4, -0.05);
    this.group.add(bun);
    // 发簪
    const pinGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6);
    const pin = new THREE.Mesh(pinGeo, PLAYER_MAT.swordGuard);
    pin.position.set(0, 1.4, -0.05);
    pin.rotation.z = Math.PI / 2;
    this.group.add(pin);

    // 眼睛
    const eyeGeo = new THREE.SphereGeometry(0.04, 6, 5);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
    eye1.position.set(-0.1, 1.12, 0.28);
    const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
    eye2.position.set(0.1, 1.12, 0.28);
    this.group.add(eye1, eye2);

    // 手臂（左右）
    this.armL = new THREE.Mesh(PLAYER_GEO.arm, PLAYER_MAT.arm);
    this.armL.position.set(-0.42, 0.55, 0);
    this.armL.castShadow = true;
    this.group.add(this.armL);
    this.armR = new THREE.Mesh(PLAYER_GEO.arm, PLAYER_MAT.arm);
    this.armR.position.set(0.42, 0.55, 0);
    this.armR.castShadow = true;
    this.group.add(this.armR);

    // 手
    const handGeo = new THREE.SphereGeometry(0.1, 8, 6);
    this.handL = new THREE.Mesh(handGeo, PLAYER_MAT.hand);
    this.handL.position.set(-0.42, 0.25, 0);
    this.group.add(this.handL);
    this.handR = new THREE.Mesh(handGeo, PLAYER_MAT.hand);
    this.handR.position.set(0.42, 0.25, 0);
    this.group.add(this.handR);

    // 腿（左右）
    this.legL = new THREE.Mesh(PLAYER_GEO.leg, PLAYER_MAT.leg);
    this.legL.position.set(-0.15, -0.05, 0);
    this.legL.castShadow = true;
    this.group.add(this.legL);
    this.legR = new THREE.Mesh(PLAYER_GEO.leg, PLAYER_MAT.leg);
    this.legR.position.set(0.15, -0.05, 0);
    this.legR.castShadow = true;
    this.group.add(this.legR);

    // 鞋
    const shoeGeo = new THREE.BoxGeometry(0.18, 0.1, 0.28);
    this.shoeL = new THREE.Mesh(shoeGeo, PLAYER_MAT.shoe);
    this.shoeL.position.set(-0.15, -0.35, 0.05);
    this.group.add(this.shoeL);
    this.shoeR = new THREE.Mesh(shoeGeo, PLAYER_MAT.shoe);
    this.shoeR.position.set(0.15, -0.35, 0.05);
    this.group.add(this.shoeR);

    // 腰间短剑（挂在右侧腰）
    this.swordGroup = new THREE.Group();
    const sword = new THREE.Mesh(PLAYER_GEO.sword, PLAYER_MAT.sword);
    sword.position.y = -0.3;
    sword.castShadow = true;
    this.swordGroup.add(sword);
    const guard = new THREE.Mesh(PLAYER_GEO.swordGuard, PLAYER_MAT.swordGuard);
    guard.position.y = 0.28;
    this.swordGroup.add(guard);
    const handle = new THREE.Mesh(PLAYER_GEO.swordHandle, PLAYER_MAT.swordHandle);
    handle.position.y = 0.4;
    this.swordGroup.add(handle);
    // 剑刃光效
    const bladeGeo = new THREE.BoxGeometry(0.1, 1.0, 0.1);
    const bladeMat = new THREE.MeshBasicMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0,
    });
    this.swordGlow = new THREE.Mesh(bladeGeo, bladeMat);
    this.swordGlow.position.y = -0.3;
    this.swordGroup.add(this.swordGlow);

    this.swordGroup.position.set(0.42, 0.55, 0.1);
    this.swordGroup.rotation.z = -0.4;
    this.group.add(this.swordGroup);

    // 玩家脚下阴影圆（辅助视觉，地面阴影已由灯光提供）
    this.group.position.copy(this.position);
    this.scene.add(this.group);

    // 角色碰撞尺寸
    this.height = 1.6;
    this.halfWidth = 0.35;
  }

  // 设置重生点
  setRespawnPoint(p) {
    this.respawnPoint.set(p.x, p.y, p.z);
  }

  // 重生
  respawn() {
    this.dead = false;
    this.hp = this.maxHp;
    this.position.copy(this.respawnPoint);
    this.velocity.set(0, 0, 0);
    this.invincible = true;
    this.invincibleTimer = this.invDuration;
    this.group.visible = true;
    this.group.position.copy(this.position);
  }

  // 受伤
  takeDamage(amount = 1) {
    if (this.invincible || this.dead) return false;
    this.hp -= amount;
    this.invincible = true;
    this.invincibleTimer = this.invDuration;
    if (this.onHit) this.onHit(this.position);
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }
    return true;
  }

  // 死亡
  die() {
    this.dead = true;
    this.respawnTimer = 1.5;
    this.velocity.set(0, 8, 0); // 死亡弹起
    if (this.onDeath) this.onDeath(this.position);
  }

  // 触发攻击
  tryAttack() {
    if (this.attacking || this.attackCooldown > 0 || this.dead) return false;
    this.attacking = true;
    this.attackTimer = 0;
    this.attackCooldown = 0.45;
    if (this.onAttack) this.onAttack(this.position, this.facing, this.attackRange, this.attackArc);
    return true;
  }

  // 触发跳跃
  tryJump() {
    if (this.dead) return false;
    if (this.jumpCount < this.maxJumps) {
      this.velocity.y = this.jumpCount === 0 ? 11 : 9.5; // 二段跳稍弱
      this.jumpCount++;
      this.onGround = false;
      if (this.onJump) this.onJump(this.position, this.jumpCount);
      return true;
    }
    return false;
  }

  // 获取中心点与AABB
  getCenter() {
    return {
      x: this.position.x,
      y: this.position.y + this.height / 2,
      z: this.position.z,
      minX: this.position.x - this.halfWidth,
      maxX: this.position.x + this.halfWidth,
      minY: this.position.y,
      maxY: this.position.y + this.height,
      minZ: this.position.z - this.halfWidth,
      maxZ: this.position.z + this.halfWidth,
    };
  }

  // 更新
  // input: { moveX, moveZ (相对相机的移动向量), jumpPressed, attackPressed }
  // platforms: 平台碰撞盒列表
  // dt: 时间步长
  update(dt, input, platforms) {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    if (this.dead) {
      this.respawnTimer -= dt;
      // 死亡时上抛后下落
      this.velocity.y += this.gravity * dt;
      this.position.y += this.velocity.y * dt;
      this.group.position.copy(this.position);
      this.group.rotation.z += dt * 3;
      if (this.respawnTimer <= 0) {
        this.respawn();
      }
      return;
    }

    // 无敌时间
    if (this.invincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.group.visible = true;
      } else {
        // 闪烁
        this.group.visible = Math.floor(this.invincibleTimer * 12) % 2 === 0;
      }
    }

    // 攻击计时
    if (this.attacking) {
      this.attackTimer += dt;
      if (this.attackTimer > 0.3) {
        this.attacking = false;
      }
    }

    // 移动输入（input.moveX/moveZ 已是相对相机的方向向量，已归一化）
    const moveLen = Math.hypot(input.moveX, input.moveZ);
    const speed = 6;
    if (moveLen > 0.01) {
      const nx = input.moveX / moveLen;
      const nz = input.moveZ / moveLen;
      this.velocity.x = nx * speed;
      this.velocity.z = nz * speed;
      // 朝向移动方向
      this.facing = Math.atan2(nx, nz);
    } else {
      // 减速
      this.velocity.x *= 0.7;
      this.velocity.z *= 0.7;
    }

    // 重力
    this.velocity.y += this.gravity * dt;

    // 记录上一帧Y（用于踩敌人判定）
    this.prevY = this.position.y;

    // 分轴碰撞：先X，再Z，最后Y
    this.position.x += this.velocity.x * dt;
    this._collideAxis(platforms, 'x');
    this.position.z += this.velocity.z * dt;
    this._collideAxis(platforms, 'z');
    this.position.y += this.velocity.y * dt;
    const wasOnGround = this.onGround;
    this.onGround = false;
    this._collideAxis(platforms, 'y');

    // 落地判定
    if (!wasOnGround && this.onGround) {
      if (this.onLand) this.onLand(this.position);
      this.jumpCount = 0;
    }
    // 离开地面（下落）时消耗一段跳
    if (!this.onGround && this.jumpCount === 0 && this.velocity.y < 0) {
      this.jumpCount = 1;
    }

    // 掉出世界
    if (this.position.y < -15) {
      this.hp = 0;
      this.die();
    }

    // 更新模型位置与朝向
    this.group.position.copy(this.position);
    // 平滑朝向
    let targetRot = this.facing;
    let cur = this.group.rotation.y;
    let diff = targetRot - cur;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.group.rotation.y = cur + diff * 0.25;

    // 动画
    this._animate(dt, moveLen);
  }

  // 单轴碰撞
  _collideAxis(platforms, axis) {
    const half = this.halfWidth;
    const minY = this.position.y;
    const maxY = this.position.y + this.height;
    for (const p of platforms) {
      const b = p.box;
      // X轴
      if (axis === 'x') {
        if (
          this.position.x + half > b.minX &&
          this.position.x - half < b.maxX &&
          maxY > b.minY &&
          minY < b.maxY &&
          this.position.z + half > b.minZ &&
          this.position.z - half < b.maxZ
        ) {
          if (this.velocity.x > 0) {
            this.position.x = b.minX - half;
          } else if (this.velocity.x < 0) {
            this.position.x = b.maxX + half;
          }
          this.velocity.x = 0;
        }
      } else if (axis === 'z') {
        if (
          this.position.x + half > b.minX &&
          this.position.x - half < b.maxX &&
          maxY > b.minY &&
          minY < b.maxY &&
          this.position.z + half > b.minZ &&
          this.position.z - half < b.maxZ
        ) {
          if (this.velocity.z > 0) {
            this.position.z = b.minZ - half;
          } else if (this.velocity.z < 0) {
            this.position.z = b.maxZ + half;
          }
          this.velocity.z = 0;
        }
      } else if (axis === 'y') {
        if (
          this.position.x + half > b.minX &&
          this.position.x - half < b.maxX &&
          this.position.z + half > b.minZ &&
          this.position.z - half < b.maxZ &&
          maxY > b.minY &&
          minY < b.maxY
        ) {
          if (this.velocity.y <= 0) {
            // 落到平台顶
            this.position.y = b.maxY;
            this.velocity.y = 0;
            this.onGround = true;
          } else if (this.velocity.y > 0) {
            // 撞到平台底
            this.position.y = b.minY - this.height;
            this.velocity.y = 0;
          }
        }
      }
    }
  }

  // 角色动画
  _animate(dt, moveLen) {
    // 行走：腿臂摆动
    if (this.onGround && moveLen > 0.01) {
      this.walkPhase += dt * 12;
      const swing = Math.sin(this.walkPhase) * 0.5;
      this.legL.rotation.x = swing;
      this.legR.rotation.x = -swing;
      this.shoeL.rotation.x = swing;
      this.shoeR.rotation.x = -swing;
      this.armL.rotation.x = -swing * 0.7;
      // 右手握剑时不动，仅左手摆
      this.body.rotation.z = Math.sin(this.walkPhase) * 0.05;
    } else if (this.onGround) {
      // 待机
      this.legL.rotation.x *= 0.8;
      this.legR.rotation.x *= 0.8;
      this.shoeL.rotation.x *= 0.8;
      this.shoeR.rotation.x *= 0.8;
      this.armL.rotation.x *= 0.8;
      this.body.rotation.z *= 0.8;
    } else {
      // 跳跃：前倾
      this.body.rotation.x = -0.25;
      this.legL.rotation.x = -0.3;
      this.legR.rotation.x = -0.3;
      this.armL.rotation.x = -1.2;
    }
    if (this.onGround) {
      this.body.rotation.x *= 0.8;
    }

    // 攻击：挥剑
    if (this.attacking) {
      const t = this.attackTimer / 0.3; // 0~1
      // 拔剑向前挥砍
      const swingAngle = Math.sin(t * Math.PI) * 2.2;
      this.swordGroup.rotation.z = -0.4 + swingAngle;
      this.swordGroup.rotation.x = -swingAngle * 0.5;
      // 右手跟随
      this.armR.rotation.x = -swingAngle;
      // 剑光
      this.swordGlow.material.opacity = Math.sin(t * Math.PI) * 0.5;
    } else {
      this.swordGroup.rotation.z = -0.4;
      this.swordGroup.rotation.x = 0;
      this.swordGlow.material.opacity *= 0.85;
    }
  }

  // 玩家是否在敌人攻击/接触范围（给敌人用）
  canBeHitBy(enemyCenter) {
    if (this.invincible || this.dead) return false;
    const c = this.getCenter();
    return (
      enemyCenter.x > c.minX - 0.2 &&
      enemyCenter.x < c.maxX + 0.2 &&
      enemyCenter.z > c.minZ - 0.2 &&
      enemyCenter.z < c.maxZ + 0.2 &&
      enemyCenter.y > c.minY - 0.5 &&
      enemyCenter.y < c.maxY + 0.5
    );
  }
}
