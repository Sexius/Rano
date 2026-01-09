package com.ragnarok.ragspringbackend.exception;

/**
 * HTTP 429 Rate Limit 발생 시 throw
 */
public class RateLimitedException extends RuntimeException {
    private final String server;
    private final String keyword;
    private final int page;

    public RateLimitedException(String server, String keyword, int page, String message) {
        super(message);
        this.server = server;
        this.keyword = keyword;
        this.page = page;
    }

    public String getServer() { return server; }
    public String getKeyword() { return keyword; }
    public int getPage() { return page; }
}
