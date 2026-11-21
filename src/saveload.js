// Reading and writing the save through the platform (localStorage, or CrazyGames' cloud saves).
import { game } from "./game.js";
import { SAVE_KEY } from "./config.js";
import { encodeSave } from "./core/save.js";
import { platform } from "./platform/index.js";
import { $ } from "./ui/dom.js";

export function save() {
  try {
    platform.setItem(SAVE_KEY, encodeSave(game.S));
    $("saveNote").textContent = "Saved at " + new Date().toLocaleTimeString() + ". Autosaves every 30 seconds.";
  } catch (e) {
    $("saveNote").textContent = "Save failed: " + e.message;
  }
}

// The saved string, or null if there isn't one. Throws if storage is blocked.
export function readSave() {
  return platform.getItem(SAVE_KEY);
}
