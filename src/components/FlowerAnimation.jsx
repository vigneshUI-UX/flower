import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";

const FlowerAnimation = () => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  // Scaled down Y targets for lower height
  const flowersConfig = [
    { id: "flower-1", transform: "translate(240, 680)", targetScale: 0.8 },
    { id: "flower-2", transform: "translate(350, 580)", targetScale: 0.95 },
    { id: "flower-3", transform: "translate(500, 480)", targetScale: 1.2 },
    { id: "flower-4", transform: "translate(650, 580)", targetScale: 0.95 },
    { id: "flower-5", transform: "translate(760, 680)", targetScale: 0.8 }
  ];

  useEffect(() => {
    // --- 1. THREE.JS FLOATING BACKGROUND PARTICLES ---
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    camera.position.z = 400;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const count = 220;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const palette = [
      new THREE.Color("#00f0ff"),
      new THREE.Color("#ff00a0"),
      new THREE.Color("#3a86ff")
    ];

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 800;
      positions[i + 1] = (Math.random() - 0.5) * 800;
      positions[i + 2] = (Math.random() - 0.5) * 400;

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i] = col.r;
      colors[i + 1] = col.g;
      colors[i + 2] = col.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    let animationFrameId;
    const animateParticles = () => {
      const pos = particleSystem.geometry.attributes.position.array;
      for (let i = 1; i < count * 3; i += 3) {
        pos[i] += 0.3;
        if (pos[i] > 400) pos[i] = -400;
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;
      particleSystem.rotation.y += 0.0003;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animateParticles);
    };

    animateParticles();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // --- 2. GSAP TIMELINE ---
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const stems = svgElement.querySelectorAll(".stem");
    stems.forEach((stem) => {
      const length = stem.getTotalLength();
      gsap.set(stem, { strokeDasharray: length, strokeDashoffset: length });
    });

    gsap.set(svgElement.querySelectorAll(".grass-blade"), {
      scaleY: 0,
      transformOrigin: "bottom center"
    });
    gsap.set(svgElement.querySelectorAll(".small-leaf"), { scale: 0, transformOrigin: "bottom center" });

    gsap.set(svgElement.querySelectorAll(".flower-group"), {
      scale: 0,
      transformOrigin: "center center",
      filter: "drop-shadow(0px 0px 0px rgba(0, 240, 255, 0))"
    });

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });

    // Step 1: Lower grass blades grow up
    tl.to(svgElement.querySelectorAll(".grass-blade"), {
      scaleY: 1,
      duration: 1.6,
      stagger: 0.02,
      ease: "power2.out"
    })
      // Step 2: Foliage appears
      .to(
        svgElement.querySelectorAll(".small-leaf"),
        { scale: 1, duration: 1, stagger: 0.05, ease: "back.out(1.5)" },
        "-=1.2"
      )
      // Step 3: Shorter stems grow
      .to(
        stems,
        {
          strokeDashoffset: 0,
          duration: 1.8,
          stagger: 0.08,
          ease: "power1.inOut"
        },
        "-=1.0"
      )
      // Step 4: Flowers bloom
      .to(
        svgElement.querySelectorAll(".flower-group"),
        {
          scale: (i) => flowersConfig[i].targetScale,
          duration: 1.2,
          stagger: 0.1,
          ease: "back.out(1.5)"
        },
        "-=0.6"
      )
      // Step 5: Glow phase
      .to(
        svgElement.querySelectorAll(".flower-group"),
        {
          filter: "drop-shadow(0px 0px 25px rgba(0, 240, 255, 1)) drop-shadow(0px 0px 55px rgba(0, 180, 255, 0.95))",
          duration: 1.2,
          stagger: 0.1,
          ease: "power2.inOut"
        },
        "+=0.2"
      )
      // Step 6: Fade out
      .to(
        svgElement.querySelectorAll(".flower-group, .stem, .grass-blade, .small-leaf"),
        {
          opacity: 0,
          duration: 1.2,
          delay: 1.5
        }
      );

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      tl.kill();
    };
  }, []);

  const renderPetalCluster = () => {
    return (
      <g className="petals-cluster">
        <path d="M 0 0 C -40 -15, -70 -10, -90 10 C -60 25, -30 20, 0 0" fill="url(#petal-blue-grad)" opacity="0.8" />
        <path d="M 0 0 C 40 -15, 70 -10, 90 10 C 60 25, 30 20, 0 0" fill="url(#petal-blue-grad)" opacity="0.8" />
        <path d="M 0 0 C -50 -35, -80 -50, -95 -30 C -65 -20, -35 -10, 0 0" fill="url(#petal-blue-grad)" opacity="0.85" />
        <path d="M 0 0 C 50 -35, 80 -50, 95 -30 C 65 -20, 35 -10, 0 0" fill="url(#petal-blue-grad)" opacity="0.85" />
        <path d="M 0 0 C -35 -60, -55 -90, -40 -105 C -20 -80, -10 -40, 0 0" fill="url(#petal-blue-grad)" />
        <path d="M 0 0 C 35 -60, 55 -90, 40 -105 C 20 -80, 10 -40, 0 0" fill="url(#petal-blue-grad)" />
        <path d="M 0 0 C -15 -70, -20 -110, 0 -130 C 20 -110, 15 -70, 0 0" fill="url(#petal-cyan-bright)" />
        <path d="M 0 0 C -8 -50, -10 -90, 0 -110 C 10 -90, 8 -50, 0 0" fill="url(#petal-white-core)" />
      </g>
    );
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#030206",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <style>{`
        .grass-blade {
          transform-origin: bottom center;
          filter: drop-shadow(0px 0px 6px rgba(0, 255, 100, 0.6));
        }

        .stem {
          stroke-linecap: round;
        }

        .flower-group {
          will-change: filter, transform;
        }
      `}</style>

      {/* Three.js Background Canvas */}
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
          pointerEvents: "none"
        }}
      />

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        viewBox="0 0 1000 1000"
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: "900px",
          height: "100%",
          maxHeight: "900px"
        }}
      >
        <defs>
          <linearGradient id="petal-blue-grad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(0, 150, 255, 0.2)" />
            <stop offset="70%" stopColor="rgba(0, 200, 255, 0.6)" />
            <stop offset="100%" stopColor="rgba(180, 245, 255, 0.95)" />
          </linearGradient>

          <linearGradient id="petal-cyan-bright" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(0, 180, 255, 0.4)" />
            <stop offset="100%" stopColor="rgba(230, 255, 255, 1)" />
          </linearGradient>

          <linearGradient id="petal-white-core" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(0, 230, 255, 0.5)" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* Full Solid Green Gradients */}
          <linearGradient id="full-green-primary" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop="#053b11" />
            <stop offset="35%" stop="#0fa83b" />
            <stop offset="75%" stop="#1ee655" />
            <stop offset="100%" stop="#72ff88" />
          </linearGradient>

          <linearGradient id="full-green-secondary" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop="#02280a" />
            <stop offset="45%" stop="#0c822e" />
            <stop offset="85%" stop="#18cb49" />
            <stop offset="100%" stop="#4dff6e" />
          </linearGradient>
        </defs>

        {/* --- DECREASED HEIGHT FULL GREEN GRASS BLADES --- */}
        <g className="foliage">
          {/* Outer Left Blades (Height reduced) */}
          <path className="grass-blade" d="M 120,950 C 95,810 100,650 160,500 C 145,650 130,810 170,950 Z" fill="url(#full-green-primary)" />
          <path className="grass-blade" d="M 145,950 C 115,820 125,670 180,530 C 165,670 150,820 190,950 Z" fill="url(#full-green-primary)" />
          <path className="grass-blade" d="M 170,950 C 140,830 150,700 205,560 C 190,700 175,830 215,950 Z" fill="url(#full-green-secondary)" />
          
          {/* Mid-Left Blades */}
          <path className="grass-blade" d="M 195,950 C 165,840 175,720 230,590 C 215,720 200,840 240,950 Z" fill="url(#full-green-primary)" />
          <path className="grass-blade" d="M 220,950 C 190,850 200,740 255,620 C 240,740 225,850 265,950 Z" fill="url(#full-green-secondary)" />
          <path className="grass-blade" d="M 245,950 C 220,860 230,760 275,650 C 260,760 245,860 285,950 Z" fill="url(#full-green-primary)" />
          <path className="grass-blade" d="M 270,950 C 250,870 260,780 300,680 C 285,780 270,870 305,950 Z" fill="url(#full-green-secondary)" />

          {/* Inner Left Base Blades */}
          <path className="grass-blade" d="M 295,950 C 275,880 285,800 325,720 C 310,800 295,880 325,950 Z" fill="url(#full-green-secondary)" />
          <path className="grass-blade" d="M 320,950 C 305,890 315,820 345,760 C 332,820 320,890 345,950 Z" fill="url(#full-green-primary)" />
          <path className="grass-blade" d="M 345,950 C 335,900 342,840 370,800 C 358,840 348,900 365,950 Z" fill="url(#full-green-secondary)" />

          {/* Outer Right Blades */}
          <path className="grass-blade" d="M 880,950 C 905,810 900,650 840,500 C 855,650 870,810 830,950 Z" fill="url(#full-green-primary)" />
          <path className="grass-blade" d="M 855,950 C 885,820 875,670 820,530 C 835,670 850,820 810,950 Z" fill="url(#full-green-primary)" />
          <path className="grass-blade" d="M 830,950 C 860,830 850,700 795,560 C 810,700 825,830 785,950 Z" fill="url(#full-green-secondary)" />

          {/* Mid-Right Blades */}
          <path className="grass-blade" d="M 805,950 C 835,840 825,720 770,590 C 785,720 800,840 760,950 Z" fill="url(#full-green-primary)" />
          <path className="grass-blade" d="M 780,950 C 810,850 800,740 745,620 C 760,740 775,850 735,950 Z" fill="url(#full-green-secondary)" />
          <path className="grass-blade" d="M 755,950 C 780,860 770,760 725,650 C 740,760 755,860 715,950 Z" fill="url(#full-green-primary)" />
          <path className="grass-blade" d="M 730,950 C 750,870 740,780 700,680 C 715,780 730,870 695,950 Z" fill="url(#full-green-secondary)" />

          {/* Inner Right Base Blades */}
          <path className="grass-blade" d="M 705,950 C 725,880 715,800 675,720 C 690,800 705,880 675,950 Z" fill="url(#full-green-secondary)" />
          <path className="grass-blade" d="M 680,950 C 695,890 685,820 655,760 C 668,820 680,890 655,950 Z" fill="url(#full-green-primary)" />
          <path className="grass-blade" d="M 655,950 C 665,900 658,840 630,800 C 642,840 652,900 635,950 Z" fill="url(#full-green-secondary)" />

          {/* Center Dense Base Blades */}
          <path className="grass-blade" d="M 370,950 C 375,900 385,850 410,810 C 418,850 415,900 410,950 Z" fill="url(#full-green-secondary)" />
          <path className="grass-blade" d="M 405,950 C 420,910 430,860 450,820 C 458,860 455,910 455,950 Z" fill="url(#full-green-primary)" />
          <path className="grass-blade" d="M 445,950 C 460,915 470,875 490,840 C 498,875 495,915 495,950 Z" fill="url(#full-green-secondary)" />
          <path className="grass-blade" d="M 505,950 C 505,915 502,875 510,840 C 530,875 540,915 555,950 Z" fill="url(#full-green-secondary)" />
          <path className="grass-blade" d="M 545,950 C 545,910 542,860 550,820 C 570,860 580,910 595,950 Z" fill="url(#full-green-primary)" />
          <path className="grass-blade" d="M 590,950 C 585,900 585,850 590,810 C 615,850 625,900 630,950 Z" fill="url(#full-green-secondary)" />
        </g>

        {/* Small Bubble Foliage */}
        <g className="small-decorations">
          <g className="small-leaf">
            <ellipse cx="320" cy="880" rx="12" ry="7" fill="none" stroke="#00e5ff" strokeWidth="2.5" transform="rotate(-25 320 880)" />
            <ellipse cx="340" cy="860" rx="10" ry="6" fill="none" stroke="#00e5ff" strokeWidth="2.5" transform="rotate(-30 340 860)" />
            <ellipse cx="365" cy="840" rx="8" ry="5" fill="none" stroke="#00e5ff" strokeWidth="2" transform="rotate(-35 365 840)" />
            <ellipse cx="300" cy="900" rx="14" ry="8" fill="none" stroke="#00e5ff" strokeWidth="2.5" transform="rotate(-20 300 900)" />
          </g>

          <g className="small-leaf">
            <ellipse cx="680" cy="880" rx="12" ry="7" fill="none" stroke="#ff00a0" strokeWidth="2.5" transform="rotate(25 680 880)" />
            <ellipse cx="660" cy="860" rx="10" ry="6" fill="none" stroke="#ff00a0" strokeWidth="2.5" transform="rotate(30 660 860)" />
            <ellipse cx="635" cy="840" rx="8" ry="5" fill="none" stroke="#ff00a0" strokeWidth="2" transform="rotate(35 635 840)" />
            <ellipse cx="700" cy="900" rx="14" ry="8" fill="none" stroke="#ff00a0" strokeWidth="2.5" transform="rotate(20 700 900)" />
          </g>
        </g>

        {/* Shorter Stems matching lower height */}
        <g className="stems">
          <path className="stem" d="M 480,920 Q 380,820 240,680" stroke="#7000ff" strokeWidth="4.5" fill="none" />
          <path className="stem" d="M 490,920 Q 420,770 350,580" stroke="#a000ff" strokeWidth="5" fill="none" />
          <path className="stem" d="M 500,920 L 500,480" stroke="#00f0ff" strokeWidth="6" fill="none" />
          <path className="stem" d="M 510,920 Q 580,770 650,580" stroke="#ff0066" strokeWidth="5" fill="none" />
          <path className="stem" d="M 520,920 Q 620,820 760,680" stroke="#ff00a0" strokeWidth="4.5" fill="none" />
        </g>

        {/* Flowers positioned at lower coordinates */}
        <g className="flowers">
          {flowersConfig.map((item) => (
            <g key={item.id} className="flower-group" transform={item.transform}>
              {renderPetalCluster()}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default FlowerAnimation;