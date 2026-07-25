import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, Text3D, Center, Environment } from '@react-three/drei';
import * as THREE from 'three';

/* ====== 标题画面3D场景 ====== */
function FloatingSword() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.5;
      ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.8) * 0.1;
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.6) * 0.15;
    }
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[0.04, 2.0, 0.04]} />
        <meshStandardMaterial color="#dab96e" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.25, 0.08, 0.08]} />
        <meshStandardMaterial color="#8b6914" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.6, 0]}>
        <octahedronGeometry args={[0.06]} />
        <meshStandardMaterial color="#f0d080" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

function MountainTerrain() {
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-8, -1.5);
    shape.lineTo(-6, 2);
    shape.lineTo(-4, 1);
    shape.lineTo(-2, 3);
    shape.lineTo(0, 1.5);
    shape.lineTo(2, 2.5);
    shape.lineTo(4, 0.5);
    shape.lineTo(6, 1.8);
    shape.lineTo(8, -1.5);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: false });
  }, []);
  return (
    <mesh geometry={geo} position={[0, -2.5, -4]} rotation={[0, 0, 0]}>
      <meshStandardMaterial color="#1a1530" transparent opacity={0.9} />
    </mesh>
  );
}

function MoonGlow() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.material.opacity = 0.3 + Math.sin(clock.elapsedTime * 0.5) * 0.1;
    }
  });
  return (
    <mesh ref={ref} position={[3, 5, -6]}>
      <sphereGeometry args={[1.5, 32, 32]} />
      <meshBasicMaterial color="#f0d080" transparent opacity={0.3} />
    </mesh>
  );
}

function InkParticles({ count = 80 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 5;
    }
    return pos;
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) {
      const pos = ref.current.geometry.attributes.position;
      for (let i = 0; i < count; i++) {
        pos.array[i * 3 + 1] += Math.sin(clock.elapsedTime + i) * 0.002;
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#dab96e" size={0.05} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

export function TitleScene3D() {
  return (
    <Canvas camera={{ position: [0, 1, 8], fov: 50 }}>
      <fog attach="fog" args={['#0a0c14', 5, 20]} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 8, 3]} intensity={0.4} color="#f0d080" />
      <pointLight position={[0, 3, 2]} intensity={0.6} color="#dab96e" distance={10} />
      <pointLight position={[-3, 1, 0]} intensity={0.2} color="#c4463a" distance={8} />

      <MountainTerrain />
      <MoonGlow />
      <InkParticles />
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <FloatingSword />
      </Float>
      <Stars radius={50} depth={50} count={1500} factor={3} saturation={0.2} fade speed={0.5} />

      <Environment preset="night" />
    </Canvas>
  );
}

/* ====== 3D 战斗竞技场 ====== */
function BattleArena() {
  return (
    <group>
      {/* 地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <circleGeometry args={[6, 64]} />
        <meshStandardMaterial color="#1a1530" roughness={0.9} />
      </mesh>
      {/* 外圈 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.49, 0]}>
        <ringGeometry args={[5.5, 6, 64]} />
        <meshStandardMaterial color="#c4463a" transparent opacity={0.4} />
      </mesh>
      {/* 内圈 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, 0]}>
        <ringGeometry args={[3.5, 3.8, 64]} />
        <meshStandardMaterial color="#dab96e" transparent opacity={0.15} />
      </mesh>
      {/* 柱子装饰 */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <group key={i} position={[Math.cos(angle) * 5.5, 0, Math.sin(angle) * 5.5]}>
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.15, 0.2, 3, 8]} />
            <meshStandardMaterial color="#2a2040" metalness={0.3} roughness={0.7} />
          </mesh>
          <pointLight position={[0, 3.5, 0]} intensity={0.3} color="#dab96e" distance={4} />
        </group>
      ))}
    </group>
  );
}

