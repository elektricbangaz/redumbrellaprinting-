"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { DesignLayer, DesignSides } from "@/lib/designer-types";
import {
  GARMENT_MODELS,
  type GarmentModelConfig,
  type PrintZoneId,
} from "@/lib/garment-models";

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

type PrintUniforms = {
  map: { value: THREE.Texture };
  min: { value: THREE.Vector2 };
  max: { value: THREE.Vector2 };
  depthCenter: { value: number };
  side: { value: number };
  enabled: { value: number };
};

const COLOR_MAP: Record<string, string> = {
  White: "#f6f6f2",
  Black: "#111214",
  Grey: "#96999b",
  Navy: "#16213a",
  Red: "#bd171c",
  Sand: "#d8cfbe",
  Gold: "#a97d3b",
};

const getHex = (name: string) =>
  name.startsWith("#") ? name : (COLOR_MAP[name] || "#d8d8d4");

const IMAGE_CACHE = new Map<string, Promise<HTMLImageElement | null>>();
const MODEL_CACHE = new Map<string, Promise<THREE.Object3D>>();

const EMPTY_TEXTURE = new THREE.DataTexture(
  new Uint8Array([0, 0, 0, 0]),
  1,
  1,
  THREE.RGBAFormat
);
EMPTY_TEXTURE.needsUpdate = true;

function loadGarmentTemplate(url: string) {
  const cached = MODEL_CACHE.get(url);
  if (cached) return cached;

  const pending = new GLTFLoader().loadAsync(url).then((gltf) => gltf.scene);
  MODEL_CACHE.set(url, pending);
  pending.catch(() => MODEL_CACHE.delete(url));
  return pending;
}

function cloneGarmentTemplate(template: THREE.Object3D) {
  const root = template.clone(true);
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.geometry = obj.geometry.clone();
  });
  return root;
}

export function preloadGarmentModel(productSlug: string) {
  const url = GARMENT_MODELS[productSlug]?.modelUrl;
  if (!url) return Promise.resolve(null);
  return loadGarmentTemplate(url).then(() => null).catch(() => null);
}

async function loadImage(src: string) {
  const cached = IMAGE_CACHE.get(src);
  if (cached) return cached;

  const pending = new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

  IMAGE_CACHE.set(src, pending);
  return pending;
}

async function renderDesignTexture(layers: DesignLayer[]) {
  const mobile = typeof window !== "undefined" && window.innerWidth <= 760;
  const canvas = document.createElement("canvas");
  canvas.width = mobile ? 900 : 1400;
  canvas.height = mobile ? 1040 : 1600;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const layer of layers) {
    ctx.save();
    ctx.translate((layer.x / 100) * canvas.width, (layer.y / 100) * canvas.height);
    ctx.rotate((layer.rotation * Math.PI) / 180);

    if (layer.type === "text") {
      try {
        await document.fonts.load(
          `${layer.bold ? 800 : 500} ${layer.fontSize}px "${layer.fontFamily}"`
        );
      } catch {}

      const px = Math.max(28, layer.fontSize * (mobile ? 2.35 : 3.1));
      ctx.font = `${layer.italic ? "italic " : ""}${layer.bold ? 800 : 500} ${px}px "${layer.fontFamily}", sans-serif`;
      ctx.fillStyle = layer.color;
      ctx.textAlign = layer.align;
      ctx.textBaseline = "middle";

      const maxWidth = ((layer.widthPct ?? 42) / 100) * canvas.width;
      const lines: string[] = [];

      for (const paragraph of layer.content.split(/\n/)) {
        const words = paragraph.split(/\s+/).filter(Boolean);
        let line = "";

        for (const word of words) {
          const chunks: string[] = [];

          if (ctx.measureText(word).width > maxWidth) {
            let chunk = "";
            for (const char of word) {
              const next = chunk + char;
              if (ctx.measureText(next).width > maxWidth && chunk) {
                chunks.push(chunk);
                chunk = char;
              } else {
                chunk = next;
              }
            }
            if (chunk) chunks.push(chunk);
          } else {
            chunks.push(word);
          }

          for (const chunk of chunks) {
            const next = line ? `${line} ${chunk}` : chunk;
            if (ctx.measureText(next).width > maxWidth && line) {
              lines.push(line);
              line = chunk;
            } else {
              line = next;
            }
          }
        }

        if (line) lines.push(line);
        if (!words.length) lines.push("");
      }

      const lineHeight = px * 1.08;
      const startY = -((lines.length - 1) * lineHeight) / 2;
      lines.forEach((value, index) => {
        ctx.fillText(value, 0, startY + index * lineHeight, maxWidth);
      });
    } else {
      const image = await loadImage(layer.src);
      if (image) {
        const width = (layer.widthPct / 100) * canvas.width;
        const height = width * (image.naturalHeight / Math.max(1, image.naturalWidth));
        ctx.drawImage(image, -width / 2, -height / 2, width, height);
      }
    }

    ctx.restore();
  }

  return canvas;
}

