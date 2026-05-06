"use client"

import Link from "next/link"

function scrollToSection(e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) {
  e.preventDefault()
  const element = document.querySelector(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: "smooth" })
  }
}

export function Footer() {
  return (
    <footer id="contato" className="border-t border-border py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="font-semibold text-lg text-foreground">Synex Brasil</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              Canais esportivos ao vivo com qualidade, estabilidade e suporte
              para você acompanhar seus jogos e eventos favoritos.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Links rápidos</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="#planos" 
                  onClick={(e) => scrollToSection(e, "#planos")}
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors cursor-pointer"
                >
                  Planos
                </a>
              </li>
              <li>
                <a 
                  href="#como-funciona" 
                  onClick={(e) => scrollToSection(e, "#como-funciona")}
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors cursor-pointer"
                >
                  Como funciona
                </a>
              </li>
              <li>
                <a 
                  href="#faq" 
                  onClick={(e) => scrollToSection(e, "#faq")}
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors cursor-pointer"
                >
                  Faq
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Contato</h3>
            <ul className="space-y-3">
              <li>
                <a href="mailto:suporte@streammax.com" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  suporte@streammax.com
                </a>
              </li>
              <li>
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>


      </div>
    </footer>
  )
}
