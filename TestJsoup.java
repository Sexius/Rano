import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import java.io.IOException;

public class TestJsoup {
    public static void main(String[] args) throws IOException {
        String url = "https://ro.gnjoy.com/itemdeal/itemDealView.asp";
        Document doc = Jsoup.connect(url)
            .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
            .header("Referer", "https://ro.gnjoy.com/itemdeal/itemDealList.asp")
            .data("svrID", "1")
            .data("mapID", "2023")
            .data("ssi", "7655662493679422025") // "천공의 무기 제련망치"
            .data("curpage", "1")
            .timeout(5000)
            .get();
        System.out.println(doc.html());
    }
}
