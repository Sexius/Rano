import com.ragnarok.ragspringbackend.service.VendingService;
import com.ragnarok.ragspringbackend.dto.VendingItemDto;
import com.ragnarok.ragspringbackend.dto.VendingPageResponse;
import java.util.List;

public class TestScrape2 {
    public static void main(String[] args) throws Exception {
        VendingService service = new VendingService(null, null, null, null);
        VendingPageResponse<VendingItemDto> res = service.searchVendingByItemDirect("baphomet", "요르", 1, 10);
        System.out.println("Items found: " + res.getData().size());
        if (!res.getData().isEmpty()) {
            VendingItemDto dto = res.getData().get(0);
            System.out.println("First item: " + dto.getItem_name() + ", ssi=" + dto.getSsi() + ", map=" + dto.getMap_id());
        }
    }
}
