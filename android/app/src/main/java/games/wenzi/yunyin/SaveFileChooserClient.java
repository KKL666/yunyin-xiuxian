package games.wenzi.yunyin;

import android.content.Intent;
import android.net.Uri;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebChromeClient;

/**
 * 放宽文件类型过滤的 WebChromeClient。
 *
 * 游戏存档导出文件使用自定义 ".save" 扩展名，其 MIME 类型为
 * application/octet-stream，与网页导入框的 accept="application/json" 不匹配，
 * 导致系统文件选择器把存档文件置灰、点选无反应。
 *
 * 这里把选择器放宽为 */*，让所有文件（含 .save）都可被选中。
 */
public class SaveFileChooserClient extends BridgeWebChromeClient {

    private final Bridge bridge;

    public SaveFileChooserClient(Bridge bridge) {
        super(bridge);
        this.bridge = bridge;
    }

    @Override
    public boolean onShowFileChooser(
        WebView webView,
        ValueCallback<Uri[]> filePathCallback,
        FileChooserParams fileChooserParams
    ) {
        try {
            Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType("*/*");

            ActivityResultLauncher<Intent> launcher = bridge.registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    Uri[] uris = WebChromeClient.FileChooserParams.parseResult(
                        result.getResultCode(),
                        result.getData()
                    );
                    filePathCallback.onReceiveValue(uris);
                }
            );
            launcher.launch(intent);
        } catch (Exception e) {
            filePathCallback.onReceiveValue(null);
        }
        return true;
    }
}
