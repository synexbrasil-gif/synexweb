import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Synex Brasil",
  description: "Termos de uso da plataforma Synex Brasil.",
}

const sections = [
  {
    title: "1. Aceite dos termos",
    content:
      "Ao acessar ou utilizar a Synex Brasil, você declara que leu, compreendeu e concorda com estes Termos de Uso. Caso não concorde com alguma condição, recomendamos que não utilize a plataforma.",
  },
  {
    title: "2. Sobre o serviço",
    content:
      "A Synex Brasil oferece uma experiência de acesso e organização de conteúdos esportivos e canais ao vivo pela internet. A disponibilidade, estabilidade e qualidade podem variar conforme conexão, dispositivo, navegador, região e fontes de transmissão.",
  },
  {
    title: "3. Cadastro e acesso",
    content:
      "O usuário é responsável por fornecer dados corretos, manter suas credenciais em sigilo e utilizar a conta apenas para fins pessoais. O compartilhamento indevido de acesso pode gerar suspensão ou cancelamento do serviço.",
  },
  {
    title: "4. Planos, renovação e pagamentos",
    content:
      "Os valores, prazos e condições dos planos podem ser alterados mediante aviso ou atualização no site. A renovação do acesso depende da confirmação do pagamento e da validação dos dados vinculados ao contrato.",
  },
  {
    title: "5. Uso adequado",
    content:
      "É proibido utilizar a plataforma para fins ilegais, revender acessos sem autorização, tentar burlar limitações técnicas, explorar falhas, automatizar acessos abusivos ou prejudicar a experiência de outros usuários.",
  },
  {
    title: "6. Suporte",
    content:
      "O suporte pode ser realizado pelos canais de atendimento informados pela Synex Brasil. O tempo de resposta pode variar conforme demanda, horário e complexidade da solicitação.",
  },
  {
    title: "7. Limitação de responsabilidade",
    content:
      "A Synex Brasil busca manter a melhor experiência possível, mas não garante funcionamento ininterrupto. Instabilidades de terceiros, manutenções, bloqueios de rede, falhas no dispositivo ou problemas de internet podem afetar o acesso.",
  },
  {
    title: "8. Alterações nos termos",
    content:
      "Estes Termos de Uso podem ser atualizados a qualquer momento. A continuidade do uso da plataforma após alterações representa concordância com a versão mais recente.",
  },
]

export default function TermsPage() {
  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_42%,oklch(0.92_0_0)_100%)] text-foreground"
      style={{ animation: "synex-fade-in 420ms ease-out both" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,oklch(0.93_0_0)_0%,oklch(0.98_0_0)_42%,oklch(0.92_0_0)_100%)]" />
      <div className="gradient-glow gradient-glow-1" style={{ top: "-220px", left: "-180px" }} />
      <div className="gradient-glow gradient-glow-2" style={{ top: "160px", right: "-220px" }} />
      <div className="gradient-glow gradient-glow-3" style={{ bottom: "-260px", left: "25%" }} />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <section className="py-10 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Termos de Uso</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
            Regras de uso da Synex Brasil
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
            Leia com atenção as condições abaixo. Elas explicam as responsabilidades de uso, acesso, suporte, pagamentos e renovações da plataforma.
          </p>
        </section>

        <section className="mb-10 overflow-hidden rounded-lg border border-border/70 bg-[linear-gradient(135deg,oklch(0.99_0_0)_0%,oklch(0.97_0_0)_50%,oklch(0.94_0_0)_100%)] shadow-sm">
          {sections.map((section) => (
            <article key={section.title} className="border-b border-border/60 p-5 last:border-0 sm:p-6">
              <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{section.content}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
