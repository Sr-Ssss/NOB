package app.nob.party;

import android.os.Bundle;
import app.nob.party.npn.NpnPlugin;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NpnPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
