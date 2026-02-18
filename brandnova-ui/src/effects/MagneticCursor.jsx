import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function MagneticCursor() {
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);
    const springX = useSpring(cursorX, { damping: 25, stiffness: 300 });
    const springY = useSpring(cursorY, { damping: 25, stiffness: 300 });
    const scaleVal = useMotionValue(1);
    const springScale = useSpring(scaleVal, { damping: 20, stiffness: 400 });

    useEffect(() => {
        const onMove = (e) => {
            cursorX.set(e.clientX - 12);
            cursorY.set(e.clientY - 12);
        };

        const onHover = () => scaleVal.set(2.5);
        const onLeave = () => scaleVal.set(1);

        window.addEventListener("mousemove", onMove);

        const targets = document.querySelectorAll("button, a, .interactive");
        targets.forEach((el) => {
            el.addEventListener("mouseenter", onHover);
            el.addEventListener("mouseleave", onLeave);
        });

        return () => {
            window.removeEventListener("mousemove", onMove);
            targets.forEach((el) => {
                el.removeEventListener("mouseenter", onHover);
                el.removeEventListener("mouseleave", onLeave);
            });
        };
    }, []);

    return (
        <motion.div
            className="magnetic-cursor pointer-events-none hidden md:block"
            style={{
                x: springX,
                y: springY,
                scale: springScale,
            }}
        />
    );
}
