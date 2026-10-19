import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EnergyTile, ZoneId } from '../types/simulation';

interface City3DCanvasProps {
  tiles: EnergyTile[];
  pedestrianCount: number;
  timeOfDay: number; // 0 - 24
  energyFlowMode: boolean;
  selectedTileId: string | null;
  onTileClick: (tile: EnergyTile) => void;
  onTileStep: (tileId: string) => void;
  activeScenarioName: string;
  cameraPreset: 'overview' | 'metro' | 'plaza' | 'battery' | 'top' | 'street';
}

interface SimulatedPedestrian {
  id: string;
  mesh: THREE.Group;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  speed: number;
  stepPhase: number;
  pathIndex: number;
  path: [number, number][];
  currentTileId: string | null;
}

interface EnergyPacket {
  progress: number; // 0 to 1
  startX: number;
  startZ: number;
  midX: number;
  midZ: number;
  endX: number;
  endZ: number;
  color: THREE.Color;
  mesh: THREE.Mesh;
}

export const City3DCanvas: React.FC<City3DCanvasProps> = ({
  tiles,
  pedestrianCount,
  timeOfDay,
  energyFlowMode,
  selectedTileId,
  onTileClick,
  onTileStep,
  cameraPreset,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const tilesMapRef = useRef<Map<string, { mesh: THREE.Mesh; borderMesh: THREE.LineSegments; tileData: EnergyTile }>>(new Map());
  const pedestriansRef = useRef<SimulatedPedestrian[]>([]);
  const energyPacketsRef = useRef<EnergyPacket[]>([]);
  const conduitLinesRef = useRef<THREE.Line[]>([]);
  const streetLightMeshesRef = useRef<THREE.PointLight[]>([]);

  // Lighting refs
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const batteryCoreRef = useRef<THREE.Mesh | null>(null);

  // Interaction controls
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const cameraPosTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(38, 32, 42));

  // Raycaster for tile clicking
  const raycasterRef = useRef(new THREE.Raycaster());
  const mousePosRef = useRef(new THREE.Vector2());

  // Battery hub location in world space
  const BATTERY_HUB_POS = new THREE.Vector3(8, 0, -6);

  // Define realistic walking paths in the district
  const WAYPOINT_PATHS: [number, number][][] = [
    // Path 1: Metro to Plaza to Shopping
    [
      [-24, 18], [-18, 16], [-10, 8], [0, 0], [12, -4], [22, -12], [28, -20]
    ],
    // Path 2: Shopping to Plaza to Park
    [
      [28, -20], [20, -10], [4, 0], [-4, -8], [-12, -18], [-22, -22]
    ],
    // Path 3: Park promenade to Metro
    [
      [-22, -22], [-14, -14], [-4, -4], [-12, 6], [-20, 14], [-24, 18]
    ],
    // Path 4: Across Plaza North-South
    [
      [0, 26], [0, 14], [0, 0], [0, -16], [0, -28]
    ],
    // Path 5: Across Plaza East-West
    [
      [-28, 0], [-14, 0], [0, 0], [16, 0], [28, 0]
    ],
    // Path 6: Metro concourse circulation
    [
      [-22, 22], [-20, 12], [-14, 12], [-14, 20], [-22, 22]
    ],
  ];

  // Set camera positions based on cameraPreset
  useEffect(() => {
    switch (cameraPreset) {
      case 'metro':
        cameraPosTargetRef.current.set(-28, 14, 28);
        cameraTargetRef.current.set(-18, 1, 16);
        break;
      case 'plaza':
        cameraPosTargetRef.current.set(4, 18, 22);
        cameraTargetRef.current.set(0, 1, 0);
        break;
      case 'battery':
        cameraPosTargetRef.current.set(16, 12, 4);
        cameraTargetRef.current.set(8, 2, -6);
        break;
      case 'top':
        cameraPosTargetRef.current.set(0, 56, 0.1);
        cameraTargetRef.current.set(0, 0, 0);
        break;
      case 'street':
        cameraPosTargetRef.current.set(-12, 2.5, 12);
        cameraTargetRef.current.set(4, 3, -2);
        break;
      case 'overview':
      default:
        cameraPosTargetRef.current.set(38, 32, 42);
        cameraTargetRef.current.set(0, 0, 0);
        break;
    }
  }, [cameraPreset]);

  // Adjust daylight / night transitions
  useEffect(() => {
    if (!sunLightRef.current || !ambientLightRef.current || !sceneRef.current) return;

    // Time: 0 to 24 hours
    // Daylight is 6.5 to 18.5
    const isNight = timeOfDay < 6.5 || timeOfDay > 18.5;
    const noonFactor = Math.max(0, 1 - Math.abs(timeOfDay - 13) / 6.5);

    if (energyFlowMode) {
      // Dark city contrast for energy glow mode
      sunLightRef.current.intensity = 0.15;
      ambientLightRef.current.intensity = 0.2;
      ambientLightRef.current.color.setHex(0x061120);
      sceneRef.current.background = new THREE.Color(0x030712);
      sceneRef.current.fog = new THREE.FogExp2(0x030712, 0.015);
    } else if (isNight) {
      // Night mood
      sunLightRef.current.intensity = 0.25;
      sunLightRef.current.color.setHex(0x1e293b);
      ambientLightRef.current.intensity = 0.35;
      ambientLightRef.current.color.setHex(0x0f172a);
      sceneRef.current.background = new THREE.Color(0x050814);
      sceneRef.current.fog = new THREE.FogExp2(0x050814, 0.012);
    } else {
      // Daylight mood
      const sunIntensity = 1.0 + noonFactor * 0.8;
      sunLightRef.current.intensity = sunIntensity;
      sunLightRef.current.color.setHex(0xfff7ed);
      sunLightRef.current.position.set(
        Math.cos((timeOfDay / 24) * Math.PI * 2) * 40,
        Math.max(15, noonFactor * 45),
        Math.sin((timeOfDay / 24) * Math.PI * 2) * 30
      );

      ambientLightRef.current.intensity = 0.65;
      ambientLightRef.current.color.setHex(0x38bdf8);
      sceneRef.current.background = new THREE.Color(0x091424);
      sceneRef.current.fog = new THREE.FogExp2(0x091424, 0.01);
    }

    // Toggle streetlights
    streetLightMeshesRef.current.forEach((light) => {
      light.intensity = isNight || energyFlowMode ? 2.5 : 0.2;
    });
  }, [timeOfDay, energyFlowMode]);

  // Main Three.js Scene Setup
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x091424);
    scene.fog = new THREE.FogExp2(0x091424, 0.012);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 300);
    camera.position.set(38, 32, 42);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.65);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    sunLight.position.set(35, 45, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 120;
    sunLight.shadow.camera.left = -40;
    sunLight.shadow.camera.right = 40;
    sunLight.shadow.camera.top = 40;
    sunLight.shadow.camera.bottom = -40;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // ==========================================
    // 1. DISTRICT GROUND & INFRASTRUCTURE
    // ==========================================

    // District Base Ground
    const groundGeo = new THREE.PlaneGeometry(90, 90);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
      metalness: 0.15,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Sidewalks & Paver Plaza
    const plazaGeo = new THREE.PlaneGeometry(36, 36);
    const plazaMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.2,
    });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.02, 0);
    plaza.receiveShadow = true;
    scene.add(plaza);

    // Subtle paving grid pattern lines
    const gridHelper = new THREE.GridHelper(36, 24, 0x06b6d4, 0x334155);
    gridHelper.position.set(0, 0.03, 0);
    scene.add(gridHelper);

    // Park Promenade (Lawn & Green Corridors)
    const parkGeo = new THREE.PlaneGeometry(24, 28);
    const parkMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b, // deep emerald
      roughness: 0.9,
    });
    const park = new THREE.Mesh(parkGeo, parkMat);
    park.rotation.x = -Math.PI / 2;
    park.position.set(-20, 0.04, -20);
    park.receiveShadow = true;
    scene.add(park);

    // Metro Entrance Structure
    createMetroEntrance(scene);

    // Modern Buildings & Skyscrapers along the perimeter
    createCityArchitecture(scene);

    // Central Energy Storage Hub
    createEnergyStorageStation(scene, batteryCoreRef);

    // Smart Street Lights
    createStreetLights(scene, streetLightMeshesRef);

    // Smart City Sensors & Dynamic Displays
    createSensorsAndDisplays(scene);

    // ==========================================
    // 2. KINETIC ENERGY TILES (INTERACTIVE)
    // ==========================================
    const tileGroup = new THREE.Group();
    scene.add(tileGroup);

    tiles.forEach((tile) => {
      // Tile Base Box
      const tileGeo = new THREE.BoxGeometry(tile.width, 0.1, tile.depth);
      const zoneColor =
        tile.zone === 'metro'
          ? 0x06b6d4
          : tile.zone === 'plaza'
          ? 0x3b82f6
          : tile.zone === 'shopping'
          ? 0x10b981
          : 0x84cc16;

      const tileMat = new THREE.MeshStandardMaterial({
        color: 0x091e3a,
        emissive: zoneColor,
        emissiveIntensity: 0.25,
        roughness: 0.3,
        metalness: 0.8,
      });

      const tileMesh = new THREE.Mesh(tileGeo, tileMat);
      tileMesh.position.set(tile.x, 0.05, tile.z);
      tileMesh.receiveShadow = true;
      tileMesh.castShadow = true;
      tileMesh.userData = { tileId: tile.id, tileData: tile };
      tileGroup.add(tileMesh);

      // Glowing Perimeter Border Wireframe
      const edges = new THREE.EdgesGeometry(tileGeo);
      const lineMat = new THREE.LineBasicMaterial({
        color: zoneColor,
        linewidth: 2,
      });
      const borderMesh = new THREE.LineSegments(edges, lineMat);
      borderMesh.position.copy(tileMesh.position);
      tileGroup.add(borderMesh);

      tilesMapRef.current.set(tile.id, { mesh: tileMesh, borderMesh, tileData: tile });
    });

    // ==========================================
    // 3. UNDERGROUND CONDUIT ENERGY GRID
    // ==========================================
    createEnergyConduits(scene, conduitLinesRef, BATTERY_HUB_POS);

    // ==========================================
    // 4. ANIMATION LOOP & SIMULATION
    // ==========================================
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth camera interpolation towards cameraTarget
      if (!isDraggingRef.current) {
        camera.position.lerp(cameraPosTargetRef.current, 0.04);
        camera.lookAt(cameraTargetRef.current);
      }

      // Rotate Battery Core glowing energy rings
      if (batteryCoreRef.current) {
        batteryCoreRef.current.rotation.y += delta * 1.5;
      }

      // Pulse Energy Conduits in Energy Flow Mode
      conduitLinesRef.current.forEach((line, index) => {
        const mat = line.material as THREE.LineBasicMaterial;
        if (mat) {
          const pulse = (Math.sin(time * 4 + index) + 1) * 0.5;
          mat.opacity = energyFlowMode ? 0.9 : 0.3 + pulse * 0.3;
        }
      });

      // Update Pedestrians
      updatePedestrians(delta, onTileStep);

      // Update Energy Packets (cyan/emerald pulses flowing to the battery hub)
      updateEnergyPackets(scene, delta);

      // Spring-back compression animation for tiles
      tilesMapRef.current.forEach(({ mesh, tileData }) => {
        if (mesh.position.y < 0.05) {
          mesh.position.y += delta * 0.2; // smoothly bounce back up
          if (mesh.position.y > 0.05) mesh.position.y = 0.05;
        }

        // Highlight selected tile
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (selectedTileId && tileData.id === selectedTileId) {
          mat.emissiveIntensity = 0.8 + Math.sin(time * 6) * 0.4;
          mat.emissive.setHex(0x38bdf8);
        } else {
          // Normal glow with subtle idle breathing
          const idleIntensity = energyFlowMode ? 0.45 : 0.2;
          mat.emissiveIntensity = idleIntensity;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Mouse & Touch Controls
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDraggingRef.current = true;
        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      const cam = cameraRef.current;
      if (!cam) return;

      if (e.buttons === 1) {
        // Orbit rotate
        const radius = cam.position.distanceTo(cameraTargetRef.current);
        const theta = Math.atan2(cam.position.x - cameraTargetRef.current.x, cam.position.z - cameraTargetRef.current.z) - deltaX * 0.005;
        const phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, Math.acos((cam.position.y - cameraTargetRef.current.y) / radius) + deltaY * 0.005));

        cam.position.x = cameraTargetRef.current.x + radius * Math.sin(phi) * Math.sin(theta);
        cam.position.y = cameraTargetRef.current.y + radius * Math.cos(phi);
        cam.position.z = cameraTargetRef.current.z + radius * Math.sin(phi) * Math.cos(theta);
        cam.lookAt(cameraTargetRef.current);

        cameraPosTargetRef.current.copy(cam.position);
      } else if (e.buttons === 2) {
        // Pan
        const panSpeed = 0.04;
        cam.position.x -= deltaX * panSpeed;
        cam.position.z -= deltaY * panSpeed;
        cameraTargetRef.current.x -= deltaX * panSpeed;
        cameraTargetRef.current.z -= deltaY * panSpeed;
        cameraPosTargetRef.current.copy(cam.position);
      }

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cam = cameraRef.current;
      if (!cam) return;
      const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
      const offset = cam.position.clone().sub(cameraTargetRef.current);
      const newLen = THREE.MathUtils.clamp(offset.length() * zoomFactor, 8, 120);
      offset.setLength(newLen);
      cam.position.copy(cameraTargetRef.current).add(offset);
      cameraPosTargetRef.current.copy(cam.position);
    };

    const onClick = (e: MouseEvent) => {
      // Prevent click triggering when drag happened
      const dist = Math.hypot(e.clientX - previousMousePositionRef.current.x, e.clientY - previousMousePositionRef.current.y);
      if (dist > 5) return;

      const rect = container.getBoundingClientRect();
      mousePosRef.current.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mousePosRef.current.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

      if (!cameraRef.current) return;
      raycasterRef.current.setFromCamera(mousePosRef.current, cameraRef.current);
      const tileMeshes = Array.from(tilesMapRef.current.values()).map((v) => v.mesh);
      const intersects = raycasterRef.current.intersectObjects(tileMeshes);

      if (intersects.length > 0) {
        const hitTile = intersects[0].object.userData.tileData as EnergyTile;
        if (hitTile) {
          onTileClick(hitTile);
        }
      }
    };

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('click', onClick);
    container.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Update pedestrian instances when pedestrianCount changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Adjust pedestrian count smoothly
    const currentList = pedestriansRef.current;
    const targetCount = Math.min(pedestrianCount, 120); // Cap instanced 3D avatars for silky 60fps

    if (currentList.length < targetCount) {
      // Spawn new pedestrians
      const toAdd = targetCount - currentList.length;
      for (let i = 0; i < toAdd; i++) {
        const p = spawnPedestrian(scene, WAYPOINT_PATHS);
        currentList.push(p);
      }
    } else if (currentList.length > targetCount) {
      // Despawn excess
      const toRemove = currentList.splice(targetCount);
      toRemove.forEach((p) => {
        scene.remove(p.mesh);
      });
    }
  }, [pedestrianCount]);

  // Handle pedestrian steps and collision with tiles
  const updatePedestrians = (
    delta: number,
    onStepTrigger: (tileId: string) => void
  ) => {
    const pedestrians = pedestriansRef.current;
    const tilesMap = tilesMapRef.current;

    pedestrians.forEach((p) => {
      // Move along waypoints
      const dx = p.targetX - p.x;
      const dz = p.targetZ - p.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 0.8) {
        // Reach waypoint, advance to next
        p.pathIndex = (p.pathIndex + 1) % p.path.length;
        const [nextX, nextZ] = p.path[p.pathIndex];
        // Add subtle natural path jitter
        p.targetX = nextX + (Math.random() - 0.5) * 1.4;
        p.targetZ = nextZ + (Math.random() - 0.5) * 1.4;
      } else {
        const moveDist = p.speed * delta;
        p.x += (dx / dist) * moveDist;
        p.z += (dz / dist) * moveDist;

        p.mesh.position.set(p.x, 0, p.z);
        // Orient towards target direction
        p.mesh.rotation.y = Math.atan2(dx, dz);

        // Walking bob animation
        p.stepPhase += delta * p.speed * 4;
        const bob = Math.abs(Math.sin(p.stepPhase)) * 0.12;
        p.mesh.position.y = bob;

        // Animate legs
        const leftLeg = p.mesh.getObjectByName('leftLeg');
        const rightLeg = p.mesh.getObjectByName('rightLeg');
        if (leftLeg && rightLeg) {
          leftLeg.rotation.x = Math.sin(p.stepPhase) * 0.45;
          rightLeg.rotation.x = -Math.sin(p.stepPhase) * 0.45;
        }
      }

      // Check tile intersection
      let steppedTileId: string | null = null;
      tilesMap.forEach(({ mesh, tileData }, tileId) => {
        const tx = mesh.position.x;
        const tz = mesh.position.z;
        const halfW = tileData.width / 2;
        const halfD = tileData.depth / 2;

        if (
          p.x >= tx - halfW &&
          p.x <= tx + halfW &&
          p.z >= tz - halfD &&
          p.z <= tz + halfD
        ) {
          steppedTileId = tileId;
        }
      });

      // Stepped onto a tile (entry event)
      if (steppedTileId && steppedTileId !== p.currentTileId) {
        p.currentTileId = steppedTileId;
        const tileEntry = tilesMap.get(steppedTileId);
        if (tileEntry) {
          // Compress tile slightly
          tileEntry.mesh.position.y = -0.015;
          const mat = tileEntry.mesh.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 1.2;

          // Trigger energy pulse packet along conduit to battery hub
          spawnEnergyPacket(
            sceneRef.current!,
            tileEntry.mesh.position.x,
            tileEntry.mesh.position.z,
            BATTERY_HUB_POS.x,
            BATTERY_HUB_POS.z,
            tileEntry.tileData.zone
          );

          // Notify simulation state
          onStepTrigger(steppedTileId);
        }
      } else if (!steppedTileId) {
        p.currentTileId = null;
      }
    });
  };

  // Spawns a glowing particle traveling from tile to battery station
  const spawnEnergyPacket = (
    scene: THREE.Scene,
    sx: number,
    sz: number,
    ex: number,
    ez: number,
    zone: ZoneId
  ) => {
    // Keep packet list bounded for high performance
    if (energyPacketsRef.current.length > 40) return;

    const geo = new THREE.SphereGeometry(0.18, 8, 8);
    const colorHex =
      zone === 'metro'
        ? 0x06b6d4
        : zone === 'plaza'
        ? 0x38bdf8
        : zone === 'shopping'
        ? 0x10b981
        : 0xa3e635;

    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(sx, 0.15, sz);
    scene.add(mesh);

    // Intermediate conduit waypoint
    const midX = (sx + ex) * 0.5 + (Math.random() - 0.5) * 2;
    const midZ = (sz + ez) * 0.5 + (Math.random() - 0.5) * 2;

    energyPacketsRef.current.push({
      progress: 0,
      startX: sx,
      startZ: sz,
      midX,
      midZ,
      endX: ex,
      endZ: ez,
      color: new THREE.Color(colorHex),
      mesh,
    });
  };

  const updateEnergyPackets = (scene: THREE.Scene, delta: number) => {
    const packets = energyPacketsRef.current;
    for (let i = packets.length - 1; i >= 0; i--) {
      const packet = packets[i];
      packet.progress += delta * 1.8; // speed of particle transfer

      if (packet.progress >= 1.0) {
        // Arrived at battery station!
        scene.remove(packet.mesh);
        packets.splice(i, 1);
      } else {
        // Quadratic bezier interpolation
        const t = packet.progress;
        const omt = 1 - t;
        const x = omt * omt * packet.startX + 2 * omt * t * packet.midX + t * t * packet.endX;
        const z = omt * omt * packet.startZ + 2 * omt * t * packet.midZ + t * t * packet.endZ;
        const y = 0.15 + Math.sin(t * Math.PI) * 0.6; // subtle parabolic rise

        packet.mesh.position.set(x, y, z);
      }
    }
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Viewport Overlay Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="backdrop-blur-md bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h3 className="text-xs font-semibold tracking-wider uppercase text-cyan-400">
              Interactive 3D District
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            Click any floor tile to inspect telemetry · Drag to orbit · Scroll to zoom
          </p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SCENE BUILDER HELPERS
// ==========================================

function spawnPedestrian(scene: THREE.Scene, paths: [number, number][][]): SimulatedPedestrian {
  const group = new THREE.Group();

  // Avatar colors
  const avatarColors = [
    0x38bdf8, // light cyan
    0x0284c7, // blue
    0x10b981, // emerald
    0x94a3b8, // slate
    0xf59e0b, // amber
    0x8b5cf6, // violet
    0xe2e8f0, // white-ish
  ];
  const color = avatarColors[Math.floor(Math.random() * avatarColors.length)];

  // Torso
  const bodyGeo = new THREE.CapsuleGeometry(0.2, 0.45, 4, 8);
  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.9;
  body.castShadow = true;
  group.add(body);

  // Head
  const headGeo = new THREE.SphereGeometry(0.16, 8, 8);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.6,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.35;
  head.castShadow = true;
  group.add(head);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.5, 6);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });

  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.name = 'leftLeg';
  leftLeg.position.set(-0.1, 0.28, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, legMat);
  rightLeg.name = 'rightLeg';
  rightLeg.position.set(0.1, 0.28, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  // Pick random path
  const path = paths[Math.floor(Math.random() * paths.length)];
  const startIndex = Math.floor(Math.random() * path.length);
  const [startX, startZ] = path[startIndex];
  const nextIndex = (startIndex + 1) % path.length;
  const [targetX, targetZ] = path[nextIndex];

  group.position.set(startX, 0, startZ);
  scene.add(group);

  return {
    id: `ped-${Math.random().toString(36).substring(2, 9)}`,
    mesh: group,
    x: startX,
    z: startZ,
    targetX,
    targetZ,
    speed: 1.8 + Math.random() * 1.4, // realistic walking speed ~2-3 m/s
    stepPhase: Math.random() * Math.PI * 2,
    pathIndex: nextIndex,
    path,
    currentTileId: null,
  };
}

