import { TradeColumn } from "./TradeColumn";
import { ResultMeter } from "./ResultMeter";

export function TradeBoard() {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid min-w-0 gap-3 lg:grid-cols-2">
        <TradeColumn
          side="you"
          title="O Teu Lado"
          hint="O que dás na janela de troca"
        />
        <TradeColumn
          side="them"
          title="Lado do Outro Jogador"
          hint="O que recebes — o detetor de lixo corre aqui"
        />
      </div>
      <ResultMeter />
    </div>
  );
}
