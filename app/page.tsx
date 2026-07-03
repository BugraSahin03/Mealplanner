import Link from "next/link";

import { buildHomeOverview, countOfficeSlots } from "@/src/home/overview";

export default function HomePage() {
  const overview = buildHomeOverview();
  const officeSlots = countOfficeSlots(overview.week);

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Bereiche">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>Essenplanner</span>
        </div>

        <nav className="nav-list" aria-label="Hauptnavigation">
          <Link className="nav-link nav-link-active" href="/profile">
            Profile
          </Link>
          <a className="nav-link" href="#woche">
            Woche
          </a>
          <a className="nav-link" href="#plan">
            Wochenplan
          </a>
          <a className="nav-link" href="#einkauf">
            Einkaufsliste
          </a>
        </nav>
      </aside>

      <div className="content">
        <header className="page-header">
          <div>
            <p className="eyebrow">Naechste Wochenplanung</p>
            <h1>Planen, einkaufen, weniger nachdenken.</h1>
          </div>
          <div className="status-pill">
            <span>{officeSlots}</span>
            <small>Office-Slots</small>
          </div>
        </header>

        <section className="workflow-band" aria-label="Planungsfluss">
          <div>
            <span>1</span>
            Profile pruefen
          </div>
          <div>
            <span>2</span>
            Office-Tage setzen
          </div>
          <div>
            <span>3</span>
            Plan erzeugen
          </div>
          <div>
            <span>4</span>
            Liste nutzen
          </div>
        </section>

        <section id="profile" className="section-block">
          <div className="section-heading">
            <p className="eyebrow">Profile</p>
            <h2>Ziele fuer diese Planung</h2>
          </div>

          <div className="person-grid">
            {overview.people.map((person) => (
              <article className="person-card" key={person.id}>
                <div>
                  <p className="person-name">{person.name}</p>
                  <p className="muted">{person.goal}</p>
                </div>
                <p>{person.focus}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="woche" className="section-block">
          <div className="section-heading">
            <p className="eyebrow">Wochen-Setup</p>
            <h2>Office und Homeoffice je Person</h2>
          </div>

          <div className="week-grid" aria-label="Wochenkontext">
            {overview.week.map((day) => (
              <article className="day-tile" key={day.weekday}>
                <strong>{day.weekday}</strong>
                <span>Buğra: {day.bugraContext}</span>
                <span>Sena: {day.senaContext}</span>
              </article>
            ))}
          </div>
        </section>

        <section id="plan" className="section-block">
          <div className="section-heading">
            <p className="eyebrow">Wochenplan</p>
            <h2>Erste Planvorschau</h2>
          </div>

          <div className="meal-list">
            {overview.meals.map((meal) => (
              <article className="meal-row" key={meal.slot}>
                <div>
                  <span>{meal.slot}</span>
                  <strong>{meal.title}</strong>
                </div>
                <p>{meal.context}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="einkauf" className="section-block shopping-section">
          <div className="section-heading">
            <p className="eyebrow">Einkaufsliste</p>
            <h2>Konsolidiert fuer den Wocheneinkauf</h2>
          </div>

          <div className="shopping-grid">
            {overview.shopping.map((group) => (
              <article className="shopping-group" key={group.category}>
                <h3>{group.category}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
