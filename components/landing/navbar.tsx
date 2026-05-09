export function Navbar({ variant }: { variant?: "login" }) {
  const planosHref = variant === "login" ? "/#planos" : "#planos"
  const comoFuncionaHref = variant === "login" ? "/#como-funciona" : "#como-funciona"

  return (
    <nav className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-b from-muted/50 to-muted/30 backdrop-blur-sm border-b border-border/50 opacity-100 translate-y-0 animate-navbar-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-16 w-full">
          <div className="flex items-center gap-4 sm:gap-6">
            {variant === "login" ? (
              <>
                <a
                  href="/"
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Voltar
                </a>
                <a
                  href={planosHref}
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Planos
                </a>
                <a
                  href={comoFuncionaHref}
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Como funciona
                </a>
                <a
                  href="/termos"
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Termos
                </a>
                <a
                  href="https://wa.me/212693974294?text=Ol%C3%A1%2C%20tenho%20interesse%20em%20contratar%20um%20plano."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Contato
                </a>
              </>
            ) : (
              <>
                <a
                  href={planosHref}
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Planos
                </a>
                <a
                  href={comoFuncionaHref}
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Como funciona
                </a>
                <a
                  href="/dashboard"
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Área do Cliente
                </a>
                <a
                  href="/termos"
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Termos
                </a>
                <a
                  href="https://wa.me/212693974294?text=Ol%C3%A1%2C%20tenho%20interesse%20em%20contratar%20um%20plano."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Contato
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
