import React, { useState } from 'react';
import { Search, Database, Grid, List, X, Sword, Shield, Sparkles, Scroll, Box, Crown, Check, Loader } from 'lucide-react';
import { ItemDbEntry } from '../types';
import ItemDbModal from './ItemDbModal';
import { searchDivineItem, getItemDetail } from '../services/apiService';
import { parseItemType, parseDivinePrideDescription, getUniqueDescriptionLines } from '../utils/divinePrideUtils';

const CATEGORIES = [
  { id: 'ALL', label: '전체', icon: <Database size={18} /> },
  { id: 'WEAPON', label: '무기', icon: <Sword size={18} /> },
  { id: 'ARMOR', label: '방어구', icon: <Shield size={18} /> },
  { id: 'CARD', label: '카드', icon: <Crown size={18} /> },
  { id: 'CONSUMABLE', label: '소비', icon: <Sparkles size={18} /> },
  { id: 'ETC', label: '기타', icon: <Scroll size={18} /> },
];

const ItemInfoView: React.FC = () => {
  const [selectedMainCat, setSelectedMainCat] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [items, setItems] = useState<ItemDbEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemDbEntry | null>(null);

  const executeSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setItems([]);

    try {
      const searchResult = await searchDivineItem(searchQuery);

      let candidateItems: any[] = [];

      if (searchResult) {
        if (Array.isArray(searchResult)) {
          candidateItems = searchResult;
        } else if (searchResult.items && Array.isArray(searchResult.items)) {
          candidateItems = searchResult.items;
        } else {
          Object.values(searchResult).forEach(val => {
            if (Array.isArray(val)) candidateItems = [...candidateItems, ...val];
          });
        }
      }

      if (candidateItems.length > 0) {
        const uniqueIds = Array.from(new Set(candidateItems.filter(i => i.id).map(item => item.id)));
        const topIds = uniqueIds.slice(0, 20);

        const detailedItems: ItemDbEntry[] = [];

        for (const idStr of topIds) {
          const id = parseInt(idStr as string);
          if (isNaN(id)) continue;

          try {
            const detail = await getItemDetail(id);
            if (detail) {
              const typeName = parseItemType(detail.itemTypeId, detail.itemSubTypeId);
              const parsed = parseDivinePrideDescription(detail.description);
              const stats = parsed.stats.map(s => s.value);

              const weight = detail.weight ?? (parsed.meta.weight ? parseInt(parsed.meta.weight) : 0);
              const reqLevel = detail.requiredLevel ?? (parsed.meta.reqLevel ? parseInt(parsed.meta.reqLevel) : 0);
              const weaponLevel = detail.weaponLevel ?? (parsed.meta.weaponLevel ? parseInt(parsed.meta.weaponLevel) : undefined);
              const jobs = parsed.meta.jobs || '전직업';

              const combinedStats = [...stats];
              if (parsed.meta.attack) combinedStats.push(`공격 : ${parsed.meta.attack}`);
              if (parsed.meta.defense) combinedStats.push(`방어 : ${parsed.meta.defense}`);
              if (parsed.meta.property) combinedStats.push(`속성 : ${parsed.meta.property}`);
              if (parsed.meta.class) combinedStats.push(`계열 : ${parsed.meta.class}`);
              if (parsed.meta.position) combinedStats.push(`위치 : ${parsed.meta.position}`);

              const uniqueFlavorLines = getUniqueDescriptionLines(parsed.flavorText || detail.description);
              const flavorText = uniqueFlavorLines.join('\n');

              detailedItems.push({
                id: detail.id,
                name: detail.name,
                slots: detail.slots || 0,
                type: typeName,
                description: flavorText,
                stats: combinedStats,
                weight: weight,
                reqLevel: reqLevel,
                weaponLevel: weaponLevel,
                jobs: jobs,
                jobTags: [],
                npcPrice: { buy: detail.price, sell: detail.price ? detail.price / 2 : 0 },
              });
            }
          } catch (err) {
            console.error(`Failed to fetch detail for ${id}`, err);
          }
        }
        setItems(detailedItems);
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  const filteredItems = items.filter(item => {
    if (selectedMainCat === 'ALL') return true;

    const catMap: Record<string, string[]> = {
      'WEAPON': ['한손검', '양손검', '단검', '한손도끼', '양손도끼', '카타르', '지팡이', '둔기', '활', '책', '너클', '악기', '채찍', '수리검', '건슬링거', '창', '도', '권투', '석궁'],
      'ARMOR': ['갑옷', '투구', '방패', '걸칠것', '신발', '악세사리'],
      'CARD': ['카드'],
      'CONSUMABLE': ['회복', '소비', '탄약', '화살'],
      'ETC': ['수집', '제련', '재료', '기타']
    };

    const types = catMap[selectedMainCat] || [];
    return types.some(t => item.type.includes(t));
  });

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-kafra-500 text-white rounded-xl shadow-lg shadow-kafra-500/30">
            <Database size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">아이템 정보</h2>
            <p className="text-xs text-gray-500">검색어를 입력하여 아이템을 찾아보세요</p>
          </div>
        </div>

        <div className="flex flex-1 md:flex-none gap-2">
          <div className="relative group flex-1 md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="아이템 이름 검색..."
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-kafra-500 focus:ring-2 focus:ring-kafra-100 transition-all font-medium"
            />
            <Search
              className="absolute left-3 top-2.5 text-gray-400 w-4 h-4 cursor-pointer hover:text-kafra-500 transition-colors"
              onClick={executeSearch}
            />
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setItems([]);
              setHasSearched(false);
              setSelectedMainCat('ALL');
            }}
            className="px-3 py-2 bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-xl transition-colors"
            title="초기화"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-8">
        <div className="text-xs font-bold text-gray-400 mb-2 ml-1">카테고리</div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedMainCat(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all border
                ${selectedMainCat === cat.id
                  ? 'bg-kafra-600 text-white border-kafra-600 shadow-md transform scale-105'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            검색 결과 <span className="text-kafra-600 bg-kafra-50 px-2 py-0.5 rounded-full text-xs">{filteredItems.length}</span>
          </h3>

          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500 gap-3">
            <Loader className="animate-spin text-kafra-500" size={32} />
            <p>아이템 정보를 불러오는 중입니다...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-2"}>
            {filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-card hover:border-kafra-300 transition-all cursor-pointer group
                  ${viewMode === 'grid' ? 'p-0 flex flex-col' : 'p-3 flex items-center gap-4'}`}
              >
                <div className={`bg-gray-50 flex items-center justify-center shrink-0 relative
                  ${viewMode === 'grid' ? 'h-40 border-b border-gray-100' : 'w-16 h-16 rounded-lg border border-gray-200'}`}>
                  <img
                    src={`https://static.divine-pride.net/images/items/collection/${item.id}.png`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://static.divine-pride.net/images/items/collection/501.png';
                    }}
                    alt={item.name}
                    className={`object-contain group-hover:scale-110 transition-transform ${viewMode === 'grid' ? 'w-24 h-24' : 'w-10 h-10'}`}
                  />
                  <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                    <span className="text-[10px] font-mono text-gray-400 bg-white/80 px-1 rounded backdrop-blur-sm">#{item.id}</span>
                    {item.slots > 0 && <span className="text-[10px] font-bold text-gray-500 bg-white/80 border border-gray-200 px-1.5 rounded shadow-sm">[{item.slots}]</span>}
                  </div>
                </div>

                <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? 'p-4' : 'py-1'}`}>
                  <h4 className="font-bold text-gray-900 truncate pr-2 group-hover:text-kafra-600 transition-colors mb-1">{item.name}</h4>

                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 font-bold border border-blue-100">{item.type}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-50 text-gray-500 font-medium border border-gray-100">Lv.{item.reqLevel}</span>
                  </div>

                  <p className={`text-xs text-gray-500 mb-3 ${viewMode === 'grid' ? 'line-clamp-2 h-8' : 'line-clamp-1'}`}>
                    {item.description}
                  </p>

                  <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">NPC 구매가</span>
                    <span className="text-sm font-bold text-gray-700">{item.npcPrice.buy ? `${item.npcPrice.buy.toLocaleString()} Z` : '비매품'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : hasSearched ? (
          <div className="py-16 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-gray-300">
              <Database />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">검색 결과가 없습니다</h3>
            <p className="text-xs text-gray-500 mt-1">다른 검색어를 시도해보세요</p>
          </div>
        ) : (
          <div className="py-16 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-gray-300">
              <Search />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">아이템을 검색해보세요</h3>
            <p className="text-xs text-gray-500 mt-1">위 검색창에 아이템 이름을 입력하세요</p>
          </div>
        )}
      </div>

      <ItemDbModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
};

export default ItemInfoView;
