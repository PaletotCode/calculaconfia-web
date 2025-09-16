"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import { useMutation } from "@tanstack/react-query";
import AuthModal from "@/components/AuthModal";
import { LucideIcon } from "@/components/LucideIcon";
import useAuth from "@/hooks/useAuth";
import { createOrder, extractErrorMessage } from "@/lib/api";

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: Record<string, unknown>) => {
      checkout: (config: { preference: { id: string } }) => void;
    };
  }
}

type AuthView = "login" | "register" | "verify";

type PaymentStatus = {
  title: string;
  message: string;
  type: "info" | "success" | "error";
};

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

const emotionalHighlights = [
  {
    icon: "check-circle-2",
    text: "A informação clara que você precisa para decidir.",
  },
  {
    icon: "check-circle-2",
    text: "Uma ferramenta ágil para planejar seu próximo passo.",
  },
  {
    icon: "check-circle-2",
    text: "A segurança de estar no controle da sua decisão.",
  },
];

const pricingBenefits = [
  "3 Análises com nossa calculadora avançada",
  "Acesso à plataforma e atualizações",
  "Histórico de consultas para seu controle",
  "Indique um amigo e ganhe 1 análise grátis!",
];

const pricingDetails = [
  {
    icon: "alert-triangle",
    title: "O Problema Real",
    description:
      "O STF decidiu: a cobrança de PIS/COFINS sobre o ICMS na sua conta de luz foi ilegal. Por anos, você pagou a mais sem saber.",
    accent: "text-yellow-500",
  },
  {
    icon: "calculator",
    title: "A Solução Simples",
    description:
      "Nossa plataforma faz o trabalho complexo: calcula o valor estimado que você pode ter a receber, com a devida correção monetária.",
    accent: "text-green-600",
  },
  {
    icon: "key-round",
    title: "O Investimento Inteligente",
    description:
      "Por um valor simbólico, você destrava o acesso à informação que mostrará o valor estimado a ser restituído. Esse é o primeiro passo para reaver seu dinheiro.",
    accent: "text-slate-600",
  },
];

