package app.rifq.quran;

import android.content.Intent;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Reads story text aloud with the phone's text-to-speech, in Arabic.
 * Prefers Google's engine ("Speech Services by Google") when installed, whatever the phone's
 * default engine is, and picks the best installed Arabic voice. Never used for Quran.
 */
@CapacitorPlugin(name = "RifqVoice")
public class RifqVoicePlugin extends Plugin {

    private static final String GOOGLE = "com.google.android.tts";

    private TextToSpeech tts;
    private boolean ready = false;
    private int initStatus = TextToSpeech.ERROR;
    private String enginePkg = null;
    private Voice arabic = null;
    private boolean arabicByLang = false;
    private final List<Runnable> waiting = new ArrayList<>();
    private final Map<String, PluginCall> pending = new HashMap<>();
    private int seq = 0;

    @Override
    public void load() {
        start();
    }

    private boolean installed(String pkg) {
        try {
            getContext().getPackageManager().getPackageInfo(pkg, 0);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private synchronized void start() {
        if (tts != null) return;
        ready = false;
        enginePkg = installed(GOOGLE) ? GOOGLE : null;
        TextToSpeech.OnInitListener onInit = (status) -> {
            List<Runnable> run;
            synchronized (RifqVoicePlugin.this) {
                initStatus = status;
                ready = true;
                if (status == TextToSpeech.SUCCESS) pickArabic();
                run = new ArrayList<>(waiting);
                waiting.clear();
            }
            for (Runnable r : run) r.run();
        };
        tts = enginePkg != null ? new TextToSpeech(getContext(), onInit, enginePkg) : new TextToSpeech(getContext(), onInit);
        tts.setOnUtteranceProgressListener(
            new UtteranceProgressListener() {
                @Override
                public void onStart(String id) {}

                @Override
                public void onDone(String id) {
                    finish(id, null);
                }

                @Override
                @Deprecated
                public void onError(String id) {
                    finish(id, "error");
                }

                @Override
                public void onError(String id, int code) {
                    finish(id, "error " + code);
                }

                @Override
                public void onStop(String id, boolean interrupted) {
                    finish(id, null);
                }
            }
        );
    }

    private synchronized void restart() {
        if (tts != null) {
            try {
                tts.stop();
                tts.shutdown();
            } catch (Exception ignored) {}
        }
        tts = null;
        arabic = null;
        arabicByLang = false;
        start();
    }

    /** Best installed Arabic voice: offline first, then quality. */
    private void pickArabic() {
        arabic = null;
        arabicByLang = false;
        try {
            Set<Voice> voices = tts.getVoices();
            int bestScore = -1;
            if (voices != null) {
                for (Voice v : voices) {
                    Locale l = v.getLocale();
                    if (l == null || !"ar".equals(l.getLanguage())) continue;
                    Set<String> f = v.getFeatures();
                    if (f != null && f.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) continue;
                    int score = (v.isNetworkConnectionRequired() ? 0 : 1000) + v.getQuality();
                    if (score > bestScore) {
                        bestScore = score;
                        arabic = v;
                    }
                }
            }
            if (arabic != null) tts.setVoice(arabic);
            else arabicByLang = tts.setLanguage(new Locale("ar")) >= TextToSpeech.LANG_AVAILABLE;
        } catch (Exception ignored) {}
    }

    private void whenReady(Runnable r) {
        boolean now;
        synchronized (this) {
            now = ready;
            if (!now) waiting.add(r);
        }
        if (now) r.run();
    }

    private void finish(String id, String err) {
        PluginCall c;
        synchronized (pending) {
            c = pending.remove(id);
        }
        if (c == null) return;
        if (err == null) c.resolve();
        else c.reject(err);
    }

    private JSObject describe() {
        JSObject r = new JSObject();
        r.put("engineReady", initStatus == TextToSpeech.SUCCESS);
        r.put("google", installed(GOOGLE));
        r.put("arabic", arabic != null || arabicByLang);
        return r;
    }

    /** { engineReady, google (Google engine installed), arabic (an Arabic voice is ready) } */
    @PluginMethod
    public void status(PluginCall call) {
        whenReady(() -> {
            if (initStatus == TextToSpeech.SUCCESS) pickArabic();
            call.resolve(describe());
        });
    }

    /** Restarts the engine (after the user installed Google's engine or the Arabic voice), then status. */
    @PluginMethod
    public void refresh(PluginCall call) {
        restart();
        whenReady(() -> call.resolve(describe()));
    }

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        float rate = call.getFloat("rate", 0.9f);
        float pitch = call.getFloat("pitch", 1.0f);
        whenReady(() -> {
            if (initStatus != TextToSpeech.SUCCESS) {
                call.reject("engine");
                return;
            }
            if (arabic == null && !arabicByLang) pickArabic();
            if (arabic == null && !arabicByLang) {
                call.reject("no-arabic");
                return;
            }
            tts.setSpeechRate(rate);
            tts.setPitch(pitch);
            String id;
            synchronized (pending) {
                id = "u" + (++seq);
                pending.put(id, call);
            }
            Bundle b = new Bundle();
            b.putInt(TextToSpeech.Engine.KEY_PARAM_STREAM, AudioManager.STREAM_MUSIC);
            if (tts.speak(text, TextToSpeech.QUEUE_FLUSH, b, id) != TextToSpeech.SUCCESS) finish(id, "speak");
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (tts != null) tts.stop();
        List<PluginCall> calls;
        synchronized (pending) {
            calls = new ArrayList<>(pending.values());
            pending.clear();
        }
        for (PluginCall c : calls) c.reject("stopped");
        call.resolve();
    }

    /** Opens Google's screen to download voices, or the Play Store page of the engine if missing. */
    @PluginMethod
    public void installVoice(PluginCall call) {
        try {
            if (installed(GOOGLE)) {
                Intent i = new Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA);
                i.setPackage(GOOGLE);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
            } else {
                openStore();
            }
            call.resolve();
        } catch (Exception e) {
            try {
                openSettings();
                call.resolve();
            } catch (Exception e2) {
                call.reject("open");
            }
        }
    }

    /** The system "Text-to-speech output" settings. */
    @PluginMethod
    public void settings(PluginCall call) {
        try {
            openSettings();
            call.resolve();
        } catch (Exception e) {
            call.reject("open");
        }
    }

    private void openSettings() {
        Intent i = new Intent("com.android.settings.TTS_SETTINGS");
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
    }

    private void openStore() {
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + GOOGLE));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(i);
        } catch (Exception e) {
            Intent w = new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + GOOGLE));
            w.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(w);
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) {
            try {
                tts.shutdown();
            } catch (Exception ignored) {}
        }
        tts = null;
    }
}
