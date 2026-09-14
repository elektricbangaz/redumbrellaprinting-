"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { DesignSides, DesignLayer } from "@/lib/designer-types";

type Props = {
  productSlug: string;
  colorName: string;
  side: "front" | "back";
  design: DesignSides;
  className?: string;
};

const COLOR_MAP: Record<string, string> = {
  White: "#f7f7f4",
  Black: "#111214",
  Grey: "#9b9b98",
  Navy: "#17233f",
  Red: "#b31318",
  Sand: "#d7ccb7",
  Gold: "#a8792f",
};

function getHex(name: string) {
  return COLOR_MAP[name] || "#d9d9d6";
}

function apparelShape(slug: string) {
  const shape = new THREE.Shape();
  if (slug === "pullover-hoodie") {
    shape.moveTo(-1.0, -1.45);
    shape.lineTo(-1.04, 0.72);
    shape.lineTo(-1.48, 0.35);
    shape.lineTo(-1.82, 0.94);
    shape.lineTo(-1.18, 1.35);
    shape.lineTo(-0.48, 1.18);
    shape.quadraticCurveTo(0, 0.92, 0.48, 1.18);
    shape.lineTo(1.18, 1.35);
    shape.lineTo(1.82, 0.94);
    shape.lineTo(1.48, 0.35);
    shape.lineTo(1.04, 0.72);
    shape.lineTo(1.0, -1.45);
    shape.closePath();
  } else {
    shape.moveTo(-0.98, -1.42);
    shape.lineTo(-1.0, 0.75);
    shape.lineTo(-1.58, 0.38);
    shape.lineTo(-1.86, 0.95);
    shape.lineTo(-1.18, 1.34);
    shape.lineTo(-0.52, 1.18);
    shape.quadraticCurveTo(0, 0.86, 0.52, 1.18);
    shape.lineTo(1.18, 1.34);
    shape.lineTo(1.86, 0.95);
    shape.lineTo(1.58, 0.38);
    shape.lineTo(1.0, 0.75);
    shape.lineTo(0.98, -1.42);
    shape.closePath();
  }

  const neck = new THREE.Path();
  neck.absellipse(0, 1.13, slug === "polo-shirt" ? 0.34 : 0.42, slug === "polo-shirt" ? 0.20 : 0.24, 0, Math.PI * 2, false, 0);
  shape.holes.push(neck);
  return shape;
}

function makeDesignCanvas(layers: DesignLayer[]) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 1024, 1024);

  for (const layer of layers) {
    ctx.save();
    ctx.translate((layer.x / 100) * 1024, (layer.y / 100) * 1024);
    ctx.rotate((layer.rotation * Math.PI) / 180);

    if (layer.type === "text") {
      const weight = layer.bold ? 800 : 500;
      const italic = layer.italic ? "italic " : "";
      ctx.font = `${italic}${weight} ${Math.max(28, layer.fontSize * 2.4)}px ${layer.fontFamily}`;
      ctx.fillStyle = layer.color;
      ctx.textAlign = layer.align;
      ctx.textBaseline = "middle";
      ctx.fillText(layer.content, 0, 0);
    } else {
      const img = new Image();
      img.src = layer.src;
      const width = (layer.widthPct / 100) * 1024;
      const height = width;
      if (img.complete) {
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
      } else {
        img.onload = () => {
          const live = canvas.getContext("2d")!;
          live.save();
          live.translate((layer.x / 100) * 1024, (layer.y / 100) * 1024);
          live.rotate((layer.rotation * Math.PI) / 180);
          live.drawImage(img, -width / 2, -height / 2, width, height);
          live.restore();
        };
      }
    }

    ctx.restore();
  }

  return canvas;
}

export function ThreeShirtViewer({ productSlug, colorName, side, design, className }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const layers = useMemo(() => design[side], [design, side]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.05, 6.3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const geometry = new THREE.ExtrudeGeometry(apparelShape(productSlug), {
      depth: productSlug === "pullover-hoodie" ? 0.28 : 0.20,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.06,
      bevelSegments: 5,
      curveSegments: 32,
    });
    geometry.center();

    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(getHex(colorName)),
      roughness: 0.92,
      metalness: 0.02,
      clearcoat: 0.03,
      clearcoatRoughness: 0.9,
      sheen: 0.22,
      sheenRoughness: 0.8,
      sheenColor: new THREE.Color("#ffffff"),
    });

    const shirt = new THREE.Mesh(geometry, material);
    shirt.castShadow = true;
    shirt.receiveShadow = true;
    group.add(shirt);

    if (productSlug === "polo-shirt") {
      const collarMat = material.clone();
      collarMat.color.offsetHSL(0, 0, -0.04);
      const collarGeo = new THREE.BoxGeometry(0.62, 0.16, 0.16);
      const left = new THREE.Mesh(collarGeo, collarMat);
      const right = new THREE.Mesh(collarGeo, collarMat);
      left.position.set(-0.24, 1.03, 0.16);
      right.position.set(0.24, 1.03, 0.16);
      left.rotation.z = -0.26;
      right.rotation.z = 0.26;
      group.add(left, right);
    }

    if (productSlug === "pullover-hoodie") {
      const hoodMat = material.clone();
      const hood = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.18, 20, 64, Math.PI * 1.45), hoodMat);
      hood.position.set(0, 1.12, -0.05);
      hood.rotation.z = Math.PI * 0.77;
      group.add(hood);
    }

    const texCanvas = makeDesignCanvas(layers);
    const texture = new THREE.CanvasTexture(texCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    const printMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
      blending: THREE.MultiplyBlending,
    });

    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.34, 1.55), printMat);
    plane.position.set(0, -0.05, side === "front" ? 0.19 : -0.19);
    if (side === "back") plane.rotation.y = Math.PI;
    group.add(plane);

    group.rotation.x = -0.02;
    if (side === "back") group.rotation.y = Math.PI;

    const ambient = new THREE.HemisphereLight(0xffffff, 0x2a2a2a, 1.7);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 4.5);
    key.position.set(4, 5, 5);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xffe6e6, 2.0);
    rim.position.set(-4, 2, -3);
    scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2.8, 64),
      new THREE.MeshBasicMaterial({ color: 0x0d0d0e, transparent: true, opacity: 0.14 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.85;
    scene.add(floor);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 4.2;
    controls.maxDistance = 8.5;
    controls.minPolarAngle = Math.PI * 0.25;
    controls.maxPolarAngle = Math.PI * 0.75;
    controls.target.set(0, 0, 0);

    function resize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    let frame = 0;
    let idle = 0;
    const onStart = () => { idle = 0; };
    controls.addEventListener("start", onStart);

    const animate = () => {
      frame = requestAnimationFrame(animate);
      controls.update();
      idle += 1;
      if (idle > 360) group.rotation.y += 0.0014;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      controls.removeEventListener("start", onStart);
      observer.disconnect();
      controls.dispose();
      texture.dispose();
      printMat.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      mount.removeChild(renderer.domElement);
    };
  }, [productSlug, colorName, side, layers]);

  return <div ref={mountRef} className={className || "three-shirt-viewer"} aria-label="Interactive 3D apparel viewer" />;
}
