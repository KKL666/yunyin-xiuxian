package games.wenzi.yunyin;

import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (bridge != null) {
            WebView webView = bridge.getWebView();
            if (webView != null) {
                webView.setWebChromeClient(new SaveFileChooserClient(bridge));
            }
        }
    }
}
