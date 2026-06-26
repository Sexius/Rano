import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import java.io.File;

public class TestJsoup {
    public static void main(String[] args) throws Exception {
        Document doc = Jsoup.parse(new File("gnjoy_yo.html"), "UTF-8");
        Element targetTable = doc.selectFirst("table.listTypeOfDefault.dealList");
        Elements rows = targetTable.select("tr");
        for (Element row : rows) {
            Elements columns = row.select("td");
            if (columns.size() < 5) continue;
            Element itemNameElement = columns.get(1);
            Element aTag = itemNameElement.selectFirst("a");
            if (aTag != null) {
                String onclick = aTag.attr("onclick");
                System.out.println("onclick: " + onclick);
                try {
                    String cleanOnclick = onclick.substring(onclick.indexOf("(") + 1, onclick.indexOf(")"));
                    String[] params = cleanOnclick.split(",");
                    if (params.length >= 3) {
                        String mapId = params[1].trim().replace("'", "");
                        String ssi = params[2].trim().replace("'", "");
                        System.out.println("  -> mapId: " + mapId + ", ssi: " + ssi);
                    }
                } catch (Exception e) {}
            }
        }
    }
}
