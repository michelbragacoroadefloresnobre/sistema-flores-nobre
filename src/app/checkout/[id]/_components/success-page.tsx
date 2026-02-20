import { Payment } from "@/generated/prisma/browser";
import { CheckCircle, CreditCard, ShoppingBag } from "lucide-react";

export const CheckoutSuccess = ({ payment }: { payment: Payment }) => {
  const orderData = {
    orderId: "#NOBRE" + payment.orderId,
    price: payment.amount,
  };

  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-card text-card-foreground rounded-2xl shadow-2xl overflow-hidden border border-border">
          <div className="bg-success p-8 text-center flex flex-col items-center text-white">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-success-foreground rounded-full mb-4">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold text-success-foreground mb-2">
              Pagamento Confirmado!
            </h1>
            <p className="text-success-foreground/80 text-lg">
              Seu pedido foi processado com sucesso
            </p>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-muted rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <ShoppingBag className="w-6 h-6 text-success" />
                <h2 className="text-xl font-semibold text-foreground">
                  Detalhes do Pedido
                </h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Número do Pedido:
                  </span>
                  <span className="font-semibold text-foreground">
                    {orderData.orderId}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Valor Total:</span>
                  <span className="font-bold text-success text-xl">
                    R$ {Number(payment.amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg border border-border/50">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Pago com</p>
                <p className="font-medium text-foreground">Cartão de Crédito</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
