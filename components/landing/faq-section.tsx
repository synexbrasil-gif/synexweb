"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    question: "O que é a Synex Brasil?",
    answer: "Synex Brasil é uma plataforma focada em canais esportivos ao vivo, com acesso pela internet e compatibilidade com diversos dispositivos."
  },
  {
    question: "Como faço para assinar?",
    answer: "Basta escolher um plano, realizar o pagamento e o acesso é liberado imediatamente. Você pode testar grátis antes de assinar."
  },
  {
    question: "Quais dispositivos são compatíveis?",
    answer: "Você pode assistir em Smart TVs, celulares, computadores, TV Box, tablets e outros dispositivos com acesso à internet."
  },
  {
    question: "O acesso é imediato após o pagamento?",
    answer: "Sim, após a confirmação do pagamento, o acesso é liberado automaticamente em poucos minutos."
  },
  {
    question: "Posso cancelar quando quiser?",
    answer: "Sim, você pode cancelar sua assinatura a qualquer momento, sem burocracia."
  },
  {
    question: "O serviço funciona em qualquer lugar?",
    answer: "Sim, você pode acessar de qualquer lugar, basta ter uma conexão estável com a internet."
  }
]

function FaqItem({ question, answer, isOpen, onClick }: { 
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void 
}) {
  return (
    <div 
      className={cn(
        "rounded-2xl border bg-background border-border",
        isOpen && "shadow-lg"
      )}
    >
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className="font-semibold text-lg pr-4 text-foreground">
          {question}
        </span>
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          isOpen 
            ? "bg-foreground text-background rotate-180" 
            : "bg-muted text-foreground"
        )}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>
      {isOpen && (
        <div className="px-6 pb-6">
          <p className="leading-relaxed text-muted-foreground">
            {answer}
          </p>
        </div>
      )}
    </div>
  )
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20 md:py-32 scroll-mt-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Perguntas Frequentes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Tire suas dúvidas sobre os canais esportivos da Synex, planos, dispositivos compatíveis e mais.
          </p>
        </div>

        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {faqs.map((faq, index) => (
            <FaqItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
