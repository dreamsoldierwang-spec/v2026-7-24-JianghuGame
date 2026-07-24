import { EQUIPMENT, SHOP_ITEMS } from "../data/gameData";

export default function Inventory({ inventory, equipped, consumables, onEquip, onUseItem }) {
  const grouped = {};
  inventory.forEach((itemId) => {
    grouped[itemId] = (grouped[itemId] || 0) + 1;
  });

  return (
    <div className="rounded-xl border border-amber-500/20 bg-[#1e2030] p-4">
      <h3 className="mb-3 text-lg font-bold text-amber-400">背包</h3>

      {Object.keys(grouped).length === 0 && Object.keys(consumables).length === 0 && (
        <p className="py-4 text-center text-sm text-gray-500">背包空空如也</p>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
        {/* Equipment */}
        {Object.entries(grouped).map(([itemId, count]) => {
          const item = EQUIPMENT[itemId];
          if (!item) return null;
          const isEquipped = equipped.weapon === itemId || equipped.armor === itemId;
          return (
            <div
              key={itemId}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                isEquipped
                  ? "border-amber-500/50 bg-amber-500/10"
                  : "border-gray-700 bg-[#161825]"
              }`}
            >
              <div>
                <div className="text-sm font-bold text-gray-200">
                  {item.name} {count > 1 && <span className="text-xs text-gray-500">x{count}</span>}
                </div>
                <div className="text-xs text-gray-400">
                  {item.type === "weapon" ? "武器" : "防具"}
                  {item.atkBonus ? ` 攻+${item.atkBonus}` : ""}
                  {item.defBonus ? ` 防+${item.defBonus}` : ""}
                  {item.hpBonus ? ` 血+${item.hpBonus}` : ""}
                  {item.spdBonus ? ` 速+${item.spdBonus}` : ""}
                </div>
              </div>
              <button
                onClick={() => onEquip(itemId)}
                disabled={isEquipped}
                className={`rounded px-3 py-1 text-xs font-bold transition ${
                  isEquipped
                    ? "bg-gray-700 text-gray-500"
                    : "bg-amber-600 text-white hover:bg-amber-500"
                }`}
              >
                {isEquipped ? "已装备" : "装备"}
              </button>
            </div>
          );
        })}

        {/* Consumables */}
        {Object.entries(consumables).map(([itemId, count]) => {
          if (count <= 0) return null;
          const item = SHOP_ITEMS.find((i) => i.id === itemId);
          if (!item) return null;
          return (
            <div
              key={itemId}
              className="flex items-center justify-between rounded-lg border border-gray-700 bg-[#161825] px-3 py-2"
            >
              <div>
                <div className="text-sm font-bold text-gray-200">
                  {item.name} <span className="text-xs text-gray-500">x{count}</span>
                </div>
                <div className="text-xs text-gray-400">{item.description}</div>
              </div>
              <button
                onClick={() => onUseItem(itemId)}
                className="rounded bg-green-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-green-500"
              >
                使用
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
