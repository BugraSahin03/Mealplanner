import type {
  PlannerResponseShoppingCategory,
  PlannerResponseUnit,
} from "../planner/response";

export type ShoppingListItemView = {
  id: string;
  name: string;
  amount: string;
  category: PlannerResponseShoppingCategory;
  sourceMealIds: string[];
  pantryItem: boolean;
  optional: boolean;
  buyingHint: string | null;
  notes: string | null;
};

export type ShoppingListGroupView = {
  category: PlannerResponseShoppingCategory;
  label: string;
  items: ShoppingListItemView[];
};

export type ShoppingListSourceItem = {
  name: string;
  amount: number;
  unit: PlannerResponseUnit;
  category?: PlannerResponseShoppingCategory;
  sourceMealIds?: string[];
  pantryItem?: boolean;
  optional?: boolean;
  buyingHint?: string;
  notes?: string;
};

const categoryLabels: Record<PlannerResponseShoppingCategory, string> = {
  produce: "Obst & Gemuese",
  meat_fish: "Fleisch & Fisch",
  dairy_eggs: "Milchprodukte & Eier",
  bakery: "Backwaren",
  dry_goods: "Vorrat & Trockenware",
  frozen: "Tiefkuehl",
  canned: "Konserven",
  condiments_spices: "Gewuerze & Saucen",
  drinks: "Getraenke",
  other: "Sonstiges",
};

const categoryOrder: PlannerResponseShoppingCategory[] = [
  "produce",
  "meat_fish",
  "dairy_eggs",
  "bakery",
  "dry_goods",
  "frozen",
  "canned",
  "condiments_spices",
  "drinks",
  "other",
];

const unitLabels: Record<PlannerResponseUnit, string> = {
  g: "g",
  kg: "kg",
  ml: "ml",
  l: "l",
  piece: "Stk.",
  tbsp: "EL",
  tsp: "TL",
  pack: "Packung",
  can: "Dose",
  jar: "Glas",
  bottle: "Flasche",
};

function formatAmount(amount: number, unit: PlannerResponseUnit): string {
  const formattedAmount = Number.isInteger(amount)
    ? String(amount)
    : new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(amount);

  return `${formattedAmount} ${unitLabels[unit]}`;
}

function makeShoppingItemId(item: ShoppingListSourceItem, index: number): string {
  return `${item.category ?? "other"}-${item.name}-${index}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function groupShoppingListItems(
  items: ShoppingListSourceItem[],
): ShoppingListGroupView[] {
  const groups = new Map<PlannerResponseShoppingCategory, ShoppingListItemView[]>();

  items.forEach((item, index) => {
    const category = item.category ?? "other";
    const viewItem: ShoppingListItemView = {
      id: makeShoppingItemId(item, index),
      name: item.name,
      amount: formatAmount(item.amount, item.unit),
      category,
      sourceMealIds: item.sourceMealIds ?? [],
      pantryItem: item.pantryItem ?? false,
      optional: item.optional ?? false,
      buyingHint: item.buyingHint ?? null,
      notes: item.notes ?? null,
    };

    groups.set(category, [...(groups.get(category) ?? []), viewItem]);
  });

  return categoryOrder
    .filter((category) => groups.has(category))
    .map((category) => ({
      category,
      label: categoryLabels[category],
      items: groups.get(category) ?? [],
    }));
}
