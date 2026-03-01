// ─── Type ────────────────────────────────────────────────────
// Define as plain interface (string values) so TR translations can satisfy it.
export interface Translations {
  common: { save: string; saved: string; saving: string; cancel: string; delete: string; edit: string; confirm: string; close: string; loading: string; submit: string; or: string; back: string; next: string; search: string; clear: string; add: string; create: string; update: string; preview: string; visibility: string; private: string; public: string; language: string };
  nav: { myBooks: string; discover: string; profile: string; signOut: string; signIn: string; getStarted: string };
  landing: { badge: string; headline1: string; headline2: string; sub: string; cta: string; ctaSecondary: string; featureHeading: string; footer: string; features: { branch: { title: string; desc: string }; characters: { title: string; desc: string }; world: { title: string; desc: string }; preview: { title: string; desc: string }; visibility: { title: string; desc: string }; notes: { title: string; desc: string } } };
  auth: { signIn: string; signUp: string; email: string; password: string; displayName: string; emailPlaceholder: string; namePlaceholder: string; passwordPlaceholder: string; signInBtn: string; signUpBtn: string; tagline: string; minPassword: string };
  books: { newBook: string; searchPlaceholder: string; allGenres: string; myBooks: string; discover: string; noBooks: string; noBooksSearch: string; noPublic: string; createFirst: string };
  createBook: { title: string; bookTitle: string; bookTitlePlaceholder: string; description: string; descriptionPlaceholder: string; genre: string; tags: string; tagsPlaceholder: string; tagsHint: string; coverColor: string; coverUpload: string; visibility: string; visibilityPublic: string; visibilityPrivate: string; visibilityPublicHint: string; visibilityPrivateHint: string; create: string; cancel: string; charCount: string; series: string; newSeries: string; seriesNamePlaceholder: string; noSeries: string; sequelOf: string; noParent: string };
  bookCard: { chapters: string; branch: string; words: string; public: string; private: string };
  editor: { chapters: string; notes: string; characters: string; dictionary: string; world: string; settings: string; preview: string; save: string; saved: string; titlePlaceholder: string; settingsHeading: string; fontLabel: string; sizeLabel: string; colorLabel: string; fontSerif: string; fontSans: string; fontMono: string; sizeSmall: string; sizeMed: string; sizeLarge: string; headingTitle: string; headingBody: string; headingChars: string; headingDict: string; headingEditor: string; autosave: string; autosaveOff: string; minute: string };
  chapterTree: { chapters: string; addChapter: string; branch: string; openBranch: string; deleteChapter: string; deleteConfirmTitle: string; deleteConfirmMsg: string; deleteConfirmBtn: string; listView: string; graphView: string; wordsLabel: string; pagesLabel: string; wordsAbbr: string; pagesAbbr: string; editTitle: string; editDone: string; makeCanon: string };
  characters: { title: string; searchPlaceholder: string; addName: string; addRole: string; addBtn: string; noCharacters: string; detailKey: string; detailValue: string; addDetail: string; defaultRole: string };
  notes: { title: string; addNote: string; noteTitlePlaceholder: string; noteContentPlaceholder: string; noNotes: string; defaultTitle: string };
  dictionary: { title: string; searchPlaceholder: string; addWord: string; addMeaning: string; addBtn: string; noEntries: string };
  world: { title: string; subtitle: string; addLabel: string; addValue: string; addBtn: string; noEntries: string; categories: { country: string; region: string; city: string; history: string; worldName: string; government: string; currency: string; language: string; religion: string; tech: string; climate: string; place: string; event: string } };
  profile: { title: string; displayNamePlaceholder: string; bioPlaceholder: string; books: string; shared: string; publicBooks: string; privateBooks: string; noBooks: string; createLink: string; saveProfile: string; editProfile: string; myBooks: string };
  userCard: { writer: string; myBooks: string; profile: string; signOut: string };
  preview: { title: string; page: string; of: string; noContent: string; close: string };
  genres: { fantasy: string; sci_fi: string; mystery: string; thriller: string; romance: string; historical: string; horror: string; adventure: string; literary_fiction: string; young_adult: string; childrens: string; dystopia: string; paranormal: string; crime: string; poetry: string; biography: string; self_help: string; graphic_novel: string };
}

