import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

public class TestScrape {
    public static void main(String[] args) throws Exception {
        String url = "https://ro.gnjoy.com/itemdeal/itemDealList.asp";
        org.jsoup.Connection.Response httpResponse = Jsoup.connect(url)
            .userAgent("Mozilla/5.0")
            .data("svrID", "9")
            .data("itemFullName", "요르")
            .data("curpage", "1")
            .timeout(15000)
            .method(org.jsoup.Connection.Method.GET)
            .execute();
            
        Document doc = httpResponse.parse();
        Element targetTable = doc.selectFirst("table.listTypeOfDefault.dealList");
        System.out.println("Table found: " + (targetTable != null));
        if (targetTable != null) {
            Elements rows = targetTable.select("tr");
            System.out.println("Rows: " + rows.size());
        }
    }
}
