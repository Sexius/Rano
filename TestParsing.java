import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

public class TestParsing {
    public static void main(String[] args) throws Exception {
        Document doc = Jsoup.connect("https://ro.gnjoy.com/itemdeal/itemDealList.asp")
            .userAgent("Mozilla/5.0")
            .header("Referer", "https://ro.gnjoy.com/")
            .data("svrID", "1")
            .data("itemFullName", "요르")
            .data("curpage", "1")
            .get();

        for (Element row : doc.select("table.listTypeOfDefault.dealList tr")) {
            Elements cols = row.select("td");
            if(cols.size() < 5) continue;
            Element itemNameElement = cols.get(1);
            Element imgForName = itemNameElement.selectFirst("img");
            String itemNameText = (imgForName != null && imgForName.hasAttr("alt") && !imgForName.attr("alt").isEmpty())
                ? imgForName.attr("alt")
                : itemNameElement.text();
            
            System.out.println(itemNameText);
        }
    }
}
