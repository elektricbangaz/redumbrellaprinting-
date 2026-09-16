"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import type { DesignLayer, DesignSides } from "@/lib/designer-types";
import { GARMENT_MODELS } from "@/lib/garment-models";

type Props = {
  productSlug: string;
  colorName: string;
  side: "front" | "back";
  design: DesignSides;
  className?: string;
  interactive?: boolean;
  onPreviewChange?: (dataUrl: string) => void;
};

const COLOR_MAP: Record<string, string> = {
  White: "#f8f8f5", Black: "#111214", Grey: "#96999b", Navy: "#16213a",
  Red: "#bd171c", Sand: "#d8cfbe", Gold: "#a97d3b",
};
const getHex = (name: string) => name.startsWith("#") ? name : (COLOR_MAP[name] || "#d8d8d4");

async function loadImage(src: string) {
  return await new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function renderDesignTexture(layers: DesignLayer[]) {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 1600;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const layer of layers) {
    ctx.save();
    ctx.translate((layer.x / 100) * canvas.width, (layer.y / 100) * canvas.height);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    if (layer.type === "text") {
      try { await document.fonts.load(`${layer.bold ? 800 : 500} ${layer.fontSize}px "${layer.fontFamily}"`); } catch {}
      const px = Math.max(32, layer.fontSize * 3.1);
      ctx.font = `${layer.italic ? "italic " : ""}${layer.bold ? 800 : 500} ${px}px "${layer.fontFamily}", sans-serif`;
      ctx.fillStyle = layer.color;
      ctx.textAlign = layer.align;
      ctx.textBaseline = "middle";
      const maxWidth = ((layer.widthPct ?? 42) / 100) * canvas.width;
      const words = layer.content.split(/\s+/);
      const lines: string[] = [];
      let line = "";
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
          lines.push(line); line = word;
        } else line = test;
      }
      if (line) lines.push(line);
      const lineHeight = px * 1.05;
      const startY = -((lines.length - 1) * lineHeight) / 2;
      lines.forEach((value, index) => ctx.fillText(value, 0, startY + index * lineHeight, maxWidth));
    } else {
      const img = await loadImage(layer.src);
      if (img) {
        const width = (layer.widthPct / 100) * canvas.width;
        const height = width * (img.naturalHeight / Math.max(1, img.naturalWidth));
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
      }
    }
    ctx.restore();
  }
  return canvas;
}

function largestMesh(root: THREE.Object3D) {
  let chosen: THREE.Mesh | null = null;
  let volume = 0;
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.geometry.computeBoundingBox();
    const box = obj.geometry.boundingBox;
    if (!box) return;
    const size = box.getSize(new THREE.Vector3());
    const next = Math.max(0.000001, size.x * size.y * size.z);
    if (next > volume) { volume = next; chosen = obj; }
  });
  return chosen;
}

