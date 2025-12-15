import React, { useState } from 'react';
import { Search, Database, Grid, List, X, Sword, Shield, Sparkles, Scroll, Box, Crown, Check, Loader2 } from 'lucide-react';
import ItemDbModal, { ItemDbEntry } from './ItemDbModal';

// DB Item from backend
interface DbItem {
  id: number;
  nameKr: string;
  description: string;
  slots: number;
  rawData?: string;
  updatedAt?: string;
}

const CATEGORIES = [
  { id: 'ALL', label: '전체', icon: <Database size={18} /> },
  { id: 'WEAPON', label: '무기', icon: <Sword size={18} /> },
  { id: 'ARMOR', label: '방어구', icon: <Shield size={18} /> },
  { id: 'CARD', label: '카드', icon: <Crown size={18} /> },
  { id: 'CONSUMABLE', label: '소비', icon: <Sparkles size={18} /> },
  { id: 'ETC', label: '기타', icon: <Scroll size={18} /> },
];

const SUB_CATEGORIES: Record<string, string[]> = {
  'WEAPON': ['전체', '한손검', '양손검', '단검', '한손도끼', '양손도끼', '카타르', '지팡이', '둔기', '활', '책', '너클', '악기', '채찍', '수리검', '건슬링거'],
  'ARMOR': ['전체', '갑옷', '투구(상)', '투구(중)', '투구(하)', '방패', '걸칠것', '신발', '악세사리'],
  'CARD': ['전체', '무기', '투구', '갑옷', '방패', '걸칠것', '신발', '악세사리'],
  'CONSUMABLE': ['전체', 'HP회복', 'SP회복', '상태이상', '요리', '주문서', '화살/탄약'],
  'ETC': ['전체', '수집품', '제련/재료', '퀘스트'],
};

const JOB_GROUPS = [
  { label: '전체 직업', id: 'ALL' },
  { label: '검사계열', id: 'SWORDMAN' },
  { label: '마법사계열', id: 'MAGE' },
  { label: '궁수계열', id: 'ARCHER' },
  { label: '상인계열', id: 'MERCHANT' },
  { label: '도둑계열', id: 'THIEF' },
  { label: '복사계열', id: 'ACOLYTE' },
  { label: '확장/기타', id: 'EXTENDED' },
];

const JOB_MAPPING: Record<string, string[]> = {
  'ALL': [],
  'SWORDMAN': ['나이트', '크루세이더', '룬나이트', '로열가드', '검사계열'],
  'MAGE': ['위자드', '세이지', '워록', '소서러', '마법사계열'],
  'ARCHER': ['헌터', '바드', '댄서', '레인저', '궁수계열'],
  'MERCHANT': ['블랙스미스', '알케미스트', '미캐닉', '제네릭', '상인계열'],
  'THIEF': ['어쌔신', '로그', '길로틴크로스', '쉐도우체이서', '도둑계열'],
  'ACOLYTE': ['프리스트', '몽크', '아크비숍', '수라', '복사계열'],
  'EXTENDED': ['태권', '권성', '소울링커', '닌자', '건슬링거', '도람', '노비스계열'],
};

