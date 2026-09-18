"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { DesignSides } from "@/lib/designer-types";
import { renderLayersToCanvas } from "@/lib/design-export";
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

type SurfacePrintUniforms = {
  map: THREE.IUniform<THREE.Texture>;
  enabled: THREE.IUniform<number>;
  zoneMin: THREE.IUniform<THREE.Vector2>;
  zoneMax: THREE.IUniform<THREE.Vector2>;
  sideSign: THREE.IUniform<number>;
  normalThreshold: THREE.IUniform<number>;
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
  if (!url) return Promise.resolve(null);
  return loadGarmentTemplate(url).then(() => null).catch(() => null);
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

function createTransparentTexture() {
  const texture = new THREE.DataTexture(
    new Uint8Array([0, 0, 0, 0]),
    1,
    1,
    THREE.RGBAFormat
  );
  texture.needsUpdate = true;
  return texture;
}

/**
 * The print is blended directly into the garment material.
 *
 * This intentionally removes the old secondary/decal mesh. A separate mesh can
 * intersect the shirt, float off the cloth, or fragment around folds. Here the
 * same shirt triangles are shaded once and the design texture is projected in
 * garment-local coordinates, so the print always follows the garment surface.
 *
 * The model can later provide authored UV regions without changing the design
 * state or compositor contract.
 */
function createPrintableGarmentMaterial(colorName: string) {
  const material = createGarmentMaterial(colorName);
  const transparentTexture = createTransparentTexture();

  const uniforms: SurfacePrintUniforms = {
    map: { value: transparentTexture },
    enabled: { value: 0 },
    zoneMin: { value: new THREE.Vector2(-0.5, -0.5) },
    zoneMax: { value: new THREE.Vector2(0.5, 0.5) },
    sideSign: { value: 1 },
    normalThreshold: { value: 0.14 },
  };

  material.userData.rupPrintUniforms = uniforms;
  material.userData.rupTransparentTexture = transparentTexture;

  material.onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.rupPrintMap = uniforms.map;
    shader.uniforms.rupPrintEnabled = uniforms.enabled;
    shader.uniforms.rupZoneMin = uniforms.zoneMin;
    shader.uniforms.rupZoneMax = uniforms.zoneMax;
    shader.uniforms.rupSideSign = uniforms.sideSign;
    shader.uniforms.rupNormalThreshold = uniforms.normalThreshold;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vRupObjectPosition;
varying vec3 vRupObjectNormal;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vRupObjectPosition = position;
vRupObjectNormal = normal;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform sampler2D rupPrintMap;
uniform float rupPrintEnabled;
uniform vec2 rupZoneMin;
uniform vec2 rupZoneMax;
uniform float rupSideSign;
uniform float rupNormalThreshold;
varying vec3 vRupObjectPosition;
varying vec3 vRupObjectNormal;`
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>

if (rupPrintEnabled > 0.5) {
  vec2 rupZoneSize = max(rupZoneMax - rupZoneMin, vec2(0.0001));
  vec2 rupUv = vec2(
    (vRupObjectPosition.x - rupZoneMin.x) / rupZoneSize.x,
    1.0 - ((vRupObjectPosition.y - rupZoneMin.y) / rupZoneSize.y)
  );

  float rupInside =
    step(0.0, rupUv.x) *
    step(rupUv.x, 1.0) *
    step(0.0, rupUv.y) *
    step(rupUv.y, 1.0);

  float rupFacing = step(
    rupNormalThreshold,
    normalize(vRupObjectNormal).z * rupSideSign
  );

  if (rupInside * rupFacing > 0.5) {
    vec4 rupPrint = texture2D(rupPrintMap, rupUv);
    diffuseColor.rgb = mix(diffuseColor.rgb, rupPrint.rgb, rupPrint.a);
  }
}`
      );
  };

  material.customProgramCacheKey = () => "red-umbrella-surface-print-v2";
  return material;
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

function getPrintUniforms(material: THREE.Material | null) {
  if (!material) return null;
  return (material.userData.rupPrintUniforms || null) as SurfacePrintUniforms | null;
}