function createMetroEntrance(scene: THREE.Scene) {
  const metroGroup = new THREE.Group();
  metroGroup.position.set(-20, 0, 16);

  // Futuristic Glass Canopy
  const canopyGeo = new THREE.BoxGeometry(6, 0.2, 8);
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.45,
    roughness: 0.1,
    metalness: 0.9,
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 3.2, 0);
  canopy.rotation.z = -0.15;
  metroGroup.add(canopy);

  // Canopy Steel Pillars
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
  const pillarGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.2);

  const p1 = new THREE.Mesh(pillarGeo, pillarMat);
  p1.position.set(-2.6, 1.6, -3.6);
  metroGroup.add(p1);

  const p2 = new THREE.Mesh(pillarGeo, pillarMat);
  p2.position.set(2.6, 1.6, -3.6);
  metroGroup.add(p2);

  const p3 = new THREE.Mesh(pillarGeo, pillarMat);
  p3.position.set(-2.6, 1.6, 3.6);
  metroGroup.add(p3);

  const p4 = new THREE.Mesh(pillarGeo, pillarMat);
  p4.position.set(2.6, 1.6, 3.6);
  metroGroup.add(p4);

  // Metro Stairs Pit
  const pitGeo = new THREE.BoxGeometry(4.5, 0.8, 6);
  const pitMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.9 });
  const pit = new THREE.Mesh(pitGeo, pitMat);
  pit.position.set(0, -0.35, 0);
  metroGroup.add(pit);

  // Glowing Metro Portal Sign
  const signGeo = new THREE.BoxGeometry(4.8, 0.4, 0.1);
  const signMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.8,
  });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, 3.5, 3.9);
  metroGroup.add(sign);

  scene.add(metroGroup);
}