const testimonials = [
  {
    name: "Carlos Silva",
    location: "São Paulo, SP",
    initials: "CS",
    color: "bg-slate-200 text-slate-600",
    text:
      '"Fiquei <span class="keyword-highlight">chocado com o valor</span> que tinha a receber. O processo foi <span class="keyword-highlight">ridiculamente fácil</span>. Paguei os 5 reais e <span class="keyword-highlight">valeu cada centavo</span>."',
  },
  {
    name: "Juliana Martins",
    location: "Belo Horizonte, MG",
    initials: "JM",
    color: "bg-green-200 text-green-700",
    text:
      '"Sempre achei que isso era <span class="keyword-highlight">complicado demais</span>. A plataforma me deu o <span class="keyword-highlight">número exato em minutos</span>. <span class="keyword-highlight">Recomendo para todo mundo!</span>"',
  },
  {
    name: "Ricardo Mendes",
    location: "Rio de Janeiro, RJ",
    initials: "RM",
    color: "bg-slate-200 text-slate-600",
    text:
      '"Usei para mim e para minha mãe. A <span class="keyword-highlight">clareza da informação</span> é o que mais impressiona. <span class="keyword-highlight">Sem enrolação, direto ao ponto.</span>"',
  },
  {
    name: "Ana Pereira",
    location: "Salvador, BA",
    initials: "AP",
    color: "bg-green-200 text-green-700",
    text:
      '"Uma <span class="keyword-highlight">ferramenta essencial!</span> O valor que paguei foi <span class="keyword-highlight">simbólico</span> perto da <span class="keyword-highlight">informação valiosa</span> que recebi. Já indiquei pra família toda."',
  },
  {
    name: "Lucas Costa",
    location: "Curitiba, PR",
    initials: "LC",
    color: "bg-slate-200 text-slate-600",
    text:
      '"<span class="keyword-highlight">Totalmente seguro e confiável.</span> Tinha receio, mas a plataforma é super profissional. O <span class="keyword-highlight">resultado sai na hora</span>, impressionante."',
  },
  {
    name: "Sofia Almeida",
    location: "Fortaleza, CE",
    initials: "SA",
    color: "bg-green-200 text-green-700",
    text:
      '"Finalmente uma <span class="keyword-highlight">forma clara de entender</span> esse direito. <span class="keyword-highlight">Valeu muito a pena</span> o pequeno investimento para ter essa estimativa em mãos."',
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
  const { user, isAuthenticated, logout, refresh } = useAuth();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<AuthView>("login");
  const [isPaymentCardOpen, setIsPaymentCardOpen] = useState(false);
  const [isPaymentStatusOpen, setIsPaymentStatusOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    title: "Status do pagamento",
    message: "Estamos analisando as informações do seu pagamento.",
    type: "info",
  });
  const [isSessionPanelOpen, setIsSessionPanelOpen] = useState(false);
  const [isPricingDetailsOpen, setIsPricingDetailsOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsPricingDetailsOpen(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      if (window.MercadoPago && data.preference_id) {
        try {
          const mp = new window.MercadoPago(
            process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ?? "",
            { locale: "pt-BR" }
          );
          mp.checkout({ preference: { id: data.preference_id } });
          setPaymentStatus({
            title: "Pronto para pagar",
            message: "Abrimos o checkout em uma nova janela. Conclua o pagamento para liberar seus créditos.",
            type: "info",
          });
          setIsPaymentStatusOpen(true);
          return;
        } catch (error) {
          console.error(error);
        }
      }
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    },
    onError: (error) => {
      setPaymentStatus({
        title: "Não foi possível iniciar",
        message: extractErrorMessage(error),
        type: "error",
      });
      setIsPaymentStatusOpen(true);
    },
  });

  const handleOpenAuth = (view: AuthView) => {
    setAuthView(view);
    setIsAuthModalOpen(true);
  };

  const handleCloseAuth = () => {
    setIsAuthModalOpen(false);
  };

  const handleUnlockClick = () => {
    if (!isAuthenticated) {
      handleOpenAuth("register");
      return;
    }
    setIsPaymentCardOpen(true);
  };

  const handleBuyCredits = () => {
    createOrderMutation.mutate();
  };

  const handleCheckBalance = async () => {
    await refresh();
    setPaymentStatus({
      title: "Saldo atualizado",
      message: "Atualizamos suas informações. Se já concluiu o pagamento, verifique seus créditos na plataforma.",
      type: "success",
    });
    setIsPaymentStatusOpen(true);
  };

  const closePaymentStatus = () => {
    setIsPaymentStatusOpen(false);
  };

  const closePaymentCard = () => {
    setIsPaymentCardOpen(false);
  };

  const toggleSessionPanel = () => {
    setIsSessionPanelOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    await logout();
    setIsSessionPanelOpen(false);
  };

  const activePricingDetailsHeight = useMemo(() => (isPricingDetailsOpen ? "max-h-[999px]" : "max-h-0"), [isPricingDetailsOpen]);

  return (
    <div className="min-h-screen bg-[var(--background-light)] text-slate-900">
      <header className="glass-effect fixed inset-x-0 top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center space-x-2">
            <img src="https://i.imgur.com/64Tovft.png" alt="Logotipo CalculaConfia" className="h-8 w-auto" />
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
                É seu direito! Veja agora o quanto você poderá receber.
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-lg text-slate-200 drop-shadow-lg md:text-xl">
                Nossa calculadora analisa seu caso e revela sua estimativa em segundos. É simples, rápido e seguro.
              </p>
              <a href="#preco" className="cta-button inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-bold text-white shadow-xl md:px-10 md:py-4 md:text-lg">
                Descubra Agora
                <LucideIcon name="arrow-right-circle" className="ml-2 inline h-5 w-5 md:h-6 md:w-6" />
              </a>
            </div>
          </div>
        </section>

        <section id="comofunciona" className="cv-auto relative overflow-hidden bg-white py-16 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto text-center">
              <h2 className="text-3xl font-extrabold md:text-4xl">Fácil como 1, 2, 3.</h2>
              <p className="mt-4 text-slate-700 md:text-lg">
                Simplificamos todo o processo para você ter sua resposta em minutos.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-12">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className={clsx(
                    "step-card relative rounded-2xl border-t-4 bg-white p-6 text-center shadow-xl md:p-8",
                    step.highlight ? "border-[var(--primary-accent)] shadow-2xl md:scale-110" : "border-slate-200"
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
                onClick={handleUnlockClick}
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
              <img
                src="https://i.imgur.com/r10jtz0.jpeg"
                alt="Pessoa analisando documentos financeiros com tranquilidade"
                className="h-full w-full object-cover"
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
                onClick={handleUnlockClick}
                className="cta-button mt-8 inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-bold text-white shadow-xl md:px-8 md:py-4 md:text-lg"
              >
                Veja Agora!
              </button>
            </div>
          </div>
        </section>

        <section id="preco" className="spotlight-section cv-auto py-16 md:py-24">
          <div className="relative z-10 container mx-auto max-w-6xl px-6">
            <div className="flex flex-col items-center gap-12 md:grid md:grid-cols-2 md:gap-16">
              <div className="order-1 flex w-full justify-center md:order-2">
                <div className="tilt-card animated-gradient-bg w-full max-w-md rounded-2xl border-t-4 border-[var(--primary-accent)] p-6 shadow-2xl md:p-8">
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
                        <LucideIcon name={benefit.includes("Indique") ? "gift" : "check-circle-2"} className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
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
                    name="chevron-down"
                    className={clsx("ml-2 h-5 w-5 transition-transform duration-300", isPricingDetailsOpen && "rotate-180")}
                  />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="referral" className="cv-auto bg-slate-50 py-16 text-center md:py-24">
          <div className="container mx-auto max-w-3xl px-6">
            <LucideIcon name="gift" className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
            <h2 className="text-3xl font-extrabold md:text-4xl">Gostou? Indique e Ganhe!</h2>
            <p className="mt-4 text-slate-700 md:text-lg">
              Transforme sua satisfação em mais oportunidades. Para cada amigo que indicar e que se tornar cliente, você ganha 1 análise extra, totalmente grátis. É a nossa forma de agradecer por confiar em nosso trabalho.
            </p>
          </div>
        </section>

        <section id="testimonials" className="cv-auto relative overflow-hidden bg-white py-16 md:py-24">
          <div className="container relative z-10 mx-auto px-6">
            <h2 className="text-center text-3xl font-extrabold md:text-4xl">
              Milhares de Brasileiros <span className="keyword-highlight">Já Confiam</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-slate-700 md:text-lg">
              Veja o que alguns de nossos usuários estão dizendo sobre a experiência com a <strong className="font-semibold text-slate-800">CalculaConfia</strong>.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div key={testimonial.name} className="testimonial-grid-card">
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
                      <LucideIcon key={index} name="star" className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-700" dangerouslySetInnerHTML={{ __html: testimonial.text }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="spotlight-section bg-slate-100 py-16 md:py-24">
          <div className="container relative z-10 mx-auto max-w-4xl px-6">
            <h2 className="text-center text-3xl font-extrabold md:text-4xl">Suas Dúvidas, Nossas Respostas.</h2>
            <div className="mt-12 space-y-4">
              {faqItems.map((item) => (
                <div key={item.question} className="faq-item-static rounded-lg bg-white p-6">
                  <h3 className="mb-2 flex items-center gap-3 text-lg font-bold text-slate-800">
                    <LucideIcon name="help-circle" className="h-6 w-6 flex-shrink-0 text-green-600" />
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

      {isPaymentStatusOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 px-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 text-center shadow-2xl md:p-8">
            <button
              type="button"
              onClick={closePaymentStatus}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              title="Fechar aviso"
            >
              <LucideIcon name="x" className="h-5 w-5" />
            </button>
            <LucideIcon
              name={paymentStatus.type === "success" ? "check-circle" : paymentStatus.type === "error" ? "alert-triangle" : "info"}
              className={clsx(
                "mx-auto mb-4 h-12 w-12",
                paymentStatus.type === "success"
                  ? "text-green-500"
                  : paymentStatus.type === "error"
                  ? "text-red-500"
                  : "text-slate-500"
              )}
            />
            <h2 className="mb-2 text-xl font-bold text-slate-800">{paymentStatus.title}</h2>
            <p className="text-slate-700">{paymentStatus.message}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="flex-1 rounded-lg bg-green-600 py-2.5 font-semibold text-white hover:bg-green-700"
                onClick={() => {
                  closePaymentStatus();
                  if (!isAuthenticated) {
                    handleOpenAuth("login");
                  }
                }}
              >
                Continuar
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg bg-slate-200 py-2.5 font-semibold text-slate-800 hover:bg-slate-300"
                onClick={closePaymentStatus}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {isPaymentCardOpen && (
        <div className="fixed inset-0 z-[60] flex min-h-full items-center justify-center bg-black/60 p-4">
          <div className="payment-card relative w-full max-w-xl rounded-2xl border border-green-200 bg-white p-8 shadow-2xl md:p-10">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-extrabold text-slate-800">Comprar Créditos</h3>
              <button type="button" onClick={closePaymentCard} className="text-slate-500 hover:text-slate-700" title="Fechar">
                <LucideIcon name="x" className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-6 rounded-xl border border-green-100 bg-green-50 p-4 text-green-800">
              <p className="font-bold">Desbloqueie agora sua análise exclusiva por apenas R$5!</p>
              <p className="mt-1 text-sm">
                Ganhe acesso imediato e descubra oportunidades que você não pode perder. <strong>Oferta limitada</strong>, aproveite enquanto está disponível.
              </p>
            </div>
            {createOrderMutation.isError && (
              <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
                {extractErrorMessage(createOrderMutation.error)}
              </div>
            )}
            <button
              type="button"
              className="btn-gradient-animated w-full rounded-xl py-4 text-lg font-bold text-white transition hover:scale-[1.03]"
              onClick={handleBuyCredits}
              disabled={createOrderMutation.isLoading}
            >
              {createOrderMutation.isLoading ? "Gerando checkout..." : "Comprar créditos!"}
            </button>
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm font-medium text-green-700 hover:text-green-800"
                onClick={handleCheckBalance}
              >
                Já paguei, verificar saldo
              </button>
            </div>
          </div>
        </div>
      )}

      <div id="session-fab" className="fixed bottom-4 left-4 z-[70]">
        <div
          id="session-toggle"
          className="cursor-pointer rounded-full border border-slate-200 bg-white/90 px-3 py-2 shadow-lg"
          onClick={toggleSessionPanel}
        >
          <div className="flex items-center gap-2">
            <LucideIcon name="user" className="h-4 w-4 text-green-600" />
            <span className="text-xs font-semibold text-slate-700">
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
            onClick={handleUnlockClick}
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