// The job list: each job definition from core/jobs.js paired with its minigame.
import { JOB_DEFS } from "../core/jobs.js";
import { LemonGame } from "./lemon.js";
import { MilkGame } from "./milk.js";
import { WasteGame } from "./waste.js";
import { DyeGame } from "./dye.js";
import { ShredGame } from "./shred.js";
import { PriceGame } from "./price.js";
import { GaugeGame } from "./gauge.js";
import { DefeatGame } from "./defeat.js";
import { AccountsGame } from "./accounts.js";
import { ShellGame } from "./shell.js";

const GAMES = {
  lemon: LemonGame, milk: MilkGame, waste: WasteGame, dye: DyeGame, shred: ShredGame,
  price: PriceGame, gauge: GaugeGame, defeat: DefeatGame, accounts: AccountsGame, shell: ShellGame,
};

export const JOBS = JOB_DEFS.map(def => ({ ...def, game: GAMES[def.id] }));
export const JOB_BY_ID = Object.fromEntries(JOBS.map(j => [j.id, j]));
