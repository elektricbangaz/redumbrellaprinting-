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
  White: "#f8f8f5",
  Black: "#111214",
  Grey: "#96999b",
  Navy: "#16213a",
  Red: "#bd171c",
  Sand: "#d8cfbe",
  Gold: "#a97d3b",
};

const getHex = (name: string) => name.startsWith("#") ? name : (COLOR_MAP[name] || "#d8d8d4");

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
      const weight = layer.bold ? 800 : 500;
      const italic = layer.italic ? "italic " : "";
      const size = Math.max(32, layer.fontSize * 3.2);
      ctx.font = `${italic}${weight} ${size}px ${layer.fontFamily || "Arial"}`;
      ctx.fillStyle = layer.color;
      ctx.textAlign = layer.align;
      ctx.textBaseline = "middle";
      ctx.fillText(layer.content, 0, 0);
    } else {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const width = (layer.widthPct / 100) * canvas.width;
          const ratio = img.naturalWidth ? img.naturalHeight / img.naturalWidth : 1;
          const height = width * ratio;
          ctx.drawImage(img, -width / 2, -height / 2, width, height);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = layer.src;
      });
    }
    ctx.restore();
  }

  return canvas;
}

function largestMesh(root: THREE.Object3D) {
  let chosen: THREE.Mesh | null = null;
  let chosenVolume = 0;
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || !obj.geometry) return;
    obj.geometry.computeBoundingBox();
    const box = obj.geometry.boundingBox;
    if (!box) return;
    const size = box.getSize(new THREE.Vector3());
    const volume = Math.max(0.000001, size.x * size.y * size.z);
    if (volume > chosenVolume) {
      chosenVolume = volume;
      chosen = obj;
    }
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
  const [state, setState] = useState<"loading" | "ready" | "fallback">("loading");
  const config = GARMENT_MODELS[productSlug];

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const container = mount;
    let disposed = false;
    let frame = 0;

    container.innerHTML = "";

    if (!config?.modelUrl) {
      setState("fallback");
      return;
    }

    setState("loading");

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f7f7f5");

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.1, 5.3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 3.2;
    controls.maxDistance = 7.5;
    controls.minPolarAngle = Math.PI * 0.24;
    controls.maxPolarAngle = Math.PI * 0.76;
    controls.autoRotate = false;
    controls.enabled = interactive;

    const hemi = new THREE.HemisphereLight(0xffffff, 0xbfc2c5, 2.2);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 4.2);
    key.position.set(3.5, 5.5, 5.2);
    key.castShadow = true;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xffeeee, 1.6);
    fill.position.set(-4, 2, 2);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 1.3);
    rim.position.set(0, 3, -5);
    scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2.5, 96),
      new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.12 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.72;
    floor.receiveShadow = true;
    scene.add(floor);

    const loader = new GLTFLoader();
    const textures: THREE.Texture[] = [];
    const decalMaterials: THREE.Material[] = [];
    const decalGeometries: THREE.BufferGeometry[] = [];
    let garmentRoot: THREE.Object3D | null = null;

    const addArtwork = async (mesh: THREE.Mesh, rootBox: THREE.Box3) => {
      const layers = design[side];
      if (!layers.length) return;

      const canvas = await renderDesignTexture(layers);
      if (disposed) return;

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.needsUpdate = true;
      textures.push(texture);

      const size = rootBox.getSize(new THREE.Vector3());
      const center = rootBox.getCenter(new THREE.Vector3());
      const printWidth = size.x * (config.printScale?.[0] ?? 0.36);
      const printHeight = size.y * (config.printScale?.[1] ?? 0.42);
      const thickness = Math.max(size.z * 0.8, 0.02);
      const z = side === "front" ? rootBox.max.z + 0.006 : rootBox.min.z - 0.006;

      const pos = new THREE.Vector3(center.x, center.y - size.y * 0.07, z);
      const orient = new THREE.Euler(
        0,
        side === "front" ? 0 : Math.PI,
        0
      );

      let decalGeo: DecalGeometry;
      try {
        decalGeo = new DecalGeometry(
          mesh,
          pos,
          orient,
          new THREE.Vector3(printWidth, printHeight, thickness)
        );
      } catch {
        return;
      }

      const decalMat = new THREE.MeshPhysicalMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        roughness: 0.84,
        metalness: 0,
        clearcoat: 0,
      });
      decalMaterials.push(decalMat);
      decalGeometries.push(decalGeo);

      const decal = new THREE.Mesh(decalGeo, decalMat);
      scene.add(decal);
    };

    loader.load(
      config.modelUrl,
      async (gltf) => {
        if (disposed) return;

        garmentRoot = gltf.scene;
        const root = garmentRoot;

        root.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;
          obj.castShadow = true;
          obj.receiveShadow = true;
          const base = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(getHex(colorName)),
            roughness: 0.9,
            metalness: 0,
            sheen: 0.2,
            sheenColor: new THREE.Color("#ffffff"),
            sheenRoughness: 0.86,
          });
          obj.material = base;
        });

        const initialBox = new THREE.Box3().setFromObject(root);
        const initialSize = initialBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(initialSize.x, initialSize.y, initialSize.z) || 1;
        const scale = 3.15 / maxDim;
        root.scale.setScalar(scale);

        const scaledBox = new THREE.Box3().setFromObject(root);
        const center = scaledBox.getCenter(new THREE.Vector3());
        root.position.sub(center);
        root.position.y -= 0.03;

        scene.add(root);

        const finalBox = new THREE.Box3().setFromObject(root);
        const mesh = largestMesh(root);
        if (mesh) await addArtwork(mesh, finalBox);

        if (side === "back") root.rotation.y = Math.PI;

        controls.target.set(0, 0, 0);
        setState("ready");
        requestAnimationFrame(() => {
          renderer.render(scene, camera);
          try { onPreviewChange?.(renderer.domElement.toDataURL("image/png")); } catch {}
        });
      },
      undefined,
      () => {
        if (!disposed) setState("fallback");
      }
    );

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
      textures.forEach((t) => t.dispose());
      decalMaterials.forEach((m) => m.dispose());
      decalGeometries.forEach((g) => g.dispose());
      garmentRoot?.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose?.();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => m?.dispose?.());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      container.innerHTML = "";
    };
  }, [config?.modelUrl, productSlug, colorName, side, design, interactive, onPreviewChange]);

  return (
    <div className={className || "premium-garment-viewer"}>
      <div ref={mountRef} className="premium-garment-stage" />
      {state === "loading" && (
        <div className="viewer-status">Loading 3D garment…</div>
      )}
      {state === "fallback" && (
        <div className="viewer-fallback">
          <img src={config?.fallbackImage || "/mockups/plain-white-shirt.webp"} alt="" />
          <small>3D model pending for this garment</small>
        </div>
      )}
    </div>
  );
}
