
import { Platform } from "react-native";
import API_URL from "./api";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = globalThis.atob(base64);
  const output = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }

  return output;
}

export async function enableWebPush(token: string): Promise<void> {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    throw new Error("Web push is only available in a web browser.");
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("This browser does not support web push notifications.");
  }

  // Register the background notification service worker.
  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  // Get the public VAPID key from the backend.
  const keyResponse = await fetch(`${API_URL}/push/public-key`);
  const keyData = await keyResponse.json();

  if (!keyResponse.ok || !keyData.publicKey) {
    throw new Error(keyData.message || "Could not retrieve the push public key.");
  }

  // Reuse an existing subscription or create a new one.
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyData.publicKey) as BufferSource,
    });
  }

  // Save the subscription against the logged-in user.
  const response = await fetch(`${API_URL}/push/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(subscription),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Could not save the push subscription.");
  }
}

export async function sendWebPushTest(token: string): Promise<string> {
  const response = await fetch(`${API_URL}/push/test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Test notification failed.");
  }

  return result.message || "Test notification sent to the push service.";
}

export async function disableWebPush(token: string): Promise<void> {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration("/");

  if (!registration) {
    return;
  }

  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return;
  }

  // Remove the server record first.
  const response = await fetch(`${API_URL}/push/unsubscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Could not disable push notifications.");
  }

  await subscription.unsubscribe();
}
