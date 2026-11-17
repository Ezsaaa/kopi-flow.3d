import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface AcrylicQRStand3DProps {
  cafeName: string;
  tableNumber: string;
}

export const AcrylicQRStand3D: React.FC<AcrylicQRStand3DProps> = ({ cafeName, tableNumber }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const redrawRef = useRef<((name: string, table: string) => void) | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 280;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1.8, 4.6);
    camera.lookAt(0, 0.9, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xfff5ea, 2.2);
    dirLight.position.set(3, 6, 4);
    scene.add(dirLight);

    const backLight = new THREE.PointLight(0xf59e0b, 2, 8);
    backLight.position.set(-2, 3, -2);
    scene.add(backLight);

    const standGroup = new THREE.Group();
    scene.add(standGroup);

    // 1. Wooden Base
    const baseGeo = new THREE.BoxGeometry(1.8, 0.22, 1.0);
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x542d13,
      roughness: 0.45,
      metalness: 0.1,
    });
    const baseMesh = new THREE.Mesh(baseGeo, woodMat);
    baseMesh.position.y = 0.11;
    standGroup.add(baseMesh);

    // 2. Lightweight Translucent Acrylic Frame (no expensive double transmission pass)
    const acrylicGeo = new THREE.BoxGeometry(1.52, 2.22, 0.06);
    const acrylicMat = new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      opacity: 0.34,
      transparent: true,
      roughness: 0.15,
      metalness: 0.25,
    });
    const acrylicMesh = new THREE.Mesh(acrylicGeo, acrylicMat);
    acrylicMesh.position.y = 1.25;
    standGroup.add(acrylicMesh);

    // Futuristic Amber Edge Accent
    const edgesGeo = new THREE.EdgesGeometry(acrylicGeo);
    const edgesMat = new THREE.LineBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.55,
    });
    const edgeWire = new THREE.LineSegments(edgesGeo, edgesMat);
    edgeWire.position.y = 1.25;
    standGroup.add(edgeWire);

    // 3. Canvas Texture for QR Plate Content
    const qrCanvas = document.createElement('canvas');
    qrCanvas.width = 512;
    qrCanvas.height = 768;
    const ctx = qrCanvas.getContext('2d')!;
    const qrTexture = new THREE.CanvasTexture(qrCanvas);
    qrTexture.colorSpace = THREE.SRGBColorSpace;

    const drawCanvas = (activeName: string, activeTable: string) => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 512, 768);

      // Top Header
      ctx.fillStyle = '#78350F';
      ctx.fillRect(0, 0, 512, 120);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 34px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText((activeName || 'Kopi Senja Utama').slice(0, 22), 256, 68);

      ctx.font = '18px sans-serif';
      ctx.fillText('SCAN QR UNTUK PESAN & BAYAR', 256, 100);

      // Table Badge
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.roundRect(140, 140, 232, 60, 30);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(activeTable || 'Meja 04', 256, 182);

      // QR Graphic
      const qrSize = 280;
      const qrX = (512 - qrSize) / 2;
      const qrY = 230;

      ctx.fillStyle = '#0F172A';
      ctx.fillRect(qrX, qrY, qrSize, qrSize);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(qrX + 16, qrY + 16, qrSize - 32, qrSize - 32);

      const drawEye = (x: number, y: number) => {
        ctx.fillStyle = '#78350F';
        ctx.fillRect(x, y, 60, 60);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 10, y + 10, 40, 40);
        ctx.fillStyle = '#78350F';
        ctx.fillRect(x + 20, y + 20, 20, 20);
      };

      drawEye(qrX + 24, qrY + 24);
      drawEye(qrX + qrSize - 84, qrY + 24);
      drawEye(qrX + 24, qrY + qrSize - 84);

      // Deterministic QR matrix derived from table name
      const seedOffset = (activeTable || 'Meja 04')
        .split('')
        .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

      ctx.fillStyle = '#1E1B18';
      for (let r = 0; r < 14; r++) {
        for (let c = 0; c < 14; c++) {
          if (((r * 7 + c * 13 + seedOffset) % 11) > 4) {
            ctx.fillRect(qrX + 90 + c * 12, qrY + 90 + r * 12, 10, 10);
          }
        }
      }

      // Center Icon
      ctx.fillStyle = '#78350F';
      ctx.beginPath();
      ctx.arc(256, qrY + qrSize / 2, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('☕', 256, qrY + qrSize / 2 + 8);

      // Footer
      ctx.fillStyle = '#475569';
      ctx.font = '22px sans-serif';
      ctx.fillText('Pesan Mandiri • Tanpa Antre Kasir', 256, 560);
      ctx.font = 'bold 26px sans-serif';
      ctx.fillStyle = '#166534';
      ctx.fillText('QRIS & Bayar di Kasir', 256, 610);

      qrTexture.needsUpdate = true;
    };

    drawCanvas(cafeName, tableNumber);
    redrawRef.current = drawCanvas;

    const paperGeo = new THREE.PlaneGeometry(1.42, 2.12);
    const paperMat = new THREE.MeshStandardMaterial({
      map: qrTexture,
      roughness: 0.3,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    const paperMesh = new THREE.Mesh(paperGeo, paperMat);
    paperMesh.position.set(0, 1.25, 0.032);
    standGroup.add(paperMesh);

    let isDragging = false;
    let prevX = 0;
    let rotY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      rotY += dx * 0.01;
      prevX = e.clientX;
    };
    const onPointerUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    let frameId: number;
    const clock = new THREE.Clock();

    const render = () => {
      const delta = Math.min(clock.getDelta(), 0.05);
      if (!isDragging) {
        rotY += delta * 0.45;
      }
      standGroup.rotation.y = rotY;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(frameId);
      redrawRef.current = null;
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      baseGeo.dispose();
      woodMat.dispose();
      acrylicGeo.dispose();
      acrylicMat.dispose();
      edgesGeo.dispose();
      edgesMat.dispose();
      paperGeo.dispose();
      paperMat.dispose();
      qrTexture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    redrawRef.current?.(cafeName, tableNumber);
  }, [cafeName, tableNumber]);

  return (
    <div className="relative w-full h-[280px] bg-slate-900 rounded-2xl border border-amber-500/30 overflow-hidden cursor-grab active:cursor-grabbing shadow-xl flex items-center justify-center">
      <div ref={mountRef} className="w-full h-full" />
      <div className="absolute top-3 left-3 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/40 text-amber-200 text-xs font-semibold flex items-center gap-1.5">
        <span>✨ Stand QR Meja 3D</span>
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full border border-white/20 text-slate-300 text-[11px] whitespace-nowrap">
        Putar 360° untuk melihat tampilan QR meja
      </div>
    </div>
  );
};
