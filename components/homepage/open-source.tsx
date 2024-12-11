"use client";

import { Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function OpenSource() {
    return (
        <div className="relative w-full overflow-hidden">
            <div className="max-w-[1400px] mx-auto px-4 py-32 lg:py-40">
                {/* Animated background elements */}
                <div className="absolute inset-0 z-0">
                    <motion.div
                        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-[120px]"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.div
                        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/20 blur-[100px]"
                        animate={{
                            scale: [1.2, 1, 1.2],
                            opacity: [0.4, 0.6, 0.4],
                        }}
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </div>

                <motion.div 
                    className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center relative z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Left Content */}
                    <div className="space-y-8 lg:space-y-12">
                        <motion.div 
                            className="space-y-4 lg:space-y-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="inline-flex items-center px-6 py-2 rounded-full text-base font-medium 
                                bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300 
                                backdrop-blur-sm border border-blue-500/20 dark:border-blue-400/20
                                shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                                Open Source
                            </div>
                            <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight 
                                bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
                                Built in the Open
                            </h2>
                        </motion.div>
                        
                        <motion.p 
                            className="text-xl lg:text-2xl text-muted-foreground/80 leading-relaxed"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            We believe in transparency and collaboration. Our entire codebase is open source, 
                            allowing developers to learn from, contribute to, and build upon our work.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Link 
                                href="https://github.com/pranjalpruthi" 
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button 
                                    variant="outline" 
                                    className="h-14 px-8 gap-3 text-lg
                                        bg-[#FDF4E7]/80 dark:bg-[#2D2416]/80 text-[#F5A524] 
                                        hover:bg-[#FCE9CF] dark:hover:bg-[#3D321F]
                                        border-[#F5A524]/30 hover:border-[#F5A524]/50
                                        transition-all duration-300 rounded-2xl font-medium
                                        backdrop-blur-sm shadow-[0_8px_16px_rgba(245,165,36,0.1)]"
                                >
                                    <Star className="w-6 h-6 fill-[#F5A524]" />
                                    Star us on GitHub
                                </Button>
                            </Link>
                        </motion.div>
                    </div>

                    {/* Right Content - Glowing Card */}
                    <motion.div 
                        className="relative aspect-[4/3] w-full"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="absolute inset-0 rounded-3xl overflow-hidden">
                            <motion.div 
                                className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"
                                animate={{
                                    background: [
                                        "linear-gradient(45deg, rgba(59,130,246,0.2) 0%, rgba(147,51,234,0.2) 100%)",
                                        "linear-gradient(225deg, rgba(59,130,246,0.2) 0%, rgba(147,51,234,0.2) 100%)",
                                    ],
                                }}
                                transition={{
                                    duration: 5,
                                    repeat: Infinity,
                                    repeatType: "reverse",
                                }}
                            />
                            <div className="absolute inset-0 backdrop-blur-sm bg-black/50" />
                            <Image
                                src="/assets/github-card.svg"
                                alt="GitHub Repository"
                                fill
                                className="object-cover object-center opacity-90"
                            />
                            <motion.div 
                                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"
                                animate={{
                                    opacity: [0, 0.5, 0],
                                    backgroundPosition: ["200% 200%", "-50% -50%", "200% 200%"],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "linear",
                                }}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