function largestMesh(root: THREE.Object3D) {
  let selected: THREE.Mesh | null = null;
  let volume = 0;

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.geometry.computeBoundingBox();
    const box = obj.geometry.boundingBox;
    if (!box) return;

    const size = box.getSize(new THREE.Vector3());
    const next = Math.max(0.000001, size.x * size.y * size.z);
    if (next > volume) {
      volume = next;
      selected = obj;
    }
  });

  return selected;
}

function createBaseGarmentMaterial(colorName: string) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(getHex(colorName)),
    roughness: 0.86,
    metalness: 0,
    sheen: 0.26,
    sheenColor: new THREE.Color("#ffffff"),
    sheenRoughness: 0.78,
  });
}

function createProjectedPrintMaterial(colorName: string) {
  const material = createBaseGarmentMaterial(colorName);
  const uniforms: PrintUniforms = {
    map: { value: EMPTY_TEXTURE },
    min: { value: new THREE.Vector2(-0.5, -0.5) },
    max: { value: new THREE.Vector2(0.5, 0.5) },
    depthCenter: { value: 0 },
    side: { value: 1 },
    enabled: { value: 0 },
  };

  material.userData.printUniforms = uniforms;
  material.customProgramCacheKey = () => "red-umbrella-garment-print-v2";
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRupPrintMap = uniforms.map;
    shader.uniforms.uRupPrintMin = uniforms.min;
    shader.uniforms.uRupPrintMax = uniforms.max;
    shader.uniforms.uRupDepthCenter = uniforms.depthCenter;
    shader.uniforms.uRupPrintSide = uniforms.side;
    shader.uniforms.uRupPrintEnabled = uniforms.enabled;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>\nvarying vec3 vRupLocalPosition;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>\nvRupLocalPosition = position;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>\nuniform sampler2D uRupPrintMap;\nuniform vec2 uRupPrintMin;\nuniform vec2 uRupPrintMax;\nuniform float uRupDepthCenter;\nuniform float uRupPrintSide;\nuniform float uRupPrintEnabled;\nvarying vec3 vRupLocalPosition;`
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>\nif (uRupPrintEnabled > 0.5) {\n  vec2 rupSpan = max(uRupPrintMax - uRupPrintMin, vec2(0.00001));\n  vec2 rupUv = (vRupLocalPosition.xy - uRupPrintMin) / rupSpan;\n  float rupInside = step(0.0, rupUv.x) * step(rupUv.x, 1.0) * step(0.0, rupUv.y) * step(rupUv.y, 1.0);\n  float rupCorrectSide = step(0.0, (vRupLocalPosition.z - uRupDepthCenter) * uRupPrintSide);\n  if (rupInside * rupCorrectSide > 0.5) {\n    vec4 rupInk = texture2D(uRupPrintMap, vec2(rupUv.x, 1.0 - rupUv.y));\n    diffuseColor.rgb = mix(diffuseColor.rgb, rupInk.rgb, rupInk.a);\n  }\n}`
      );
  };

  material.needsUpdate = true;
  return material;
}

function getPrintUniforms(material: THREE.Material | THREE.Material[]) {
  const first = Array.isArray(material) ? material[0] : material;
  return first?.userData?.printUniforms as PrintUniforms | undefined;
}

