'use client';

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { motion, Variants } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import confetti from 'canvas-confetti';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const triggerSprinkles = () => {
    if (!canvasRef.current) return;

    const myConfetti = confetti.create(canvasRef.current, {
      resize: true,
      useWorker: true
    });

    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0.5,
      decay: 0.94,
      startVelocity: 30,
      shapes: ['circle', 'square'],
      colors: ['#3b82f6', '#f97316', '#ffffff', '#0c2a50', '#60a5fa']
    };

    const shoot = () => {
      // Create custom shapes from emojis
      const gear = confetti.shapeFromText({ text: '⚙️', scalar: 3 });
      const block = confetti.shapeFromText({ text: '🧱', scalar: 3 });
      const box = confetti.shapeFromText({ text: '📦', scalar: 3 });
      const puzzle = confetti.shapeFromText({ text: '🧩', scalar: 3 });

      myConfetti({
        ...defaults,
        particleCount: 30,
        scalar: 1.5,
        shapes: [gear, block, box, puzzle, 'circle', 'square'] as any,
        ticks: 150,
        gravity: 0.6,
        startVelocity: 45
      });

      myConfetti({
        ...defaults,
        particleCount: 20,
        scalar: 0.8,
        shapes: ['circle', 'square'] as any,
        ticks: 200,
        gravity: 0.4,
        startVelocity: 35
      });
    };

    shoot();
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-10 pb-20 px-4 relative overflow-hidden">

      {/* Hero Logo Area */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 20, duration: 0.8 }}
        className="relative w-[300px] h-[300px] sm:w-[500px] sm:h-[400px] mb-8 mt-4"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-sky-400 rounded-full blur-[80px] opacity-30 mix-blend-multiply" />
        <div className="flex flex-col items-center justify-center w-full h-full relative z-10 text-center drop-shadow-2xl">
          <div className="flex flex-col items-center">
            {/* NOYS - Falling Animation */}
            <motion.h1
              initial={{ y: -800, opacity: 0, rotate: -15 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{
                type: "spring",
                damping: 12,
                stiffness: 100,
                duration: 0.8,
                delay: 0.2
              }}
              className="text-6xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-sky-100 to-sky-300 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]"
            >
              NOYS
            </motion.h1>

            {/* 3D PRINTS - Falling Animation */}
            <div className="flex gap-4 mt-[-10px]">
              {["3D", "PRINTS"].map((word, index) => (
                <motion.h2
                  key={word}
                  initial={{ y: -800, opacity: 0, rotate: index === 0 ? 15 : -10 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  onAnimationComplete={word === "PRINTS" ? triggerSprinkles : undefined}
                  transition={{
                    type: "spring",
                    damping: 10,
                    stiffness: 80,
                    duration: 0.8,
                    delay: 0.6 + (index * 0.2)
                  }}
                  className={`text-4xl sm:text-6xl font-black drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] ${index === 0 ? 'text-orange-500' : 'text-white'}`}
                >
                  {word}
                </motion.h2>
              ))}
            </div>

            {/* Canvas Confetti (Behind Text) */}
            <canvas
              ref={canvasRef}
              className="absolute inset-[-200px] w-[calc(100%+400px)] h-[calc(100%+400px)] pointer-events-none -z-10"
              style={{ willChange: 'transform' }}
            />
          </div>

          {/* A WORLD MADE IN PLASTIC - Slow Fade In */}
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 2.5,
              delay: 1.8,
              ease: "easeOut"
            }}
            className="mt-6 font-bold text-white bg-blue-900/50 px-8 py-3 rounded-full border border-blue-400/30 backdrop-blur-sm text-sm sm:text-lg tracking-widest uppercase shadow-xl"
          >
            A WORLD MADE IN PLASTIC
          </motion.p>
        </div>
      </motion.div>

      {/* Main Copy */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="max-w-3xl text-center z-10 space-y-6"
      >
        <h2 className="text-4xl sm:text-5xl font-black text-[#0c2a50]">
          A World Made in Plastic
        </h2>
        <p className="text-lg sm:text-xl text-[#1a4073] font-medium leading-relaxed">
          High detail 3D printed miniatures, custom designs and hobby ready models made to order.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link href="/shop">
            <Button variant="primary" size="lg" className="text-lg w-full sm:w-auto min-w-[200px]">
              Shop Now &rsaquo;&rsaquo;
            </Button>
          </Link>
          <Link href="/ai-generator">
            <Button variant="secondary" size="lg" className="text-lg w-full sm:w-auto min-w-[200px]">
              Create Your Own &rsaquo;
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Secondary Copy */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
        variants={{
          hidden: { opacity: 0, y: 30 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
        }}
        className="max-w-4xl text-center mt-24 mb-16 z-10 px-4"
      >
        <h3 className="text-3xl font-bold text-[#0c2a50]">
          Precision 3D Printing for Creators & Collectors
        </h3>
        <p className="mt-4 text-[#1a4073] text-lg max-w-3xl mx-auto leading-relaxed">
          We design and produce high quality 3D printed models for dollhouses, tabletop gaming
          and custom projects. Whether you are looking for ready made pieces or
          something completely unique, we bring your ideas to life with precision.
        </p>
      </motion.div>

      {/* Process Section */}
      <div className="w-full max-w-6xl z-10 mt-8 mb-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <div className="h-[2px] w-12 sm:w-32 bg-blue-300"></div>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#0c2a50] whitespace-nowrap">
            Need an STL File Generated?
          </h3>
          <div className="h-[2px] w-12 sm:w-32 bg-blue-300"></div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            { tag: "1", title: "Custom Designs from Photos", img: "/placeholder-1.jpg" },
            { tag: "2", title: "High Detail Prints", img: "/placeholder-2.jpg" },
            { tag: "3", title: "Fast Turnaround", img: "/placeholder-3.jpg" },
            { tag: "4", title: "Receive STL Package", img: "/placeholder-4.jpg" },
          ].map((item, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className="h-full group relative pt-8 pb-4 bg-gradient-to-b from-white to-blue-50 transform hover:scale-105 transition-all duration-300 cursor-pointer overflow-visible">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-black text-3xl border-4 border-[#1a4073] shadow-[4px_4px_0px_#1a4073] group-hover:-translate-y-2 group-hover:bg-orange-500 group-hover:scale-110 transition-all duration-300 ease-out z-10">
                  {item.tag}
                </div>
                <CardContent className="flex flex-col items-center px-4 py-2 mt-2 h-full">
                  <div className="w-full h-40 bg-blue-200 border-4 border-[#1a4073] rounded-xl mb-4 overflow-hidden flex items-center justify-center group-hover:shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] transition-all duration-300 relative">
                    <div className="text-blue-500 font-extrabold text-xl group-hover:scale-110 transition-transform duration-500 ease-in-out">{item.title} Image</div>
                    <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <h4 className="font-extrabold text-[#0c2a50] text-lg mb-4 text-center h-12 flex items-center justify-center group-hover:text-blue-600 transition-colors duration-300 transform group-hover:-translate-y-1">
                    {item.title}
                  </h4>
                  <div className="mt-auto w-full">
                    <Link href="/ai-generator" className="w-full block">
                      <Button variant="secondary" className="w-full">
                        View All &rsaquo;
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Final CTA */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl text-center z-10 pt-8 pb-20"
      >
        <h3 className="text-2xl sm:text-3xl font-bold text-[#0c2a50] mb-4">
          Built for Hobbyists, Collectors & Creators
        </h3>
        <div className="flex items-center justify-center gap-4 mb-6 opacity-70">
          <div className="h-[1px] w-16 bg-blue-400"></div>
          <p className="text-[#1a4073] italic font-semibold">Got an Idea? We'll Print It</p>
          <div className="h-[1px] w-16 bg-blue-400"></div>
        </div>
        <p className="text-[#1a4073] text-lg mb-8 max-w-2xl mx-auto">
          Send us your reference image, sketch, or concept — we'll turn it into a clean,
          printable 3D model and bring it to life.
        </p>
        <Link href="/ai-generator">
          <Button variant="primary" size="lg" className="text-xl w-full sm:w-auto min-w-[250px]">
            Request a Custom Design &rsaquo;
          </Button>
        </Link>
      </motion.div>

    </div>
  );
}