export function PremiumGarmentViewer({
  productSlug,
  colorName,
  side,
  design,
  className,
  interactive = true,
  onPreviewChange,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const garmentRef = useRef<THREE.Object3D | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const boxRef = useRef<THREE.Box3 | null>(null);
  const decalRef = useRef<THREE.Mesh | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "fallback">("loading");
  const config = GARMENT_MODELS[productSlug];

  const capture = () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;
    renderer.render(scene, camera);
    try { onPreviewChange?.(renderer.domElement.toDataURL("image/png")); } catch {}
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    let disposed = false;
    let frame = 0;

    container.innerHTML = "";
    setState(config?.modelUrl ? "loading" : "fallback");
    if (!config?.modelUrl) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f7f7f5");
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.1, 5.3);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 3.2;
    controls.maxDistance = 7.5;
    controls.minPolarAngle = Math.PI * 0.24;
    controls.maxPolarAngle = Math.PI * 0.76;
    controls.enabled = interactive;
    controlsRef.current = controls;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xbfc2c5, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 4.2);
    key.position.set(3.5, 5.5, 5.2); key.castShadow = true; scene.add(key);
    const fill = new THREE.DirectionalLight(0xffeeee, 1.6);
    fill.position.set(-4, 2, 2); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.3);
    rim.position.set(0, 3, -5); scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2.5, 96),
      new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.12 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.72;
    floor.receiveShadow = true;
    scene.add(floor);

    const loader = new GLTFLoader();
    loader.load(config.modelUrl, (gltf) => {
      if (disposed) return;
      const root = gltf.scene;
      root.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        obj.castShadow = true; obj.receiveShadow = true;
        obj.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(getHex(colorName)),
          roughness: 0.9, metalness: 0, sheen: 0.2,
          sheenColor: new THREE.Color("#ffffff"), sheenRoughness: 0.86,
        });
      });

      const initialBox = new THREE.Box3().setFromObject(root);
      const initialSize = initialBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(initialSize.x, initialSize.y, initialSize.z) || 1;
      root.scale.setScalar(3.15 / maxDim);
      const scaledBox = new THREE.Box3().setFromObject(root);
      root.position.sub(scaledBox.getCenter(new THREE.Vector3()));
      root.position.y -= 0.03;
      scene.add(root);

      garmentRef.current = root;
      meshRef.current = largestMesh(root);
      boxRef.current = new THREE.Box3().setFromObject(root);
      root.rotation.y = side === "back" ? Math.PI : 0;
      setState("ready");
      setTimeout(capture, 100);
    }, undefined, () => {
      if (!disposed) setState("fallback");
    });

    const resize = () => {
      const w = container.clientWidth, h = container.clientHeight;
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
      textureRef.current?.dispose();
      decalRef.current?.geometry.dispose();
      const dm = decalRef.current?.material;
      if (dm) (Array.isArray(dm) ? dm : [dm]).forEach((m) => m.dispose());
      rootDispose(garmentRef.current);
      renderer.dispose();
      container.innerHTML = "";
      sceneRef.current = null; rendererRef.current = null; cameraRef.current = null;
      controlsRef.current = null; garmentRef.current = null; meshRef.current = null;
      boxRef.current = null; decalRef.current = null; textureRef.current = null;
    };
  }, [config?.modelUrl, productSlug]);

  useEffect(() => {
    const root = garmentRef.current;
    if (!root) return;
    const next = new THREE.Color(getHex(colorName));
    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        if ("color" in m && (m as THREE.MeshStandardMaterial).color) {
          (m as THREE.MeshStandardMaterial).color.copy(next);
          m.needsUpdate = true;
        }
      });
    });
    setTimeout(capture, 40);
  }, [colorName]);

  useEffect(() => {
    const root = garmentRef.current;
    if (!root) return;
    root.rotation.y = side === "back" ? Math.PI : 0;
    setTimeout(capture, 40);
  }, [side]);

  useEffect(() => {
    if (controlsRef.current) controlsRef.current.enabled = interactive;
  }, [interactive]);

  useEffect(() => {
    const scene = sceneRef.current;
    const mesh = meshRef.current;
    const box = boxRef.current;
    if (!scene || !mesh || !box || state !== "ready") return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (cancelled) return;

      if (decalRef.current) {
        scene.remove(decalRef.current);
        decalRef.current.geometry.dispose();
        const mats = Array.isArray(decalRef.current.material) ? decalRef.current.material : [decalRef.current.material];
        mats.forEach((m) => m.dispose());
        decalRef.current = null;
      }
      textureRef.current?.dispose();
      textureRef.current = null;

      const layers = design[side];
      if (!layers.length) { capture(); return; }

      const canvas = await renderDesignTexture(layers);
      if (cancelled) return;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = rendererRef.current?.capabilities.getMaxAnisotropy() || 1;
      texture.needsUpdate = true;
      textureRef.current = texture;

      root.updateMatrixWorld(true);
      mesh.updateMatrixWorld(true);
      const liveBox = new THREE.Box3().setFromObject(root);
      const size = liveBox.getSize(new THREE.Vector3());
      const center = liveBox.getCenter(new THREE.Vector3());
      const pos = new THREE.Vector3(
        center.x,
        center.y - size.y * 0.07,
        side === "front" ? liveBox.max.z + 0.012 : liveBox.min.z - 0.012
      );
      const orient = new THREE.Euler(0, side === "front" ? 0 : Math.PI, 0);
      try {
        const geo = new DecalGeometry(
          mesh, pos, orient,
          new THREE.Vector3(size.x * (config?.printScale?.[0] ?? 0.36), size.y * (config?.printScale?.[1] ?? 0.42), Math.max(size.z * 0.85, 0.03))
        );
        const mat = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.02,
          depthWrite: false,
          depthTest: true,
          polygonOffset: true,
          polygonOffsetFactor: -8,
          polygonOffsetUnits: -8,
          toneMapped: false,
          side: THREE.DoubleSide,
        });
        const decal = new THREE.Mesh(geo, mat);
        decalRef.current = decal;
        scene.add(decal);
        capture();
      } catch {
        capture();
      }
    }, 70);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [design, side, state, config?.printScale]);

  return (
    <div className={className || "premium-garment-viewer"}>
      <div ref={mountRef} className="premium-garment-stage" />
      {state === "loading" && <div className="viewer-status">Loading 3D garment…</div>}
      {state === "fallback" && (
        <div className="viewer-fallback">
          <img src={config?.fallbackImage || "/mockups/plain-white-shirt.webp"} alt="" />
          <small>Preview this product and place your design.</small>
        </div>
      )}
    </div>
  );
}

function rootDispose(root: THREE.Object3D | null) {
  root?.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.geometry?.dispose?.();
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((m) => m?.dispose?.());
  });
}
