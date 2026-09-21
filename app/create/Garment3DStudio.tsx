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

type PrintSurface = {
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  material: THREE.MeshBasicMaterial;
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

const MODEL_CACHE = new Map<string, Promise<THREE.Object3D>>();
const IMAGE_CACHE = new Map<string, Promise<HTMLImageElement | null>>();

function canUseHeavyGarmentPreview() {
  if (typeof window === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (connection?.saveData) return false;
  const effectiveType = connection?.effectiveType;
  if (effectiveType && ["slow-2g", "2g", "3g"].includes(effectiveType)) return false;
  return true;
}

function getHex(name: string) {
  return name.startsWith("#") ? name : (COLOR_MAP[name] || "#d8d8d4");
}

function loadGarmentTemplate(url: string) {
  const existing = MODEL_CACHE.get(url);
  if (existing) return existing;

  const pending = new GLTFLoader().loadAsync(url).then((gltf) => gltf.scene);
  MODEL_CACHE.set(url, pending);
  pending.catch(() => MODEL_CACHE.delete(url));
  return pending;
}

function cloneGarmentTemplate(template: THREE.Object3D) {
  const root = template.clone(true);
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry = object.geometry.clone();
  });
  return root;
}

export function preloadGarmentModel(productSlug: string) {
  const url = GARMENT_MODELS[productSlug]?.modelUrl;
  if (!url || !canUseHeavyGarmentPreview()) return Promise.resolve(null);

  const run = () => loadGarmentTemplate(url).then(() => null).catch(() => null);
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    return new Promise((resolve) => {
      const idle = window.requestIdleCallback(() => resolve(run()));
      return idle;
    });
  }

  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve(run());
    }, 250);
  });
}

