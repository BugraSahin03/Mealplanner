export type PersonOverview = {
  id: "bugra" | "sena";
  name: string;
  goal: string;
  focus: string;
};

export type WeekDayPreview = {
  weekday: string;
  bugraContext: "Office" | "Home";
  senaContext: "Office" | "Home";
};

export type MealPreview = {
  slot: "Fruehstueck" | "Mittag" | "Abend";
  title: string;
  context: string;
};

export type ShoppingPreview = {
  category: string;
  items: string[];
};

export type HomeOverview = {
  people: PersonOverview[];
  week: WeekDayPreview[];
  meals: MealPreview[];
  shopping: ShoppingPreview[];
};

export function buildHomeOverview(): HomeOverview {
  return {
    people: [
      {
        id: "bugra",
        name: "Buğra",
        goal: "Muskelaufbau",
        focus: "proteinreich und leicht im Ueberschuss",
      },
      {
        id: "sena",
        name: "Sena",
        goal: "Gewichtsabnahme",
        focus: "kalorienbewusst ohne getrennte Abendessen",
      },
    ],
    week: [
      { weekday: "Mo", bugraContext: "Office", senaContext: "Home" },
      { weekday: "Di", bugraContext: "Home", senaContext: "Office" },
      { weekday: "Mi", bugraContext: "Office", senaContext: "Office" },
      { weekday: "Do", bugraContext: "Home", senaContext: "Home" },
      { weekday: "Fr", bugraContext: "Office", senaContext: "Home" },
      { weekday: "Sa", bugraContext: "Home", senaContext: "Home" },
      { weekday: "So", bugraContext: "Home", senaContext: "Home" },
    ],
    meals: [
      {
        slot: "Fruehstueck",
        title: "Skyr-Glas mit Haferflocken",
        context: "transportierbar fuer Office-Tage",
      },
      {
        slot: "Mittag",
        title: "Meal-Prep-Bowl mit Reis und Gemuese",
        context: "getrennte Portionen je Ziel",
      },
      {
        slot: "Abend",
        title: "Gemeinsames Abendessen mit Restepotenzial",
        context: "Basis fuer Einkaufsliste",
      },
    ],
    shopping: [
      {
        category: "Frische",
        items: ["Paprika", "Gurke", "Beeren", "Salat"],
      },
      {
        category: "Protein",
        items: ["Skyr", "Haehnchen", "Eier", "Thunfisch"],
      },
      {
        category: "Vorrat",
        items: ["Haferflocken", "Reis", "Tomaten aus der Dose"],
      },
    ],
  };
}

export function countOfficeSlots(week: WeekDayPreview[]): number {
  return week.reduce((total, day) => {
    const bugra = day.bugraContext === "Office" ? 1 : 0;
    const sena = day.senaContext === "Office" ? 1 : 0;

    return total + bugra + sena;
  }, 0);
}