function configureProjection(
  mesh: THREE.Mesh,
  config: GarmentModelConfig,
  printZoneId: PrintZoneId | undefined,
  side: "front" | "back"
) {
  mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox;
  const uniforms = getPrintUniforms(mesh.material);
  if (!box || !uniforms) return;

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const zone =
    config.printZones?.find((candidate) => candidate.id === printZoneId && candidate.side === side) ||
    config.printZones?.find((candidate) => candidate.side === side);

  const scale = zone?.projectionScale || config.printScale || [0.36, 0.42];
  const offset = zone?.projectionOffset || [0, -0.07];
  const width = Math.max(0.0001, size.x * scale[0]);
  const height = Math.max(0.0001, size.y * scale[1]);
  const zoneCenterX = center.x + size.x * offset[0];
  const zoneCenterY = center.y + size.y * offset[1];

  uniforms.min.value.set(zoneCenterX - width / 2, zoneCenterY - height / 2);
  uniforms.max.value.set(zoneCenterX + width / 2, zoneCenterY + height / 2);
  uniforms.depthCenter.value = center.z;
  uniforms.side.value = side === "front" ? 1 : -1;
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
  const printMeshRef = useRef<THREE.Mesh | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const floorRef = useRef<THREE.Mesh | null>(null);

  const [state, setState] = useState<"loading" | "ready" | "fallback">("loading");
  const [hasRendered, setHasRendered] = useState(false);
  const config = GARMENT_MODELS[productSlug];

  const capture = () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;

    renderer.render(scene, camera);
    try {
      onPreviewChange?.(renderer.domElement.toDataURL("image/png"));
    } catch {}
  };

  const fitCamera = () => {
    const container = mountRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const root = garmentRef.current;
    if (!container || !camera || !root) return;

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    camera.aspect = width / height;

    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
    const fitHeight = size.y / Math.max(0.01, 2 * Math.tan(verticalFov / 2));
    const fitWidth = size.x / Math.max(0.01, 2 * Math.tan(horizontalFov / 2));
    const distance = Math.max(fitHeight, fitWidth) * 1.18;

    camera.position.set(center.x, center.y + size.y * 0.02, center.z + Math.max(3.4, distance));
    camera.near = Math.max(0.01, distance / 100);
    camera.far = Math.max(100, distance * 20);
    camera.updateProjectionMatrix();

    controls?.target.copy(center);
    controls?.update();

    if (floorRef.current) {
      floorRef.current.position.y = box.min.y - 0.035;
      floorRef.current.position.x = center.x;
      floorRef.current.position.z = center.z;
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let disposed = false;
    let animationFrame = 0;
    let readyFrame = 0;

    container.innerHTML = "";
    setHasRendered(false);
    setState(config?.modelUrl ? "loading" : "fallback");
    if (!config?.modelUrl) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f4f4f2");
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
        alpha: false,
      });
    } catch {
      setState("fallback");
      return;
    }

    const mobile = window.innerWidth <= 760;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.35 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 2.6;
    controls.maxDistance = 8;
    controls.minPolarAngle = Math.PI * 0.24;
    controls.maxPolarAngle = Math.PI * 0.76;
    controls.enabled = interactive;
    controlsRef.current = controls;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xa9afb4, 2.4));

    const key = new THREE.DirectionalLight(0xffffff, 4.6);
    key.position.set(3.8, 5.8, 5.8);
    key.castShadow = true;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xfff8f6, 1.8);
    fill.position.set(-4.5, 2.8, 3.4);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 1.8);
    rim.position.set(0, 3.2, -5.5);
    scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2.8, 96),
      new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.13 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floorRef.current = floor;
    scene.add(floor);

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;

      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      fitCamera();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    void loadGarmentTemplate(config.modelUrl)
      .then((template) => {
        if (disposed) return;

        const root = cloneGarmentTemplate(template);
        root.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;
          obj.castShadow = true;
          obj.receiveShadow = true;
          obj.frustumCulled = false;
          obj.material = createBaseGarmentMaterial(colorName);
        });

        const printableMesh = largestMesh(root);
        if (printableMesh) {
          const oldMaterial = printableMesh.material;
          printableMesh.material = createProjectedPrintMaterial(colorName);
          const oldMaterials = Array.isArray(oldMaterial) ? oldMaterial : [oldMaterial];
          oldMaterials.forEach((material) => material.dispose());
          printMeshRef.current = printableMesh;
          configureProjection(printableMesh, config, printZoneId, side);
        }

        const initialBox = new THREE.Box3().setFromObject(root);
        const initialSize = initialBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(initialSize.x, initialSize.y, initialSize.z) || 1;
        root.scale.setScalar(3.15 / maxDim);

        const scaledBox = new THREE.Box3().setFromObject(root);
        const center = scaledBox.getCenter(new THREE.Vector3());
        root.position.sub(center);
        root.rotation.y = side === "back" ? Math.PI : 0;
        root.updateMatrixWorld(true);

        scene.add(root);
        garmentRef.current = root;

        resize();
        fitCamera();
        setState("ready");

        readyFrame = requestAnimationFrame(() => {
          if (disposed) return;
          renderer.render(scene, camera);
          requestAnimationFrame(() => {
            if (disposed) return;
            renderer.render(scene, camera);
            setHasRendered(true);
            capture();
          });
        });
      })
      .catch(() => {
        if (!disposed) setState("fallback");
      });

    const animate = () => {
      animationFrame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(readyFrame);
      observer.disconnect();
      controls.dispose();
      textureRef.current?.dispose();
      rootDispose(garmentRef.current);
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      renderer.dispose();
      container.innerHTML = "";

      sceneRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      garmentRef.current = null;
      printMeshRef.current = null;
      textureRef.current = null;
      floorRef.current = null;
    };
  }, [config?.modelUrl, productSlug]);

  useEffect(() => {
    const root = garmentRef.current;
    if (!root) return;

    const next = new THREE.Color(getHex(colorName));
    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach((material) => {
        if ("color" in material && (material as THREE.MeshStandardMaterial).color) {
          (material as THREE.MeshStandardMaterial).color.copy(next);
          material.needsUpdate = true;
        }
      });
    });

    requestAnimationFrame(capture);
  }, [colorName]);

  useEffect(() => {
    const root = garmentRef.current;
    const printableMesh = printMeshRef.current;
    if (!root) return;

    root.rotation.y = side === "back" ? Math.PI : 0;
    root.updateMatrixWorld(true);
    if (printableMesh && config) {
      configureProjection(printableMesh, config, printZoneId, side);
    }
    fitCamera();
    requestAnimationFrame(capture);
  }, [side, printZoneId, config]);

  useEffect(() => {
    if (controlsRef.current) controlsRef.current.enabled = interactive;
  }, [interactive]);

  useEffect(() => {
    const printableMesh = printMeshRef.current;
    if (!printableMesh || state !== "ready") return;

    const uniforms = getPrintUniforms(printableMesh.material);
    if (!uniforms) return;

    let cancelled = false;
    const frame = requestAnimationFrame(async () => {
      const layers = design[side];

      if (!layers.length) {
        textureRef.current?.dispose();
        textureRef.current = null;
        uniforms.map.value = EMPTY_TEXTURE;
        uniforms.enabled.value = 0;
        capture();
        return;
      }

      const canvas = await renderDesignTexture(layers);
      if (cancelled) return;

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = rendererRef.current?.capabilities.getMaxAnisotropy() || 1;
      texture.needsUpdate = true;

      const previous = textureRef.current;
      textureRef.current = texture;
      uniforms.map.value = texture;
      uniforms.enabled.value = 1;
      previous?.dispose();
      capture();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [design, side, state]);

  const fallbackImage = config?.fallbackImage || "/mockups/plain-white-shirt.webp";

  return (
    <div className={className || "premium-garment-viewer"}>
      <div ref={mountRef} className="premium-garment-stage" />

      {(state === "loading" || (state === "ready" && !hasRendered)) && (
        <div className="viewer-loading-preview">
          <img src={fallbackImage} alt="" />
          <span>Preparing 3D preview…</span>
        </div>
      )}

      {state === "fallback" && (
        <div className="viewer-fallback">
          <img src={fallbackImage} alt="" />
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
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    materials.forEach((material) => material?.dispose?.());
  });
}
