"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { MouseEvent as ReactMouseEvent } from "react";
import clsx from "clsx";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import AuthModal from "@/components/AuthModal";
import { useSessionManager } from "@/components/SessionManager";
import { LucideIcon, type IconName } from "@/components/LucideIcon";
import useAuth from "@/hooks/useAuth";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: Record<string, unknown>) => {
      checkout: (config: { preference: { id: string } }) => void;
    };
    VANTA?: {
      NET?: (options: Record<string, unknown>) => { destroy?: () => void } | undefined;
    };
    THREE?: unknown;
  }
}

type AuthView = "login" | "register" | "verify";

const heroSlides = [
  { src: "https://i.imgur.com/QpHVTbh.mp4", autoPlay: true },
  { src: "https://i.imgur.com/HlVQjpL.mp4", autoPlay: false },
  { src: "https://i.imgur.com/CpSZTuu.mp4", autoPlay: false },
];

const steps = [
  {
    number: "1",
    title: "Crie seu Acesso",
    description: "Faça um cadastro rápido e seguro para liberar o acesso à nossa plataforma de análise.",
    highlight: false,
  },
  {
    number: "2",
    title: "Conta de Energia",
    description: "Com uma conta de luz em mãos, preencha as informações solicitadas.",
    highlight: true,
  },
  {
    number: "3",
    title: "Conheça o Valor",
    description: "Veja em segundos a estimativa do valor a que poderá ser restituído, já com a projeção da correção.",
    highlight: false,
  },
];

const emotionalHighlights: Array<{ icon: IconName; text: string }> = [
  {
    icon: "CircleCheckBig",
    text: "A informação clara que você precisa para decidir.",
  },
  {
    icon: "CircleCheckBig",
    text: "Uma ferramenta ágil para planejar seu próximo passo.",
  },
  {
    icon: "CircleCheckBig",
    text: "A segurança de estar no controle da sua decisão.",
  },
];

const pricingBenefits = [
  "3 Análises com nossa calculadora avançada",
  "Acesso à plataforma e atualizações",
  "Histórico de consultas para seu controle",
  "Indique um amigo e ganhe 1 análise grátis!",
];

const pricingDetails: Array<{
  icon: IconName;
  title: string;
  description: string;
  accent: string;
}> = [
  {
    icon: "TriangleAlert",
    title: "O Problema Real",
    description:
      "O STF decidiu: a cobrança de PIS/COFINS sobre o ICMS na sua conta de luz foi ilegal. Por anos, você pagou a mais sem saber.",
    accent: "text-yellow-500",
  },
  {
    icon: "Calculator",
    title: "A Solução Simples",
    description:
      "Nossa plataforma faz o trabalho complexo: calcula o valor estimado que você pode ter a receber, com a devida correção monetária.",
    accent: "text-green-600",
  },
  {
    icon: "KeyRound",
    title: "O Investimento Inteligente",
    description:
      "Por um valor simbólico, você destrava o acesso à informação que mostrará o valor estimado a ser restituído. Esse é o primeiro passo para reaver seu dinheiro.",
    accent: "text-slate-600",
  },
];

const testimonials = [
  {
    name: "André Rocha",
    location: "Rondonópolis, MT",
    initials: "AR",
    color: "bg-slate-200 text-slate-600",
    text:
      '"Eu não fazia ideia de que podia ter dinheiro a receber. Em segundos tive uma <span class="keyword-highlight">estimativa clara</span>, sem complicação."',
  },
  {
    name: "Fernanda Melo",
    location: "Rondonópolis, MT",
    initials: "FM",
    color: "bg-green-200 text-green-700",
    text:
      '"Foi <span class="keyword-highlight">muito rápido</span>. Coloquei os dados da conta e já apareceu o valor aproximado. Pelo preço simbólico, <span class="keyword-highlight">valeu demais</span>."',
  },
  {
    name: "Gabriel Torres",
    location: "Rondonópolis, MT",
    initials: "GT",
    color: "bg-slate-200 text-slate-600",
    text:
      '"Gostei da <span class="keyword-highlight">transparência</span>. Não promete milagre, mas mostra de forma simples quanto posso recuperar."',
  },
  {
    name: "Marina Souza",
    location: "Cuiabá, MT",
    initials: "MS",
    color: "bg-green-200 text-green-700",
    text:
      '"Paguei os R$5 e tive a resposta <span class="keyword-highlight">na hora</span>. Achei bem acessível e <span class="keyword-highlight">objetivo</span>, sem enrolação."',
  },
  {
    name: "Paulo Vieira",
    location: "Sinop, MT",
    initials: "PV",
    color: "bg-slate-200 text-slate-600",
    text:
      '"Estava desconfiado, mas a análise foi <span class="keyword-highlight">rápida e segura</span>. Já indiquei para dois amigos."',
  },
  {
    name: "Letícia Carvalho",
    location: "Várzea Grande, MT",
    initials: "LC",
    color: "bg-green-200 text-green-700",
    text:
      '"Um serviço que realmente entrega o que promete: <span class="keyword-highlight">clareza e agilidade</span>. Valeu muito a pena."',
  },
];