function createCityArchitecture(scene: THREE.Scene) {
  // Array of surrounding buildings
  const buildings = [
    { x: -32, z: -8, w: 14, h: 28, d: 14, color: 0x1e293b },
    { x: -32, z: 8, w: 12, h: 36, d: 14, color: 0x0f172a },
    { x: -8, z: -32, w: 18, h: 22, d: 12, color: 0x1e293b },
    { x: 12, z: -32, w: 16, h: 42, d: 14, color: 0x0f172a },
    { x: 32, z: -16, w: 14, h: 30, d: 16, color: 0x1e293b },
    { x: 32, z: 8, w: 14, h: 48, d: 16, color: 0x0f172a },
    { x: 18, z: 28, w: 16, h: 26, d: 14, color: 0x1e293b },
    { x: -6, z: 32, w: 18, h: 34, d: 12, color: 0x0f172a },
  ];

  buildings.forEach((b) => {
    const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
    const mat = new THREE.MeshStandardMaterial({
      color: b.color,
      roughness: 0.4,
      metalness: 0.7,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(b.x, b.h / 2, b.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Glowing window strips
    const windowStripGeo = new THREE.PlaneGeometry(b.w * 0.8, b.h * 0.85);
    const windowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const windows = new THREE.Mesh(windowStripGeo, windowMat);
    windows.position.set(b.x, b.h / 2, b.z + b.d / 2 + 0.05);
    scene.add(windows);
  });
}

function createEnergyStorageStation(
  scene: THREE.Scene,
  batteryCoreRef: React.MutableRefObject<THREE.Mesh | null>
) {
  const stationGroup = new THREE.Group();
  stationGroup.position.set(8, 0, -6);

  // Base platform
  const baseGeo = new THREE.CylinderGeometry(3.5, 3.8, 0.6, 24);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.8,
    roughness: 0.3,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.3;
  base.castShadow = true;
  base.receiveShadow = true;
  stationGroup.add(base);

  // Outer protective glass column
  const glassGeo = new THREE.CylinderGeometry(2.4, 2.4, 4.2, 24);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
    metalness: 0.9,
  });
  const glassCol = new THREE.Mesh(glassGeo, glassMat);
  glassCol.position.y = 2.4;
  stationGroup.add(glassCol);

  // Inner Glowing Core (Storage Cells)
  const coreGeo = new THREE.CylinderGeometry(1.4, 1.4, 3.4, 16);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.75,
    roughness: 0.2,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = 2.4;
  stationGroup.add(core);
  batteryCoreRef.current = core;

  // Station Canopy Roof
  const roofGeo = new THREE.CylinderGeometry(3.2, 2.6, 0.4, 24);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 4.6;
  stationGroup.add(roof);

  // Energy Station Indicator Light
  const pLight = new THREE.PointLight(0x06b6d4, 2.2, 14);
  pLight.position.set(0, 2.6, 0);
  stationGroup.add(pLight);

  scene.add(stationGroup);
}

function createStreetLights(
  scene: THREE.Scene,
  lightsRef: React.MutableRefObject<THREE.PointLight[]>
) {
  const lightPositions = [
    [-14, 0, 8],
    [-8, 0, 14],
    [6, 0, 12],
    [14, 0, 6],
    [-14, 0, -8],
    [12, 0, -14],
    [-2, 0, -18],
    [18, 0, -4],
  ];

  const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
  const headMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.8,
  });

  lightPositions.forEach(([x, y, z]) => {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Pole
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 4.2, 8);
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 2.1;
    pole.castShadow = true;
    group.add(pole);

    // Cantilever Arm
    const armGeo = new THREE.BoxGeometry(0.8, 0.08, 0.08);
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.position.set(0.35, 4.15, 0);
    group.add(arm);

    // Lamp Luminaire Head
    const headGeo = new THREE.BoxGeometry(0.4, 0.08, 0.25);
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0.65, 4.12, 0);
    group.add(head);

    // Actual point light casting downward light
    const pLight = new THREE.PointLight(0x38bdf8, 1.8, 16);
    pLight.position.set(0.65, 4.0, 0);
    pLight.castShadow = true;
    group.add(pLight);
    lightsRef.current.push(pLight);

    scene.add(group);
  });
}

