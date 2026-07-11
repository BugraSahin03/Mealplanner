"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { getPlannerStatusAction, startPlannerJobForWeekAction } from "./actions";
import type { PlannerStatusSnapshot } from "./status";

type PlannerStatusPanelProps = {
  initialStatus: PlannerStatusSnapshot;
  plannerHref: string;
  weekId: string;
};

const pollingDelayMs = 1200;

export function PlannerStatusPanel({ initialStatus, plannerHref, weekId }: PlannerStatusPanelProps) {
  const [snapshot, setSnapshot] = useState(initialStatus);
  const [isStarting, setIsStarting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const startingRef = useRef(false);

  useEffect(() => {
    if (snapshot.status !== "running") {
      return undefined;
    }

    let cancelled = false;
    let timeout: number | undefined;

    async function poll(): Promise<void> {
      let nextSnapshot: PlannerStatusSnapshot;
      try {
        nextSnapshot = await getPlannerStatusAction(weekId);
      } catch {
        if (!cancelled) {
          setSnapshot((current) => ({
            ...current,
            status: "failed",
            errorMessage: "Der aktuelle Status konnte nicht geladen werden.",
          }));
        }
        return;
      }
      if (cancelled) {
        return;
      }

      setSnapshot((current) => {
        if (current.status === "running" && nextSnapshot.status === "success") {
          setShowSuccess(true);
        }
        return nextSnapshot;
      });

      if (nextSnapshot.status === "running") {
        timeout = window.setTimeout(poll, pollingDelayMs);
      }
    }

    timeout = window.setTimeout(poll, pollingDelayMs);
    return () => {
      cancelled = true;
      if (timeout !== undefined) {
        window.clearTimeout(timeout);
      }
    };
  }, [snapshot.status, weekId]);

  useEffect(() => {
    if (!showSuccess) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setShowSuccess(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [showSuccess]);

  async function startPlanner(): Promise<void> {
    if (startingRef.current || snapshot.status === "running") {
      return;
    }

    startingRef.current = true;
    setIsStarting(true);
    setSnapshot((current) => ({
      ...current,
      jobId: null,
      status: "running",
      errorMessage: null,
    }));

    try {
      const nextSnapshot = await startPlannerJobForWeekAction(weekId);
      setSnapshot(nextSnapshot);
    } catch {
      setSnapshot((current) => ({
        ...current,
        status: "failed",
        errorMessage: "Die Planung konnte nicht gestartet werden.",
      }));
    } finally {
      startingRef.current = false;
      setIsStarting(false);
    }
  }

  const isRunning = snapshot.status === "running";
  const isSuccess = snapshot.status === "success";
  const isFailed = snapshot.status === "failed";

  return (
    <>
      <article
        aria-atomic="true"
        aria-live="polite"
        className={`plan-command-primary plan-status-panel plan-status-${snapshot.status}`}
        role="status"
      >
        <p className="eyebrow">
          {isRunning ? "In Arbeit" : isSuccess ? "Fertig" : isFailed ? "Fehler" : "Diese Woche"}
        </p>

        <div className="plan-status-copy">
          <h2>
            {isRunning
              ? "Wochenplan entsteht"
              : isSuccess
                ? "Wochenplan fertig"
                : isFailed
                  ? "Nicht geklappt"
                  : snapshot.hasPlan
                    ? "Plan erneuern"
                    : "Jetzt planen"}
          </h2>
          {isRunning ? <p>OpenClaw erstellt gerade deinen Plan.</p> : null}
          {isFailed ? <p>{snapshot.errorMessage ?? "Die Planung konnte nicht abgeschlossen werden."}</p> : null}
        </div>

        {isRunning ? (
          <div className="plan-status-activity" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        ) : isSuccess ? (
          <div className="plan-status-actions">
            <Link className="primary-button command-primary-button" href={plannerHref}>
              Wochenplan ansehen
            </Link>
            <button className="plan-status-secondary" onClick={startPlanner} type="button">
              Neu erstellen
            </button>
          </div>
        ) : (
          <button
            className="primary-button command-primary-button"
            disabled={isStarting}
            onClick={startPlanner}
            type="button"
          >
            {isFailed ? "Erneut versuchen" : snapshot.hasPlan ? "Plan neu erstellen" : "Plan erstellen"}
          </button>
        )}
      </article>

      {showSuccess ? (
        <div className="plan-success-toast" role="status">
          <strong>Wochenplan wurde erstellt.</strong>
          <Link href={plannerHref}>Ansehen</Link>
        </div>
      ) : null}
    </>
  );
}
