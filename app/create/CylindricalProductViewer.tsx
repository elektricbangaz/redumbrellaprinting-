"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { DesignLayer, DesignSides } from "@/lib/designer-types";

type Props = {
  productSlug: string;
  colorName: string;
  side: "front" | "back";
  design: DesignSides;
  interactive?: boolean;
  onPreviewChange?: (dataUrl: string) => void;
};

const COLORS: Record<string, string> = {
  White: "#f5f5f1",
  Black: "#111214",
  Grey: "#999999",
  Navy: "#16213a",
  Red: "#bd171c",
  Gold: "#a97d3b",
};

function hex(name: string) {
  return name.startsWith("#") ? name : (COLORS[name] || "#e5e5e2");
}

async function loadImage(src: string) {
  return await new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function textureCanvas(layers: DesignLayer[]) {
  const canvas = document.createElement("canvas");
  canvas.width = 1800;
  canvas.height = 900;
  const ctx = canvas.getContext("2d")!;
  // The active front/back design occupies the full cylindrical wrap canvas.
  // Its layer coordinates are percentages relative to this centered region.
  const region = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    w: canvas.width,
    h: canvas.height,
  };
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const layer of layers) {
    ctx.save();
    const localX = region.x + (((layer.x / 100) * region.w) - region.w / 2);
    const localY = region.y + (((layer.y / 100) * region.h) - region.h / 2);
    ctx.translate(localX, localY);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    if (layer.type === "text") {
      try { await document.fonts.load(`${layer.bold ? 800 : 500} ${layer.fontSize}px "${layer.fontFamily}"`); } catch {}
      const px = Math.max(42, layer.fontSize * 3);
      ctx.font = `${layer.italic ? "italic " : ""}${layer.bold ? 800 : 500} ${px}px "${layer.fontFamily}", sans-serif`;
      ctx.fillStyle = layer.color;
      ctx.textAlign = layer.align;
      ctx.textBaseline = "middle";
      const maxWidth = ((layer.widthPct ?? 38) / 100) * region.w;
      ctx.fillText(layer.content, 0, 0, maxWidth);
    } else {
      const img = await loadImage(layer.src);
      if (img) {
        const w = (layer.widthPct / 100) * region.w;
        const h = w * (img.naturalHeight / Math.max(1, img.naturalWidth));
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      }
    }
    ctx.restore();
  }
  return canvas;
}

export function CylindricalProductViewer({
  productSlug,
  colorName,
  side,
  design,
  interactive = true,
  onPreviewChange,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    let disposed = false;
    let frame = 0;
    setLoading(true);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f7f7f5");

    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
    camera.position.set(0, 0.2, 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enabled = interactive;
    controls.minDistance = 3.3;
    controls.maxDistance = 7.5;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xbfc2c5, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 4);
    key.position.set(4, 5, 5);
    key.castShadow = true;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffeeee, 1.4);
    fill.position.set(-4, 2, 2);
    scene.add(fill);

    const baseMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(hex(colorName)),
      roughness: productSlug === "custom-mug" ? 0.46 : 0.76,
      metalness: productSlug === "custom-mug" ? 0 : 0.08,
      clearcoat: productSlug === "custom-mug" ? 0.32 : 0.12,
    });

    const group = new THREE.Group();
    scene.add(group);

    let body: THREE.Mesh;
    if (productSlug === "custom-mug") {
      body = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 2.35, 96, 1, false), baseMat);
      const handle = new THREE.Mesh(
        new THREE.TorusGeometry(0.63, 0.16, 28, 80, Math.PI * 1.7),
        baseMat
      );
      handle.rotation.z = Math.PI / 2;
      handle.position.set(1.05, 0.05, 0);
      group.add(handle);
    } else {
      body = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.96, 2.85, 96, 1, false), baseMat);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.52, 0.42, 64), baseMat);
      neck.position.y = 1.62;
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.25, 64),
        new THREE.MeshPhysicalMaterial({ color: productSlug === "branded-bottle" ? 0x171717 : 0xeeeeee, roughness: 0.7 })
      );
      cap.position.y = 1.96;
      group.add(neck, cap);
    }
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2.5, 80),
      new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.11 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.55;
    floor.receiveShadow = true;
    scene.add(floor);

    let tex: THREE.CanvasTexture | null = null;
    let printMat: THREE.MeshBasicMaterial | null = null;
    let printShell: THREE.Mesh | null = null;

    textureCanvas(design[side] ?? []).then((canvas) => {
      if (disposed) return;
      tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.needsUpdate = true;
      printMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
      });
      const radius = productSlug === "custom-mug" ? 1.056 : 0.91;
      const height = productSlug === "custom-mug" ? 1.55 : 1.85;
      printShell = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 96, 1, true), printMat);
      printShell.position.y = productSlug === "custom-mug" ? 0 : -0.15;
      if (side === "back") printShell.rotation.y = Math.PI;
      group.add(printShell);
      setLoading(false);
      requestAnimationFrame(() => {
        renderer.render(scene, camera);
        try { onPreviewChange?.(renderer.domElement.toDataURL("image/png")); } catch {}
      });
    });

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    const animate = () => {
      frame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      tex?.dispose();
      printMat?.dispose();
      printShell?.geometry.dispose();
      body.geometry.dispose();
      baseMat.dispose();
      renderer.dispose();
      container.innerHTML = "";
    };
  }, [productSlug, colorName, side, design, interactive, onPreviewChange]);

  return (
    <div className="cylindrical-viewer">
      <div ref={mountRef} className="premium-garment-stage" />
      {loading && <div className="viewer-status">Updating live wrap…</div>}
    </div>
  );
}
