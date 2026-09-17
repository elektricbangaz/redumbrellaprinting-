"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import type { DesignLayer, DesignSides } from "@/lib/designer-types";
import { GARMENT_MODELS, type PrintZoneId } from "@/lib/garment-models";

type Props = {
  productSlug: string;
  colorName: string;
  side: "front" | "back";
  design: DesignSides;
  printZoneId?: PrintZoneId;
  className?: string;
  interactive?: boolean;
  onPreviewChange?: (dataUrl: string) => void;
};

const COLOR_MAP: Record<string, string> = {
  White: "#f8f8f5", Black: "#111214", Grey: "#96999b", Navy: "#16213a",
  Red: "#bd171c", Sand: "#d8cfbe", Gold: "#a97d3b",
};
const getHex = (name: string) => name.startsWith("#") ? name : (COLOR_MAP[name] || "#d8d8d4");

const IMAGE_CACHE = new Map<string, Promise<HTMLImageElement | null>>();

async function loadImage(src: string) {
  const existing = IMAGE_CACHE.get(src);
  if (existing) return existing;
  const pending = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  IMAGE_CACHE.set(src, pending);
  return pending;
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
      const lines: string[] = [];
      const paragraphs = layer.content.split(/\n/);
      for (const paragraph of paragraphs) {
        const words = paragraph.split(/\s+/).filter(Boolean);
        let line = "";
        for (const word of words) {
          const chunks: string[] = [];
          if (ctx.measureText(word).width > maxWidth) {
            let chunk = "";
            for (const char of word) {
              const testChunk = chunk + char;
              if (ctx.measureText(testChunk).width > maxWidth && chunk) {
                chunks.push(chunk);
                chunk = char;
              } else chunk = testChunk;
            }
            if (chunk) chunks.push(chunk);
          } else chunks.push(word);

          for (const chunk of chunks) {
            const test = line ? line + " " + chunk : chunk;
            if (ctx.measureText(test).width > maxWidth && line) {
              lines.push(line);
              line = chunk;
            } else {
              line = test;
            }
          }
        }
        if (line) {
          lines.push(line);
          line = "";
        }
        if (!words.length) lines.push("");
      }
      const lineHeight = px * 1.08;
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
  printZoneId,
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
    const root = garmentRef.current;
    const mesh = meshRef.current;
    if (!scene || !root || !mesh || state !== "ready") return;

    if (decalRef.current) {
      scene.remove(decalRef.current);
      decalRef.current.geometry.dispose();
      const mats = Array.isArray(decalRef.current.material) ? decalRef.current.material : [decalRef.current.material];
      mats.forEach((m) => m.dispose());
      decalRef.current = null;
    }

    root.updateMatrixWorld(true);
    mesh.updateMatrixWorld(true);
    const liveBox = new THREE.Box3().setFromObject(root);
    const size = liveBox.getSize(new THREE.Vector3());
    const center = liveBox.getCenter(new THREE.Vector3());
    const zone =
      config?.printZones?.find((candidate) => candidate.id === printZoneId && candidate.side === side) ||
      config?.printZones?.find((candidate) => candidate.side === side);
    const projectionScale = zone?.projectionScale || config?.printScale || [0.36, 0.42];
    const projectionOffset = zone?.projectionOffset || [0, -0.07];
    const pos = new THREE.Vector3(
      center.x + size.x * projectionOffset[0],
      center.y + size.y * projectionOffset[1],
      side === "front" ? liveBox.max.z + 0.012 : liveBox.min.z - 0.012
    );
    const orient = new THREE.Euler(0, side === "front" ? 0 : Math.PI, 0);

    try {
      const geo = new DecalGeometry(
        mesh,
        pos,
        orient,
        new THREE.Vector3(
          size.x * projectionScale[0],
          size.y * projectionScale[1],
          Math.max(size.z * 0.14, 0.028)
        )
      );
      const mat = new THREE.MeshBasicMaterial({
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
    } catch {}
  }, [side, state, config?.printScale, config?.printZones, printZoneId]);

  useEffect(() => {
    const decal = decalRef.current;
    if (!decal || state !== "ready") return;
    let cancelled = false;
    const frame = requestAnimationFrame(async () => {
      const layers = design[side];
      if (cancelled) return;
      const mat = decal.material as THREE.MeshBasicMaterial;

      if (!layers.length) {
        textureRef.current?.dispose();
        textureRef.current = null;
        mat.map = null;
        mat.needsUpdate = true;
        capture();
        return;
      }

      const canvas = await renderDesignTexture(layers);
      if (cancelled) return;
      const nextTexture = new THREE.CanvasTexture(canvas);
      nextTexture.colorSpace = THREE.SRGBColorSpace;
      nextTexture.anisotropy = rendererRef.current?.capabilities.getMaxAnisotropy() || 1;
      nextTexture.needsUpdate = true;

      const previous = textureRef.current;
      textureRef.current = nextTexture;
      mat.map = nextTexture;
      mat.needsUpdate = true;
      previous?.dispose();
      capture();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [design, side, state]);

  return (
    <div className={className || "premium-garment-viewer"}>
      <div ref={mountRef} className="premium-garment-stage" />
      {state === "loading" && (
        <div className="viewer-loading-preview">
          <img src={config?.fallbackImage || "/mockups/plain-white-shirt.webp"} alt="" />
          <span>Preparing 3D preview…</span>
        </div>
      )}
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