function WarriorCharacter({ position, color, isPlayer, name }) {
  const groupRef = useRef();
  const bodyRef = useRef();
  const weaponRef = useRef();

  useFrame(({ clock }) => {
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(clock.elapsedTime * 2) * 0.05;
    }
  });

  const idleAnimation = (ref, offset = 0) => {
    useFrame(({ clock }) => {
      if (ref.current) {
        ref.current.rotation.z = Math.sin(clock.elapsedTime * 1.5 + offset) * 0.05;
      }
    });
  };

  return (
    <group ref={groupRef} position={position}>
      {/* 身体 */}
      <mesh ref={bodyRef} position={[0, 0.8, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.8, 8, 16]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
      </mesh>
      {/* 头部 */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
      </mesh>
      {/* 肩甲 */}
      <mesh position={[-0.4, 1.05, 0]} castShadow>
        <boxGeometry args={[0.2, 0.15, 0.2]} />
        <meshStandardMaterial color="#8b6914" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.4, 1.05, 0]} castShadow>
        <boxGeometry args={[0.2, 0.15, 0.2]} />
        <meshStandardMaterial color="#8b6914" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* 武器 */}
      {isPlayer && (
        <group position={[0.5, 0.6, 0]} rotation={[0, 0, -0.3]}>
          <mesh ref={weaponRef} position={[0.3, 0.5, 0]}>
            <boxGeometry args={[0.03, 1.2, 0.03]} />
            <meshStandardMaterial color="#dab96e" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      )}
      {!isPlayer && (
        <group position={[0.5, 0.4, 0]} rotation={[0, 0, -0.2]}>
          <mesh position={[0.25, 0.35, 0]}>
            <boxGeometry args={[0.08, 0.8, 0.08]} />
            <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      )}
      {/* 光环 */}
      <mesh position={[0, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.7, 32]} />
        <meshBasicMaterial color={isPlayer ? '#dab96e' : '#c4463a'} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function AttackEffect({ position, active, color }) {
  const ref = useRef();
  const particles = useMemo(() => {
    const pos = new Float32Array(30 * 3);
    for (let i = 0; i < 30; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2;
      pos[i * 3 + 1] = Math.random() * 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.visible = active;
      if (active) {
        ref.current.rotation.y = clock.elapsedTime * 5;
        ref.current.scale.setScalar(0.8 + Math.sin(clock.elapsedTime * 10) * 0.2);
      }
    }
  });

  return (
    <points ref={ref} position={position} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={30} array={particles} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.08} transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

export function BattleScene3D({ playerHpPercent, monsterHpPercent, playerName, monsterName, isAttacking, isMonsterAttacking, isVictory }) {
  return (
    <Canvas camera={{ position: [0, 4, 10], fov: 45 }} shadows>
      <fog attach="fog" args={['#0a0c14', 8, 25]} />
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 10, 5]} intensity={0.5} color="#f0d080" castShadow />
      <pointLight position={[-3, 4, 2]} intensity={0.4} color="#c4463a" distance={12} />
      <pointLight position={[3, 4, 2]} intensity={0.4} color="#dab96e" distance={12} />

      <BattleArena />

      <WarriorCharacter position={[-2.5, 0, 2]} color="#4a6a9a" isPlayer={true} name={playerName || '小帅'} />
      <WarriorCharacter position={[2.5, 0, 2]} color="#8b3030" isPlayer={false} name={monsterName || '敌人'} />

      <AttackEffect position={[-2.5, 1, 2]} active={isAttacking} color="#f0d080" />
      <AttackEffect position={[2.5, 1, 2]} active={isMonsterAttacking} color="#e05548" />

      <Stars radius={40} depth={30} count={800} factor={2} saturation={0.1} fade speed={0.3} />

      {/* 胜利光柱 */}
      {isVictory && (
        <mesh position={[0, 5, 2]}>
          <cylinderGeometry args={[0.1, 1.5, 10, 16, 1, true]} />
          <meshBasicMaterial color="#dab96e" transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      )}

      <Environment preset="night" />
    </Canvas>
  );
}

/* ====== 3D 地图探索场景 ====== */
function TerrainChunk({ type, position }) {
  const colors = {
    village: '#1a2818',
    mountain: '#2a2035',
    town: '#2a2520',
    dark: '#1a1525',
    secret: '#2a1520',
    sect: '#1a2535',
  };
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color={colors[type] || '#1a1530'} roughness={0.95} />
      </mesh>
      {/* 随机装饰 */}
      {type === 'village' && (
        <>
          <mesh position={[-1, 0.3, -0.5]}>
            <boxGeometry args={[0.4, 0.6, 0.4]} />
            <meshStandardMaterial color="#3a2a20" />
          </mesh>
          <mesh position={[1, 0.25, 0.8]}>
            <boxGeometry args={[0.3, 0.5, 0.3]} />
            <meshStandardMaterial color="#3a2a20" />
          </mesh>
        </>
      )}
      {type === 'mountain' && (
        <mesh position={[0, 0.8, 0]}>
          <coneGeometry args={[1, 2, 6]} />
          <meshStandardMaterial color="#252030" />
        </mesh>
      )}
      {type === 'town' && (
        <>
          <mesh position={[-0.8, 0.4, -0.3]}>
            <boxGeometry args={[0.6, 0.8, 0.6]} />
            <meshStandardMaterial color="#4a3525" />
          </mesh>
          <mesh position={[0.8, 0.35, 0.5]}>
            <boxGeometry args={[0.5, 0.7, 0.5]} />
            <meshStandardMaterial color="#4a3525" />
          </mesh>
          <pointLight position={[0, 1.5, 0]} intensity={0.3} color="#f0a040" distance={4} />
        </>
      )}
      {type === 'dark' && (
        <mesh position={[0, 0.6, 0]}>
          <coneGeometry args={[0.8, 1.5, 5]} />
          <meshStandardMaterial color="#1a1020" />
        </mesh>
      )}
      {type === 'sect' && (
        <>
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.3, 0.5, 2, 8]} />
            <meshStandardMaterial color="#2a3545" metalness={0.3} />
          </mesh>
          <pointLight position={[0, 2.5, 0]} intensity={0.5} color="#6090c0" distance={5} />
        </>
      )}
      {type === 'secret' && (
        <>
          <mesh position={[0, 0, 0]}>
            <torusGeometry args={[1, 0.15, 8, 32]} />
            <meshStandardMaterial color="#c4463a" emissive="#c4463a" emissiveIntensity={0.3} />
          </mesh>
          <pointLight position={[0, 0.5, 0]} intensity={0.6} color="#c4463a" distance={5} />
        </>
      )}
    </group>
  );
}

export function MapScene3D({ mapType = 'village' }) {
  return (
    <Canvas camera={{ position: [0, 6, 8], fov: 50 }}>
      <fog attach="fog" args={['#0a0c14', 8, 20]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 8, 5]} intensity={0.4} color="#f0d080" />
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#dab96e" distance={10} />

      {/* 中心地形 */}
      <TerrainChunk type={mapType} position={[0, 0, 0]} />
      {/* 周围地形 */}
      <TerrainChunk type="village" position={[-4, -0.1, 0]} />
      <TerrainChunk type="mountain" position={[4, -0.1, 0]} />
      <TerrainChunk type="town" position={[0, -0.1, -4]} />
      <TerrainChunk type="dark" position={[0, -0.1, 4]} />

      <Stars radius={30} depth={20} count={600} factor={2} saturation={0.15} fade speed={0.3} />
      <Environment preset="night" />
    </Canvas>
  );
}
