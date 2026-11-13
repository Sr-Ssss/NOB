package app.nob.party.npn

import android.Manifest
import android.content.Intent
import android.os.Build
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import java.io.File

/** Ponte JS ↔ BLE para o ecrã de teste NPN. */
@CapacitorPlugin(
    name = "Npn",
    permissions = [
        Permission(
            alias = "ble",
            strings = [
                Manifest.permission.BLUETOOTH_SCAN,
                Manifest.permission.BLUETOOTH_ADVERTISE,
                Manifest.permission.BLUETOOTH_CONNECT,
            ],
        ),
        Permission(alias = "local", strings = [Manifest.permission.ACCESS_FINE_LOCATION]),
        Permission(alias = "notif", strings = ["android.permission.POST_NOTIFICATIONS"]),
    ],
)
class NpnPlugin : Plugin() {

    private fun aliases(): Array<String> {
        val l = mutableListOf<String>()
        l += if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) "ble" else "local"
        if (Build.VERSION.SDK_INT >= 33) l += "notif"
        return l.toTypedArray()
    }

    private fun temPermissoes() = aliases().filter { it != "notif" }.all { getPermissionState(it) == PermissionState.GRANTED }

    @PluginMethod
    fun iniciar(call: PluginCall) {
        if (!temPermissoes()) {
            requestPermissionForAliases(aliases(), call, "depoisDasPermissoes")
            return
        }
        arrancar(call)
    }

    @PermissionCallback
    private fun depoisDasPermissoes(call: PluginCall) {
        if (temPermissoes()) arrancar(call) else call.reject("Sem permissão de Bluetooth")
    }

    private fun arrancar(call: PluginCall) {
        val adapter = (context.getSystemService(android.content.Context.BLUETOOTH_SERVICE) as android.bluetooth.BluetoothManager).adapter
        if (adapter == null || !adapter.isEnabled) {
            call.reject("Liga o Bluetooth")
            return
        }
        NpnServico.ouvinte = { l ->
            notifyListeners(
                "leitura",
                JSObject().apply {
                    put("id", l.id)
                    put("nome", l.nome)
                    put("rssi", l.rssi)
                    put("mediana", l.mediana)
                    put("perto", l.perto)
                    put("t", l.t)
                },
            )
        }
        val i = Intent(context, NpnServico::class.java)
            .putExtra(NpnServico.EXTRA_NOME, call.getString("nome") ?: "NOB")
            .putExtra(NpnServico.EXTRA_LIMITE, call.getInt("limite") ?: -65)
        ContextCompat.startForegroundService(context, i)
        call.resolve()
    }

    @PluginMethod
    fun parar(call: PluginCall) {
        context.stopService(Intent(context, NpnServico::class.java))
        NpnServico.ouvinte = null
        call.resolve()
    }

    @PluginMethod
    fun definirLimite(call: PluginCall) {
        NpnServico.limite = call.getInt("limite") ?: NpnServico.limite
        call.resolve()
    }

    /** grava o CSV na cache e abre a folha de partilha (Drive, email, ficheiros…) */
    @PluginMethod
    fun partilharCsv(call: PluginCall) {
        val texto = call.getString("texto") ?: return call.reject("sem texto")
        val nome = call.getString("nome") ?: "npn.csv"
        val f = File(context.cacheDir, nome).apply { writeText(texto) }
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", f)
        val enviar = Intent(Intent.ACTION_SEND)
            .setType("text/csv")
            .putExtra(Intent.EXTRA_STREAM, uri)
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        activity.startActivity(Intent.createChooser(enviar, "Exportar registo"))
        call.resolve()
    }
}
