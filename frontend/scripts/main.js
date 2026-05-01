/**
 * Entry point — initializes all modules.
 */

import * as particles from "./components/particles.js";
import * as introScreen from "./screens/intro.js";
import * as chatScreen from "./screens/chat.js";
import * as endScreen from "./screens/end.js";

// Initialize particle system
particles.init();

// Initialize screen event listeners
introScreen.init();
chatScreen.init();
endScreen.init();
