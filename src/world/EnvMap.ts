// Environment map generation for glass reflections
import * as THREE from 'three';

export function createEnvMap(): THREE.CubeTexture {
  const renderer = new THREE.WebGLRenderer();
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  // Crear un environment map procedural simple
  const cubeRenderTarget = pmremGenerator.fromScene(createEnvScene());
  const envMap = cubeRenderTarget.texture;
  pmremGenerator.dispose();
  renderer.dispose();

  return envMap as THREE.CubeTexture;
}

function createEnvScene(): THREE.Scene {
  const envScene = new THREE.Scene();

  // Esfera grande con gradiente para env map
  const envGeo = new THREE.SphereGeometry(100, 32, 32);
  const envMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float y = vNormal.y * 0.5 + 0.5;
        vec3 color = mix(
          vec3(0.02, 0.02, 0.05),
          vec3(0.15, 0.1, 0.2),
          smoothstep(0.0, 0.5, y)
        );
        color = mix(color, vec3(0.3, 0.2, 0.4), smoothstep(0.5, 1.0, y));
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side: THREE.BackSide,
  });
  const envSphere = new THREE.Mesh(envGeo, envMat);
  envScene.add(envSphere);

  return envScene;
}