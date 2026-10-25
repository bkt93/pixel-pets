import { registerPet } from './registry.js';
import blackCat from './pets/black-cat.js';

registerPet(blackCat);

export { Pet } from './Pet.js';
export { registerPet, getPet, listPets } from './registry.js';
export { blackCat };
