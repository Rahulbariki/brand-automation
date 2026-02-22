import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { useRef, useMemo, useEffect } from "react";

import { useTheme } from "../context/ThemeContext";

function Particles() {
    const ref = useRef();
    const { theme } = useTheme();
    const sphere = useMemo(() => {
        const count = 4000;
        const positions = new Float32Array(count * 3);
        const radius = 1.4;
        for (let i = 0; i < count; i++) {
            let u = Math.random();
            let v = Math.random();
            let theta = u * 2.0 * Math.PI;
            let phi = Math.acos(2.0 * v - 1.0);
            let r = Math.cbrt(Math.random()) * radius;

            let sinPhi = Math.sin(phi);
            positions[i * 3] = r * sinPhi * Math.cos(theta);
            positions[i * 3 + 1] = r * sinPhi * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }
        return positions;
    }, []);

    const themeColors = {
        cosmic: "#7c3aed",
        aurora: "#10b981",
        sunset: "#f43f5e",
        minimal: "#888",
    };

    const color = themeColors[theme] || "#10b981";
    const baseRotation = useRef({ x: 0, y: 0 });
    const pointer = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const onMove = (e) => {
            pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener("mousemove", onMove);
        return () => window.removeEventListener("mousemove", onMove);
    }, []);

    useFrame((state, delta) => {
        if (ref.current) {
            // Constant base slow rotation
            baseRotation.current.x -= delta / 20;
            baseRotation.current.y -= delta / 30;

            // Target rotation = base + global mouse offset
            const targetX = baseRotation.current.x + (pointer.current.y * 0.4);
            const targetY = baseRotation.current.y + (pointer.current.x * 0.4);

            // Smooth interpolation towards target
            ref.current.rotation.x += (targetX - ref.current.rotation.x) * 0.05;
            ref.current.rotation.y += (targetY - ref.current.rotation.y) * 0.05;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color={color}
                    size={0.008}
                    sizeAttenuation
                    depthWrite={false}
                    opacity={0.7}
                />
            </Points>
        </group>
    );
}

export default function ParticleBackground() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none opacity-70">
            <Canvas camera={{ position: [0, 0, 1] }} dpr={[1, 2]}>
                <Particles />
            </Canvas>
        </div>
    );
}
