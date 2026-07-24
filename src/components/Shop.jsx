import { SHOP_ITEMS, EQUIPMENT } from "../data/gameData";

export default function Shop({ coin, level, onBuyItem }) {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-[#1e2030] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold text-amber-400">商店</h3>
        <span className="text-sm text-amber-300">铜币: {coin}</span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
        {/* Shop consumables */}
        {SHOP_ITEMS.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-gray-700 bg-[#161825] px-3 py-2"
          >
            <div>
              <div className="text-sm font-bold text-gray-200">{item.name}</div>
              <div className="text-xs text-gray-400">{item.description}</div>
            </div>
            <button
              onClick={() => onBuyItem(item.id)}
              disabled={coin < item.price}
              className="rounded bg-amber-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-amber-500 disabled:opacity-30"
            >
              {item.price} 铜币
            </button>
          </div>
        ))}

        {/* Equipment for sale */}
        {Object.values(EQUIPMENT)
          .filter((item) => item.levelRequired <= level)
          .map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-gray-700 bg-[#161825] px-3 py-2"
            >
              <div>
                <div className="text-sm font-bold text-gray-200">{item.name}</div>
                <div className="text-xs text-gray-400">
                  {item.type === "weapon" ? "武器" : "防具"}
                  {item.atkBonus ? ` 攻+${item.atkBonus}` : ""}
                  {item.defBonus ? ` 防+${item.defBonus}` : ""}
                  {item.hpBonus ? ` 血+${item.hpBonus}` : ""}
                  {item.spdBonus ? ` 速+${item.spdBonus}` : ""}
                </div>
              </div>
              <button
                onClick={() => onBuyItem(item.id)}
                disabled={coin < item.price}
                className="rounded bg-amber-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-amber-500 disabled:opacity-30"
              >
                {item.price} 铜币
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