const faqItems = [
  {
    question: "Por que só agora eu tenho esse direito?",
    answer:
      "Este direito nasceu de uma longa batalha judicial que chegou ao Supremo Tribunal Federal (STF). A decisão final e as regras para a devolução foram confirmadas recentemente. É o momento perfeito para buscar o que é seu.",
  },
  {
    question: "O que a calculadora realmente faz?",
    answer:
      "Nossa calculadora aplica a fórmula de PIS/COFINS sobre o ICMS, projeta a correção pela taxa Selic e entrega uma estimativa precisa — sem planilhas ou complicações.",
  },
  {
    question: "Não guardei minhas contas antigas. E agora?",
    answer:
      "Pedimos apenas o valor médio do ICMS de uma conta recente. A calculadora usa essa média para projetar os últimos anos de forma inteligente.",
  },
  {
    question: "Qual a vantagem real de usar a plataforma?",
    answer:
      "Tempo, dinheiro e paz de espírito. Em segundos você tem uma resposta segura sobre um direito que pode valer muito, sem labirintos fiscais.",
  },
];

export default function LandingPage() {
  const { user, isAuthenticated, logout } = useAuth();

  const { openPaymentModal } = useSessionManager();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<AuthView>("login");
  const [isSessionPanelOpen, setIsSessionPanelOpen] = useState(false);
  const [isPricingDetailsOpen, setIsPricingDetailsOpen] = useState(false);

  const stepsSectionRef = useRef<HTMLElement | null>(null);
  const testimonialsSectionRef = useRef<HTMLElement | null>(null);
  const stepCardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const testimonialCardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const tiltCardRef = useRef<HTMLDivElement | null>(null);
  const spotlightSectionRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const handleResize = () => {
      setIsPricingDetailsOpen(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const sections = [stepsSectionRef.current, testimonialsSectionRef.current].filter(
      (section): section is HTMLElement => section instanceof HTMLElement
    );

    if (sections.length === 0) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      return;
    }

    let disposed = false;
    let observer: IntersectionObserver | null = null;
    let instances: Array<{ destroy?: () => void }> = [];

    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
        if (existing) {
          if (existing.dataset.loaded === "true") {
            resolve();
            return;
          }
          const handleLoad = () => {
            existing.dataset.loaded = "true";
            resolve();
          };
          const handleError = () => reject(new Error(`Failed to load script: ${src}`));
          existing.addEventListener("load", handleLoad, { once: true });
          existing.addEventListener("error", handleError, { once: true });
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.dataset.vanta = "true";
        script.addEventListener("load", () => {
          script.dataset.loaded = "true";
          resolve();
        });
        script.addEventListener("error", () => reject(new Error(`Failed to load script: ${src}`)));
        document.head.appendChild(script);
      });

    const ensureVanta = async () => {
      if (disposed) {
        return;
      }
      try {
        if (!window.THREE) {
          await loadScript("https://cdn.jsdelivr.net/npm/three@0.134.0/build/three.min.js");
        }
        if (!window.VANTA?.NET) {
          await loadScript("https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.net.min.js");
        }
        if (disposed) {
          return;
        }

        const nav = navigator as Navigator & { deviceMemory?: number };
        const lowSpec =
          (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2) ||
          (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4);

        const baseConfig = {
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color: 0xcccccc,
          backgroundColor: 0xffffff,
          points: 11.0,
          maxDistance: 22.0,
          spacing: 18.0,
        } as const;
        const liteConfig = { ...baseConfig, points: 9.0, maxDistance: 18.0, spacing: 20.0 };
        const config = lowSpec ? liteConfig : baseConfig;

        sections.forEach((section) => {
          const instance = window.VANTA?.NET?.({ el: section, ...config });
          if (instance) {
            instances.push(instance);
          }
        });
      } catch (error) {
        console.error(error);
      }
    };

    const startVanta = () => {
      if (disposed) {
        return;
      }
      void ensureVanta();
    };

    try {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect();
            startVanta();
          }
        },
        { rootMargin: "200px" }
      );
      sections.forEach((section) => observer?.observe(section));
    } catch (_) {
      startVanta();
    }

    return () => {
      disposed = true;
      observer?.disconnect();
      instances.forEach((instance) => {
        try {
          instance?.destroy?.();
        } catch {
          // ignore cleanup errors
        }
      });
      instances = [];
    };
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      stepCardRefs.current.forEach((card) => card?.classList.add("is-visible"));
      testimonialCardRefs.current.forEach((card) => card?.classList.add("is-visible"));
      return;
    }

    const observedSections: Array<{ element: Element; reveal: () => void }> = [];
    const timeouts: number[] = [];

    if (stepsSectionRef.current) {
      observedSections.push({
        element: stepsSectionRef.current,
        reveal: () => {
          stepCardRefs.current.forEach((card) => card?.classList.add("is-visible"));
        },
      });
    }

    if (testimonialsSectionRef.current) {
      observedSections.push({
        element: testimonialsSectionRef.current,
        reveal: () => {
          testimonialCardRefs.current.forEach((card, index) => {
            if (!card) {
              return;
            }
            const timeoutId = window.setTimeout(() => {
              card.classList.add("is-visible");
            }, index * 150);
            timeouts.push(timeoutId);
          });
        },
      });
    }

    if (observedSections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          const sectionConfig = observedSections.find((section) => section.element === entry.target);
          if (!sectionConfig) {
            return;
          }
          sectionConfig.reveal();
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -60px" }
    );

    observedSections.forEach((section) => observer.observe(section.element));

    return () => {
      observer.disconnect();
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const tiltElements = Array.from(
      document.querySelectorAll<HTMLDivElement>(".tilt-card")
    ).filter(
      (element): element is HTMLDivElement => element instanceof HTMLDivElement
    );

    if (tiltElements.length === 0) {
      return;
    }

    const prefersReducedMotion = window
      .matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

    if (prefersReducedMotion) {
      return;
    }

    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max);

    const parseScaleValue = (value: string | null | undefined) => {
      if (!value) {
        return null;
      }
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const ensureBaseScale = (element: HTMLDivElement) => {
      const computedScale = parseScaleValue(
        window.getComputedStyle(element).getPropertyValue("--card-base-scale")
      );
      const datasetScale = parseScaleValue(element.dataset.cardBaseScale);
      const candidate = datasetScale ?? computedScale ?? 1;
      const safeScale = Number.isFinite(candidate) && candidate > 0 ? candidate : 1;
      element.dataset.cardBaseScale = safeScale.toString();
      element.style.setProperty("--card-tilt-scale", safeScale.toString());
      element.style.setProperty("--card-rotate-x", "0deg");
      element.style.setProperty("--card-rotate-y", "0deg");
      return safeScale;
    };

    const getBaseScale = (element: HTMLDivElement) => {
      const stored = parseScaleValue(element.dataset.cardBaseScale);
      if (stored !== null) {
        return stored;
      }
      return ensureBaseScale(element);
    };

    const setTiltState = (
      element: HTMLDivElement,
      rotateX: number,
      rotateY: number,
      multiplier = 1
    ) => {
      const baseScale = getBaseScale(element);
      const scaled = baseScale * multiplier;
      const safeScale =
        Number.isFinite(scaled) && scaled > 0 ? scaled : baseScale;
      element.style.setProperty("--card-rotate-x", `${rotateX}deg`);
      element.style.setProperty("--card-rotate-y", `${rotateY}deg`);
      element.style.setProperty("--card-tilt-scale", safeScale.toString());
    };

    const resetElement = (element: HTMLDivElement) => {
      element.classList.remove("is-tilting", "card-3d--active");
      setTiltState(element, 0, 0, 1);
    };

    const tiltScaleMultiplier = 1.05;

    tiltElements.forEach((element) => {
      element.classList.add("card-3d");
    });

    const updateBaseScales = () => {
      tiltElements.forEach((element) => {
        ensureBaseScale(element);
      });
    };

    updateBaseScales();

    const cleanupCallbacks: Array<() => void> = [];

    window.addEventListener("resize", updateBaseScales);
    cleanupCallbacks.push(() => {
      window.removeEventListener("resize", updateBaseScales);
    });

    const pointerFine = window.matchMedia("(pointer: fine)").matches;

    const setupPointerTilt = () => {
      tiltElements.forEach((element) => {
        let frameId: number | null = null;

        const resetTilt = () => {
          if (frameId !== null) {
            cancelAnimationFrame(frameId);
            frameId = null;
          }
          resetElement(element);
        };

        const handlePointerEnter = () => {
          ensureBaseScale(element);
          element.classList.add("is-tilting", "card-3d--active");
          if (frameId !== null) {
            cancelAnimationFrame(frameId);
            frameId = null;
          }
          setTiltState(element, 0, 0, tiltScaleMultiplier);
        };

        const handlePointerMove = (event: PointerEvent) => {
          const rect = element.getBoundingClientRect();
          const relativeX = (event.clientX - rect.left) / rect.width;
          const relativeY = (event.clientY - rect.top) / rect.height;
          const rotateX = clamp((0.5 - relativeY) * 30, -15, 15);
          const rotateY = clamp((relativeX - 0.5) * 30, -15, 15);

          if (frameId !== null) {
            cancelAnimationFrame(frameId);
          }

          frameId = window.requestAnimationFrame(() => {
            setTiltState(element, rotateX, rotateY, tiltScaleMultiplier);
            frameId = null;
          });
        };

        const handlePointerLeave = () => {
          resetTilt();
        };

        element.addEventListener("pointerenter", handlePointerEnter);
        element.addEventListener("pointermove", handlePointerMove);
        element.addEventListener("pointerleave", handlePointerLeave);
        element.addEventListener("pointercancel", handlePointerLeave);

        cleanupCallbacks.push(() => {
          element.removeEventListener("pointerenter", handlePointerEnter);
          element.removeEventListener("pointermove", handlePointerMove);
          element.removeEventListener("pointerleave", handlePointerLeave);
          element.removeEventListener("pointercancel", handlePointerLeave);
          resetTilt();
        });
      });
    };

    const setupOrientationTilt = () => {
      if (typeof window.DeviceOrientationEvent === "undefined") {
        return;
      }

      let frameId: number | null = null;
      let started = false;
      const last = { beta: 0, gamma: 0 };
      const interactionCleanups: Array<() => void> = [];

      const applyOrientation = (beta: number, gamma: number) => {
        const rotateX = clamp(-beta * 0.25, -15, 15);
        const rotateY = clamp(gamma * 0.25, -15, 15);

        tiltElements.forEach((element) => {
          element.classList.add("card-3d--active", "is-tilting");
          setTiltState(element, rotateX, rotateY, tiltScaleMultiplier);
        });
      };

      const handleOrientation = (event: DeviceOrientationEvent) => {
        const { beta, gamma } = event;

        if (typeof beta !== "number" || typeof gamma !== "number") {
          return;
        }

        const clampedBeta = clamp(beta, -90, 90);
        const clampedGamma = clamp(gamma, -90, 90);

        if (frameId !== null) {
          cancelAnimationFrame(frameId);
        }

        frameId = window.requestAnimationFrame(() => {
          const smoothing = 0.15;

          last.beta += (clampedBeta - last.beta) * smoothing;
          last.gamma += (clampedGamma - last.gamma) * smoothing;

          applyOrientation(last.beta, last.gamma);
          frameId = null;
        });
      };
      
      const stop = () => {
        if (!started) {
          return;
        }

        window.removeEventListener("deviceorientation", handleOrientation);
        started = false;
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
          frameId = null;
        }
        tiltElements.forEach((element) => {
          resetElement(element);
        });
      };

      const cleanupInteractions = () => {
        interactionCleanups.splice(0).forEach((cleanup) => cleanup());
      };

      const start = () => {
        if (started) {
          return;
        }

        cleanupInteractions();
        tiltElements.forEach((element) => {
          ensureBaseScale(element);
        });
        window.addEventListener("deviceorientation", handleOrientation);
        started = true;
      };

      const requestPermission = () => {
        const DeviceOrientation = window.DeviceOrientationEvent as typeof window.DeviceOrientationEvent & {
          requestPermission?: () => Promise<PermissionState | "granted" | "denied">;
        };

        if (typeof DeviceOrientation?.requestPermission === "function") {
          DeviceOrientation.requestPermission()
            .then((state) => {
              if (state === "granted") {
                start();
              }
            })
            .catch(() => {});
        } else {
          start();
        }
      };

      requestPermission();

      if (!started) {
        const registerInteraction = (
          type: keyof DocumentEventMap,
          options?: AddEventListenerOptions
        ) => {
          const handler = () => {
            requestPermission();
          };
          document.addEventListener(type, handler, options);
          interactionCleanups.push(() =>
            document.removeEventListener(type, handler, options)
          );
        };

        registerInteraction("click", { once: true });
        registerInteraction("touchstart", { once: true, passive: true });
      }

      cleanupCallbacks.push(() => {
        cleanupInteractions();
        stop();
      });
    };

    if (pointerFine) {
      setupPointerTilt();
    }

    setupOrientationTilt();

    return () => {
      cleanupCallbacks.forEach((cleanup) => cleanup());
      tiltElements.forEach((element) => {
        resetElement(element);
        element.classList.remove("card-3d");
        element.style.removeProperty("--card-rotate-x");
        element.style.removeProperty("--card-rotate-y");
        element.style.removeProperty("--card-tilt-scale");
        delete element.dataset.cardBaseScale;
      });
    };
  }, []);

  useEffect(() => {
    const sections = spotlightSectionRefs.current.filter(
      (section): section is HTMLElement => Boolean(section)
    );

    if (sections.length === 0) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointerFine = window.matchMedia("(pointer: fine)").matches;
    const cleanups: Array<() => void> = [];

    const setCenter = (section: HTMLElement) => {
      section.style.setProperty("--x", "50%");
      section.style.setProperty("--y", "50%");
    };

    sections.forEach((section) => {
      setCenter(section);

      if (!pointerFine || prefersReducedMotion) {
        return;
      }

      let frameId: number | null = null;

      const handleMove = (event: MouseEvent) => {
        const rect = section.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (frameId) {
          cancelAnimationFrame(frameId);
        }
        frameId = window.requestAnimationFrame(() => {
          section.style.setProperty("--x", `${x}px`);
          section.style.setProperty("--y", `${y}px`);
        });
      };

      const handleLeave = () => {
        if (frameId) {
          cancelAnimationFrame(frameId);
        }
        frameId = null;
        setCenter(section);
      };

      section.addEventListener("mousemove", handleMove);
      section.addEventListener("mouseleave", handleLeave);

      cleanups.push(() => {
        section.removeEventListener("mousemove", handleMove);
        section.removeEventListener("mouseleave", handleLeave);
        if (frameId) {
          cancelAnimationFrame(frameId);
        }
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  const handleOpenAuth = (view: AuthView) => {
    setAuthView(view);
    setIsAuthModalOpen(true);
  };

  const handleCloseAuth = () => {
    setIsAuthModalOpen(false);
  };

  const handleScrollToPricing = (
    event?: ReactMouseEvent<HTMLAnchorElement | HTMLButtonElement>
  ) => {
    event?.preventDefault();
    if (typeof window === "undefined") {
      return;
    }
    const target = document.getElementById("preco");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.hash = "preco";
    }
  };

  const handleUnlockClick = () => {
    if (!isAuthenticated) {
      handleOpenAuth("register");
      return;
    }
    openPaymentModal();
  };

  const toggleSessionPanel = () => {
    setIsSessionPanelOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    // Reutiliza o fluxo centralizado (API + remoção do cookie) mantido no
    // contexto. Aqui não precisamos redirecionar porque o usuário já está na
    // landing page.
    await logout();
    setIsSessionPanelOpen(false);
  };

  const activePricingDetailsHeight = useMemo(() => (isPricingDetailsOpen ? "max-h-[999px]" : "max-h-0"), [isPricingDetailsOpen]);

  const [stepsRef, stepsVisible] = useIntersectionObserver();
  const [testimonialsRef, testimonialsVisible] = useIntersectionObserver();


  return (
    <div className="min-h-screen bg-[var(--background-light)] text-slate-900">
      <header className="glass-effect fixed inset-x-0 top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center space-x-2">
            <Image src="https://i.imgur.com/64Tovft.png" alt="Logotipo CalculaConfia" width={120} height={32} className="h-8 w-auto" />
            <span className="hidden text-2xl font-bold text-slate-800 sm:block">
              Calcula<span className="text-[var(--primary-accent)]">Confia</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn-shine hidden rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-200 sm:px-4 sm:py-2 sm:text-sm"
              onClick={() => (isAuthenticated ? (window.location.href = "/platform") : handleOpenAuth("login"))}
            >
              Acessar Plataforma
            </button>
            <a
              href="#preco"
              className="cta-button rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-md sm:px-4 sm:py-2 sm:text-sm"
              onClick={handleScrollToPricing}
            >
              Iniciar Análise
            </a>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <section className="relative h-screen">
          <Swiper
            modules={[EffectFade, Autoplay, Pagination]}
            effect="fade"
            loop
            pagination={{ clickable: true }}
            autoplay={{ delay: 7000, disableOnInteraction: false }}
            className="hero-carousel h-full"
          >
            {heroSlides.map((slide) => (
              <SwiperSlide key={slide.src}>
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay={slide.autoPlay}
                  loop
                  muted
                  playsInline
                  preload={slide.autoPlay ? "auto" : "metadata"}
                >
                  <source src={slide.src} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-slate-900/70" />
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
            <div id="hero-text-content" className="container mx-auto text-center text-white">
              <span className="mb-4 inline-block rounded-full bg-yellow-500/20 px-4 py-1 text-xs font-semibold text-yellow-300 sm:text-sm">
                Baseado na Decisão do STF - 2025 (Tema 69)
              </span>
              <h1 className="mb-4 text-4xl font-black leading-tight drop-shadow-xl sm:text-5xl md:text-6xl">
                R$5 que revelam se você tem centenas a receber.
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-lg text-slate-200 drop-shadow-lg md:text-xl">
                Descubra em segundos se tem dinheiro a recuperar, com total clareza e segurança.
              </p>
              <a
                href="#preco"
                className="cta-button inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-bold text-white shadow-xl md:px-10 md:py-4 md:text-lg"
                onClick={handleScrollToPricing}
              >
                Descubra Agora
                <LucideIcon name="CircleArrowRight" className="ml-2 inline h-5 w-5 md:h-6 md:w-6" />
              </a>
            </div>
          </div>
        </section>

        <section
          id="comofunciona"
          ref={stepsSectionRef}
          className="cv-auto relative overflow-hidden bg-white py-16 md:py-24"
        >
          <div className="container relative z-10 mx-auto px-6">
            <div className="mx-auto text-center">
              <h2 className="text-3xl font-extrabold md:text-4xl">Fácil como 1, 2, 3.</h2>
              <p className="mt-4 text-slate-700 md:text-lg">
                Simplificamos todo o processo para você ter sua resposta em minutos.
              </p>
            </div>
            <div ref={stepsRef} className="mt-12 grid gap-8 md:grid-cols-3 md:gap-12">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  ref={(element: HTMLDivElement | null) => {
                    stepCardRefs.current[index] = element;
                  }}
                  className={clsx(
                    "tilt-card step-card relative rounded-2xl border-t-4 bg-white p-6 text-center shadow-xl md:p-8",
                    step.highlight
                      ? "border-[var(--primary-accent)] shadow-2xl md:[--card-base-scale:1.1]"
                      : "border-slate-200",
                    stepsVisible && "is-visible"
                  )}
                >
                  {step.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--primary-accent)] px-3 py-1 text-xs font-bold text-white">
                      INDISPENSÁVEL
                    </span>
                  )}
                  <div className="mb-4 text-5xl font-black text-[var(--primary-accent)]">{step.number}</div>
                  <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
                  <p className="text-slate-700">{step.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center md:mt-16">
              <button
                type="button"
                onClick={handleScrollToPricing}
                className="btn-shine inline-block rounded-lg bg-slate-800 px-8 py-3 text-base font-bold text-white shadow-xl transition-transform hover:scale-105 hover:bg-slate-900 md:px-10 md:py-4 md:text-lg"
              >
                Liberar Minha Análise
              </button>
            </div>
          </div>
        </section>

        <section className="bg-slate-800 py-16 text-white md:py-24">
          <div className="container mx-auto grid items-center gap-8 px-6 md:grid-cols-2 md:gap-12">
            <div className="order-last h-80 overflow-hidden rounded-lg md:order-first md:h-96">
              <Image
                src="https://i.imgur.com/r10jtz0.jpeg"
                alt="Pessoa analisando documentos financeiros com tranquilidade"
                width={1200}
                height={800}
                className="h-full w-full object-cover"
                priority={false}
              />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold md:text-4xl">Um direito seu. O primeiro passo para agir.</h2>
              <p className="mt-4 text-slate-300 md:text-lg">
                Empodere suas decisões financeiras. Descubra o valor estimado da sua restituição e decida, de forma inteligente, se buscará o que é seu por direito.
              </p>
              <div className="mt-6 space-y-4 md:text-lg">
                {emotionalHighlights.map((item) => (
                  <div key={item.text} className="flex items-center">
                    <LucideIcon name={item.icon} className="mr-3 h-6 w-6 flex-shrink-0 text-yellow-400" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleScrollToPricing}
                className="cta-button mt-8 inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-bold text-white shadow-xl md:px-8 md:py-4 md:text-lg"
              >
                Veja Agora!
              </button>
            </div>
          </div>
        </section>

        <section
          id="preco"
          ref={(element: HTMLElement | null) => {
            spotlightSectionRefs.current[0] = element;
          }}
          className="spotlight-section cv-auto py-16 md:py-24"
        >
          <div className="relative z-10 container mx-auto max-w-6xl px-6">
            <div className="flex flex-col items-center gap-12 md:grid md:grid-cols-2 md:gap-16">
              <div className="order-1 flex w-full justify-center md:order-2">
                <div
                ref={tiltCardRef}
                className="tilt-card relative w-full max-w-md rounded-2xl border-t-4 border-[var(--primary-accent)] shadow-2xl"
              >
                {/* Camada 1: O Fundo que se move (agora uma div separada) */}
                <div className="animated-gradient-bg absolute inset-0 rounded-2xl"></div>

                {/* Camada 2: O Conteúdo estático (agora em uma div separada com o padding) */}
                <div className="relative flex h-full flex-col p-6 md:p-8">
                  <div className="flex-grow">
                    <div className="flex items-center justify-center space-x-3 pt-8 md:space-x-4">
                      <p className="text-2xl font-medium text-slate-500 line-through md:text-3xl">R$10</p>
                      <p className="text-5xl font-black text-green-600 md:text-6xl">
                        R$5<span className="text-lg font-medium text-slate-600 md:text-xl">,00</span>
                      </p>
                    </div>
                    <p className="mt-4 text-center text-slate-600 md:mt-6 md:text-lg">Pagamento único. Sem mensalidades.</p>
                    <ul className="mt-8 space-y-4 text-left text-sm md:text-base">
                      {pricingBenefits.map((benefit) => (
                        <li key={benefit} className="flex items-center">
                          <LucideIcon name={benefit.includes("Indique") ? "Gift" : "CircleCheckBig"} className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    id="unlock-cta"
                    onClick={handleUnlockClick}
                    className="cta-button mt-8 flex w-full items-center justify-center rounded-lg py-3 text-base font-bold text-white shadow-xl md:py-4 md:text-lg"
                  >
                    Desbloquear Análise por R$5
                  </button>
                </div>
              </div>
              </div>
              <div className="order-2 w-full text-left md:order-1">
                <h2 className="text-3xl font-extrabold md:text-4xl">Acesso Imediato. Potencial Imenso.</h2>
                <div
                  id="pricing-details"
                  className={clsx(
                    "transition-all duration-500 ease-in-out overflow-hidden",
                    activePricingDetailsHeight
                  )}
                >
                  <p className="mt-4 mb-8 text-slate-700 md:text-lg">
                    Antes de continuar, entenda por que este é um investimento inteligente.
                  </p>
                  <div className="space-y-6">
                    {pricingDetails.map((detail) => (
                      <div key={detail.title} className="flex items-start space-x-4">
                        <LucideIcon name={detail.icon} className={clsx("mt-1 h-10 w-10 flex-shrink-0 md:h-12 md:w-12", detail.accent)} />
                        <div>
                          <h3 className="text-lg font-bold md:text-xl">{detail.title}</h3>
                          <p className="text-slate-600">{detail.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="group mt-6 flex items-center font-semibold text-green-600 md:hidden"
                  onClick={() => setIsPricingDetailsOpen((prev) => !prev)}
                >
                  <span>Entenda o porquê</span>
                  <LucideIcon
                    name="ChevronDown"
                    className={clsx("ml-2 h-5 w-5 transition-transform duration-300", isPricingDetailsOpen && "rotate-180")}
                  />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="referral" className="cv-auto bg-slate-50 py-16 text-center md:py-24">
          <div className="container mx-auto max-w-3xl px-6">
            <LucideIcon name="Gift" className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
            <h2 className="text-3xl font-extrabold md:text-4xl">Gostou? Indique e Ganhe!</h2>
            <p className="mt-4 text-slate-700 md:text-lg">
              Transforme sua satisfação em mais oportunidades. Para cada amigo que indicar e que se tornar cliente, você ganha 1 análise extra, totalmente grátis. É a nossa forma de agradecer por confiar em nosso trabalho.
            </p>
          </div>
        </section>

        <section
          id="testimonials"
          ref={testimonialsSectionRef}
          className="cv-auto relative overflow-hidden bg-white py-16 md:py-24"
        >
          <div className="container relative z-10 mx-auto px-6">
            <h2 className="text-center text-3xl font-extrabold md:text-4xl">
              Milhares de Brasileiros <span className="keyword-highlight">Já Confiam</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-slate-700 md:text-lg">
              Veja o que alguns de nossos usuários estão dizendo sobre a experiência com a <strong className="font-semibold text-slate-800">CalculaConfia</strong>.
            </p>
            <div ref={testimonialsRef} className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.name}
                  ref={(element: HTMLDivElement | null) => {
                    testimonialCardRefs.current[index] = element;
                  }}
                  className={clsx("testimonial-grid-card", testimonialsVisible && "is-visible")}
                >
                  <div className="mb-4 flex items-center">
                    <div className={clsx("mr-4 flex h-14 w-14 items-center justify-center rounded-full", testimonial.color)}>
                      <span className="text-xl font-bold">{testimonial.initials}</span>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-800">{testimonial.name}</p>
                      <p className="text-sm text-slate-600">{testimonial.location}</p>
                    </div>
                  </div>
                  <div className="mb-4 flex text-yellow-500">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <LucideIcon key={index} name="Star" className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-700" dangerouslySetInnerHTML={{ __html: testimonial.text }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="faq"
          ref={(element: HTMLElement | null) => {
            spotlightSectionRefs.current[1] = element;
          }}
          className="spotlight-section bg-slate-100 py-16 md:py-24"
        >
          <div className="container relative z-10 mx-auto max-w-4xl px-6">
            <h2 className="text-center text-3xl font-extrabold md:text-4xl">Suas Dúvidas, Nossas Respostas.</h2>
            <div className="mt-12 space-y-4">
              {faqItems.map((item) => (
                <div key={item.question} className={clsx("tilt-card", "faq-item-static rounded-lg bg-white p-6")}>
                  <h3 className="mb-2 flex items-center gap-3 text-lg font-bold text-slate-800">
                    <LucideIcon name="MessageCircleQuestion" className="h-6 w-6 flex-shrink-0 text-green-600" />
                    <span>{item.question}</span>
                  </h3>
                  <p className="pl-9 text-sm text-slate-700 md:text-base">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <AuthModal isOpen={isAuthModalOpen} onClose={handleCloseAuth} defaultView={authView} />

      <div id="session-fab" className="fixed bottom-4 left-4 z-[70]">
        <div
          id="session-toggle"
          className="cursor-pointer rounded-full border border-slate-200 bg-white/90 px-3 py-2 shadow-lg"
          onClick={toggleSessionPanel}
        >
          <div className="flex items-center gap-2">
            <LucideIcon name="User" className="h-4 w-4 text-green-600" />
            <span
              className={clsx(
                "inline-block text-xs font-semibold text-slate-700",
                !isAuthenticated && "session-status-pulse"
              )}
            >
              {isAuthenticated ? user?.first_name ?? "Você está logado" : "Não logado"}
            </span>
          </div>
        </div>
        {isSessionPanelOpen && (
          <div className="mt-2 w-64 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-2xl">
            {isAuthenticated ? (
              <>
                <p className="text-sm font-semibold text-slate-800">Olá, {user?.first_name ?? "usuário"}!</p>
                <button
                  type="button"
                  className="mt-3 w-full rounded-lg bg-red-600 py-2 font-bold text-white hover:bg-red-700"
                  onClick={handleLogout}
                >
                  Sair
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full rounded-lg bg-green-600 py-2 font-bold text-white hover:bg-green-700"
                  onClick={() => handleOpenAuth("login")}
                >
                  Fazer login
                </button>
                <button
                  type="button"
                  className="w-full rounded-lg border border-green-600 py-2 font-bold text-green-600 hover:bg-green-50"
                  onClick={() => handleOpenAuth("register")}
                >
                  Criar conta
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="bg-slate-900 py-12 text-white md:py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold md:text-4xl">Não deixe essa oportunidade passar.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            O primeiro passo para descobrir seu potencial de restituição custa apenas R$5. Comece agora.
          </p>
          <button
            type="button"
            className="cta-button mt-8 inline-block rounded-lg px-6 py-3 text-base font-bold text-white shadow-xl md:px-10 md:py-4 md:text-lg"
            onClick={handleScrollToPricing}
          >
            Sim, Quero Minha Análise
          </button>
          <div className="mt-12 border-t border-slate-700 pt-8 text-xs text-slate-400 sm:text-sm">
            <p className="mx-auto max-w-3xl">
              <strong>Aviso Legal:</strong> Nosso cálculo estimativo é válido em todo o território nacional e restrito a unidades consumidoras residenciais. A CalculaConfia é uma ferramenta de software para estimativa e não constitui aconselhamento jurídico. Os resultados são baseados em dados públicos e nas informações inseridas pelo usuário. Para iniciar um processo de restituição, consulte um advogado.
            </p>
            <p className="mt-6 text-slate-500">© 2025 Torres Project. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}



