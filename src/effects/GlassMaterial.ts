// Factory para materiales glassmorphism
import * as THREE from 'three';
import { CONFIG } from '../config';

export function createGlassMaterial(envMap?: THREE.CubeTexture | THREE.Texture | null): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    transmission: CONFIG.glass.transmission,
    roughness: CONFIG.glass.roughness,
    ior: CONFIG.glass.ior,
    thickness: CONFIG.glass.thickness,
    clearcoat: CONFIG.glass.clearcoat,
    clearcoatRoughness: CONFIG.glass.clearcoatRoughness,
    envMapIntensity: CONFIG.glass.envMapIntensity,
    metalness: CONFIG.glass.metalness,
    color: CONFIG.glassTint,
    envMap,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: true,
  });
}

export function createGlassPanelGeometry(): THREE.BufferGeometry {
  const { width, height, depth, radius } = CONFIG.panel;

  // Rounded box geometry para panel
  const shape = new THREE.Shape();
  const r = radius;
  const hw = width / 2;
  const hh = height / 2;

  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

  const extrudeSettings = {
    depth,
    bevelEnabled: false,
    steps: 1,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

// Geometría simple con RoundedBoxGeometry (r158+)
export function createRoundedPanelGeometry(): THREE.BufferGeometry {
  const { width, height, depth, radius } = CONFIG.panel;
  const geometry = new THREE.BoxGeometry(width, height, depth, 4, 4, 2);

  // Aplicar redondeo manual en vertices (para compatibilidad)
  const position = geometry.attributes.position;
  const hw = width / 2;
  const hh = height / 2;
  const hd = depth / 2;

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);

    // Redondear esquinas en XY
    const dx = Math.abs(x) - (hw - radius);
    const dy = Math.abs(y) - (hh - radius);
    if (dx > 0 && dy > 0) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < radius) {
        const nx = dx / d;
        const ny = dy / d;
        position.setX(i, Math.sign(x) * (hw - radius + nx * radius));
        position.setY(i, Math.sign(y) * (hh - radius + ny * radius));
      }
    }
  }

  geometry.computeVertexNormals();
  return geometry;
}

export function createPhoneGeometry(): THREE.BufferGeometry {
  // Teléfono: rectángulo redondeado extruido, ratio ~19.5:9
  const width = 4;
  const height = 8.5;
  const depth = 0.25;
  const radius = 0.6;

  const shape = new THREE.Shape();
  const hw = width / 2;
  const hh = height / 2;
  const r = radius;

  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

  const extrudeSettings = { depth, bevelEnabled: false, steps: 1 };
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

export function createChipGeometry(): THREE.BufferGeometry {
  // Chip filename: pequeño rectángulo redondeado
  const width = 3.5;
  const height = 0.9;
  const depth = 0.08;
  const radius = 0.3;

  const shape = new THREE.Shape();
  const hw = width / 2;
  const hh = height / 2;
  const r = radius;

  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

  const extrudeSettings = { depth, bevelEnabled: false, steps: 1 };
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

export function createBadgeGeometry(): THREE.BufferGeometry {
  // Badge "12 tests passed"
  const width = 5;
  const height = 1.2;
  const depth = 0.08;
  const radius = 0.4;

  const shape = new THREE.Shape();
  const hw = width / 2;
  const hh = height / 2;
  const r = radius;

  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

  const extrudeSettings = { depth, bevelEnabled: false, steps: 1 };
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

export function createCurtainGeometry(): THREE.BufferGeometry {
  // Telón grande para Scene 5
  const width = 200;
  const height = 120;
  const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
  geometry.center();
  return geometry;
}