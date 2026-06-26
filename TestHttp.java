import java.net.HttpURLConnection;
import java.net.URL;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URLEncoder;

public class TestHttp {
    public static void main(String[] args) throws Exception {
        String keyword = URLEncoder.encode("요르", "UTF-8");
        URL url = new URL("https://ro.gnjoy.com/itemdeal/itemDealList.asp?svrID=9&itemFullName=" + keyword + "&itemOrder=&inclusion=&curpage=1");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("User-Agent", "Mozilla/5.0");
        conn.setConnectTimeout(5000);
        
        BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream(), "EUC-KR"));
        String inputLine;
        StringBuilder content = new StringBuilder();
        int lines = 0;
        while ((inputLine = in.readLine()) != null && lines < 100) {
            content.append(inputLine).append("\n");
            lines++;
        }
        in.close();
        System.out.println("Response contains CallItemDealView? " + content.toString().contains("CallItemDealView"));
        System.out.println(content.toString());
    }
}
