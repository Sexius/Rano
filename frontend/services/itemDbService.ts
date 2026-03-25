// MariaDB에서 아이템 정보를 가져오는 서비스
const getApiBaseUrl = (): string => {
    let rawUrl = import.meta.env.VITE_API_URL || 'https://rano.onrender.com';
    rawUrl = rawUrl.replace(/\/+$/, '');
    return rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;
};
const API_BASE_URL = getApiBaseUrl();

export interface DbItem {
    id: number;
    nameKr: string;
    description: string;
    slots: number;
    rawData: string;
    updatedAt: string;
}

/**
 * DB에서 아이템 정보를 가져옵니다
 * @param itemId 아이템 ID
 * @returns 아이템 정보 또는 null
 */
export const getItemFromDb = async (itemId: number): Promise<DbItem | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/items/${itemId}`);

        if (!response.ok) {
            if (response.status === 404) {
                console.log(`아이템 ID ${itemId}를 DB에서 찾을 수 없습니다.`);
                return null;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: DbItem = await response.json();
        return data;
    } catch (error) {
        console.error('[ItemDbService] Error fetching item:', error);
        return null;
    }
};