// English — default language
const en: Translations = {
  // ── Common ──────────────────────────────────────────────
  common: {
    save: "Save",
    saved: "Saved!",
    saving: "Saving…",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    confirm: "Confirm",
    close: "Close",
    loading: "Loading…",
    submit: "Submit",
    or: "or",
    back: "Back",
    next: "Next",
    search: "Search",
    clear: "Clear",
    add: "Add",
    create: "Create",
    update: "Update",
    preview: "Preview",
    visibility: "Visibility",
    private: "Private",
    public: "Public",
    language: "Language",
  },

  // ── Nav / Header ─────────────────────────────────────────
  nav: {
    myBooks: "My Books",
    discover: "Discover",
    profile: "Profile",
    signOut: "Sign Out",
    signIn: "Sign In",
    getStarted: "Get Started",
  },

  // ── Landing Page ─────────────────────────────────────────
  landing: {
    badge: "Built for writers by writers",
    headline1: "Branch your story.",
    headline2: "Choose the canon.",
    sub: "BookGit is a git-style writing environment for authors. Branch between chapters, manage characters and world, and preview your book.",
    cta: "Start Writing",
    ctaSecondary: "Explore Books",
    featureHeading: "Everything you need, in one place",
    footer: "Built for writers who think in branches.",
    features: {
      branch: { title: "Git-Style Chapter Structure", desc: "Branch between chapters. Create alternative stories. Choose the canon path." },
      characters: { title: "Character Journal", desc: "Manage your characters, document their traits and relationships." },
      world: { title: "World Building", desc: "Define the geography, history, and culture of your universe freely." },
      preview: { title: "Book Preview", desc: "A5 format, page by page preview. Visualize as you write." },
      visibility: { title: "Public / Private", desc: "Share your book with everyone or keep it private. Your choice." },
      notes: { title: "Dictionary & Notes", desc: "Define terms in a glossary, take chapter notes. Everything in one place." },
    },
  },

  // ── Auth ─────────────────────────────────────────────────
  auth: {
    signIn: "Sign In",
    signUp: "Sign Up",
    email: "Email",
    password: "Password",
    displayName: "Full Name",
    emailPlaceholder: "example@mail.com",
    namePlaceholder: "Jane Doe",
    passwordPlaceholder: "••••••••",
    signInBtn: "Sign In",
    signUpBtn: "Create Account",
    tagline: "Start writing your story.",
    minPassword: "Minimum 6 characters",
  },

  // ── Books Page ───────────────────────────────────────────
  books: {
    newBook: "New Book",
    searchPlaceholder: "Search books…",
    allGenres: "All",
    myBooks: "My Books",
    discover: "Discover",
    noBooks: "No books yet.",
    noBooksSearch: "No results found.",
    noPublic: "No shared books yet.",
    createFirst: "Create your first book",
  },

  // ── Book Creation Dialog ──────────────────────────────────
  createBook: {
    title: "New Book",
    bookTitle: "Book Title *",
    bookTitlePlaceholder: "Your book's title",
    description: "Description",
    descriptionPlaceholder: "A short introduction…",
    genre: "Genre (max 3)",
    tags: "Tags",
    tagsPlaceholder: "add a tag, press Enter…",
    tagsHint: "Press Enter or comma · max 10",
    coverColor: "Cover Color",
    coverUpload: "Cover",
    visibility: "Visibility",
    visibilityPublic: "Public",
    visibilityPrivate: "Private",
    visibilityPublicHint: "Appears on homepage, others can read.",
    visibilityPrivateHint: "Only you can see this.",
    create: "Create Book",
    cancel: "Cancel",
    charCount: "/2000",
    series: "Series",
    newSeries: "New Series",
    seriesNamePlaceholder: "Series name...",
    noSeries: "No Series",
    sequelOf: "Sequel Of",
    noParent: "None (Fresh start)",
  },

  // ── Book Card ────────────────────────────────────────────
  bookCard: {
    chapters: "chapters",
    branch: "branch",
    words: "words",
    public: "Public",
    private: "Private",
  },

  // ── Editor ───────────────────────────────────────────────
  editor: {
    chapters: "Chapters",
    notes: "Notes",
    characters: "Characters",
    dictionary: "Dictionary",
    world: "World",
    settings: "Settings",
    preview: "Preview",
    save: "Save",
    saved: "Saved!",
    titlePlaceholder: "Title…",
    settingsHeading: "Appearance",
    fontLabel: "Font",
    sizeLabel: "Size",
    colorLabel: "Color",
    fontSerif: "Serif",
    fontSans: "Sans",
    fontMono: "Mono",
    sizeSmall: "Small",
    sizeMed: "Medium",
    sizeLarge: "Large",
    headingTitle: "Title",
    headingBody: "Body",
    headingChars: "Character Highlights",
    headingDict: "Dictionary Terms",
    headingEditor: "Editor",
    autosave: "Autosave",
    autosaveOff: "Off",
    minute: "min",
  },

  // ── Chapter Tree ─────────────────────────────────────────
  chapterTree: {
    chapters: "Chapters",
    addChapter: "New Chapter",
    branch: "Branch",
    openBranch: "Open Branch",
    deleteChapter: "Delete Chapter",
    deleteConfirmTitle: "Delete chapter?",
    deleteConfirmMsg: "will be permanently deleted.",
    deleteConfirmBtn: "Delete",
    listView: "List view",
    graphView: "Git graph view",
    wordsLabel: "words",
    pagesLabel: "pages",
    wordsAbbr: "w",
    pagesAbbr: "p",
    editTitle: "Edit title",
    editDone: "Done",
    makeCanon: "Make/Remove Canon",
  },

  // ── Characters Panel ─────────────────────────────────────
  characters: {
    title: "Characters",
    searchPlaceholder: "Search…",
    addName: "Character name…",
    addRole: "Role (Protagonist, Villain…)",
    addBtn: "Add",
    noCharacters: "No characters yet.",
    detailKey: "Detail (e.g. age, weapon…)",
    detailValue: "Value",
    addDetail: "Add Detail",
    defaultRole: "Character",
  },

  // ── Notes Panel ──────────────────────────────────────────
  notes: {
    title: "Notes",
    addNote: "Add Note",
    noteTitlePlaceholder: "Note title…",
    noteContentPlaceholder: "Write your note here…",
    noNotes: "No notes yet.",
    defaultTitle: "New Note",
  },

  // ── Dictionary Panel ─────────────────────────────────────
  dictionary: {
    title: "Dictionary",
    searchPlaceholder: "Search terms…",
    addWord: "Word…",
    addMeaning: "Meaning…",
    addBtn: "Add",
    noEntries: "No entries yet.",
  },

  // ── World Panel ──────────────────────────────────────────
  world: {
    title: "World",
    subtitle: "Add information about the universe where your book takes place",
    addLabel: "Label…",
    addValue: "Value…",
    addBtn: "Add",
    noEntries: "No world entries yet.",
    categories: {
      country: "Country",
      region: "Region",
      city: "City",
      history: "Era / History",
      worldName: "World Name",
      government: "Government",
      currency: "Currency",
      language: "Language",
      religion: "Religion / Belief",
      tech: "Technology Level",
      climate: "Climate",
      place: "Important Place",
      event: "Historical Event",
    },
  },

  // ── Profile Page ─────────────────────────────────────────
  profile: {
    title: "Profile",
    displayNamePlaceholder: "Full Name",
    bioPlaceholder: "Tell us about yourself…",
    books: "Books",
    shared: "Shared",
    publicBooks: "Public",
    privateBooks: "Private",
    noBooks: "No books yet",
    createLink: "Create a book →",
    saveProfile: "Save",
    editProfile: "Edit",
    myBooks: "My Books",
  },

  // ── User Card ────────────────────────────────────────────
  userCard: {
    writer: "Writer",
    myBooks: "My Books",
    profile: "Profile",
    signOut: "Sign Out",
  },

  // ── Book Preview ─────────────────────────────────────────
  preview: {
    title: "Book Preview",
    page: "Page",
    of: "of",
    noContent: "No content to preview.",
    close: "Close",
  },

  // ── Genres ───────────────────────────────────────────────
  // (labels come from DB in JSONB, so these are just fallbacks)
  genres: {
    fantasy: "Fantasy",
    sci_fi: "Science Fiction",
    mystery: "Mystery",
    thriller: "Thriller",
    romance: "Romance",
    historical: "Historical",
    horror: "Horror",
    adventure: "Adventure",
    literary_fiction: "Literary Fiction",
    young_adult: "Young Adult",
    childrens: "Children's",
    dystopia: "Dystopia",
    paranormal: "Paranormal",
    crime: "Crime",
    poetry: "Poetry",
    biography: "Biography",
    self_help: "Self Help",
    graphic_novel: "Graphic Novel",
  },
};

export default en;
