const pets = new Map();

// Registra una definición de mascota (ver src/pets/black-cat.js como ejemplo).
export function registerPet(def) {
  if (!def || !def.name) throw new Error('pixel-pets: la definición necesita un "name"');
  for (const [name, seq] of Object.entries(def.animations)) {
    for (const [frame] of seq) {
      if (!def.frames[frame]) throw new Error(`pixel-pets: "${def.name}.${name}" usa el frame inexistente "${frame}"`);
    }
  }
  pets.set(def.name, def);
  return def;
}

export function getPet(name) {
  const def = pets.get(name);
  if (!def) throw new Error(`pixel-pets: no hay mascota registrada con el nombre "${name}"`);
  return def;
}

export function listPets() {
  return [...pets.keys()];
}