const ItemInfoView: React.FC = () => {
  // States
  const [selectedMainCat, setSelectedMainCat] = useState('WEAPON');
  const [selectedSubCat, setSelectedSubCat] = useState('전체');
  const [selectedJobGroup, setSelectedJobGroup] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // DB States
  const [items, setItems] = useState<ItemDbEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [selectedItem, setSelectedItem] = useState<ItemDbEntry | null>(null);

  // Convert DB item to display format
  const convertDbItemToDisplay = (dbItem: DbItem): ItemDbEntry => {
    const cleanDesc = (text: string) => text.replace(/\^[0-9A-Fa-f]{6}/g, '');

    return {
      id: dbItem.id,
      name: dbItem.nameKr,
      slots: dbItem.slots,
      type: '미정',
      description: cleanDesc(dbItem.description),
      stats: [],
      weight: 0,
      reqLevel: 1,
      jobs: '전직업',
      jobTags: ['전직업'],
      npcPrice: {}
    };
  };

  // Search Handler
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8080/api/items/search?keyword=${encodeURIComponent(searchQuery)}`);

      if (!response.ok) {
        throw new Error('검색 실패');
      }

      const data: DbItem[] = await response.json();
      const convertedData = data.map(convertDbItemToDisplay);
      setItems(convertedData);

      if (data.length === 0) {
        setError('검색 결과가 없습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMainCatClick = (catId: string) => {
    setSelectedMainCat(catId);
    setSelectedSubCat('전체');
  };

  const handleReset = () => {
    setSelectedMainCat('ALL');
    setSelectedSubCat('전체');
    setSelectedJobGroup('ALL');
    setSearchQuery('');
    setItems([]);
    setError(null);
  };

  // Filter Logic
  const filteredItems = items.filter(item => {
    if (selectedMainCat !== 'ALL') {
      const isCard = selectedMainCat === 'CARD' && item.type === '카드';
      const subs = SUB_CATEGORIES[selectedMainCat] || [];
      const isTypeMatch = subs.includes(item.type);
      if (!isCard && !isTypeMatch) return false;
    }
    if (selectedSubCat !== '전체') {
      if (item.type !== selectedSubCat) return false;
    }
    if (selectedJobGroup !== 'ALL') {
      const targetTags = JOB_MAPPING[selectedJobGroup];
      const hasTag = item.jobTags.some(t => targetTags.includes(t)) || item.jobTags.includes('전직업') || item.jobTags.includes('모든 직업');
      if (!hasTag) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto pb-20">

      {/* Modal */}
      <ItemDbModal item={selectedItem} onClose={() => setSelectedItem(null)} />

      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-kafra-500 text-white rounded-xl shadow-lg shadow-kafra-500/30">
            <Database size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">아이템 정보</h2>
            <p className="text-xs text-gray-500">MariaDB 실시간 검색</p>
          </div>
        </div>

        <div className="flex flex-1 md:flex-none gap-2">
          <div className="relative group flex-1 md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="아이템 이름 검색 (예: 포션, 검)"
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-kafra-500 focus:ring-2 focus:ring-kafra-100 transition-all font-medium"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-4 py-2 bg-kafra-600 text-white hover:bg-kafra-700 rounded-xl transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                검색 중...
              </>
            ) : (
              <>
                <Search size={16} />
                검색
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-2 bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-xl transition-colors"
            title="필터 초기화"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-600">❌ {error}</p>
        </div>
      )}

      {/* Filter Area */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-8 space-y-6">

        {/* Main Categories */}
        <div>
          <div className="text-xs font-bold text-gray-400 mb-2 ml-1">카테고리</div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleMainCatClick(cat.id)}
                className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all border
                    ${selectedMainCat === cat.id
                    ? 'bg-kafra-600 text-white border-kafra-600 shadow-md transform scale-105'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }
                  `}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sub Categories */}
        {selectedMainCat !== 'ALL' && SUB_CATEGORIES[selectedMainCat] && (
          <div className="animate-fade-in">
            <div className="text-xs font-bold text-gray-400 mb-2 ml-1">{CATEGORIES.find(c => c.id === selectedMainCat)?.label} 상세 분류</div>
            <div className="flex flex-wrap gap-1.5 p-3 bg-gray-50/80 rounded-xl border border-gray-100">
              {SUB_CATEGORIES[selectedMainCat].map(sub => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubCat(sub)}
                  className={`
                       px-3 py-1.5 rounded-md text-xs font-bold transition-all
                       ${selectedSubCat === sub
                      ? 'bg-white text-kafra-600 shadow-sm border border-gray-200 ring-1 ring-kafra-100'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                    }
                     `}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Job Groups */}
        <div>
          <div className="text-xs font-bold text-gray-400 mb-2 ml-1">착용 직업군</div>
          <div className="flex flex-wrap gap-2">
            {JOB_GROUPS.map(job => (
              <button
                key={job.id}
                onClick={() => setSelectedJobGroup(job.id)}
                className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                    ${selectedJobGroup === job.id
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
                  }
                  `}
              >
                {selectedJobGroup === job.id && <Check size={10} />}
                {job.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Area */}
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

        {filteredItems.length > 0 ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-2"}>
            {filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`
                       bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-card hover:border-kafra-300 transition-all cursor-pointer group
                       ${viewMode === 'grid' ? 'p-0 flex flex-col' : 'p-3 flex items-center gap-4'}
                    `}
              >
                {/* Image Section */}
                <div className={`
                        bg-gray-50 flex items-center justify-center shrink-0 relative
                        ${viewMode === 'grid' ? 'h-40 border-b border-gray-100' : 'w-16 h-16 rounded-lg border border-gray-200'}
                     `}>
                  <img
                    src={`https://static.divine-pride.net/images/items/item/${item.id}.png`}
                    alt={item.name}
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://via.placeholder.com/75?text=No+Img`; }}
                    className={`object-contain mix-blend-multiply opacity-90 group-hover:scale-110 transition-transform ${viewMode === 'grid' ? 'w-24 h-24' : 'w-10 h-10'}`}
                  />
                  <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                    <span className="text-[10px] font-mono text-gray-400 bg-white/80 px-1 rounded backdrop-blur-sm">#{item.id}</span>
                    {item.slots > 0 && <span className="text-[10px] font-bold text-gray-500 bg-white/80 border border-gray-200 px-1.5 rounded shadow-sm">[{item.slots}]</span>}
                  </div>
                </div>

                {/* Info Section */}
                <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? 'p-4' : 'py-1'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-900 truncate pr-2 group-hover:text-kafra-600 transition-colors">{item.name}</h4>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 font-bold border border-blue-100">{item.type}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-50 text-gray-500 font-medium border border-gray-100">Lv.{item.reqLevel}</span>
                  </div>

                  <p className={`text-xs text-gray-500 mb-3 ${viewMode === 'grid' ? 'line-clamp-2 h-8' : 'line-clamp-1'}`}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-gray-300">
              <Database />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">아이템 이름을 검색해주세요</h3>
            <p className="text-xs text-gray-500 mt-1">예: 포션, 검, 갑옷 등</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default ItemInfoView;
