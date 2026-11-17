import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const HeroCoffeeCup3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL as per threejs guidelines
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 280;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1e120b, 0.03);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 2.2, 5.2);
    camera.lookAt(0, 0.6, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.appendChild(renderer.domElement);

    // Lightweight 3-point studio lighting (no heavy per-frame shadowMap pass)
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.3);
    keyLight.position.set(4, 8, 5);
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0xffedd5, 0x451a03, 1.3);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xf59e0b, 2.5, 10);
    rimLight.position.set(-3, 4, -3);
    scene.add(rimLight);

    // Create 3D Coffee Cup Group
    const cupGroup = new THREE.Group();

    // 1. Cup Body (Ceramic)
    const cupGeo = new THREE.CylinderGeometry(0.95, 0.7, 2.0, 24);
    const ceramicMat = new THREE.MeshStandardMaterial({
      color: 0xfffcf8,
      roughness: 0.18,
      metalness: 0.05,
    });
    const cupMesh = new THREE.Mesh(cupGeo, ceramicMat);
    cupMesh.position.y = 1.0;
    cupGroup.add(cupMesh);

    // 2. Craft Sleeve Accent
    const sleeveGeo = new THREE.CylinderGeometry(0.97, 0.86, 0.7, 24);
    const sleeveMat = new THREE.MeshStandardMaterial({
      color: 0x92400e,
      roughness: 0.6,
      metalness: 0.12,
    });
    const sleeveMesh = new THREE.Mesh(sleeveGeo, sleeveMat);
    sleeveMesh.position.y = 0.95;
    cupGroup.add(sleeveMesh);

    // 3. Coffee Liquid Surface
    const liquidGeo = new THREE.CylinderGeometry(0.88, 0.88, 0.05, 24);
    const liquidMat = new THREE.MeshStandardMaterial({
      color: 0x3b1c0a,
      roughness: 0.12,
      metalness: 0.1,
    });
    const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    liquidMesh.position.y = 1.88;
    cupGroup.add(liquidMesh);

    // Latte Art Foam Disk
    const foamGeo = new THREE.CircleGeometry(0.6, 24);
    const foamMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      roughness: 0.35,
    });
    const foamMesh = new THREE.Mesh(foamGeo, foamMat);
    foamMesh.rotation.x = -Math.PI / 2;
    foamMesh.position.y = 1.91;
    cupGroup.add(foamMesh);

    // 4. Cup Handle
    const handleGeo = new THREE.TorusGeometry(0.55, 0.12, 12, 24, Math.PI * 1.1);
    const handleMesh = new THREE.Mesh(handleGeo, ceramicMat);
    handleMesh.position.set(0.95, 1.0, 0);
    handleMesh.rotation.z = -Math.PI / 2;
    cupGroup.add(handleMesh);

    // 5. Futuristic Glowing Orbital Accent Ring
    const haloGeo = new THREE.TorusGeometry(1.42, 0.02, 8, 48);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.45,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.y = 0.85;
    haloMesh.rotation.x = Math.PI / 2.2;
    haloMesh.rotation.y = 0.25;
    scene.add(haloMesh);

    // 6. Soft Contact Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(3.2, 3.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.01;
    scene.add(shadowMesh);

    // 7. Lightweight Floating Steam Particles
    const steamParticleCount = isSoftwareGl ? 6 : 10;
    const steamGeo = new THREE.BufferGeometry();
    const steamPositions = new Float32Array(steamParticleCount * 3);

    for (let i = 0; i < steamParticleCount; i++) {
      steamPositions[i * 3] = (Math.random() - 0.5) * 0.7;
      steamPositions[i * 3 + 1] = 2.0 + Math.random() * 1.4;
      steamPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.7;
    }

    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));

    const steamCanvas = document.createElement('canvas');
    steamCanvas.width = 48;
    steamCanvas.height = 48;
    const ctx = steamCanvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(24, 24, 0, 24, 24, 24);
    grad.addColorStop(0, 'rgba(255, 245, 235, 0.65)');
    grad.addColorStop(0.5, 'rgba(255, 235, 215, 0.25)');
    grad.addColorStop(1, 'rgba(255, 235, 215, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 48, 48);

    const steamTex = new THREE.CanvasTexture(steamCanvas);

    const steamMat = new THREE.PointsMaterial({
      size: 0.42,
      map: steamTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const steamPoints = new THREE.Points(steamGeo, steamMat);
    cupGroup.add(steamPoints);

    scene.add(cupGroup);

    // Mouse / Touch Drag Rotation
    let isDragging = false;
    let previousMouseX = 0;
    let targetRotationY = 0;
    let currentRotationY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      previousMouseX = e.clientX;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMouseX;
      targetRotationY += deltaX * 0.01;
      previousMouseX = e.clientX;
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.05);
      const time = clock.getElapsedTime();

      if (!isDragging) {
        targetRotationY += delta * 0.45;
      }

      currentRotationY = THREE.MathUtils.damp(currentRotationY, targetRotationY, 8, delta);
      cupGroup.rotation.y = currentRotationY;
      cupGroup.position.y = Math.sin(time * 1.8) * 0.045;
      haloMesh.rotation.z = time * 0.35;

      const posAttr = steamGeo.attributes.position as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;

      for (let i = 0; i < steamParticleCount; i++) {
        array[i * 3 + 1] += delta * 0.55;
        array[i * 3] += Math.sin(time * 2.5 + i) * 0.0018;

        if (array[i * 3 + 1] > 3.6) {
          array[i * 3 + 1] = 2.0;
          array[i * 3] = (Math.random() - 0.5) * 0.7;
          array[i * 3 + 2] = (Math.random() - 0.5) * 0.7;
        }
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElem.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);

      cupGeo.dispose();
      sleeveGeo.dispose();
      liquidGeo.dispose();
      foamGeo.dispose();
      handleGeo.dispose();
      haloGeo.dispose();
      shadowGeo.dispose();
      steamGeo.dispose();
      ceramicMat.dispose();
      sleeveMat.dispose();
      liquidMat.dispose();
      foamMat.dispose();
      haloMat.dispose();
      shadowMat.dispose();
      steamMat.dispose();
      steamTex.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[260px] cursor-grab active:cursor-grabbing select-none group">
      <div ref={mountRef} className="w-full h-full" />
      {/* 3D Interaction Hint Badge */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium tracking-wide flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
        <span>Geser 360° untuk Putar Gelas 3D</span>
      </div>
    </div>
  );
};
