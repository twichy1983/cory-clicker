// The platform the game runs on: plain web (localStorage) or CrazyGames (their SDK).
import { IS_CRAZYGAMES } from "../config.js";
import { webPlatform } from "./web.js";
import { crazyGamesPlatform } from "./crazygames.js";

export const platform = IS_CRAZYGAMES ? crazyGamesPlatform : webPlatform;