function loadImage(src: string) {
  const existing = IMAGE_CACHE.get(src);
  if (existing) return existing;

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
  canvas.height = mobile ? 1080 : 1680;

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return canvas;

  context.clearRect(0, 0, canvas.width, canvas.height);

  for (const layer of layers) {
    context.save();
    context.translate((layer.x / 100) * canvas.width, (layer.y / 100) * canvas.height);
    context.rotate((layer.rotation * Math.PI) / 180);

    if (layer.type === "text") {
      const weight = layer.bold ? 800 : 500;
      try {
        await document.fonts.load(`${weight} ${layer.fontSize}px "${layer.fontFamily}"`);
      } catch {}

      const fontPx = Math.max(24, layer.fontSize * (mobile ? 2.35 : 3.1));
      context.font = `${layer.italic ? "italic " : ""}${weight} ${fontPx}px "${layer.fontFamily}", sans-serif`;
      context.fillStyle = layer.color;
      context.textAlign = layer.align;
      context.textBaseline = "middle";

      const maxWidth = ((layer.widthPct ?? 42) / 100) * canvas.width;
      const lines: string[] = [];

      for (const paragraph of layer.content.split(/\n/)) {
        const words = paragraph.split(/\s+/).filter(Boolean);
        let line = "";

        for (const word of words) {
          const chunks: string[] = [];
          if (context.measureText(word).width > maxWidth) {
            let chunk = "";
            for (const character of word) {
              const next = chunk + character;
              if (context.measureText(next).width > maxWidth && chunk) {
                chunks.push(chunk);
                chunk = character;
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
            if (context.measureText(next).width > maxWidth && line) {
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

      const lineHeight = fontPx * 1.08;
      const startY = -((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, index) => {
        context.fillText(line, 0, startY + index * lineHeight, maxWidth);
      });
    } else {
      const image = await loadImage(layer.src);
      if (image) {
        const width = (layer.widthPct / 100) * canvas.width;
        const ratio = image.naturalHeight / Math.max(1, image.naturalWidth);
        const height = width * ratio;
        context.drawImage(image, -width / 2, -height / 2, width, height);
      }
    }

    context.restore();
  }

  return canvas;
}

function createGarmentMaterial(colorName: string) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(getHex(colorName)),
    roughness: 0.86,
    metalness: 0,
    sheen: 0.26,
    sheenColor: new THREE.Color("#ffffff"),
    sheenRoughness: 0.78,
  });
}

function largestMesh(root: THREE.Object3D) {
  let selected: THREE.Mesh | null = null;
  let selectedVolume = 0;

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.computeBoundingBox();
    const box = object.geometry.boundingBox;
    if (!box) return;

    const size = box.getSize(new THREE.Vector3());
    const volume = Math.max(0.000001, size.x * size.y * size.z);
    if (volume > selectedVolume) {
      selectedVolume = volume;
      selected = object;
    }
  });

  return selected;
}

function worldFaceNormal(hit: THREE.Intersection<THREE.Object3D>) {
  const face = hit.face;
  if (!face) return null;
  const mesh = hit.object as THREE.Mesh;
  return face.normal.clone().transformDirection(mesh.matrixWorld).normalize();
}

function chooseSurfaceHit(
  hits: THREE.Intersection<THREE.Object3D>[],
  side: "front" | "back"
) {
  const wantedSign = side === "front" ? 1 : -1;
  return hits.find((hit) => {
    const normal = worldFaceNormal(hit);
    if (!normal) return false;
    return normal.z * wantedSign > 0.16;
  }) || null;
}

/**
 * Build a dedicated UV grid that is ray-cast onto the actual garment surface.
 *
 * The artwork never shares garment triangles and is never projected by screen
 * coordinates in the shader. Each grid vertex is physically snapped to the
 * visible cloth surface, so the print follows folds and rotates with the shirt
 * without leaking onto the collar, back face, or unrelated mesh regions.
 */
function createConformalPrintSurface({
  root,
  target,
  config,
  printZoneId,
  side,
  mobile,
}: {
  root: THREE.Object3D;
  target: THREE.Mesh;
  config: GarmentModelConfig;
  printZoneId?: PrintZoneId;
  side: "front" | "back";
  mobile: boolean;
}): PrintSurface | null {
  const originalRotationY = root.rotation.y;
  root.rotation.y = 0;
  root.updateMatrixWorld(true);
  target.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(target);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  if (size.x <= 0 || size.y <= 0 || size.z <= 0) {
    root.rotation.y = originalRotationY;
    root.updateMatrixWorld(true);
    return null;
  }

  const zone =
    config.printZones?.find((candidate) => candidate.id === printZoneId && candidate.side === side) ||
    config.printZones?.find((candidate) => candidate.side === side);

  const zoneScale = zone?.projectionScale || config.printScale || [0.36, 0.42];
  const zoneOffset = zone?.projectionOffset || [0, -0.07];
  const zoneWidth = size.x * zoneScale[0];
  const zoneHeight = size.y * zoneScale[1];
  const zoneCenterX = center.x + size.x * zoneOffset[0];
  const zoneCenterY = center.y + size.y * zoneOffset[1];

  const columns = mobile ? 28 : 44;
  const rows = mobile ? 34 : 54;
  const vertexCount = (columns + 1) * (rows + 1);
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const valid = new Uint8Array(vertexCount);
  const raycaster = new THREE.Raycaster();
  const direction = new THREE.Vector3(0, 0, side === "front" ? -1 : 1);
  const castDistance = Math.max(0.5, size.z * 2.5);
  const originZ = side === "front" ? box.max.z + castDistance : box.min.z - castDistance;
  const epsilon = Math.max(0.0015, Math.min(size.x, size.y) * 0.0012);

  for (let row = 0; row <= rows; row += 1) {
    const v = row / rows;
    const worldY = zoneCenterY + zoneHeight * (0.5 - v);

    for (let column = 0; column <= columns; column += 1) {
      const u = column / columns;
      const worldX = zoneCenterX + zoneWidth * (u - 0.5);
      const index = row * (columns + 1) + column;

      raycaster.set(new THREE.Vector3(worldX, worldY, originZ), direction);
      raycaster.far = castDistance * 2.2;
      const hit = chooseSurfaceHit(raycaster.intersectObject(target, false), side);

      uvs[index * 2] = u;
      uvs[index * 2 + 1] = 1 - v;

      if (!hit) {
        const placeholder = root.worldToLocal(new THREE.Vector3(worldX, worldY, center.z));
        positions[index * 3] = placeholder.x;
        positions[index * 3 + 1] = placeholder.y;
        positions[index * 3 + 2] = placeholder.z;
        continue;
      }

      const normal = worldFaceNormal(hit);
      const point = hit.point.clone();
      if (normal) point.addScaledVector(normal, epsilon);
      const localPoint = root.worldToLocal(point);

      positions[index * 3] = localPoint.x;
      positions[index * 3 + 1] = localPoint.y;
      positions[index * 3 + 2] = localPoint.z;
      valid[index] = 1;
    }
  }

  const indices: number[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const a = row * (columns + 1) + column;
      const b = a + 1;
      const c = a + (columns + 1);
      const d = c + 1;

      if (valid[a] && valid[b] && valid[c]) indices.push(a, c, b);
      if (valid[b] && valid[c] && valid[d]) indices.push(b, c, d);
    }
  }

  root.rotation.y = originalRotationY;
  root.updateMatrixWorld(true);

  if (!indices.length) return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 1,
    alphaTest: 0.002,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "red-umbrella-conformal-print-surface";
  mesh.userData.redUmbrellaPrintSurface = true;
  mesh.frustumCulled = false;
  mesh.renderOrder = 20;

  return { mesh, material };
}

