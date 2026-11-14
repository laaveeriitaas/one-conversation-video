// Confetti effect using InstancedMesh (CPU simulation)
import * as THREE from 'three';
import { CONFIG } from '../config';
import { randomInRange, randomVec3 } from '../utils/math';

interface ConfettiParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  rotationSpeed: THREE.Euler;
  color: THREE.Color;
  size: number;
  alive: boolean;
  life: number;
  maxLife: number;
}

const PARTICLE_COUNT = 100;
const GRAVITY = -15; // More dramatic for visual effect
const GROUND_Y = -5;

export class Confetti {
  private mesh: THREE.InstancedMesh;
  private particles: ConfettiParticle[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.MeshBasicMaterial;
  private isActive: boolean = false;
  private activeCount: number = 0;
  private dummy: THREE.Object3D;
  private colorArray: Float32Array;
  private timeSinceBurst: number = 0;

  constructor() {
    // Geometry: simple triangle (more performant than plane)
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
      0, 0.5, 0,    // top
      -0.5, -0.5, 0, // bottom left
      0.5, -0.5, 0,  // bottom right
    ]);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.computeVertexNormals();

    // Material with vertex colors
    this.material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, PARTICLE_COUNT);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;

    this.dummy = new THREE.Object3D();

    // Color array for instanced colors
    this.colorArray = new Float32Array(PARTICLE_COUNT * 3);
    this.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(this.colorArray, 3));

    this.initParticles();
  }

  private initParticles(): void {
    this.particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const color = new THREE.Color(CONFIG.confetti.colors[Math.floor(Math.random() * CONFIG.confetti.colors.length)]);
      this.particles.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        rotation: new THREE.Euler(),
        rotationSpeed: new THREE.Euler(
          randomInRange(-2, 2),
          randomInRange(-2, 2),
          randomInRange(-2, 2)
        ),
        color,
        size: randomInRange(0.15, 0.35),
        alive: false,
        life: 0,
        maxLife: randomInRange(2.5, 4.5),
      });
    }
  }

  burst(origin: THREE.Vector3 = new THREE.Vector3(0, 8, 0)): void {
    this.isActive = true;
    this.activeCount = PARTICLE_COUNT;
    this.mesh.visible = true;
    this.mesh.count = PARTICLE_COUNT;
    this.timeSinceBurst = 0;

    this.particles.forEach((p, i) => {
      // Spawn around origin with spread
      p.position.set(
        origin.x + randomInRange(-3, 3),
        origin.y + randomInRange(-1, 1),
        origin.z + randomInRange(-3, 3)
      );

      // Initial velocity - upward and outward
      const angle = randomInRange(0, Math.PI * 2);
      const speed = randomInRange(8, 18);
      const upSpeed = randomInRange(10, 20);

      p.velocity.set(
        Math.cos(angle) * speed,
        upSpeed,
        Math.sin(angle) * speed
      );

      p.rotation.set(0, 0, 0);
      p.rotationSpeed.set(
        randomInRange(-4, 4),
        randomInRange(-4, 4),
        randomInRange(-4, 4)
      );

      p.color.set(CONFIG.confetti.colors[Math.floor(Math.random() * CONFIG.confetti.colors.length)]);
      p.size = randomInRange(0.12, 0.3);
      p.alive = true;
      p.life = 0;
      p.maxLife = randomInRange(3, 5);

      // Set instance color
      this.colorArray[i * 3] = p.color.r;
      this.colorArray[i * 3 + 1] = p.color.g;
      this.colorArray[i * 3 + 2] = p.color.b;
    });

    this.geometry.attributes.instanceColor.needsUpdate = true;
  }

  update(deltaTime: number): void {
    if (!this.isActive) return;

    this.timeSinceBurst += deltaTime;
    let aliveCount = 0;

    this.particles.forEach((p, i) => {
      if (!p.alive) return;

      p.life += deltaTime;

      if (p.life >= p.maxLife) {
        p.alive = false;
        this.mesh.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0));
        return;
      }

      aliveCount++;

      // Physics
      p.velocity.y += GRAVITY * deltaTime;
      p.position.addScaledVector(p.velocity, deltaTime);

      // Ground collision with bounce
      if (p.position.y <= GROUND_Y + p.size / 2) {
        p.position.y = GROUND_Y + p.size / 2;
        p.velocity.y = Math.abs(p.velocity.y) * 0.3; // Bounce with damping
        p.velocity.x *= 0.9;
        p.velocity.z *= 0.9;

        // Stop very slow particles
        if (Math.abs(p.velocity.y) < 0.5 && Math.abs(p.velocity.x) < 0.1 && Math.abs(p.velocity.z) < 0.1) {
          p.velocity.set(0, 0, 0);
        }
      }

      // Rotation
      p.rotation.x += p.rotationSpeed.x * deltaTime;
      p.rotation.y += p.rotationSpeed.y * deltaTime;
      p.rotation.z += p.rotationSpeed.z * deltaTime;

      // Fade out near end of life
      const lifeRatio = p.life / p.maxLife;
      let scale = p.size;
      if (lifeRatio > 0.7) {
        scale *= (1 - lifeRatio) / 0.3;
      }

      // Update instance matrix
      this.dummy.position.copy(p.position);
      this.dummy.rotation.copy(p.rotation);
      this.dummy.scale.setScalar(scale);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    });

    this.mesh.instanceMatrix.needsUpdate = true;
    this.activeCount = aliveCount;

    if (aliveCount === 0) {
      this.isActive = false;
      this.mesh.visible = false;
    }
  }

  getMesh(): THREE.InstancedMesh {
    return this.mesh;
  }

  isPlaying(): boolean {
    return this.isActive;
  }

  reset(): void {
    this.isActive = false;
    this.activeCount = 0;
    this.mesh.visible = false;
    this.particles.forEach(p => {
      p.alive = false;
    });
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.mesh.dispose();
  }
}

// Confetti manager for Scene 4
export class ConfettiManager {
  private confetti: Confetti;
  private triggered: boolean = false;

  constructor() {
    this.confetti = new Confetti();
  }

  getMesh(): THREE.InstancedMesh {
    return this.confetti.getMesh();
  }

  trigger(origin?: THREE.Vector3): void {
    if (!this.triggered) {
      this.triggered = true;
      this.confetti.burst(origin);
    }
  }

  update(deltaTime: number): void {
    this.confetti.update(deltaTime);
  }

  isActive(): boolean {
    return this.confetti.isPlaying();
  }

  reset(): void {
    this.triggered = false;
    this.confetti.reset();
  }

  dispose(): void {
    this.confetti.dispose();
  }
}