// 核心游戏引擎
// 负责：场景初始化、第三人称跟随相机、灯光阴影、简单物理、游戏循环、
// 键盘/触屏输入、AABB碰撞、粒子效果，并编排 Player / Enemy / Level

import * as THREE from 'three';
import Player from './Player.js';
import Enemy from './Enemy.js';
import Level from './Level.js';
import { LEVELS } from './levels.js';

export default class GameEngine {
  // container: DOM 容器；callbacks: { onHud } 用于更新HUD
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;

    // 状态
    this.levelIndex = 0;
    this.running = false;
    this.paused = false;
    this.levelCompleted = false;
    this.gameOver = false;

    // 输入状态
    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false, // 边沿触发由方法处理
      attack: false,
      joystick: { x: 0, y: 0, active: false },
    };
    // 记录上一帧按键，用于边沿检测
    this._prevJump = false;
    this._prevAttack = false;

    // 粒子系统
    this.particles = [];

    // 相机控制
    this.cameraYaw = 0;
    this.cameraPitch = 0.35;
    this.cameraDistance = 7;
    this.cameraTarget = new THREE.Vector3();

    this._initThree();
    this._initInput();
    this._initTouch();
    this._bindResize();

    this._loop = this._loop.bind(this);
  }

  // 初始化 Three.js
  _initThree() {
    // 渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x88ccff);

    // 相机
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      300
    );
    this.camera.position.set(0, 8, 12);
    this.camera.lookAt(0, 0, 0);

    // 灯光
    this.ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambient);

    this.sun = new THREE.DirectionalLight(0xffffff, 0.9);
    this.sun.position.set(20, 30, 15);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 120;
    const s = 40;
    this.sun.shadow.camera.left = -s;
    this.sun.shadow.camera.right = s;
    this.sun.shadow.camera.top = s;
    this.sun.shadow.camera.bottom = -s;
    this.sun.shadow.bias = -0.0005;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    // 雾
    this.scene.fog = new THREE.Fog(0x88ccff, 30, 90);

    // 太阳球体（远景装饰）
    const sunGeo = new THREE.SphereGeometry(3, 16, 12);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff2cc, fog: false });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.position.set(40, 50, -80);
    this.scene.add(this.sunMesh);

    // 粒子用的共享几何
    this._particleGeo = new THREE.SphereGeometry(0.12, 6, 5);
    this._particleGeo._shared = true; // 标记为共享，释放粒子时不dispose
  }

  // 初始化键盘输入
  _initInput() {
    this._keyDown = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.right = true;
          break;
        case 'Space':
          this.input.jump = true;
          e.preventDefault();
          break;
        case 'KeyJ':
          this.input.attack = true;
          break;
        case 'Escape':
          this.paused = !this.paused;
          break;
        default:
          break;
      }
    };
    this._keyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.right = false;
          break;
        case 'Space':
          this.input.jump = false;
          break;
        case 'KeyJ':
          this.input.attack = false;
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', this._keyDown);
    window.addEventListener('keyup', this._keyUp);
  }

  // 初始化触屏控制（虚拟摇杆 + 按钮）
  _initTouch() {
    // 仅触屏设备显示
    if (!('ontouchstart' in window)) return;

    this.touchUI = document.createElement('div');
    this.touchUI.style.cssText = `
      position:absolute; inset:0; pointer-events:none; z-index:10;
      user-select:none; -webkit-user-select:none; touch-action:none;
    `;
    this.container.appendChild(this.touchUI);

    // 左侧摇杆
    this.joystickBase = document.createElement('div');
    this.joystickBase.style.cssText = `
      position:absolute; left:24px; bottom:24px; width:128px; height:128px;
      border-radius:50%; background:rgba(255,255,255,0.12);
      border:2px solid rgba(255,255,255,0.35); pointer-events:auto;
      display:flex; align-items:center; justify-content:center;
    `;
    this.joystickKnob = document.createElement('div');
    this.joystickKnob.style.cssText = `
      width:54px; height:54px; border-radius:50%;
      background:rgba(218,185,110,0.7); border:2px solid rgba(255,255,255,0.6);
    `;
    this.joystickBase.appendChild(this.joystickKnob);
    this.touchUI.appendChild(this.joystickBase);

    // 右侧跳跃按钮
    this.jumpBtn = this._makeButton('跳', '#4a8aff', 'right:120px; bottom:48px;');
    this.touchUI.appendChild(this.jumpBtn);
    // 右侧攻击按钮
    this.attackBtn = this._makeButton('攻', '#c4463a', 'right:36px; bottom:96px;');
    this.touchUI.appendChild(this.attackBtn);

    // 摇杆逻辑
    this._joyId = null;
    this._joyCenter = { x: 0, y: 0 };
    const onJoyStart = (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      this._joyId = t.identifier;
      const rect = this.joystickBase.getBoundingClientRect();
      this._joyCenter.x = rect.left + rect.width / 2;
      this._joyCenter.y = rect.top + rect.height / 2;
      this.input.joystick.active = true;
    };
    const onJoyMove = (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier !== this._joyId) continue;
        let dx = t.clientX - this._joyCenter.x;
        let dy = t.clientY - this._joyCenter.y;
        const max = 48;
        const len = Math.hypot(dx, dy);
        if (len > max) {
          dx = (dx / len) * max;
          dy = (dy / len) * max;
        }
        this.joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
        this.input.joystick.x = dx / max;
        this.input.joystick.y = dy / max;
      }
    };
    const onJoyEnd = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this._joyId) {
          this._joyId = null;
          this.input.joystick.active = false;
          this.input.joystick.x = 0;
          this.input.joystick.y = 0;
          this.joystickKnob.style.transform = 'translate(0,0)';
        }
      }
    };
    this.joystickBase.addEventListener('touchstart', onJoyStart, { passive: false });
    this.joystickBase.addEventListener('touchmove', onJoyMove, { passive: false });
    this.joystickBase.addEventListener('touchend', onJoyEnd);
    this.joystickBase.addEventListener('touchcancel', onJoyEnd);

    // 跳跃/攻击按钮
    this._bindTapButton(this.jumpBtn, () => {
      this.input.jump = true;
      setTimeout(() => (this.input.jump = false), 50);
    });
    this._bindTapButton(this.attackBtn, () => {
      this.input.attack = true;
      setTimeout(() => (this.input.attack = false), 50);
    });
  }

  _makeButton(label, color, positionCss) {
    const btn = document.createElement('div');
    btn.textContent = label;
    btn.style.cssText = `
      position:absolute; ${positionCss} width:78px; height:78px;
      border-radius:50%; background:${color}; color:#fff;
      display:flex; align-items:center; justify-content:center;
      font-size:22px; font-weight:bold; pointer-events:auto;
      border:2px solid rgba(255,255,255,0.5);
      box-shadow:0 4px 12px rgba(0,0,0,0.3);
      opacity:0.85;
    `;
    return btn;
  }

  _bindTapButton(btn, handler) {
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handler();
    });
  }

  // 窗口尺寸响应
  _bindResize() {
    this._onResize = () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.renderer.setSize(w, h);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', this._onResize);
  }

  // 加载关卡
  loadLevel(index) {
    // 清理旧关卡
    if (this.level) this.level.dispose();
    if (this.enemies) this.enemies.forEach((e) => e.dispose());
    this.enemies = [];
    this.particles.forEach((p) => this.scene.remove(p.mesh));
    this.particles = [];

    this.levelIndex = Math.max(0, Math.min(LEVELS.length - 1, index));
    const data = LEVELS[this.levelIndex];
    this.levelData = data;

    // 应用场景外观
    const skyColor = new THREE.Color(data.sky || 0x88ccff);
    this.scene.background = skyColor;
    this.scene.fog = new THREE.Fog(
      data.fog || data.sky || 0x88ccff,
      data.fogNear || 30,
      data.fogFar || 90
    );
    this.ambient.intensity = data.ambient ?? 0.6;
    this.sun.intensity = data.directional ?? 0.9;

    // 太阳颜色随主题微调
    if (data.decoration === 'secret') {
      this.sunMesh.material.color.set(0xaa66ff);
      this.sun.color.set(0xb090ff);
    } else if (data.decoration === 'mountain') {
      this.sunMesh.material.color.set(0xffd8a0);
      this.sun.color.set(0xffe0b0);
    } else {
      this.sunMesh.material.color.set(0xfff2cc);
      this.sun.color.set(0xffffff);
    }

    // 构建关卡
    this.level = new Level(this.scene, data);

    // 玩家
    if (!this.player) {
      this.player = new Player(this.scene);
      this._wirePlayerCallbacks();
    }
    this.player.setRespawnPoint(data.startPoint);
    this.player.respawn();
    this.player.position.copy(data.startPoint);
    this.player.group.position.copy(data.startPoint);
    this.player.velocity.set(0, 0, 0);

    // 敌人
    this.enemies = (data.enemies || []).map((cfg) => {
      const e = new Enemy(this.scene, cfg);
      this._wireEnemyCallbacks(e);
      return e;
    });

    // 相机初始位置
    this.cameraYaw = 0;
    this.cameraTarget.copy(this.player.position);
    this._updateCamera(0, true);

    this.levelCompleted = false;
    this.gameOver = false;

    if (this.callbacks.onLevelLoad) this.callbacks.onLevelLoad(data);
    this._emitHud();
  }

  // 连接玩家回调
  _wirePlayerCallbacks() {
    const p = this.player;
    p.onJump = (pos, count) => {
      this._spawnDust(pos, count === 2 ? 0x88ddff : 0xddccaa);
    };
    p.onLand = (pos) => {
      this._spawnDust(pos, 0xddccaa);
    };
    p.onAttack = (pos, facing, range, arc) => {
      this._spawnAttackEffect(pos, facing, range);
      this._handlePlayerAttack(pos, facing, range, arc);
    };
    p.onHit = (pos) => {
      this._spawnBurst(pos, 0xff6644, 12);
    };
    p.onDeath = (pos) => {
      this._spawnBurst(pos, 0xff3333, 20);
    };
    p.onStomp = (pos) => {
      // 踩到敌人后反弹
      p.velocity.y = 10;
      this._spawnBurst(pos, 0xffee88, 10);
    };
  }

  // 连接敌人回调
  _wireEnemyCallbacks(e) {
    e.onDeath = (pos, type) => {
      const color = type === 'boss' ? 0xaa00ff : type === 'scout' ? 0xaa66ff : 0xff6644;
      const count = type === 'boss' ? 40 : 18;
      this._spawnBurst(pos, color, count);
    };
    e.onHit = (pos) => {
      this._spawnBurst(pos, 0xffee88, 6);
    };
  }

  // 处理玩家攻击命中判定
  _handlePlayerAttack(pos, facing, range, arc) {
    // 攻击扇形：以玩家朝向为中心
    const dirX = Math.sin(facing);
    const dirZ = Math.cos(facing);
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = e.position.x - pos.x;
      const dz = e.position.z - pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist > range + e.halfWidth) continue;
      // 角度
      const ang = Math.atan2(dirX, dirZ);
      const eAng = Math.atan2(dx, dz);
      let diff = eAng - ang;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) <= arc / 2) {
        const dmg = e.type === 'boss' ? 1 : 2;
        e.takeDamage(dmg);
      }
    }
  }

  // ============ 粒子系统 ============
  // 跳跃/落地灰尘
  _spawnDust(pos, color) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
      });
      const m = new THREE.Mesh(this._particleGeo, mat);
      m.position.set(pos.x, pos.y + 0.1, pos.z);
      const ang = (i / count) * Math.PI * 2;
      const sp = 2 + Math.random() * 2;
      this.scene.add(m);
      this.particles.push({
        mesh: m,
        vel: new THREE.Vector3(Math.cos(ang) * sp, 1 + Math.random() * 2, Math.sin(ang) * sp),
        life: 0.5,
        maxLife: 0.5,
        gravity: -8,
        scaleRate: 1.5,
      });
    }
  }

  // 攻击特效（扇形剑气）
  _spawnAttackEffect(pos, facing, range) {
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    // 扇形几何
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    const arc = Math.PI * 0.7;
    const segs = 10;
    for (let i = 0; i <= segs; i++) {
      const a = -arc / 2 + (i / segs) * arc;
      shape.lineTo(Math.sin(a) * range, Math.cos(a) * range);
    }
    const geo = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.8;
    group.add(mesh);
    group.position.set(pos.x, 0, pos.z);
    group.rotation.y = facing;
    this.scene.add(group);
    this.particles.push({
      mesh: group,
      vel: new THREE.Vector3(0, 0, 0),
      life: 0.25,
      maxLife: 0.25,
      gravity: 0,
      scaleRate: 0,
      fadeOnly: true,
    });
  }

  // 爆裂粒子（受伤/死亡/收集）
  _spawnBurst(pos, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
      });
      const m = new THREE.Mesh(this._particleGeo, mat);
      m.position.set(pos.x, pos.y + 0.8, pos.z);
      const sp = 3 + Math.random() * 4;
      const ang = Math.random() * Math.PI * 2;
      const elev = Math.random() * Math.PI * 0.6;
      this.scene.add(m);
      this.particles.push({
        mesh: m,
        vel: new THREE.Vector3(
          Math.cos(ang) * sp * Math.cos(elev),
          Math.sin(elev) * sp + 2,
          Math.sin(ang) * sp * Math.cos(elev)
        ),
        life: 0.7,
        maxLife: 0.7,
        gravity: -10,
        scaleRate: 0,
      });
    }
  }

  // 收集闪光
  _spawnCollectFlash(pos, color) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
      });
      const m = new THREE.Mesh(this._particleGeo, mat);
      m.position.set(pos.x, pos.y, pos.z);
      const sp = 1.5 + Math.random() * 2;
      const ang = (i / count) * Math.PI * 2;
      this.scene.add(m);
      this.particles.push({
        mesh: m,
        vel: new THREE.Vector3(Math.cos(ang) * sp, 2 + Math.random() * 2, Math.sin(ang) * sp),
        life: 0.6,
        maxLife: 0.6,
        gravity: -6,
        scaleRate: 1,
      });
    }
  }

  // 更新粒子
  _updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        // 处理 Mesh 与 Group 两种情况
        p.mesh.traverse((obj) => {
          if (obj.isMesh) {
            if (obj.geometry && !obj.geometry._shared) obj.geometry.dispose();
            if (obj.material) {
              if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
              else obj.material.dispose();
            }
          }
        });
        this.particles.splice(i, 1);
        continue;
      }
      p.vel.y += p.gravity * dt;
      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      p.mesh.position.z += p.vel.z * dt;
      const t = p.life / p.maxLife;
      if (p.mesh.material) {
        p.mesh.material.opacity = t;
      }
      if (p.scaleRate > 0) {
        const s = 1 + (1 - t) * p.scaleRate;
        p.mesh.scale.setScalar(s);
      }
    }
  }

  // ============ 相机 ============
  _updateCamera(dt, snap = false) {
    // 第三人称跟随：根据 yaw/pitch 与距离
    const target = this.player.position;
    const desired = new THREE.Vector3(
      target.x + Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance,
      target.y + Math.sin(this.cameraPitch) * this.cameraDistance + 1.2,
      target.z + Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance
    );
    if (snap) {
      this.camera.position.copy(desired);
    } else {
      this.camera.position.lerp(desired, Math.min(1, dt * 8));
    }
    this.cameraTarget.lerp(
      new THREE.Vector3(target.x, target.y + 0.8, target.z),
      Math.min(1, dt * 10)
    );
    this.camera.lookAt(this.cameraTarget);

    // 方向光跟随玩家
    this.sun.position.set(target.x + 20, 30, target.z + 15);
    this.sun.target.position.copy(target);
    this.sun.target.updateMatrixWorld();
  }

  // 计算移动方向（相对相机）
  _getMoveVector() {
    let mx = 0;
    let mz = 0;
    // 键盘
    if (this.input.forward) mz -= 1;
    if (this.input.backward) mz += 1;
    if (this.input.left) mx -= 1;
    if (this.input.right) mx += 1;
    // 摇杆（y向上为负z向前）
    if (this.input.joystick.active) {
      mx += this.input.joystick.x;
      mz += this.input.joystick.y;
    }
    // 把输入转换到相机方向（仅绕Y）
    // 相机朝向 = -（cameraYaw方向）
    const cosY = Math.cos(this.cameraYaw);
    const sinY = Math.sin(this.cameraYaw);
    // 相机forward（朝向target）的水平分量
    const fwdX = -sinY;
    const fwdZ = -cosY;
    // 相机right
    const rightX = cosY;
    const rightZ = -sinY;
    // 玩家想要的前进方向 = forward * (-mz) + right * mx
    // （mz<0 表示按W向前）
    const worldX = rightX * mx + fwdX * (-mz);
    const worldZ = rightZ * mx + fwdZ * (-mz);
    return { moveX: worldX, moveZ: worldZ };
  }

  // ============ 碰撞：玩家 vs 敌人 ============
  _handlePlayerEnemyCollision() {
    const p = this.player;
    if (p.dead) return;
    const pCenter = p.getCenter();
    const pPrevY = p.prevY;
    const pVy = p.velocity.y;

    for (const e of this.enemies) {
      if (e.dead) continue;

      // 是否踩头
      if (e.isStomped(pPrevY, pCenter, pVy)) {
        e.takeDamage(e.type === 'boss' ? 1 : 2);
        if (p.onStomp) p.onStomp(p.position);
        continue;
      }

      // 接触伤害
      if (e.canHitPlayer(pCenter)) {
        // 玩家受伤
        if (p.takeDamage(1)) {
          // 击退
          const dx = p.position.x - e.position.x;
          const dz = p.position.z - e.position.z;
          const len = Math.hypot(dx, dz) || 1;
          p.velocity.x = (dx / len) * 6;
          p.velocity.z = (dz / len) * 6;
          p.velocity.y = 5;
        }
      }
    }
  }

  // ============ HUD ============
  _emitHud() {
    if (!this.callbacks.onHud) return;
    const stats = this.level ? this.level.getCollectedStats() : null;
    this.callbacks.onHud({
      hp: this.player ? this.player.hp : 0,
      maxHp: this.player ? this.player.maxHp : 3,
      levelIndex: this.levelIndex,
      levelName: this.levelData ? this.levelData.name : '',
      levelId: this.levelData ? this.levelData.id : 0,
      totalLevels: LEVELS.length,
      coins: stats ? stats.coins : 0,
      exp: stats ? stats.exp : 0,
      totalCoins: stats ? stats.totalCoins : 0,
      totalExp: stats ? stats.totalExp : 0,
      gameOver: this.gameOver,
      levelCompleted: this.levelCompleted,
      bossActive: this.enemies.some((e) => e.type === 'boss' && !e.dead),
      bossHp: (() => {
        const boss = this.enemies.find((e) => e.type === 'boss' && !e.dead);
        return boss ? { hp: boss.hp, maxHp: boss.maxHp } : null;
      })(),
    });
  }

  // ============ 游戏循环 ============
  start() {
    if (this.running) return;
    this.running = true;
    this._lastTime = performance.now();
    requestAnimationFrame(this._loop);
  }

  stop() {
    this.running = false;
  }

  _loop(now) {
    if (!this.running) return;
    requestAnimationFrame(this._loop);
    const dt = Math.min(0.05, (now - this._lastTime) / 1000);
    this._lastTime = now;
    if (this.paused) {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    this._tick(dt, now / 1000);
    this.renderer.render(this.scene, this.camera);
  }

  _tick(dt, time) {

    // 边沿触发：跳跃/攻击
    const jumpPressed = this.input.jump && !this._prevJump;
    const attackPressed = this.input.attack && !this._prevAttack;
    if (jumpPressed) this.player.tryJump();
    if (attackPressed) this.player.tryAttack();
    this._prevJump = this.input.jump;
    this._prevAttack = this.input.attack;

    // 玩家更新
    const move = this._getMoveVector();
    this.player.update(dt, move, this.level.getPlatforms());

    // 敌人更新
    const playerInfo = {
      position: this.player.position,
      center: this.player.getCenter(),
      velocity: this.player.velocity,
    };
    for (const e of this.enemies) {
      e.update(dt, playerInfo, this.level.getPlatforms());
    }

    // 碰撞
    this._handlePlayerEnemyCollision();

    // 收集
    const collected = this.level.checkCollect(this.player.getCenter());
    if (collected.coins > 0) {
      this._spawnCollectFlash(this.player.position, 0xffcc33);
      this._emitHud();
    }
    if (collected.exp > 0) {
      this._spawnCollectFlash(this.player.position, 0x44aaff);
      this._emitHud();
    }

    // 终点检测
    if (!this.levelCompleted && this.level.checkEndReached(this.player.position)) {
      this.levelCompleted = true;
      this._spawnBurst(this.level.endPosition, 0xffee88, 30);
      if (this.callbacks.onLevelComplete) {
        this.callbacks.onLevelComplete(this.levelIndex, this.level.getCollectedStats());
      }
    }

    // 玩家死亡
    if (this.player.dead && this.player.respawnTimer <= 0 && !this.gameOver) {
      // respawn 由 Player 内部处理
    }
    // 检查游戏结束（HP为0且未自动重生）
    if (this.player.hp <= 0 && !this.gameOver) {
      // 留给重生逻辑，如果重生次数用尽可触发
    }

    // 关卡更新
    this.level.update(dt, time);

    // 粒子
    this._updateParticles(dt);

    // 相机
    this._updateCamera(dt);

    // HUD 周期更新（每0.2秒）
    this._hudTimer = (this._hudTimer || 0) + dt;
    if (this._hudTimer > 0.2) {
      this._hudTimer = 0;
      this._emitHud();
    }
  }

  // 切换下一关
  nextLevel() {
    if (this.levelIndex < LEVELS.length - 1) {
      this.loadLevel(this.levelIndex + 1);
      return true;
    }
    // 全部通关
    if (this.callbacks.onAllComplete) this.callbacks.onAllComplete();
    return false;
  }

  // 重置当前关
  restartLevel() {
    this.loadLevel(this.levelIndex);
  }

  // 销毁
  dispose() {
    this.stop();
    window.removeEventListener('keydown', this._keyDown);
    window.removeEventListener('keyup', this._keyUp);
    window.removeEventListener('resize', this._onResize);
    if (this.level) this.level.dispose();
    if (this.enemies) this.enemies.forEach((e) => e.dispose());
    if (this.player) this.scene.remove(this.player.group);
    this.particles.forEach((p) => this.scene.remove(p.mesh));
    this.particles = [];
    if (this.touchUI && this.touchUI.parentNode) {
      this.touchUI.parentNode.removeChild(this.touchUI);
    }
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
