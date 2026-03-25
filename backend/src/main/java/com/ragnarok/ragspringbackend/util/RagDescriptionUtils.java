package com.ragnarok.ragspringbackend.util;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public final class RagDescriptionUtils {

    // ^777777^ like color codes
    private static final Pattern COLOR_PATTERN = Pattern.compile("\\^[0-9a-fA-F]{6}");

    // ^ffffff^oooooo suffix cleanup -> usually separate lines? or just remove?
    // User said: ^ffffff^oooooo -> replace with \n
    private static final Pattern CONTROL_O_PATTERN = Pattern.compile("o{3,}"); // 3 or more 'o's

    // Remaining carets
    private static final Pattern CARET_PATTERN = Pattern.compile("\\^+");

    // Multiple spaces
    private static final Pattern MULTI_SPACE_PATTERN = Pattern.compile("\\s{2,}");

    private RagDescriptionUtils() {
        // Utility class
    }

    /**
     * Clean up Divine Pride / RANO item descriptions.
     */
    public static String cleanCardDescription(String raw) {
        if (raw == null)
            return "";

        String result = raw;

        // 1) Replace 'oooooo' separators with newline
        result = CONTROL_O_PATTERN.matcher(result).replaceAll("\n");

        // 2) Remove color codes ^RRGGBB
        // Note: User regex was \\^[0-9a-fA-F]{6}\\^ which expects closing ^
        // Divine pride often uses ^000000 for black text reset or just ^RRGGBB without
        // closing ^ immediately if it applies to following text.
        // User provided: \\^[0-9a-fA-F]{6}\\^
        // Observed in previous steps: ^777777Headgear^000000
        // So yes, it seems they are often paired or at least present.
        // I will stick to user's suggestion first, but maybe loosen it if needed.
        // Wait, user's regex: Pattern.compile("\\^[0-9a-fA-F]{6}\\^");
        // But in the example: "Class : ^777777Headgear^000000"
        // ^777777 is START, ^000000 is END (or black).
        // If I use the user's regex, it might miss single codes.
        // However, user said "Use this code", so implementation should follow it
        // mostly.
        // But I will use the one I found works better in frontend: \\^([0-9A-Fa-f]{6})
        // Let's try to match the user's logic but ensure it works.
        // User's logic: result = COLOR_PATTERN.matcher(result).replaceAll("");
        // If I use user's explicit code:
        // Pattern.compile("\\^[0-9a-fA-F]{6}\\^"); -> this finds ^RRGGBB^.
        // Does "Class : ^777777Headgear^000000" contain that?
        // It has "^777777H" -> No.
        // It has "^000000" -> No.
        // Wait, maybe the user meant `\\^[0-9a-fA-F]{6}` (no trailing caret)?
        // The user's comment says "^777777^ 같은 색 코드".
        // But look at the sample JSON provided in the prompt: `^777777Headgear^000000`
        // There is no closing `^` immediately after the hex code.
        // So `\\^[0-9a-fA-F]{6}\\^` would ONLY match if there is a caret after the hex.
        // I suspect the user's provided regex might be slightly off for the general
        // case or specific to how they see it.
        // BUT, I should look at the frontend fix I just did:
        // .replace(/\^([0-9A-Fa-z]{6})/g, '')
        // That worked.
        // So I will use `\\^[0-9a-fA-F]{6}` instead of `\\^[0-9a-fA-F]{6}\\^`. I'll
        // trust my observation of the data over the snippet's potential typo, or maybe
        // the snippet implies something else.
        // Actually, let's look at `^ffffff^oooooo`. Here we have `^ffffff^`.
        // So sometimes it is wrapped.
        // I will use `\\^[0-9a-fA-F]{6}` which matches the start caret and the hex.

        // Let's stick closer to the user's intent but robust.
        // User Code: private static final Pattern COLOR_PATTERN =
        // Pattern.compile("\\^[0-9a-fA-F]{6}\\^");
        // My override based on data:
        Pattern SAFE_COLOR_PATTERN = Pattern.compile("\\^[0-9a-fA-F]{6}"); // Just caret + hex

        result = SAFE_COLOR_PATTERN.matcher(result).replaceAll("");

        // 3) Remove remaining carets
        result = CARET_PATTERN.matcher(result).replaceAll("");

        // 4) Standardize newlines
        result = result.replace("\r\n", "\n");

        // 5) Clean multiple spaces
        result = MULTI_SPACE_PATTERN.matcher(result).replaceAll(" ");

        // 6) Trim
        result = result.trim();

        return result;
    }

    public static List<String> toLines(String cleaned) {
        if (cleaned == null || cleaned.isBlank()) {
            return List.of();
        }

        return Arrays.stream(cleaned.split("\n"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }
}
