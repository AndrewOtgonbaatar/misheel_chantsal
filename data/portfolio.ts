export type SectionId =
  | "about"
  | "sports"
  | "service"
  | "school"
  | "medicine"
  | "awards";

export type Placement = {
  x: number;
  y: number;
  rot: number;
};

export type Shot = {
  id: string;
  src: string;
  label: string;
  section: SectionId;
  home?: Placement;
  focus?: Placement;
};

export type Section = {
  id: SectionId;
  nav: string;
  title: string;
  lede: string;
  points: string[];
};

const img = (folder: string, file: string) =>
  encodeURI(`/images/${folder}/${file}`);

const sports = "Sports (Varsity Basketball & Volleyball)";

const cluster: Placement[] = [
  { x: -1.85, y: 0.72, rot: -7 },
  { x: -0.35, y: 0.82, rot: 5 },
  { x: 1.05, y: 0.48, rot: -4 },
  { x: -2.0, y: -0.38, rot: 6 },
  { x: -0.4, y: -0.18, rot: -3 },
  { x: 0.95, y: -0.48, rot: 4 },
  { x: -1.15, y: -1.15, rot: 2 },
];

const trio: Placement[] = [
  { x: -0.9, y: 0.32, rot: -5 },
  { x: 0.35, y: 0.18, rot: 4 },
  { x: -0.28, y: -0.62, rot: 2 },
];

function placed(index: number, count: number) {
  return (count <= 3 ? trio : cluster)[index];
}

function shot(
  id: string,
  folder: string,
  file: string,
  label: string,
  section: SectionId,
  index: number,
  count: number,
  home?: Placement,
): Shot {
  return {
    id,
    src: img(folder, file),
    label,
    section,
    focus: placed(index, count),
    ...(home ? { home } : {}),
  };
}

export const sections: Section[] = [
  {
    id: "about",
    nav: "About",
    title: "Misheel",
    lede: "A student at the American School of Ulaanbaatar with a 4.0 GPA and honors. She wants to work on healthcare for young people in Mongolia, and she is already leading that work at school, in clinics, and in her own projects.",
    points: [
      "American School of Ulaanbaatar, grades 4–11",
      "Ulaanbaatar Elite International School, grades 3–4",
      "Hobby School of Ulaanbaatar, grades 1–2",
      "Khan-Uul, Ulaanbaatar",
    ],
  },
  {
    id: "sports",
    nav: "Sports",
    title: "Sports",
    lede: "Misheel plays U19 girls volleyball and basketball for the American School of Ulaanbaatar, including international championships in Japan. She also played both sports at the U15 level.",
    points: [
      "U19 volleyball, first place in the UBAC division",
      "U19 basketball, Most Improved Player and Athlete Scholar",
      "Yellow Division first place, 2025–2026",
      "Tomujin summer camp",
    ],
  },
  {
    id: "service",
    nav: "Service",
    title: "Service",
    lede: "Most of her time outside class goes to younger students. She co-founded a foundation, tutors every week, and helps run fundraisers for clinics, kindergartens, and holiday drives.",
    points: [
      "Co-founded the Mongoldoi Foundation: kindergarten tuition for 240 children, about $41,000, plus an art competition for 300 children at Public Kindergarten 312",
      "More than 250 hours teaching English and math to children ages 4–5",
      "National Honor Society: clothing drive for the Lotus Center, and 80+ hours tutoring elementary students",
      "Red Cross: Tuul River safety, 30+ hours of cleanups, and a planting of 50 trees",
      "Veloo Foundation fundraiser that brought Christmas gifts to 50 children",
      "Rotary Interact: a three-day trip for 100 children to Batsumber, with 400 donated items",
    ],
  },
  {
    id: "school",
    nav: "School",
    title: "School",
    lede: "She is a house captain, a Model UN organizer, and president of the Science National Honor Society. The science-fair board beside her is “No Lunch, Why?”, a study she co-authored.",
    points: [
      "Class representative and house captain. Her house won every month of the 2024–2025 school year",
      "MUN administrative head. Delegate affairs for ASUMUN 2025 and finance head for ASUMUN 2026, a three-day conference of 120 delegates",
      "Science National Honor Society president, including a paper on corporate lobbying and a student sanitary brand",
      "National Art Honor Society secretary, Mu Alpha Theta, and a STEM olympiad for 200 students",
      "Weekly school photographer, musical stage crew, and mock trial organizer",
      "Tutors 10 students about four hours a week, since 2022",
    ],
  },
  {
    id: "medicine",
    nav: "Medicine",
    title: "Medicine",
    lede: "H.E.A.L. Mongolia is her project for students who want a life in medicine. Alongside it she has interned in a clinic, shadowed at a public hospital, and started research of her own.",
    points: [
      "Founded H.E.A.L. Mongolia in 2025. Students from eight schools, working toward nonprofit recognition",
      "Cell Clinic internship, summer 2025: five anticoagulant prototypes, and help with lab results for 20 patients",
      "Shadowing at the First Public Hospital, from July 2026",
      "Research on green synthesis of pharmaceutical nanoparticles",
      "A children’s book series on illnesses, with Nepko Publishing",
      "First Aid club with Red Cross Mongolia",
    ],
  },
  {
    id: "awards",
    nav: "Awards",
    title: "Awards",
    lede: "She has a 4.0 with honors, AP Scholar with Distinction, and the highest-GPA award two years running. The longer list is mostly from the World Scholars Cup and from school service.",
    points: [
      "World Scholars Cup: five rounds, including Dubai and Yale, and 51 medals. At Yale: 24th in individual writing, 1st gold Country Top Scholar, 4th gold in Central Asia",
      "World Mathematics Invitational, merit",
      "Third overall, ASU Science Fair 2026",
      "U.S. Embassy International Volunteer Award, twice",
      "Exemplary Leader and Impact Award, Public Kindergarten 312",
      "Academic achievement in Mongolian, Social Studies, 3D Art Foundations, and Public Health",
    ],
  },
];

