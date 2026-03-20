import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEY } from "./keys";
import { AppState } from "../types/models";

export async function loadStoredState() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AppState;
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export async function saveStoredState(state: AppState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
