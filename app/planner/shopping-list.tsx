"use client";

import type { ShoppingListGroupView } from "@/src/shopping-list/grouping";

type ShoppingListProps = {
  groups: ShoppingListGroupView[];
};

export function ShoppingList({ groups }: ShoppingListProps) {
  return (
    <div className="shopping-list-board">
      {groups.map((group) => (
        <section className="shopping-list-group" key={group.category}>
          <h3>{group.label}</h3>
          <div className="shopping-list-items">
            {group.items.map((item) => (
              <label className="shopping-list-item" key={item.id}>
                <input type="checkbox" />
                <span className="shopping-checkmark" aria-hidden="true" />
                <span className="shopping-item-body">
                  <span className="shopping-item-main">
                    <strong>{item.name}</strong>
                    <span>{item.amount}</span>
                  </span>
                  <span className="shopping-item-tags">
                    {item.optional ? <em>Optional</em> : null}
                    {item.pantryItem ? <em>Vorrat</em> : null}
                    {item.sourceMealIds.length > 0 ? (
                      <em>{item.sourceMealIds.length} Mahlzeit(en)</em>
                    ) : null}
                  </span>
                  {item.buyingHint ? <small>{item.buyingHint}</small> : null}
                  {item.notes ? <small>{item.notes}</small> : null}
                </span>
              </label>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
