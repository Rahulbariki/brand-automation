import { motion } from "framer-motion";

export default function AnimatedText({ text, speed = 0.03, className = "" }) {
    const chars = Array.from(text);

    return (
        <motion.div className={`flex flex-wrap whitespace-pre-wrap ${className}`}>
            {chars.map((char, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * speed, duration: 0.1 }}
                >
                    {char}
                </motion.span>
            ))}
        </motion.div>
    );
}
