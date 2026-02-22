import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function MagneticCursor() {
    const torchX = useMotionValue(-1000);
    const torchY = useMotionValue(-1000);

    // Tighter, faster spring so the flashlight feels responsive and natural
    const springTorchX = useSpring(torchX, { damping: 40, stiffness: 500 });
    const springTorchY = useSpring(torchY, { damping: 40, stiffness: 500 });

    // Smooth out clicks or hovers
    const scaleVal = useMotionValue(1);
    const springScale = useSpring(scaleVal, { damping: 20, stiffness: 400 });

    const opacityVal = useMotionValue(0.7);
    const springOpacity = useSpring(opacityVal, { damping: 20, stiffness: 300 });

    useEffect(() => {
        const onMove = (e) => {
            // Center the 800x800 torch light directly on the mouse
            torchX.set(e.clientX - 400);
            torchY.set(e.clientY - 400);

            // Dispatch event for 3D particles parallax
            window.dispatchEvent(new CustomEvent('global-pointer-move', {
                detail: { x: (e.clientX / window.innerWidth) * 2 - 1, y: -(e.clientY / window.innerHeight) * 2 + 1 }
            }));
        };

        const handleMouseOver = (e) => {
            if (e.target.closest("button, a, .interactive, input")) {
                scaleVal.set(1.5);
                opacityVal.set(1);
            }
        };

        const handleMouseOut = (e) => {
            if (e.target.closest("button, a, .interactive, input")) {
                scaleVal.set(1);
                opacityVal.set(0.7);
            }
        };

        const handleMouseDown = () => {
            scaleVal.set(0.85);
            opacityVal.set(1);
        };

        const handleMouseUp = () => {
            scaleVal.set(1);
            opacityVal.set(0.7);
        };

        window.addEventListener("mousemove", onMove);
        document.addEventListener("mouseover", handleMouseOver);
        document.addEventListener("mouseout", handleMouseOut);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseover", handleMouseOver);
            document.removeEventListener("mouseout", handleMouseOut);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    return (
        <motion.div
            className="pointer-events-none hidden md:block"
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: 800,
                height: 800,
                borderRadius: "50%",
                // True flashlight effect: Intense bright core -> Theme color glow -> Transparent fade
                background: "radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, var(--primary-glow) 8%, transparent 45%)",
                x: springTorchX,
                y: springTorchY,
                scale: springScale,
                opacity: springOpacity,
                zIndex: 9999, // Illuminates over everything
                mixBlendMode: "screen", // Creates physical light simulation
                pointerEvents: "none",
            }}
        />
    );
}
