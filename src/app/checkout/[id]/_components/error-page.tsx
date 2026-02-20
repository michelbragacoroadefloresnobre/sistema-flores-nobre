import { XCircle } from "lucide-react";

export const CheckoutFailure = ({
  setError,
  value,
  lastCardDigits,
}: {
  setError: (v: boolean) => any;
  value: string;
  lastCardDigits: string;
}) => {
  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-stone-50 rounded-xl shadow-lg overflow-hidden">
          {/* Header compacto */}
          <div className="bg-linear-to-r from-red-500 to-rose-600 p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-50 rounded-full mb-3">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Pagamento Recusado
            </h1>
            <p className="text-red-100 text-sm">
              Não foi possível processar o pagamento
            </p>
          </div>

          {/* Conteúdo compacto */}
          <div className="p-6 space-y-4">
            {/* Resumo simples */}
            <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-stone-600">Valor:</span>
                <span className="font-semibold text-stone-800">R$ {value}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">Cartão:</span>
                <span className="font-medium text-stone-800">
                  •••• {lastCardDigits}
                </span>
              </div>
            </div>

            {/* Sugestão simples */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-stone-700">
                <strong>Sugestões:</strong> Verifique os dados do cartão, o
                limite disponível ou tente outro cartão.
              </p>
            </div>

            {/* Botão único */}
            <button
              onClick={() => setError(false)}
              className="w-full bg-linear-to-r from-red-500 to-rose-600 text-white font-semibold py-3 rounded-lg hover:from-red-600 hover:to-rose-700 transition-all shadow-md"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
