import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const DICE_PARAMS = {
  numberOfDice: 2,
  scale: 1.2,
};

const EPS = 0.1;

const isNear = (value, target) => Math.abs(value - target) < EPS;

const getDiceResult = (euler) => {
  const isZero = (angle) => Math.abs(angle) < EPS;
  const isHalfPi = (angle) => isNear(angle, 0.5 * Math.PI);
  const isMinusHalfPi = (angle) => isNear(angle, -0.5 * Math.PI);
  const isPiOrMinusPi = (angle) => isNear(Math.abs(angle), Math.PI);

  if (isZero(euler.z)) {
    if (isZero(euler.x)) return 1;
    if (isHalfPi(euler.x)) return 4;
    if (isMinusHalfPi(euler.x)) return 3;
    if (isPiOrMinusPi(euler.x)) return 6;
    return null;
  }

  if (isHalfPi(euler.z)) return 2;
  if (isMinusHalfPi(euler.z)) return 5;
  return null;
};

export default function DiceRoll() {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const diceRef = useRef([]);
  const throwRef = useRef(() => {});
  const rafRef = useRef(null);
  const scoreRef = useRef([]);
  const [score, setScore] = useState('');

  useEffect(() => {
    if (!canvasRef.current || !wrapperRef.current) return undefined;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: canvasRef.current,
    });
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 300);
    camera.position.set(0, 0.5, 4).multiplyScalar(7);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    const topLight = new THREE.PointLight(0xffffff, 0.85);
    topLight.position.set(12, 18, 6);
    topLight.castShadow = true;
    topLight.shadow.mapSize.width = 2048;
    topLight.shadow.mapSize.height = 2048;
    topLight.shadow.camera.near = 4;
    topLight.shadow.camera.far = 450;

    const spotlight = new THREE.SpotLight(0xffffff, 1.2, 120, Math.PI * 0.22, 0.25, 1.15);
    spotlight.position.set(0, 22, 0);
    spotlight.target.position.set(0, 0, 0);
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.width = 2048;
    spotlight.shadow.mapSize.height = 2048;
    scene.add(ambientLight, topLight, spotlight, spotlight.target);

    const world = new CANNON.World({
      allowSleep: true,
      gravity: new CANNON.Vec3(0, -50, 0),
    });
    world.defaultContactMaterial.restitution = 0.3;

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1000),
      new THREE.ShadowMaterial({ opacity: 0.1 })
    );
    floor.receiveShadow = true;
    floor.position.y = -4.5;
    floor.quaternion.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), Math.PI * 0.5);
    scene.add(floor);

    const floorBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Plane(),
    });
    floorBody.position.copy(floor.position);
    floorBody.quaternion.copy(floor.quaternion);
    world.addBody(floorBody);

    diceRef.current = [];

    const showRollResults = (value) => {
      scoreRef.current = [...scoreRef.current, value];
      setScore(scoreRef.current.join('+'));
    };

    const addDiceEvents = (dice) => {
      dice.body.addEventListener('sleep', (event) => {
        dice.body.allowSleep = false;

        const euler = new CANNON.Vec3();
        event.target.quaternion.toEuler(euler);

        const result = getDiceResult(euler);
        if (result === null) {
          dice.body.allowSleep = true;
          return;
        }

        showRollResults(result);
      });
    };

    const loader = new GLTFLoader();
    let diceShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));

    loader.load('/dice.glb', (gltf) => {
      if (!wrapperRef.current) return;

      const template = gltf.scene;
      template.scale.setScalar(DICE_PARAMS.scale);
      template.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      const bounds = new THREE.Box3().setFromObject(template);
      const size = new THREE.Vector3();
      bounds.getSize(size);
      if (size.length() > 0) {
        diceShape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
      }

      for (let i = 0; i < DICE_PARAMS.numberOfDice; i += 1) {
        const mesh = template.clone(true);
        scene.add(mesh);

        const body = new CANNON.Body({
          mass: 1,
          shape: diceShape,
          sleepTimeLimit: 0.1,
        });
        world.addBody(body);

        const dice = { mesh, body };
        diceRef.current.push(dice);
        addDiceEvents(dice);
      }

      throwRef.current();
    });

    const updateSceneSize = () => {
      const width = wrapperRef.current.clientWidth || 1;
      const height = wrapperRef.current.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(updateSceneSize);
    resizeObserver.observe(wrapperRef.current);
    updateSceneSize();

    const throwDice = () => {
      scoreRef.current = [];
      setScore('');

      diceRef.current.forEach((dice, idx) => {
        dice.body.velocity.setZero();
        dice.body.angularVelocity.setZero();

        dice.body.position.set(6, idx * 1.5, 0);
        dice.mesh.position.copy(dice.body.position);

        dice.mesh.rotation.set(2 * Math.PI * Math.random(), 0, 2 * Math.PI * Math.random());
        dice.body.quaternion.copy(dice.mesh.quaternion);

        const force = 3 + 5 * Math.random();
        dice.body.applyImpulse(
          new CANNON.Vec3(-force, force, 0),
          new CANNON.Vec3(0, 0, 0.2)
        );

        dice.body.allowSleep = true;
      });
    };

    throwRef.current = throwDice;

    const render = () => {
      world.fixedStep();
      diceRef.current.forEach((dice) => {
        dice.mesh.position.copy(dice.body.position);
        dice.mesh.quaternion.copy(dice.body.quaternion);
      });
      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(render);
    };

    render();

    const handleDoubleClick = () => throwDice();
    const canvas = canvasRef.current;
    canvas.addEventListener('dblclick', handleDoubleClick);

    return () => {
      canvas.removeEventListener('dblclick', handleDoubleClick);
      resizeObserver.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      renderer.dispose();
      diceRef.current = [];
    };
  }, []);

  return (
    <div style={{ display: 'grid', gap: '16px', width: '100%' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        <div>
          <div className="font-rajdhani" style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.35em',
            color: '#9ca3af',
            marginBottom: '6px',
          }}>
            Score
          </div>
          <div className="font-orbitron font-black" style={{
            fontSize: 'clamp(18px, 2vw, 24px)',
            color: '#fde047',
          }}>
            {score || '—'}
          </div>
        </div>
        <button
          type="button"
          className="font-rajdhani font-bold"
          onClick={() => throwRef.current()}
          style={{
            borderRadius: '999px',
            padding: '12px 24px',
            background: 'linear-gradient(to right, #eab308, #f97316)',
            color: '#000',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            boxShadow: '0 20px 60px rgba(245,197,24,0.2)',
          }}
        >
          Throw Dice
        </button>
      </div>

      <div
        ref={wrapperRef}
        style={{
          width: '100%',
          height: '320px',
          borderRadius: '20px',
          overflow: 'hidden',
          background: 'rgba(0,0,0,0.12)',
        }}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      <div className="font-rajdhani" style={{ color: '#9ca3af', fontSize: '12px' }}>
        Double click the dice area to throw again.
      </div>
    </div>
  );
}
