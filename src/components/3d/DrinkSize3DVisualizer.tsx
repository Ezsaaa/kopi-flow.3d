import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface DrinkSize3DVisualizerProps {
  selectedSize: 'Regular' | 'Large';
  category: string;
}

export const DrinkSize3DVisualizer: React.FC<DrinkSize3DVisualizerProps> = ({
  selectedSize,
  category,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const selectedSizeRef = useRef(selectedSize);

  useEffect(() => {
    selectedSizeRef.current = selectedSize;
  }, [selectedSize]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 168;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1.8, 4.2);
    camera.lookAt(0, 0.85, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffedd5, 1.3);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xfffcf8, 2.0);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    const group = new THREE.Group();
    scene.add(group);

    const isMatcha = category.toLowerCase().includes('non-kopi');
    const isFood = category.includes('Makanan');

    const liquidColor = isFood ? 0xd97706 : isMatcha ? 0x059669 : 0x451a03;

    const cupGeo = new THREE.CylinderGeometry(0.85, 0.65, 1.8, 24);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.12,
      metalness: 0.1,
      transparent: true,
      opacity: 0.82,
    });
    const cupMesh = new THREE.Mesh(cupGeo, glassMat);
    cupMesh.position.y = 0.9;
    group.add(cupMesh);

    const liquidGeo = new THREE.CylinderGeometry(0.8, 0.62, 1.5, 24);
    const liquidMat = new THREE.MeshStandardMaterial({
      color: liquidColor,
      roughness: 0.25,
      metalness: 0.05,
    });
    const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    liquidMesh.position.y = 0.78;
    group.add(liquidMesh);

    const lidGeo = !isFood ? new THREE.CylinderGeometry(0.88, 0.88, 0.08, 24) : null;
    const lidMat = !isFood ? new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3 }) : null;
    const strawGeo = !isFood ? new THREE.CylinderGeometry(0.04, 0.04, 2.4, 12) : null;
    const strawMat = !isFood ? new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2 }) : null;

    if (lidGeo && lidMat && strawGeo && strawMat) {
      const lidMesh = new THREE.Mesh(lidGeo, lidMat);
      lidMesh.position.y = 1.82;
      group.add(lidMesh);

      const strawMesh = new THREE.Mesh(strawGeo, strawMat);
      strawMesh.position.set(0.2, 1.8, 0);
      strawMesh.rotation.z = -0.2;
      group.add(strawMesh);
    }

    const shadowGeo = new THREE.PlaneGeometry(2.5, 2.5);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.18,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.01;
    scene.add(shadowMesh);

    let frameId: number;
    const clock = new THREE.Clock();

    const render = () => {
      const delta = Math.min(clock.getDelta(), 0.05);
      group.rotation.y += delta * 0.75;

      const isLarge = selectedSizeRef.current === 'Large';
      const targetScaleY = isLarge ? 1.24 : 1.0;
      const targetScaleXZ = isLarge ? 1.14 : 1.0;

      group.scale.y = THREE.MathUtils.damp(group.scale.y, targetScaleY, 10, delta);
      group.scale.x = THREE.MathUtils.damp(group.scale.x, targetScaleXZ, 10, delta);
      group.scale.z = THREE.MathUtils.damp(group.scale.z, targetScaleXZ, 10, delta);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(frameId);
      cupGeo.dispose();
      glassMat.dispose();
      liquidGeo.dispose();
      liquidMat.dispose();
      lidGeo?.dispose();
      lidMat?.dispose();
      strawGeo?.dispose();
      strawMat?.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [category]);

  return (
    <div className="relative w-full h-[168px] bg-amber-950/5 rounded-2xl flex items-center justify-center overflow-hidden border border-amber-900/10">
      <div ref={mountRef} className="w-full h-full" />
      <div className="absolute bottom-2 right-3 bg-white/95 px-2.5 py-1 rounded-lg border border-amber-200 text-[11px] font-semibold text-amber-900 shadow-xs">
        Ukuran {selectedSize} ({selectedSize === 'Large' ? '16 oz / 473 ml' : '12 oz / 354 ml'})
      </div>
    </div>
  );
};