function createSensorsAndDisplays(scene: THREE.Scene) {
  // Environmental Sensor Towers
  const sensorPositions = [
    [-6, 0, 8],
    [4, 0, 6],
    [-12, 0, -4],
  ];

  sensorPositions.forEach(([x, y, z]) => {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const postGeo = new THREE.CylinderGeometry(0.06, 0.08, 2.4, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.y = 1.2;
    group.add(post);

    // Sensor Capsule
    const capGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.6,
    });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 2.4;
    group.add(cap);

    scene.add(group);
  });

  // Dynamic Transit Display Kiosk
  const kioskGroup = new THREE.Group();
  kioskGroup.position.set(-4, 0, 14);

  const kioskBaseGeo = new THREE.BoxGeometry(0.3, 2.8, 1.4);
  const kioskBaseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
  const kioskBase = new THREE.Mesh(kioskBaseGeo, kioskBaseMat);
  kioskBase.position.y = 1.4;
  kioskGroup.add(kioskBase);

  const screenGeo = new THREE.PlaneGeometry(1.2, 2.2);
  const screenMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0.16, 1.5, 0);
  screen.rotation.y = Math.PI / 2;
  kioskGroup.add(screen);

  scene.add(kioskGroup);
}

function createEnergyConduits(
  scene: THREE.Scene,
  linesRef: React.MutableRefObject<THREE.Line[]>,
  hubPos: THREE.Vector3
) {
  // Conduit network linking zones to central energy station
  const zoneHubs = [
    new THREE.Vector3(-18, 0.04, 16), // Metro
    new THREE.Vector3(0, 0.04, 0),    // Plaza
    new THREE.Vector3(14, 0.04, -8),  // Shopping
    new THREE.Vector3(-14, 0.04, -14),// Park
  ];

  zoneHubs.forEach((src) => {
    const points = [
      src,
      new THREE.Vector3((src.x + hubPos.x) / 2, 0.04, (src.z + hubPos.z) / 2),
      new THREE.Vector3(hubPos.x, 0.04, hubPos.z),
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.6,
      linewidth: 2,
    });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    linesRef.current.push(line);
  });
}
