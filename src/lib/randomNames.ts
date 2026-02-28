const firstNames = [
  'Alia', 'Kira', 'Selva', 'Miran', 'Deren', 'Yael', 'Leora', 'Tamar',
  'Ayden', 'Erkan', 'Solen', 'Ciran', 'Mirna', 'Dava', 'Kaela', 'Ziran',
  'Oren', 'Nadia', 'Reva', 'Sable', 'Theron', 'Vesna', 'Idris', 'Faelan',
  'Beren', 'Liora', 'Aslan', 'Emre', 'Sinan', 'Zeynep',
];

const lastNames = [
  'Aldenmor', 'Voss', 'Calder', 'Wyn', 'Ashveil', 'Drak', 'Feyne',
  'Morwen', 'Strel', 'Vane', 'Kael', 'Doren', 'Solhan', 'Erith',
  'Kaner', 'Arslan', 'Demir', 'Yıldız', 'Çelik', 'Aydın',
];

export function generateRandomName(): string {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}
