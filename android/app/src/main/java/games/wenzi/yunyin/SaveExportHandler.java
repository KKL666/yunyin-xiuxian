package games.wenzi.yunyin;

import android.content.Intent;
import android.net.Uri;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;

import org.json.JSONObject;

import java.io.OutputStream;

/**
 * Handles save export in the WebView.
 *
 * The game's export relies on file-saver, which clicks a hidden &lt;a download&gt;
 * element. Capacitor's WebView has no DownloadListener by default, so that
 * download event is silently dropped. This listener catches blob downloads,
 * reads the blob content back through a small JS bridge, and saves it via the
 * system "Create Document" dialog.
 */
public class SaveExportHandler implements DownloadListener {

    private final AppCompatActivity activity;
    private final WebView webView;
    private final ActivityResultLauncher<Intent> createDocumentLauncher;

    private String pendingText;
    private String pendingName;

    public SaveExportHandler(AppCompatActivity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        this.createDocumentLauncher = activity.registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == AppCompatActivity.RESULT_OK && result.getData() != null) {
                    Uri uri = result.getData().getData();
                    if (uri != null && pendingText != null) {
                        writeText(uri, pendingText, pendingName);
                    }
                }
                pendingText = null;
                pendingName = null;
            }
        );
    }

    @Override
    public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
        if (url == null || !url.startsWith("blob:")) {
            return;
        }

        String filename = extractFilename(contentDisposition);
        if (filename == null || filename.isEmpty()) {
            filename = "yunyin-xiuxian-save.save";
        }
        final String name = filename;

        // Fetch the blob content inside the page and hand it back to the native
        // bridge (window.SaveBridge), which then opens the save dialog.
        String js = "fetch(" + JSONObject.quote(url) + ")"
            + ".then(function(r){return r.text();})"
            + ".then(function(t){window.SaveBridge.save(t," + JSONObject.quote(name) + ");})"
            + ".catch(function(e){window.SaveBridge.onError(String(e));});";
        webView.evaluateJavascript(js, null);
    }

    @JavascriptInterface
    public void save(String text, String filename) {
        activity.runOnUiThread(() -> {
            pendingText = text;
            pendingName = filename;
            Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType("application/octet-stream");
            intent.putExtra(Intent.EXTRA_TITLE, filename);
            try {
                createDocumentLauncher.launch(intent);
            } catch (Exception e) {
                pendingText = null;
                pendingName = null;
                Toast.makeText(activity, "导出失败：" + e.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    @JavascriptInterface
    public void onError(String message) {
        activity.runOnUiThread(() ->
            Toast.makeText(activity, "导出失败", Toast.LENGTH_SHORT).show()
        );
    }

    private void writeText(Uri uri, String text, String name) {
        try {
            OutputStream os = activity.getContentResolver().openOutputStream(uri);
            if (os != null) {
                os.write(text.getBytes("UTF-8"));
                os.flush();
                os.close();
                Toast.makeText(activity, "存档已导出", Toast.LENGTH_SHORT).show();
            } else {
                Toast.makeText(activity, "写入失败", Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            Toast.makeText(activity, "写入失败：" + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private String extractFilename(String contentDisposition) {
        if (contentDisposition == null) {
            return null;
        }
        for (String part : contentDisposition.split(";")) {
            part = part.trim();
            if (part.startsWith("filename=")) {
                return part.substring("filename=".length()).replace("\"", "");
            }
        }
        return null;
    }
}
