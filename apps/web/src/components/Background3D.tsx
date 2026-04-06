'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';
import { useRoomStore } from '@/store/useRoomStore';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

function GlassShape({ position, rotation, scale, geometry, color }: any) {
    const mesh = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.rotation.x += 0.002;
            mesh.current.rotation.y += 0.003;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh ref={mesh} position={position} rotation={rotation} scale={scale}>
                {geometry === 'torus' && <torusGeometry args={[1, 0.4, 32, 64]} />}
                {geometry === 'icosahedron' && <icosahedronGeometry args={[1, 0]} />}
                {geometry === 'octahedron' && <octahedronGeometry args={[1, 0]} />}

                <meshPhysicalMaterial
                    roughness={0.1}
                    transmission={0.9}
                    thickness={0.5}
                    color={color}
                    transparent
                    opacity={0.6}
                    envMapIntensity={1}
                />
            </mesh>
        </Float>
    )
}

// Helper to strip alpha from rgba strings for Three.js
function stripAlpha(color: string) {
    if (color.startsWith('rgba')) {
        const parts = color.match(/\d+/g);
        if (parts && parts.length >= 3) {
            return `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`;
        }
    }
    return color;
}

export function Background3D() {
    const themeColor = useRoomStore(state => state.themeColor);
    const safeColor = useMemo(() => stripAlpha(themeColor), [themeColor]);

    return (
        <div className="fixed inset-0 z-[-10] pointer-events-none">
            <Canvas camera={{ position: [0, 0, 10], fov: 45 }} dpr={[1, 2]}> {/* Optimize DPR */}
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={2} color={safeColor} />
                <pointLight position={[-10, -10, -5]} intensity={1} color="#ffffff" />

                <GlassShape position={[-4, 2, -2]} rotation={[0, 0, 0]} scale={1.2} geometry="torus" color={safeColor} />
                <GlassShape position={[4, -3, -4]} rotation={[1, 1, 0]} scale={2} geometry="icosahedron" color={safeColor} />
                <GlassShape position={[0, 0, -8]} rotation={[0.5, 0.5, 0]} scale={4} geometry="octahedron" color={safeColor} />
                <GlassShape position={[5, 4, -5]} rotation={[0, 0, 0]} scale={0.8} geometry="torus" color={safeColor} />

                <Environment preset="city" />
            </Canvas>
        </div>
    );
}