export function Garment3DStudio({
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
  const garmentMeshRef = useRef<THREE.Mesh | null>(null);
  const printSurfaceRef = useRef<PrintSurface | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const floorRef = useRef<THREE.Mesh | null>(null);
  const config = GARMENT_MODELS[productSlug];

  const [state, setState] = useState<"loading" | "ready" | "fallback">("loading");
  const [hasRendered, setHasRendered] = useState(false);

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
      floorRef.current.position.set(center.x, box.min.y - 0.035, center.z);
    }
  };

  const disposePrintSurface = () => {
    const surface = printSurfaceRef.current;
    if (!surface) return;
    garmentRef.current?.remove(surface.mesh);
    surface.mesh.geometry.dispose();
    surface.material.dispose();
    printSurfaceRef.current = null;
  };

  const rebuildPrintSurface = () => {
    const root = garmentRef.current;
    const target = garmentMeshRef.current;
    if (!root || !target || !config) return;

    disposePrintSurface();

    const mobile = typeof window !== "undefined" && window.innerWidth <= 760;
    const surface = createConformalPrintSurface({
      root,
      target,
      config,
      printZoneId,
      side,
      mobile,
    });

    if (surface) {
      root.add(surface.mesh);
      if (textureRef.current) {
        surface.material.map = textureRef.current;
        surface.material.needsUpdate = true;
      }
      printSurfaceRef.current = surface;
    }

    root.rotation.y = side === "back" ? Math.PI : 0;
    root.updateMatrixWorld(true);
    fitCamera();
    requestAnimationFrame(capture);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const modelUrl = config?.modelUrl;
    if (!modelUrl || !canUseHeavyGarmentPreview()) {
      setState("fallback");
      return;
    }

    let disposed = false;
    let animationFrame = 0;
    let readyFrame = 0;

    container.innerHTML = "";
    setHasRendered(false);
    setState("loading");

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 2));
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

    const scheduledLoad = window.setTimeout(() => {
      void loadGarmentTemplate(modelUrl)
      .then((template) => {
        if (disposed) return;

        const root = cloneGarmentTemplate(template);
        root.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.castShadow = true;
          object.receiveShadow = true;
          object.frustumCulled = false;
          const oldMaterials = Array.isArray(object.material) ? object.material : [object.material];
          object.material = createGarmentMaterial(colorName);
          oldMaterials.forEach((material) => material.dispose());
        });

        const initialBox = new THREE.Box3().setFromObject(root);
        const initialSize = initialBox.getSize(new THREE.Vector3());
        const maxDimension = Math.max(initialSize.x, initialSize.y, initialSize.z) || 1;
        root.scale.setScalar(3.15 / maxDimension);

        const scaledBox = new THREE.Box3().setFromObject(root);
        const center = scaledBox.getCenter(new THREE.Vector3());
        root.position.sub(center);
        root.rotation.y = 0;
        root.updateMatrixWorld(true);

        const printableMesh = largestMesh(root);
        garmentMeshRef.current = printableMesh;

        scene.add(root);
        garmentRef.current = root;
        rebuildPrintSurface();

        resize();
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
    }, 180);

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
      clearTimeout(scheduledLoad);
      observer.disconnect();
      controls.dispose();
      textureRef.current?.dispose();
      disposePrintSurface();
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
      garmentMeshRef.current = null;
      textureRef.current = null;
      floorRef.current = null;
    };
  // The model scene is intentionally created only when the product model changes.
  // Artwork, colour and placement update against the existing scene.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.modelUrl, productSlug]);

  useEffect(() => {
    const root = garmentRef.current;
    if (!root) return;

    const next = new THREE.Color(getHex(colorName));
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      if (object.userData.redUmbrellaPrintSurface) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
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
    if (state !== "ready") return;
    rebuildPrintSurface();
  // Rebuild only the conformal print grid, never the garment GLB.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side, printZoneId, state]);

  useEffect(() => {
    if (controlsRef.current) controlsRef.current.enabled = interactive;
  }, [interactive]);

  useEffect(() => {
    const surface = printSurfaceRef.current;
    if (!surface || state !== "ready") return;

    let cancelled = false;
    const frame = requestAnimationFrame(async () => {
      const layers = design[side];

      if (!layers.length) {
        const previous = textureRef.current;
        textureRef.current = null;
        surface.material.map = null;
        surface.material.needsUpdate = true;
        previous?.dispose();
        capture();
        return;
      }

      const canvas = await renderDesignTexture(layers);
      if (cancelled) return;

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = rendererRef.current?.capabilities.getMaxAnisotropy() || 1;
      texture.needsUpdate = true;

      const previous = textureRef.current;
      textureRef.current = texture;
      surface.material.map = texture;
      surface.material.needsUpdate = true;
      previous?.dispose();
      capture();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [design, side, state, printZoneId]);

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
  root?.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry?.dispose?.();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => material?.dispose?.());
  });
}
