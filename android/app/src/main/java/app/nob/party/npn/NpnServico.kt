package app.nob.party.npn

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.ParcelUuid
import android.os.SystemClock
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.NotificationCompat
import app.nob.party.MainActivity
import java.util.UUID
import kotlin.random.Random

/** Uma leitura já filtrada: mediana de 3 s e estado PERTO/LONGE com histerese. */
data class Leitura(
    val id: String,
    val nome: String,
    val rssi: Int,
    val mediana: Int,
    val perto: Boolean,
    val t: Long,
)

/**
 * Serviço em primeiro plano: anuncia este telemóvel e faz scan por BLE,
 * também com o ecrã desligado. Vibra quando alguém passa a PERTO.
 */
class NpnServico : Service() {

    companion object {
        /** UUID do serviço NOB (teste de proximidade) */
        val SERVICO: UUID = UUID.fromString("6e6f6200-7e57-4b1e-9a00-000000000001")
        const val FABRICANTE = 0xFFFF // id reservado para testes
        const val JANELA_MS = 3000L
        const val HISTERESE = 4
        const val EXTRA_NOME = "nome"
        const val EXTRA_LIMITE = "limite"
        private const val CANAL = "npn"
        private const val NOTIF_ID = 4242

        @Volatile var ouvinte: ((Leitura) -> Unit)? = null
        @Volatile var limite: Int = -65
        @Volatile var aCorrer = false
            private set
    }

    private class Estado(val nome: String) {
        val amostras = ArrayDeque<Pair<Long, Int>>()
        var perto = false
    }

    private val vistos = HashMap<String, Estado>()
    private val token = Random.nextBytes(4)

    private val bt by lazy { getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager }

    private val anuncio = object : AdvertiseCallback() {}

    private val scan = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) = tratar(result)
        override fun onBatchScanResults(results: MutableList<ScanResult>) = results.forEach(::tratar)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val nome = intent?.getStringExtra(EXTRA_NOME) ?: "NOB"
        limite = intent?.getIntExtra(EXTRA_LIMITE, limite) ?: limite
        primeiroPlano()
        if (!aCorrer) {
            aCorrer = true
            iniciarBle(nome)
        }
        return START_STICKY
    }

    override fun onDestroy() {
        pararBle()
        aCorrer = false
        super.onDestroy()
    }

    private fun primeiroPlano() {
        val nm = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            nm.createNotificationChannel(NotificationChannel(CANAL, "NPN (teste)", NotificationManager.IMPORTANCE_LOW))
        }
        val abrir = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE,
        )
        val notif: Notification = NotificationCompat.Builder(this, CANAL)
            .setContentTitle("NOB · NPN (teste)")
            .setContentText("A procurar telemóveis por perto…")
            .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
            .setOngoing(true)
            .setContentIntent(abrir)
            .build()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIF_ID, notif, ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE)
        } else {
            startForeground(NOTIF_ID, notif)
        }
    }

    @SuppressLint("MissingPermission") // as permissões são pedidas pelo NpnPlugin antes de arrancar
    private fun iniciarBle(nome: String) {
        val adapter = bt.adapter ?: return
        // pacote: 'N' 'B' + token (4 bytes) + nome (até 21 bytes UTF-8)
        val nomeBytes = nome.toByteArray(Charsets.UTF_8).let { if (it.size > 21) it.copyOf(21) else it }
        val dados = byteArrayOf('N'.code.toByte(), 'B'.code.toByte()) + token + nomeBytes

        adapter.bluetoothLeAdvertiser?.startAdvertising(
            AdvertiseSettings.Builder()
                .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
                .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_MEDIUM)
                .setConnectable(false)
                .build(),
            AdvertiseData.Builder().addServiceUuid(ParcelUuid(SERVICO)).setIncludeDeviceName(false).build(),
            AdvertiseData.Builder().addManufacturerData(FABRICANTE, dados).setIncludeDeviceName(false).build(),
            anuncio,
        )

        adapter.bluetoothLeScanner?.startScan(
            listOf(ScanFilter.Builder().setServiceUuid(ParcelUuid(SERVICO)).build()),
            ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build(),
            scan,
        )
    }

    @SuppressLint("MissingPermission")
    private fun pararBle() {
        val adapter = bt.adapter ?: return
        runCatching { adapter.bluetoothLeAdvertiser?.stopAdvertising(anuncio) }
        runCatching { adapter.bluetoothLeScanner?.stopScan(scan) }
    }

    private fun tratar(r: ScanResult) {
        val d = r.scanRecord?.getManufacturerSpecificData(FABRICANTE) ?: return
        if (d.size < 6 || d[0] != 'N'.code.toByte() || d[1] != 'B'.code.toByte()) return
        val id = d.copyOfRange(2, 6).joinToString("") { "%02x".format(it) }
        val nome = String(d.copyOfRange(6, d.size), Charsets.UTF_8)
        val agora = SystemClock.elapsedRealtime()

        val leitura = synchronized(vistos) {
            val e = vistos.getOrPut(id) { Estado(nome) }
            e.amostras.addLast(agora to r.rssi)
            while (e.amostras.isNotEmpty() && agora - e.amostras.first().first > JANELA_MS) e.amostras.removeFirst()
            val ordenadas = e.amostras.map { it.second }.sorted()
            val mediana = ordenadas[ordenadas.size / 2]
            val antes = e.perto
            // entra em PERTO acima do limite; só sai 4 dB abaixo
            e.perto = if (e.perto) mediana > limite - HISTERESE else mediana >= limite
            if (e.perto && !antes) vibrar()
            Leitura(id, nome, r.rssi, mediana, e.perto, System.currentTimeMillis())
        }
        ouvinte?.invoke(leitura)
    }

    private fun vibrar() {
        val v: Vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            getSystemService(VibratorManager::class.java).defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            v.vibrate(VibrationEffect.createOneShot(200, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            v.vibrate(200)
        }
    }
}