export const shots: Shot[] = [
  shot("misheel", "Schoolwork, Music", "IMG_6233 2.jpg", "Misheel", "about", 0, 3, {
    x: -1.7,
    y: -0.02,
    rot: -8,
  }),
  shot("studying", "Schoolwork, Music", "IMG_6232.jpg", "Studying", "about", 1, 3),
  shot("homework", "Schoolwork, Music", "IMG_6234 2.jpg", "Homework", "about", 2, 3),

  shot("volleyball", sports, "IMG_1145.JPG", "Volleyball", "sports", 0, 7, {
    x: -2.45,
    y: -1.2,
    rot: 7,
  }),
  shot("basketball", sports, "IMG_3385.JPG", "Basketball", "sports", 1, 7, {
    x: 0.2,
    y: -0.77,
    rot: -6,
  }),
  shot("practice", sports, "IMG_2137.JPG", "Practice", "sports", 2, 7),
  shot("match", sports, "IMG_0128.JPG", "Match", "sports", 3, 7),
  shot("play", sports, "IMG_3211.JPG", "Play", "sports", 4, 7),
  shot("team", sports, "IMG_0990.JPG", "Team", "sports", 5, 7),
  shot("bench", sports, "IMG_1004.JPG", "Bench", "sports", 6, 7),

  shot("mongoldoi", "Donation Drive", "IMG_0695.jpg", "Mongoldoi", "service", 0, 7, {
    x: 1.55,
    y: -1.47,
    rot: 6,
  }),
  shot("tutoring", "Volunteer Work", "IMG_1858.JPG", "Tutoring", "service", 1, 7),
  shot("donations", "Donation Drive", "IMG_0154.JPG", "Donations", "service", 2, 7),
  shot("gifts", "Donation Drive", "IMG_0650.JPG", "Gifts", "service", 3, 7),
  shot(
    "supplies",
    "Donation Drive",
    "Image_20250218_1630105858950982970930013.jpg",
    "Supplies",
    "service",
    4,
    7,
  ),
  shot("reading", "Volunteer Work", "IMG_2727.JPG", "Reading", "service", 5, 7),
  shot("workshop", "Volunteer Work", "IMG_1875.JPG", "Workshop", "service", 6, 7),

  shot("research", "Speech and Debate", "IMG_0780.JPG", "Research", "school", 0, 7, {
    x: 2.4,
    y: 0.06,
    rot: -10,
  }),
  shot("snhs", "Certificates & Awards", "IMG_0975.JPG", "SNHS", "school", 1, 7),
  shot("opening", "Speech and Debate", "IMG_0270 (1).JPG", "Opening", "school", 2, 7),
  shot("stage", "Speech and Debate", "IMG_0642.png", "Stage", "school", 3, 7),
  shot("speaking", "Speech and Debate", "IMG_0672.JPG", "Speaking", "school", 4, 7),
  shot("seminar", "Speech and Debate", "IMG_1796.JPG", "Seminar", "school", 5, 7),
  shot("assembly", "Certificates & Awards", "IMG_0652.JPG", "Assembly", "school", 6, 7),

  shot("clinic", "Professional Internships", "IMG_5726 2.JPG", "Cell Clinic", "medicine", 0, 6, {
    x: 3.35,
    y: -0.57,
    rot: 4,
  }),
  shot("cohort", "Professional Internships", "IMG_0024.JPG", "Cohort", "medicine", 1, 6),
  shot("microscope", "Professional Internships", "IMG_6229.PNG", "Microscope", "medicine", 2, 6),
  shot("ward", "Professional Internships", "IMG_6230.PNG", "Ward", "medicine", 3, 6),
  shot("rounds", "Professional Internships", "IMG_6231.PNG", "Rounds", "medicine", 4, 6),
  shot("notes", "Professional Internships", "IMG_5229 2.PNG", "Notes", "medicine", 5, 6),

  shot("honor", "Certificates & Awards", "IMG_0210.JPG", "Honor Society", "awards", 0, 7, {
    x: -0.15,
    y: 0.13,
    rot: 9,
  }),
  shot("mu-alpha", "Certificates & Awards", "_DSF2621.JPG", "Mu Alpha Theta", "awards", 1, 7),
  shot("ceremony", "Certificates & Awards", "_DSF2663.JPG", "Ceremony", "awards", 2, 7),
  shot("honors", "Certificates & Awards", "IMG_0450.JPG", "Honors", "awards", 3, 7),
  shot("scholars", "Certificates & Awards", "IMG_0984.JPG", "Scholars", "awards", 4, 7),
  shot("group", "Certificates & Awards", "IMG_1005.JPG", "Group", "awards", 5, 7),
  shot("medals", "Certificates & Awards", "IMG_2759.PNG", "Medals", "awards", 6, 7),
];

export const contact = {
  email: "misheel0008@gmail.com",
  phone: "+976 99900818",
  phoneLabel: "+976 9990 0818",
  resume: "/Misheel-Chantsal-resume.pdf",
};
