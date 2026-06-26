package com.ragnarok.ragspringbackend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class VendingScheduledCrawler {

    private final VendingCollectorService collectorService;
    private final VendingLogger logger;

    // 자주 쓰이는 한글 초성/모음 및 알파벳을 통해 최대한 많은 노점을 포괄
    private final List<String> CRAWL_KEYWORDS = Arrays.asList(
        "가", "나", "다", "라", "마", "바", "사", "아", "자", "차", "카", "타", "파", "하",
        "a", "e", "i", "o", "u",
        "검", "활", "지팡이", "갑옷", "방패", "투구", "부츠", "망토", "반지", "목걸이",
        "카드", "주문서", "물약", "포션", "상자", "결정", "파편", "원석", "제련", "인챈트",
        "도면", "레시피", "코인", "증표", "스톤", "큐펫", "알"
    );

    private final List<String> SERVERS = Arrays.asList("baphomet", "yggdrasil", "ifrit");

    public VendingScheduledCrawler(VendingCollectorService collectorService, VendingLogger logger) {
        this.collectorService = collectorService;
        this.logger = logger;
    }

    @Value("${ENABLE_PERIODIC_CRAWL:false}")
    private boolean enablePeriodicCrawl;

    /**
     * 30분마다 전체 수집 사이클 실행 (너무 잦으면 429 차단 위험)
     */
    @Scheduled(fixedDelay = 1800000) // 30분
    public void runPeriodicCrawl() {
        if (!enablePeriodicCrawl) {
            // 기본적으로 비활성화 (환경변수로 켤 수 있게 함)
            logger.log("SCHEDULED_CRAWL_SKIPPED", "ENABLE_PERIODIC_CRAWL is not set. Skipping background crawl.");
            return;
        }

        logger.log("SCHEDULED_CRAWL_START", "Starting periodic crawl cycle for all servers");

        for (String server : SERVERS) {
            for (String keyword : CRAWL_KEYWORDS) {
                try {
                    // 서버당/키워드당 최대 5페이지씩 수집 (핵심 매물 위주)
                    collectorService.collectSync(server, keyword, 1, 5);
                    // 차단 방지를 위한 약간의 대기
                    Thread.sleep(2000); 
                } catch (Exception e) {
                    logger.log("SCHEDULED_CRAWL_ERROR", "Error for " + server + "/" + keyword + ": " + e.getMessage());
                }
            }
        }

        logger.log("SCHEDULED_CRAWL_END", "Finished periodic crawl cycle");
    }
}
