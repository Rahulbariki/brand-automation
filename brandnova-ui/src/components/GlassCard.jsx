import Tilt from "react-parallax-tilt";

export default function GlassCard({ children, className = "", onClick, tilt = true }) {
    const inner = (
        <div
            className={`glass relative overflow-hidden p-6 rounded-[20px] cursor-pointer ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );

    if (!tilt) return inner;

    return (
        <Tilt
            glareEnable
            glareMaxOpacity={0.12}
            glareColor="var(--primary)"
            scale={1.03}
            tiltMaxAngleX={10}
            tiltMaxAngleY={10}
            transitionSpeed={400}
        >
            {inner}
        </Tilt>
    );
}
