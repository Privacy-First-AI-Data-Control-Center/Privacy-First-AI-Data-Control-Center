import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { hostname } from 'node:os';

export const UNREGISTERED_DEVICE_PLACEHOLDER = 'local-unregistered-device';

/**
 * Returns the device ID to stamp on events.
 *
 * - If AGENT_DEVICE_ID is set (e.g. after backend enrollment), it is used as-is.
 * - Otherwise a stable local ID is derived from /etc/machine-id (falling back to the hostname),
 *   hashed so the raw machine identifier is never stored. The `local-` prefix makes it clear
 *   the device has not been enrolled with the backend yet.
 */
export function resolveLocalDeviceId(configuredDeviceId: string): string {
  if (configuredDeviceId && configuredDeviceId !== UNREGISTERED_DEVICE_PLACEHOLDER) {
    return configuredDeviceId;
  }

  let machineSeed = hostname();
  try {
    const machineId = readFileSync('/etc/machine-id', 'utf8').trim();
    if (machineId) {
      machineSeed = machineId;
    }
  } catch {
    // /etc/machine-id is unavailable (non-systemd Linux, macOS, Windows); hostname is used.
  }

  const shortHash = createHash('sha256').update(machineSeed, 'utf8').digest('hex').slice(0, 12);
  return `local-${shortHash}`;
}
