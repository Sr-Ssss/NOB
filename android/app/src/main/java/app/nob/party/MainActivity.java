package app.nob.party;

import android.os.Bundle;
import android.view.WindowManager;
import app.nob.party.npn.NpnPlugin;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NpnPlugin.class);
        super.onCreate(savedInstanceState);
        // ecrã sempre ligado enquanto a app está à frente (fase 3; a WebView não tem Wake Lock API).
        // A flag vale só para esta janela: o Android solta-a sozinho em segundo plano e repõe-na ao voltar.
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
}
