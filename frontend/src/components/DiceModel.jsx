import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";

function Dice() {
  const ref = useRef();

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.x += 0.01;
      ref.current.rotation.y += 0.007;
    }
  });

  const { scene } = useGLTF("/dice.glb");

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return <primitive ref={ref} object={scene} scale={1.2} />;
}

function FollowLight() {
  const lightRef = useRef();
  const { camera, scene } = useThree();

  useFrame(() => {
    if (!lightRef.current) return;
    lightRef.current.position.set(camera.position.x, camera.position.y + 2, camera.position.z);
    lightRef.current.target.position.set(0, 0, 0);
    lightRef.current.target.updateMatrixWorld();
  });

  if (lightRef.current && lightRef.current.target.parent !== scene) {
    scene.add(lightRef.current.target);
  }

  return <directionalLight ref={lightRef} intensity={1.5} castShadow />;
}

export default function DiceModel({ height = 320 }) {
  return (
    <div style={{ width: "100%", height }}>
      <Canvas
        shadows
        camera={{ position: [0, 2, 5], fov: 50, near: 0.1, far: 1000 }}
        style={{ width: "100%", height: "100%", background: "transparent" }}
      >
        {/* Lighting */}
        <ambientLight intensity={1.2} color={0xffffff} />
        <hemisphereLight intensity={0.9} color={0xffffff} groundColor={0x444444} />
        <directionalLight position={[6, 8, 6]} intensity={2.0} castShadow />
        <directionalLight position={[-6, 4, -4]} intensity={1.2} />
        <directionalLight position={[8, 2, -6]} intensity={1.0} />
        <directionalLight position={[-8, 6, 6]} intensity={1.0} />
        <pointLight position={[0, 6, 4]} intensity={1.0} />
        <pointLight position={[4, 2, 0]} intensity={0.9} />
        <pointLight position={[-4, 2, 0]} intensity={0.9} />
        <pointLight position={[0, 2, -5]} intensity={0.8} />
        <pointLight position={[0, 9, 0]} intensity={1.2} />
        <pointLight position={[0, 0, 6]} intensity={0.9} />
        <FollowLight />

        <Dice />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.8}
        />
      </Canvas>
    </div>
  );
}