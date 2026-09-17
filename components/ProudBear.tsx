"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Sparkles, TrendingUp, X } from "lucide-react";
import ProudBearIcon from "./ProudBearIcon";
import { BEAR_TIPS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { BearTip } from "@/lib/types";

interface ChatMessage {
  id: string;
  from: "bear" | "user";
  text: string;
}

const TONE_STYLES: Record<BearTip["tone"], string> = {
  positive: "border-accent-mint/30 bg-accent-mint/10 text-accent-mint",
  warning: "border-accent-amber/30 bg-accent-amber/10 text-accent-amber",
  info: "border-accent-sky/30 bg-accent-sky/10 text-accent-sky",
};

const QUICK_PROMPTS = [
  "¿Cómo voy con mi presupuesto?",
  "Dame un consejo de ahorro",
  "Analiza mis gastos del mes",
];

function pickMockReply(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("presupuesto")) {
    return "Vas al 68% de tu presupuesto mensual con 12 días restantes. A este ritmo, cerrarás el mes por debajo de lo planeado. ¡Buen control! 🐻";
  }
  if (lower.includes("ahorro") || lower.includes("ahorrar")) {
    return "Prueba la regla 50/30/20: 50% necesidades, 30% deseos, 20% ahorro. Con tus ingresos actuales, eso equivale a ~$730/mes hacia tus metas.";
  }
  if (lower.includes("gasto")) {
    return "Tu categoría con mayor crecimiento es Ocio (+22% vs. agosto). El resto de categorías se mantiene estable o a la baja. ¡Nada de qué preocuparse!";
  }
  return "Analizando tus movimientos... Todo indica que tus finanzas están en buen camino. ¿Quieres que revise alguna categoría en particular?";
}

export default function ProudBear() {
  const [open, setOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const currentTip = BEAR_TIPS[tipIndex];

  function sendPrompt(prompt: string) {
    if (!prompt.trim() || thinking) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), from: "user", text: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), from: "bear", text: pickMockReply(prompt) },
      ]);
      setThinking(false);
    }, 900);
  }

  return (
    <div className="fixed bottom-24 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="glass-panel flex h-[28rem] w-[21rem] flex-col overflow-hidden rounded-3xl border-white/10 shadow-glow sm:w-96"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <ProudBearIcon size={30} />
                <div>
                  <p className="text-sm font-semibold text-white">Proud Bear</p>
                  <p className="flex items-center gap-1 text-[11px] text-accent-mint">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-mint animate-pulse-soft" />
                    Tu asistente financiero
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar asistente"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin px-4 py-4">
              <div
                className={cn(
                  "rounded-2xl border px-3.5 py-3 text-xs leading-relaxed",
                  TONE_STYLES[currentTip.tone],
                )}
              >
                <p className="mb-1 flex items-center gap-1.5 font-semibold">
                  <Sparkles size={13} /> {currentTip.title}
                </p>
                <p className="text-slate-200/90">{currentTip.message}</p>
                <button
                  onClick={() => setTipIndex((i) => (i + 1) % BEAR_TIPS.length)}
                  className="mt-2 text-[11px] font-medium underline decoration-dotted underline-offset-2 opacity-80 hover:opacity-100"
                >
                  Siguiente consejo
                </button>
              </div>

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex", msg.from === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed",
                      msg.from === "user"
                        ? "bg-accent-mint/15 text-slate-100"
                        : "bg-white/[0.06] text-slate-200",
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {thinking && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1 rounded-2xl bg-white/[0.06] px-3.5 py-2.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]" />
                  </div>
                </div>
              )}

              {messages.length === 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendPrompt(prompt)}
                      className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-slate-300 hover:bg-white/[0.08]"
                    >
                      <TrendingUp size={11} />
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendPrompt(input);
              }}
              className="flex items-center gap-2 border-t border-white/10 bg-white/[0.03] p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregúntale a Proud Bear…"
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-accent-mint/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || thinking}
                aria-label="Enviar"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-mint text-background disabled:opacity-40"
              >
                <ArrowUp size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.92 }}
        aria-label="Abrir asistente Proud Bear"
        className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] shadow-glow backdrop-blur-xl animate-float"
      >
        <ProudBearIcon size={38} />
      </motion.button>
    </div>
  );
}
