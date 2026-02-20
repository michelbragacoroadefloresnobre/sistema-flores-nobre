import Image from "next/image";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
                <p className="text-sm text-muted-foreground">
                  Finalize sua compra de forma segura
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Image
                width={200}
                height={200}
                src="https://nobre-coroa-fotos.s3.us-east-1.amazonaws.com/LOGO%20OFICIAL.png"
                alt="logotipo da nobre coroa de flores"
                className="size-10 object-cover rounded-md"
              />
              <div className="hidden md:block">
                <h2 className="text-xl font-bold text-primary">Flores Nobre</h2>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 grow flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border bg-card mt-auto">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 Coroa de Flores Nobre. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
