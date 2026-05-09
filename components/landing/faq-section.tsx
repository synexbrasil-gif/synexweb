"use client"

import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "O que é a Synex Brasil?",
    answer: "Synex Brasil é uma plataforma focada em canais esportivos ao vivo, com acesso pela internet e player pelo navegador.",
  },
  {
    question: "Como faço para assinar?",
    answer: "Basta escolher um plano, realizar o pagamento e o acesso é liberado automaticamente em poucos minutos.",
  },
  {
    question: "Onde posso assistir?",
    answer: "Por enquanto, o player funciona pelo navegador. Você pode acessar pelo computador, celular, tablet ou Smart TV com navegador atualizado.",
  },
  {
    question: "O acesso é imediato após o pagamento?",
    answer: "Sim, após a confirmação do pagamento, o acesso é liberado automaticamente em poucos minutos.",
  },
  {
    question: "Posso cancelar quando quiser?",
    answer: "Sim, você pode cancelar sua assinatura a qualquer momento, sem burocracia.",
  },
  {
    question: "O serviço funciona em qualquer lugar?",
    answer: "Sim, você pode acessar de qualquer lugar pelo navegador, basta ter uma conexão estável com a internet.",
  },
]

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-2xl border border-border bg-background open:shadow-lg">
      <summary className="flex w-full cursor-pointer list-none items-center justify-between p-6 text-left [&::-webkit-details-marker]:hidden">
        <span className="pr-4 text-lg font-semibold text-foreground">{question}</span>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted text-foreground transition-all group-open:rotate-180 group-open:bg-foreground group-open:text-background">
          <ChevronDown className="h-5 w-5" />
        </div>
      </summary>
      <div className="px-6 pb-6">
        <p className="leading-relaxed text-muted-foreground">{answer}</p>
      </div>
    </details>
  )
}

export function FaqSection() {
  return (
    <section id="faq" className="relative overflow-hidden py-20 scroll-mt-20 md:py-32">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Perguntas Frequentes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Tire suas dúvidas sobre os canais esportivos da Synex, planos, acesso pelo navegador e mais.
          </p>
        </div>

        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {faqs.map((faq, index) => (
            <FaqItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  )
}
