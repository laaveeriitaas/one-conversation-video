// Cúpula con gradientes radiales suaves - Shader GLSL
import * as THREE from 'three';
import { CONFIG } from '../config';

const vertexShader = /* glsl */`
varying vec3 vWorldPosition;
varying vec3 vNormal;

void main() {
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */`
varying vec3 vWorldPosition;
varying vec3 vNormal;

uniform vec3 colorStops[4];
uniform float stopPositions[4];
uniform float uTime;
uniform vec3 uCameraPos;

void main() {
  // Vector desde centro de la cúpula
  vec3 dir = normalize(vWorldPosition);

  // Coordenadas esféricas para mapear gradientes
  float phi = atan(dir.z, dir.x); // -PI a PI
  float theta = acos(clamp(dir.y, -1.0, 1.0)); // 0 a PI

  // Mapear a 0-1 para lookup de gradiente
  float u = (phi + 3.14159) / (2.0 * 3.14159);
  float v = theta / 3.14159;

  // Combinar u y v para crear patrones orgánicos
  float gradientCoord = u * 0.6 + v * 0.4;

  // Animación muy sutil
  gradientCoord += sin(uTime * 0.1 + phi * 3.0) * 0.02;
  gradientCoord = fract(gradientCoord);

  // Interpolar entre 4 colores
  vec3 color = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    float t = smoothstep(stopPositions[i], stopPositions[i + 1], gradientCoord);
    color = mix(color, colorStops[i], t);
  }
  // Último segmento
  float t = smoothstep(stopPositions[3], 1.0, gradientCoord);
  color = mix(color, colorStops[3], t);

  // Atenuación hacia el horizonte (más oscuro abajo)
  float horizonFade = smoothstep(-0.2, 0.3, dir.y);
  color *= horizonFade;

  // Fresnel suave en los bordes (vista desde cámara)
  float viewDot = abs(dot(normalize(vWorldPosition - uCameraPos), vNormal));
  float fresnel = pow(1.0 - viewDot, 2.0) * 0.3;
  color += vec3(fresnel) * 0.15;

  // Oscurecer base
  float baseFade = smoothstep(-1.0, -0.5, dir.y);
  color *= baseFade;

  gl_FragColor = vec4(color, 1.0);
}
`;

export function createDomeMaterial(): THREE.ShaderMaterial {
  const uniforms = {
    colorStops: { value: CONFIG.domeGradients.map(g => new THREE.Color(g.color)) },
    stopPositions: { value: CONFIG.domeGradients.map(g => g.pos) },
    uTime: { value: 0 },
    uCameraPos: { value: new THREE.Vector3() },
  };

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    side: THREE.BackSide, // Render interior de la esfera
    depthWrite: false,
    transparent: false,
  });
}

export function createDomeGeometry(): THREE.BufferGeometry {
  return new THREE.SphereGeometry(
    CONFIG.dome.radius,
    CONFIG.dome.segments,
    CONFIG.dome.segments
  );
}

export class GradientDome extends THREE.Mesh {
  material: THREE.ShaderMaterial;

  constructor() {
    const geometry = createDomeGeometry();
    const material = createDomeMaterial();
    super(geometry, material);
    this.material = material;
    this.frustumCulled = false; // Siempre visible
  }

  update(time: number, cameraPos: THREE.Vector3): void {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uCameraPos.value.copy(cameraPos);
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}