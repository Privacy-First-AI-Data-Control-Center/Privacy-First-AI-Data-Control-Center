export declare const UNREGISTERED_DEVICE_PLACEHOLDER = "local-unregistered-device";
/**
 * Returns the device ID to stamp on events.
 *
 * - If AGENT_DEVICE_ID is set (e.g. after backend enrollment), it is used as-is.
 * - Otherwise a stable local ID is derived from /etc/machine-id (falling back to the hostname),
 *   hashed so the raw machine identifier is never stored. The `local-` prefix makes it clear
 *   the device has not been enrolled with the backend yet.
 */
export declare function resolveLocalDeviceId(configuredDeviceId: string): string;