function configureSurfaceMapping({
  target,
  material,
  config,
  printZoneId,
  side,
}: {
  target: THREE.Mesh;
  material: THREE.Material;
  config: GarmentModelConfig;
  printZoneId?: PrintZoneId;
  side: "front" | "back";
}) {
  target.geometry.computeBoundingBox();
  const box = target.geometry.boundingBox;
  const uniforms = getPrintUniforms(material);
  if (!box || !uniforms) return;

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const zone =
    config.printZones?.find((candidate) => candidate.id === printZoneId && candidate.side === side) ||
    config.printZones?.find((candidate) => candidate.side === side);

  const zoneScale = zone?.projectionScale || config.printScale || [0.36, 0.42];
  const zoneOffset = zone?.projectionOffset || [0, -0.07];

  const zoneWidth = size.x * zoneScale[0];
  const zoneHeight = size.y * zoneScale[1];
  const zoneCenterX = center.x + size.x * zoneOffset[0];
  const zoneCenterY = center.y + size.y * zoneOffset[1];

  uniforms.zoneMin.value.set(
    zoneCenterX - zoneWidth / 2,
    zoneCenterY - zoneHeight / 2
  );
  uniforms.zoneMax.value.set(
    zoneCenterX + zoneWidth / 2,
    zoneCenterY + zoneHeight / 2
  );
  uniforms.sideSign.value = side === "front" ? 1 : -1;
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
  const printMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
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

    camera.position.set(
      center.x,
      center.y + size.y * 0.02,
      center.z + Math.max(3.4, distance)
    );
    camera.near = Math.max(0.01, distance / 100);
    camera.far = Math.max(100, distance * 20);
    camera.updateProjectionMatrix();

    controls?.target.copy(center);
    controls?.update();

    if (floorRef.current) {
      floorRef.current.position.set(center.x, box.min.y - 0.035, center.z);
    }
  };

  const updateSurfaceMapping = () => {
    const root = garmentRef.current;
    const target = garmentMeshRef.current;
    const material = printMaterialRef.current;
    if (!root || !target || !material || !config) return;

    configureSurfaceMapping({
      target,
      material,
      config,
      printZoneId,
      side,
    });

    root.rotation.y = side === "back" ? Math.PI : 0;
    root.updateMatrixWorld(true);
    fitCamera();
    requestAnimationFrame(capture);
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

    void loadGarmentTemplate(config.modelUrl)
      .then((template) => {
        if (disposed) return;

        const root = cloneGarmentTemplate(template);

        root.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.castShadow = true;
          object.receiveShadow = true;
          object.frustumCulled = false;

          const oldMaterials = Array.isArray(object.material)
            ? object.material
            : [object.material];

          object.material = createGarmentMaterial(colorName);
          oldMaterials.forEach((material) => material.dispose());
        });

        const initialBox = new THREE.Box3().setFromObject(root);
        const initialSize = initialBox.getSize(new THREE.Vector3());
        const maxDimension = Math.max(
          initialSize.x,
          initialSize.y,
          initialSize.z
        ) || 1;
        root.scale.setScalar(3.15 / maxDimension);

        const scaledBox = new THREE.Box3().setFromObject(root);
        const center = scaledBox.getCenter(new THREE.Vector3());
        root.position.sub(center);
        root.rotation.y = 0;
        root.updateMatrixWorld(true);

        const printableMesh = largestMesh(root);
        garmentMeshRef.current = printableMesh;

        if (printableMesh) {
          const materials = Array.isArray(printableMesh.material)
            ? printableMesh.material
            : [printableMesh.material];
          materials.forEach((material) => material.dispose());

          const printMaterial = createPrintableGarmentMaterial(colorName);
          printableMesh.material = printMaterial;
          printMaterialRef.current = printMaterial;
        }

        scene.add(root);
        garmentRef.current = root;
        updateSurfaceMapping();

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
      garmentMeshRef.current = null;
      printMaterialRef.current = null;
      textureRef.current = null;
      floorRef.current = null;
    };
    // The GLB scene is created only when the product model changes.
    // Artwork, colour and placement update against the live material.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.modelUrl, productSlug]);

  useEffect(() => {
    const root = garmentRef.current;
    if (!root) return;

    const next = new THREE.Color(getHex(colorName));
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];

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
    updateSurfaceMapping();
    // Surface changes remap uniforms only. The garment model is never rebuilt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side, printZoneId, state]);

  useEffect(() => {
    if (controlsRef.current) controlsRef.current.enabled = interactive;
  }, [interactive]);

  useEffect(() => {
    const material = printMaterialRef.current;
    const uniforms = material ? getPrintUniforms(material) : null;
    if (!uniforms || state !== "ready") return;

    let cancelled = false;
    const frame = requestAnimationFrame(async () => {
      const layers = design[side];

      if (!layers.length) {
        uniforms.enabled.value = 0;
        const previous = textureRef.current;
        textureRef.current = null;
        uniforms.map.value = material.userData.rupTransparentTexture;
        previous?.dispose();
        capture();
        return;
      }

      const mobile = typeof window !== "undefined" && window.innerWidth <= 760;
      const canvas = await renderLayersToCanvas(layers, {
        width: mobile ? 900 : 1400,
        height: mobile ? 1080 : 1680,
      });
      if (cancelled) return;

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy =
        rendererRef.current?.capabilities.getMaxAnisotropy() || 1;
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
  }, [design, side, state, printZoneId]);

  const fallbackImage =
    config?.fallbackImage || "/mockups/plain-white-shirt.webp";

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
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    materials.forEach((material) => {
      (material.userData.rupTransparentTexture as THREE.Texture | undefined)
        ?.dispose?.();
      material?.dispose?.();
    });
  });
}
