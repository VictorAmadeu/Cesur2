import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { NFC, NDEFMessagesTransformable, NFCError } from '@exxili/capacitor-nfc';

@Injectable({
  providedIn: 'root',
})
export class NfcService {
  async isSupported(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const { supported } = await NFC.isSupported();
      return supported;
    } catch {
      return false;
    }
  }

  async readOnce(timeoutMs: number = 20000): Promise<string> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('NFC no disponible en este entorno.');
    }

    const { supported } = await NFC.isSupported();
    if (!supported) {
      throw new Error('NFC no soportado en este dispositivo.');
    }

    if (Capacitor.getPlatform() === 'ios') {
      await NFC.startScan();
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);

        const nfcAny = NFC as any;

        // Limpia listeners si la versión del plugin lo soporta (evita duplicados entre llamadas).
        void Promise.resolve(nfcAny.removeAllListeners?.()).catch(() => {});

        if (Capacitor.getPlatform() === 'ios') {
          // Cierra sesión de lectura solo si existe en esta versión del plugin.
          void Promise.resolve(nfcAny.cancelScan?.()).catch(() => {});
          void Promise.resolve(nfcAny.stopScan?.()).catch(() => {});
          void Promise.resolve(nfcAny.stopSession?.()).catch(() => {});
        }
      };

      const finalize = (fn: () => void) => {
        if (settled) return;
        settled = true;
        cleanup();
        fn();
      };

      // onRead/onError devuelven void en tu versión → no se guardan "handles".
      NFC.onRead((data: NDEFMessagesTransformable) => {
        const payload = this.extractFirstPayload(data);
        if (!payload) {
          finalize(() => reject(new Error('No se pudo leer el contenido NFC.')));
          return;
        }
        finalize(() => resolve(payload));
      });

      NFC.onError((error: NFCError) => {
        const message = error?.error ?? 'Error al leer NFC.';
        finalize(() => reject(new Error(message)));
      });

      if (timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          finalize(() => reject(new Error('Tiempo de espera agotado.')));
        }, timeoutMs);
      }
    });
  }

  private extractFirstPayload(data: NDEFMessagesTransformable): string | null {
    try {
      const stringMessages = data.string();
      const messages = stringMessages?.messages ?? [];

      for (const message of messages) {
        const records = message?.records ?? [];
        for (const record of records) {
          const payload = typeof record?.payload === 'string' ? record.payload.trim() : '';
          if (payload) return payload;
        }
      }
    } catch {
      return null;
    }

    return null;
  }
}
