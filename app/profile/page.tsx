import Link from "next/link";

import { getDb } from "@/src/db/client";
import { listToText, profileToFormDefaults } from "@/src/profiles/form";
import { primaryGoalOptions } from "@/src/profiles/model";
import { listProfiles, type Profile } from "@/src/profiles/repository";
import { buildWeekIdFromDate, getIsoWeekStart } from "@/src/week-context/model";
import { AppBottomNav } from "../app-bottom-nav";
import { saveProfileAction } from "./actions";

export const dynamic = "force-dynamic";

function ProfileForm({ profile }: { profile: Profile }) {
  const defaults = profileToFormDefaults(profile);

  return (
    <form className="profile-form" action={saveProfileAction}>
      <input type="hidden" name="personId" value={profile.personId} />
      <input type="hidden" name="displayName" value={profile.displayName} />

      <div className="profile-form-header">
        <div>
          <h2>{profile.displayName}</h2>
        </div>
        <button className="primary-button" type="submit">
          Speichern
        </button>
      </div>

      <div className="form-grid">
        <label>
          Ziel
          <select name="primaryGoal" defaultValue={profile.primaryGoal}>
            {primaryGoalOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Tageskalorienziel
          <input
            name="dailyCaloriesTarget"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            defaultValue={profile.dailyCaloriesTarget ?? ""}
            placeholder="optional"
          />
        </label>
      </div>

      <div className="form-grid form-grid-three">
        <label>
          Lieblingsgerichte
          <textarea name="favoriteMeals" defaultValue={defaults.favoriteMeals} rows={5} />
        </label>
        <label>
          Vorlieben
          <textarea name="likedIngredients" defaultValue={defaults.likedIngredients} rows={5} />
        </label>
        <label>
          Abneigungen
          <textarea
            name="dislikedIngredients"
            defaultValue={defaults.dislikedIngredients}
            rows={5}
          />
        </label>
      </div>

      <div className="form-grid form-grid-three">
        <label>
          Fruehstueck
          <textarea name="breakfast" defaultValue={defaults.breakfast} rows={4} />
        </label>
        <label>
          Mittagessen
          <textarea name="lunch" defaultValue={defaults.lunch} rows={4} />
        </label>
        <label>
          Abendessen
          <textarea name="dinner" defaultValue={defaults.dinner} rows={4} />
        </label>
      </div>

      <label>
        Weiche Regeln
        <textarea name="softRules" defaultValue={listToText(profile.softRules)} rows={3} />
      </label>

      <label>
        Notizen
        <textarea name="notes" defaultValue={defaults.notes} rows={3} />
      </label>
    </form>
  );
}

export default function ProfilePage() {
  const profiles = listProfiles(getDb());
  const currentWeekId = buildWeekIdFromDate(getIsoWeekStart());

  return (
    <main className="profile-command-page bottom-nav-page">
      <div className="profile-command-content">
        <Link className="brand brand-link" href="/">
          <span className="brand-mark" aria-hidden="true" />
          <span>Essenplanner</span>
        </Link>

        <header className="profile-command-header">
          <div>
            <p className="eyebrow">Profile</p>
            <h1>Eure Profile.</h1>
          </div>
        </header>

        <div className="profile-command-list">
          {profiles.map((profile) => (
            <ProfileForm key={profile.personId} profile={profile} />
          ))}
        </div>
      </div>
      <AppBottomNav active="profile" weekId={currentWeekId} />
    </main>
  );
}
