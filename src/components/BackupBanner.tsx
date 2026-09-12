// Backup reminder banner: prompts the user to export a backup once they have made enough
// progress (checklist ticks, tracker data, or a profile) that losing it would matter.

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from './Toast';
import { exportBackup } from '../lib/backup';
import { useLang } from '../lib/i18n';
import { hasAnyProfileValue, useChk, useProfile } from '../lib/progress';
import { storeGet, storeSet } from '../lib/store';
import { useTracker } from '../lib/tracker';

const WEEK_MS = 7 * 86400000;

function currentPageId(pathname: string): string {
  const id = pathname.replace(/^\/+/, '');
  return id || 'home';
}

export function BackupBanner() {
  const { T } = useLang();
  const toast = useToast();
  const location = useLocation();
  const [chk] = useChk();
  const [profile] = useProfile();
  const tracker = useTracker();
  // bumped after export/snooze so the banner re-evaluates its own storage-backed timers immediately
  const [, forceRender] = useState(0);

  const hasProgress =
    Object.values(chk).some(Boolean) ||
    tracker.chars.length > 0 ||
    Object.keys(tracker.counts).length > 0 ||
    tracker.custom.length > 0 ||
    hasAnyProfileValue(profile);

  const now = Date.now();
  const lastExport = storeGet<number>('lastExport', 0);
  const snooze = storeGet<number>('bkSnooze', 0);
  const due = !lastExport || now - lastExport > WEEK_MS;
  const show = hasProgress && due && now > snooze;

  if (!show) return null;

  const days = lastExport ? Math.floor((now - lastExport) / 86400000) : null;
  const statusText =
    days === null
      ? T('You have roadmap or tracker data that has never been exported.')
      : days === 1
        ? T('Last export was 1 day ago.')
        : T('Last export was {n} days ago.', { n: days });

  function handleExport() {
    exportBackup(chk, profile, currentPageId(location.pathname), tracker.get());
    toast(T('Backup downloaded'));
    forceRender((n) => n + 1);
  }

  function handleSnooze() {
    storeSet('bkSnooze', Date.now() + WEEK_MS);
    toast(T('Reminder snoozed for 7 days'));
    forceRender((n) => n + 1);
  }

  return (
    <div className="bk-banner">
      <span>
        <strong>{T('Back up your progress.')}</strong> {statusText}{' '}
        {T('Browser data clearing wipes it; the export is a small JSON file you can import anywhere.')}
      </span>
      <span className="bk-actions">
        <button className="btn primary" onClick={handleExport}>
          {T('Export backup')}
        </button>
        <button className="btn" onClick={handleSnooze}>
          {T('Remind me in 7 days')}
        </button>
      </span>
    </div>
  );
}
