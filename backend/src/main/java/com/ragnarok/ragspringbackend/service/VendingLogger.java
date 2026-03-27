package com.ragnarok.ragspringbackend.service;

import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.stream.Collectors;

@Service
public class VendingLogger {

    private static final int MAX_LOGS = 500;
    private final ConcurrentLinkedQueue<String> logQueue = new ConcurrentLinkedQueue<>();
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    public void log(String category, String message) {
        String timestamp = LocalDateTime.now().format(formatter);
        String logEntry = String.format("[%s] [%s] %s", timestamp, category, message);
        
        System.out.println(logEntry);
        
        logQueue.offer(logEntry);
        while (logQueue.size() > MAX_LOGS) {
            logQueue.poll();
        }
    }

    public List<String> getRecentLogs(int count) {
        List<String> list = new ArrayList<>(logQueue);
        int fromIndex = Math.max(0, list.size() - count);
        return list.subList(fromIndex, list.size());
    }
}
