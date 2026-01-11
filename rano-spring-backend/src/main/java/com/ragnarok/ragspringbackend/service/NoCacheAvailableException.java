package com.ragnarok.ragspringbackend.service;

/**
 * GNJOY 에러 발생 시 캐시가 없을 때 던지는 예외
 */
public class NoCacheAvailableException extends RuntimeException {
    private final String reason;
    private final String server;
    private final String keyword;
    private final int retryAfterSeconds;

    public NoCacheAvailableException(String reason, String server, String keyword, int retryAfterSeconds) {
        super("No cache available: " + reason);
        this.reason = reason;
        this.server = server;
        this.keyword = keyword;
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public String getReason() { return reason; }
    public String getServer() { return server; }
    public String getKeyword() { return keyword; }
    public int getRetryAfterSeconds() { return retryAfterSeconds; }
}
