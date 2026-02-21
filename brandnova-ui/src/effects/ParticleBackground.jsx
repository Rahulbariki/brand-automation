import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as random from "maath/random/dist/maath-random.esm";
import { useRef, useMemo } from "react";

import { useTheme } from "../context/ThemeContext";

function Particles() {
    const ref = useRef();
    const { theme } = useTheme();
    const sphere = useMemo(
        () => random.inSphere(new Float32Array(4000 * 3), { radius: 1.4 }),
        []
    );

    const themeColors = {
        cosmic: "#7c3aed",
        aurora: "#10b981",
        sunset: "#f43f5e",
        minimal: "#888",
    };

    const color = themeColors[theme] || "#10b981";

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta / 20;
            ref.current.rotation.y -= delta / 30;
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
        <div className="fixed inset-0 -z-10 opacity-70">
            <Canvas camera={{ position: [0, 0, 1] }} dpr={[1, 2]}>
                <Particles />
            </Canvas>
        </div>
    );
}
