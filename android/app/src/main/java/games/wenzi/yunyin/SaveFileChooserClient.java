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
 * WebChromeClient that relaxes the file picker MIME filter.
 *
 * The game's save export uses a custom ".save" extension, whose MIME type is
 * application/octet-stream. This does not match the web page's
 * accept="application/json", so the system picker greys out the save file and
 * tapping it does nothing. This client opens the picker with a wildcard type
 * so every file, including .save, can be selected.
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
